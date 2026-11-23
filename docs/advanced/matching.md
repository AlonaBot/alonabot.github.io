---
title: 文本匹配与事件
description: 不用命令前缀，按消息内容触发；处理进群、撤回等事件。
---

文本匹配根据消息内容触发 Handler；事件订阅处理新消息、成员加入、消息撤回等平台事件。

## 按内容匹配

```go
	p.FullMatch("hello", "hi").IgnoreCase().
		Handle(func(c *sdk.Context) error {
			return c.Reply("Hello!")
		})
```

```text
> Hi
Hello!
```

| 方法 | 什么时候触发 |
| --- | --- |
| `p.FullMatch("a", "b")` | 消息正好是其中一个 |
| `p.Keyword("a", "b")` | 消息里包含其中一个 |
| `p.StartsWith("a", "b")` | 消息以其中一个开头 |
| `p.EndsWith("a", "b")` | 消息以其中一个结尾 |
| `p.Regex(expr)` | 消息符合正则表达式 |

加 `.IgnoreCase()` 不区分大小写。Handler 里用 `c.Text()` 取消息的文字。

### 正则表达式

用 `c.Match()` 取匹配结果，第 0 项是整个匹配，之后是各个括号里的内容：

```go
	p.Regex(`^remind me in (\d+) minutes$`).
		Handle(func(c *sdk.Context) error {
			return c.Reply("OK, in " + c.Match()[1] + " minutes.")
		})
```

```text
> remind me in 10 minutes
OK, in 10 minutes.
```

正则用的是 Go 标准库 `regexp` 的语法。

## 处理所有消息

```go
import "github.com/AlonaBot/AlonaBot/sdk/message"

	p.On(sdk.MessageCreated).Rule(sdk.NotCommand()).
		Handle(func(c *sdk.Context, e *message.CreatedPayload) error {
			return c.Reply("You said: " + e.Chain.Text())
		})
```

```text
> good morning
You said: good morning
```

`p.On` 注册事件处理函数，`sdk.MessageCreated` 对应新消息事件。SDK 将事件载荷绑定到 Handler 的第二个参数 `e`，`e.Chain` 是消息链。只使用调用上下文时，签名可写为 `func(c *sdk.Context) error`。

`sdk.NotCommand()` 让命令不触发它，否则 `/todo list` 也会被复述一遍。

### 只处理发给机器人的消息

加上 `sdk.ToMe()`，在私聊、被 @ 或收到对机器人消息的回复时处理：

```go
p.On(sdk.MessageCreated).Rule(sdk.ToMe(), sdk.NotCommand()).Handle(chat)
```

## 其他事件

| 事件 | 什么时候发生 | 第二个参数的类型 |
| --- | --- | --- |
| `sdk.MessageCreated` | 有新消息 | `*message.CreatedPayload` |
| `sdk.MessageEdited` | 消息被编辑 | `*message.EditedPayload` |
| `sdk.MessageDeleted` | 消息被撤回 | `*message.DeletedPayload` |
| `sdk.MemberJoined` | 有人进群 | `*message.MemberPayload` |
| `sdk.MemberLeft` | 有人退群 | `*message.MemberPayload` |
| `sdk.ReactionAdded` | 有人给消息点了表情 | `*message.ReactionAddedPayload` |
| `sdk.BotOnline`、`sdk.BotOffline` | 机器人账号上线、下线 | `*message.BotOnlinePayload`、`*message.BotOfflinePayload` |

欢迎新成员：

```go
	p.On(sdk.MemberJoined).
		Handle(func(c *sdk.Context, e *message.MemberPayload) error {
			return c.Reply("Welcome!", message.Mention(e.MemberExternalUserID))
		})
```

平台不支持的事件不会发生。比如某个平台不通知消息被编辑，`sdk.MessageEdited` 的 Handler 在那里就永远不会被调用。

## 路由 ID

相同事件的处理函数默认使用相同的路由 ID，重复注册会在启动时报错。用 `.ID(...)` 分别指定标识：

```go
	p.On(sdk.MessageCreated).ID("log").Handle(logMessage)
	p.On(sdk.MessageCreated).ID("chat").Rule(sdk.ToMe()).Handle(chat)
```

管理界面用路由 ID 区分这些处理函数。默认 ID 已唯一时可省略 `.ID(...)`。

## 平台特有的事件

平台可以提供标准事件之外的事件。用法是声明一个和平台约定好的结构体：

```go
type Poke struct {
	TargetID string `json:"target_id"`
}

var poke = sdk.AdapterEvent[Poke]("example.poke", 1)

	p.On(poke).Handle(func(c *sdk.Context, e *Poke) error {
		return c.Reply("Don't poke me!")
	})
```

事件的名字、版本和字段由对应的 Adapter 规定，以它的文档为准。
