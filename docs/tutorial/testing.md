---
title: 测试
description: 在 go test 里给插件发消息，断言它的回复。
---

`plugintest` 在 `go test` 中启动 Core 并加载插件，支持发送消息、断言回复。命令解析、权限、配置和数据库使用与正式运行相同的实现。

## 测试命令回复

在 `plugin.go` 旁边新建 `plugin_test.go`：

```go title="plugin_test.go"
package plugin

import (
	"testing"

	"github.com/AlonaBot/AlonaBot/plugintest"
)

func TestAddAndList(t *testing.T) {
	h := plugintest.Start(t, plugintest.Plugin(New()))
	alice := plugintest.User{ID: "alice"}
	chat := plugintest.Private(alice.ID)

	h.Text(chat, alice, "/todo add buy milk").RequireReply(t, "Added: buy milk")
	h.Text(chat, alice, "/todo list").RequireReply(t, "1. buy milk")
}
```

```sh
go test ./...
```

测试接口：

- `plugintest.Start` 启动 Core 并装入插件。每个测试有自己的临时目录和空数据库，测试结束时自动清理。
- `plugintest.User{ID: "alice"}` 是一个测试用户，`plugintest.Private(...)` 是和她的私聊。群聊用 `plugintest.Group("room")`。
- `h.Text(chat, user, text)` 以这个用户的身份发一条消息，等插件处理完，返回结果。不需要 `sleep`。
- `RequireReply(t, want)` 断言插件正好回复了一条内容为 `want` 的消息，并且 Handler 没有出错。

## 检查消息与执行结果

`h.Text` 返回的结果里有这次处理产生的全部内容：

```go
	result := h.Text(chat, alice, "/todo list")
	if len(result.Sends) != 1 {
		t.Fatalf("got %d messages, want 1", len(result.Sends))
	}
	sent := result.Sends[0]
	t.Log(sent.Text())  // 消息里的文字
	t.Log(sent.Chain)   // 完整内容，可以检查图片、按钮
	t.Log(sent.To)      // 发到了哪个会话
```

| 字段 | 内容 |
| --- | --- |
| `result.Sends` | 插件发出的消息，按顺序 |
| `result.Outcomes` | 每个被调用的 Handler 的结果，`Err` 不为 `nil` 表示出错 |
| `result.Waiting` | 插件是否正在等用户的下一条消息 |

## 测试配置

```go
func TestLimit(t *testing.T) {
	p := New()
	h := plugintest.Start(t,
		plugintest.Plugin(p),
		plugintest.Config(p, `{"limit": 1}`),
	)
	alice := plugintest.User{ID: "alice"}
	chat := plugintest.Private(alice.ID)

	h.Text(chat, alice, "/todo add buy milk").RequireReply(t, "Added: buy milk")
	h.Text(chat, alice, "/todo add call mom").RequireReply(t, "Your list is full.")
}
```

`Config` 和 `Plugin` 要传同一个 `p`。不写 `Config` 时用各配置项的默认值。

## 测试多轮对话

```go
func TestClear(t *testing.T) {
	h := plugintest.Start(t, plugintest.Plugin(New()))
	alice := plugintest.User{ID: "alice"}
	chat := plugintest.Private(alice.ID)

	h.Text(chat, alice, "/todo add buy milk")

	question := h.Text(chat, alice, "/todo clear")
	question.RequireReply(t, "Remove all items? Reply yes to confirm.")
	if !question.Waiting {
		t.Fatal("plugin should be waiting for an answer")
	}

	h.Text(chat, alice, "yes").RequireReply(t, "All items removed.")
	h.Text(chat, alice, "/todo list").RequireReply(t, "Nothing to do.")
}
```

## 测试权限

测试用户缺省是普通用户。用 `plugintest.Admin` 指定机器人管理员：

```go
func TestAdminOnly(t *testing.T) {
	h := plugintest.Start(t, plugintest.Plugin(New()), plugintest.Admin("root"))
	root := plugintest.User{ID: "root"}
	bob := plugintest.User{ID: "bob"}

	h.Text(plugintest.Private(root.ID), root, "/todo purge").RequireReply(t, "Purged.")

	denied := h.Text(plugintest.Private(bob.ID), bob, "/todo purge")
	if len(denied.Sends) != 0 {
		t.Fatalf("bob got a reply: %+v", denied.Sends)
	}
}
```

没有权限时 Handler 不会被调用，所以没有回复。

## 其他测试场景

| 场景 | 方法 |
| --- | --- |
| 点击按钮 | `h.Click(user, sent, "动作名")`，见[按钮](../advanced/buttons.md#测试) |
| 触发定时任务 | `h.Trigger(p, "任务名")`，见[定时任务](../advanced/schedule.md#测试) |
| 替换大模型 | `plugintest.LLM(fn)`，见[调用大模型](../advanced/llm.md#测试) |
| 图片等非文字消息 | `h.Message(chat, user, message.Chain{...})` |
| 两个插件互相调用 | 多写几个 `plugintest.Plugin(...)` |
| 平台不支持某功能时 | `plugintest.Capabilities("message.send")` 只保留列出的能力 |

同一个测试里的 `h.Text` 等调用要按顺序执行，不要并发调用。

## 真实平台联调

`plugintest` 使用模拟 Adapter。消息拆分、平台排版等行为通过[真实平台联调](../platforms/development.md)验证。
