---
title: Calling models
description: Use models through Agent with centrally managed credentials and APIs.
---

Bot owners configure models and credentials in [Agent](../usage/agent.md). Plugins share access through `sdk/llm`.

## Generate text

```go
import "github.com/AlonaBot/AlonaBot/sdk/llm"

	p.Command("ask").RawTail().Handle(func(c *sdk.Context, question string) error {
		resp, err := llm.Generate(c, llm.Request{Messages: []llm.Message{{Role: "user", Text: question}}})
		if err != nil {
			return err
		}
		return c.Reply(resp.Text)
	})
```

```text
> /ask What is the capital of France?
The capital of France is Paris.
```

## Models and generation parameters

```go
	resp, err := llm.Generate(c, llm.Request{
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

| Field | Meaning |
| --- | --- |
| `System` | System prompt defining the model's role and instructions |
| `Messages` | Conversation history; `Role` is `user` or `assistant`, with the current question last |
| `Model` | Model selection; defaults to the owner's configured model |
| `MaxOutputTokens` | Output token limit; defaults to model settings |

`resp.Model` identifies the model actually used.

## Handle missing configuration

Calls return an error when Agent is absent or no model is configured. Give the user a clear message:

```go
	resp, err := llm.Generate(c, llm.Request{Messages: []llm.Message{{Role: "user", Text: question}}})
	if errcode.Of(err) == errcode.Unavailable {
		return c.Reply("AI is not configured on this bot.")
	}
	if err != nil {
		return err
	}
	return c.Reply(resp.Text)
```

Owners can restrict model access to selected plugins. Other plugins receive `PERMISSION_DENIED`.

## Store conversation history

Pass earlier messages to the model for multi-turn conversations. `sdk/conversation` stores them in order:

```go
import (
	"encoding/json"

	"github.com/AlonaBot/AlonaBot/sdk/conversation"
	"github.com/AlonaBot/AlonaBot/sdk/llm"
)

func chat(c *sdk.Context, text string) error {
	key := c.Session() + "|" + c.User()

	// Load history
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

	// Ask the model
	question := llm.Message{Role: "user", Text: text}
	resp, err := llm.Generate(c, llm.Request{Messages: append(history, question)})
	if err != nil {
		return err
	}

	// Save this turn
	answer := llm.Message{Role: "assistant", Text: resp.Text}
	q, _ := json.Marshal(question)
	a, _ := json.Marshal(answer)
	if _, err := conversation.Append(c, key, q, a); err != nil {
		return err
	}
	return c.Reply(resp.Text)
}
```

`key` groups messages into a conversation. The example uses session and user, giving each group member a separate context. Clear it with `conversation.Clear(c, key)`.

Longer histories increase latency and cost. Retrieve only the recent entries you need.

## Testing

Use a fake model in tests, without credentials or network access:

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

Capture `req` inside this function to assert what the plugin sends to the model.

## Tool loop

For model tool calls, pass an `agent.RunRequest` to `agent.Run` from `sdk/agent`. `Input` uses the same `llm.Request`, and `Tools` selects the tool catalog. Results include `Text`, model and tool steps, and each step's full error. Use `agent.RunStream` for streaming.

Use `sdk/agent/goal` to create persistent goals, inspect status, and pause, resume, or cancel execution. Goals are accepted against verifiable conditions.
