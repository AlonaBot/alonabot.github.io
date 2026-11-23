---
title: 调用大模型
description: 通过 Agent 使用大模型，不用自己管理密钥和接口。
---

插件不需要自己接大模型的 API。机器人主人在 [Agent](../usage/agent.md) 里配置好模型和密钥，所有插件通过 `sdk/llm` 共用。

## 生成文本

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

## 模型与生成参数

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

| 字段 | 含义 |
| --- | --- |
| `System` | 系统提示，设定模型的角色和要求 |
| `Messages` | 对话历史，`Role` 是 `user` 或 `assistant`，最后一条是这次的问题 |
| `Model` | 指定模型。不填时用机器人主人设置的缺省模型 |
| `MaxOutputTokens` | 回答的长度上限。不填时用模型的设置 |

返回的 `resp.Model` 是实际使用的模型。

## 没有配置模型时

机器人主人没有安装 Agent 或没有配置模型时，调用返回错误。给用户一个明确的提示：

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

机器人主人也可以只允许部分插件调用模型。不在名单里时错误码是 `PERMISSION_DENIED`。

## 保存对话历史

多轮对话需要把之前说过的话再传给模型。`sdk/conversation` 帮你按顺序保存：

```go
import (
	"encoding/json"

	"github.com/AlonaBot/AlonaBot/sdk/conversation"
	"github.com/AlonaBot/AlonaBot/sdk/llm"
)

func chat(c *sdk.Context, text string) error {
	key := c.Session() + "|" + c.User()

	// 取出历史
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

	// 提问
	question := llm.Message{Role: "user", Text: text}
	resp, err := llm.Generate(c, llm.Request{Messages: append(history, question)})
	if err != nil {
		return err
	}

	// 保存这一轮
	answer := llm.Message{Role: "assistant", Text: resp.Text}
	q, _ := json.Marshal(question)
	a, _ := json.Marshal(answer)
	if _, err := conversation.Append(c, key, q, a); err != nil {
		return err
	}
	return c.Reply(resp.Text)
}
```

`key` 决定哪些消息算同一段对话。上面按「会话 + 用户」区分，所以群里每个人有各自的上下文。清空用 `conversation.Clear(c, key)`。

历史越长，每次调用越慢、越贵。实际使用时只取最近的若干条。

## 测试

测试里用一个假的模型，不需要密钥，也不联网：

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

想检查插件传给模型的内容，在这个函数里把 `req` 存下来再断言。

## 工具循环

需要模型调用工具时，通过 `sdk/agent` 的 `agent.Run` 传入 `agent.RunRequest`。其中 `Input` 使用同一 `llm.Request`，`Tools` 指定工具目录；返回 `Text`、模型与工具步骤，以及各步的完整错误。流式运行使用 `agent.RunStream`。

`sdk/agent/goal` 用于创建持久目标，并查询状态、暂停、恢复或取消执行；目标按可验证条件验收。
