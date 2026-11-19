---
title: 文本匹配与事件
description: 不用命令前缀，按消息内容触发；处理进群、撤回等事件。
---

命令要以 `/` 开头。想让机器人对普通的话有反应，或者处理「有人进群」这类不是消息的事情，用这一页的方法。

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
| `p.Regex(`expr`)` | 消息符合正则表达式 |

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

`p.On` 处理一类事件，`sdk.MessageCreated` 是「有新消息」。Handler 的第二个参数是这类事件的具体内容，`e.Chain` 是消息内容。不需要时可以只写 `func(c *sdk.Context) error`。

`sdk.NotCommand()` 让命令不触发它，否则 `/todo list` 也会被复述一遍。

:::caution 群里要克制
上面的写法会回复群里的每一条消息。在群里通常加上 `sdk.ToMe()`，只在被 @ 时回应：

```go
p.On(sdk.MessageCreated).Rule(sdk.ToMe(), sdk.NotCommand()).Handle(chat)
```
:::

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

## 同一种写了两个

两个内容完全相同的登记会在启动时报错，因为框架无法区分它们。给其中一个起个名字：

```go
	p.On(sdk.MessageCreated).ID("log").Handle(logMessage)
	p.On(sdk.MessageCreated).ID("chat").Rule(sdk.ToMe()).Handle(chat)
```

这个名字也是机器人主人在管理界面里看到的标识。只要内容不重复，就不用写。

## 平台特有的事件

平台可以提供标准事件之外的事件。用法是声明一个和平台约定好的结构体：

```go
type Poke struct {
	TargetID string `json:"target_id"`
}

var poke = sdk.AdapterEvent[Poke]("onebot11.poke", 1)

	p.On(poke).Handle(func(c *sdk.Context, e *Poke) error {
		return c.Reply("Don't poke me!")
	})
```

事件的名字、版本和字段由对应的 Adapter 规定，以它的文档为准。
