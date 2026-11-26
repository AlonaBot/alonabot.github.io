---
title: 回复消息
description: 回复文字和图片，读取用户、会话与消息信息。
---

Handler 的第一个参数 `c` 是调用上下文（`*sdk.Context`），用于读取用户、会话和事件信息，以及回复消息。

## 回复

```go
// 只回文字
return c.Reply("Added: " + text)

// 文字后面跟一张图片
return c.Reply("Here you go", message.ImageURL("https://example.com/cat.png"))
```

`message` 是 `github.com/AlonaBot/AlonaBot/sdk/message` 包。常用的内容：

| 写法 | 内容 |
| --- | --- |
| `message.Text("...")` | 文字 |
| `message.ImageURL(url)` | 图片 |
| `message.VideoURL(url)`、`message.VoiceURL(url)` | 视频、语音 |
| `message.FileURL(url)` | 文件 |
| `message.Mention(userID)` | @某人 |
| `message.Quote(ref)` | 引用一条消息 |

需要完全自己排列内容，或者要拿到发送结果时，用 `c.Send`：

```go
sent, err := c.Send(message.Chain{
	message.ImageURL("https://example.com/cat.png"),
	message.Text("A cat"),
})
```

`message.Chain` 是一串内容，按顺序发出。`sent` 里有发出的消息的标识，之后可以用来[编辑或撤回](../advanced/media.md#编辑和撤回)。

一次调用里可以回复多次：

```go
func add(c *sdk.Context, text string) error {
	if err := c.Reply("Saving..."); err != nil {
		return err
	}
	return c.Reply("Added: " + text)
}
```

回复群聊消息时，框架按配置文件的[回复方式](../usage/settings.md#回复方式)，自动给这次调用的第一条回复加上 @提及、引用或文字前缀；后台、定时任务和发往别的会话的消息不加。

## 用返回值回复

Handler 返回 `(message.Content, error)` 时，框架自动发送返回的内容：

```go
	p.Command("ping").Handle(func(c *sdk.Context) (message.Content, error) {
		return message.Text("pong"), nil
	})
```

返回 `nil` 表示这次不回复。

## 调用上下文

| 写法 | 得到 |
| --- | --- |
| `c.User()` | 发消息的用户，如 `telegram:123456` |
| `c.Session()` | 所在的会话，如 `telegram:-100123` |
| `c.Text()` | 消息里的文字 |
| `c.IsPrivate()`、`c.IsGroup()` | 是私聊还是群聊 |
| `c.Event()` | 完整的事件，包括消息 ID、时间、原始内容 |

`c.User()` 和 `c.Session()` 返回的都是字符串，格式是「平台:ID」。可以直接存进数据库，以后用来区分用户或者往这个会话发消息。

给待办清单加上「谁的待办」：

```go
	todo.Command("add").Description("Add a to-do item").RawTail().
		Handle(func(c *sdk.Context, text string) error {
			return c.Reply(fmt.Sprintf("Added for %s: %s", c.User(), text))
		})
```

```text
> /todo add buy milk
Added for console:local: buy milk
```

终端对话里的用户固定是 `console:local`。

## 出错时

Handler 返回的 `error` 会记到日志里，不会发给用户。要告诉用户出了什么问题，自己回复一句：

```go
func done(c *sdk.Context, number int) error {
	if number < 1 {
		return c.Reply("The number starts from 1.")
	}
	// ...
	return c.Reply("Done.")
}
```

需要让调用方（比如调用你服务的插件）区分错误类型时，用 `sdk/errcode` 返回带错误码的错误，例如 `errcode.InvalidArgument.New("invalid input")` 或 `errcode.InvalidArgument.Errorf("invalid field %s", name)`；用 `errcode.Of(err)` 读取错误链里的错误码，全部错误码见[错误码](../reference/errors.md)。

## 日志

用标准库的 `log/slog`，或者 `c.Logger()`（会自动带上这次调用的信息）：

```go
c.Logger().Info("item added", "user", c.User())
```

日志用英文写。不要用 `fmt.Println`：插件的标准输出有别的用途，往里写内容会让插件出错。终端对话时屏幕上只显示警告和错误，完整日志在 `data/logs/` 里。

下一页：[配置](config.md)。
