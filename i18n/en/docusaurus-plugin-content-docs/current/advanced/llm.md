---
title: Calling a model
description: Reuse the configured Agent instead of managing provider clients.
---

Configure the [official Agent](../usage/agent.md) once, then call it from plugins through the SDK.

## Ask one question

```go
import "github.com/AlonaBot/AlonaBot/sdk/llm"

	p.Command("ask").RawTail().Handle(func(c *sdk.Context, question string) error {
		answer, err := llm.Ask(c, question)
		if err != nil {
			return err
		}
		return c.Reply(answer)
	})
```

```text
> /ask What is the capital of France?
The capital of France is Paris.
```

## Send a complete request

Import `github.com/AlonaBot/AlonaBot/sdk/agent` as well as `sdk/llm`:

```go
	resp, err := agent.Generate(c, llm.Request{
		System: "You are a concise assistant. Answer in one sentence.",
		Messages: []llm.Message{
			{Role: "user", Text: "What is Go?"},
			{Role: "assistant", Text: "Go is a programming language created at Google."},
			{Role: "user", Text: "Who created it?"},
		},
		MaxOutputTokens: 200,
	})
	if err != nil {
		return err
	}
	return c.Reply(resp.Text)
```

System sets the instruction; Messages contains user/assistant turns; Model selects a configured model name and otherwise uses chat_model; MaxOutputTokens overrides the model's output budget. The response preserves the model actually used and optional token counts. Requests are non-streaming and inherit the caller's deadline.

## Missing or restricted service

```go
	answer, err := llm.Ask(c, question)
	if errcode.Of(err) == errcode.Unavailable {
		return c.Reply("AI is not configured on this bot.")
	}
	if err != nil {
		return err
	}
```

Import `sdk/errcode`, and return other errors unchanged. Plugins outside llm_service_allowed_plugins receive `PERMISSION_DENIED`. Missing or unconfigured Agent services can report unavailable or service lookup errors; handle the actual error relevant to your UI.

## Persist conversation history

```go
import (
	"encoding/json"

	"github.com/AlonaBot/AlonaBot/sdk/agent"
	"github.com/AlonaBot/AlonaBot/sdk/conversation"
	"github.com/AlonaBot/AlonaBot/sdk/llm"
)

func chat(c *sdk.Context, text string) error {
	key := c.Session() + "|" + c.User()
	entries, _, _, err := conversation.List(c, key, 0)
	if err != nil {
		return err
	}
	var history []llm.Message
	for _, e := range entries {
		var m llm.Message
		if err := json.Unmarshal(e.Entry, &m); err != nil {
			return err
		}
		history = append(history, m)
	}
	question := llm.Message{Role: "user", Text: text}
	resp, err := agent.Generate(c, llm.Request{Messages: append(history, question)})
	if err != nil {
		return err
	}
	answer := llm.Message{Role: "assistant", Text: resp.Text}
	q, err := json.Marshal(question)
	if err != nil {
		return err
	}
	a, err := json.Marshal(answer)
	if err != nil {
		return err
	}
	if _, err := conversation.Append(c, key, q, a); err != nil {
		return err
	}
	return c.Reply(resp.Text)
}
```

The key separates chats and users. Conversation entries remain ordered; Clear removes a conversation. Limit the history used in model requests according to your product's cost and context needs. The SDK storage API preserves the complete entries you pass to it.

## Testing

```go
func TestAsk(t *testing.T) {
	h := plugintest.Start(t,
		plugintest.Plugin(New()),
		plugintest.LLM(func(_ context.Context, req llm.Request) (llm.Response, error) {
			return llm.Response{Text: "42", Model: "fake"}, nil
		}),
	)
	alice := plugintest.User{ID: "alice"}
	h.Text(plugintest.Private(alice.ID), alice, "/ask What is the answer?").RequireReply(t, "42")
}
```

Import `context`, `testing`, `sdk/llm` and `plugintest`. The local test Agent returns a deterministic response without network access. Inspect req in the callback when the request itself matters.
