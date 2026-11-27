---
title: 媒体、编辑与流式输出
description: 发送和接收图片文件，编辑撤回消息，逐步输出长文本。
---

## 发送图片和文件

已经有网址的，直接用网址：

```go
return c.Reply("Here it is", message.ImageURL("https://example.com/chart.png"))
```

内容在内存里的（比如刚生成的图表），用 `sdk/media`：

```go
import "github.com/AlonaBot/AlonaBot/sdk/media"

func export(c *sdk.Context) error {
	file, err := media.File(c, []byte("buy milk\ncall mom\n"), "todos.txt", "text/plain")
	if err != nil {
		return err
	}
	return c.Reply("Your list", file)
}
```

| 方法 | 内容 |
| --- | --- |
| `media.Image(c, data)` | 图片 |
| `media.Video(c, data)` | 视频 |
| `media.File(c, data, 文件名, 类型)` | 文件 |

很大的文件不要整个读进内存，用 `media.Upload` 边读边传：

```go
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	ref, err := media.Upload(c, f, "application/zip")
	if err != nil {
		return err
	}
	return c.Reply("Backup", message.File(ref.Source(), "backup.zip"))
```

## 接收图片

把 Handler 的参数写成图片类型，用户就要在命令后面带一张图：

```go
	p.Command("size").Handle(func(c *sdk.Context, img *message.ImageSegment) error {
		r, err := media.Open(c, img.Source)
		if err != nil {
			return err
		}
		defer r.Close()

		data, err := io.ReadAll(r)
		if err != nil {
			return err
		}
		return c.Reply(fmt.Sprintf("%d bytes", len(data)))
	})
```

`media.Open` 返回一个 `io.ReadCloser`，图片内容在读的时候才从平台下载。用完要关闭。

处理任意消息里的图片时，遍历消息内容：

```go
	p.On(sdk.MessageCreated).Handle(func(c *sdk.Context, e *message.CreatedPayload) error {
		for _, seg := range e.Chain {
			if img, ok := seg.(message.ImageSegment); ok {
				// 用 media.Open(c, img.Source) 读取
				_ = img
			}
		}
		return nil
	})
```

## 编辑和撤回

`c.Send` 返回的结果里有消息的标识，用它编辑或撤回：

```go
func work(c *sdk.Context) error {
	sent, err := c.Send(message.Text("Working..."))
	if err != nil {
		return err
	}

	// ... 做一些耗时的事 ...

	_, err = c.Edit(sent.Ref(), message.Text("Done."))
	return err
}
```

撤回：

```go
_, err = c.Delete(sent.Ref())
```

`sent.Ref()` 是一个字符串，可以存进数据库，以后再用。用户发来的那条消息的标识是 `c.Event().Ref()`，可以用来引用回复：

```go
return c.Reply("Got it", message.Quote(c.Event().Ref()))
```

编辑和撤回都需要平台支持。不支持时返回 `UNSUPPORTED` 错误。

## 流式输出

内容是一点一点产生的（比如大模型的回答），用 `c.Stream` 让用户看到逐步出现的文字，而不是等到最后：

```go
func story(c *sdk.Context) error {
	parts := []string{"Once upon a time, ", "there was a bot. ", "The end."}
	i := 0
	_, err := c.Stream(func(ctx context.Context) (string, error) {
		if i == len(parts) {
			return "", io.EOF
		}
		part := parts[i]
		i++
		return part, nil
	})
	return err
}
```

你提供一个函数，每次被调用时返回下一段文字，全部给完后返回 `io.EOF`。

- 平台支持编辑时，先发出第一段，之后不断编辑同一条消息把内容接上。
- 平台不支持编辑时，等全部给完后一次发出。

两种情况下你的代码相同。

## 发到别的会话

`c.Reply` 和 `c.Send` 发到当前会话。发到别处用 `c.SendTo`：

```go
_, err := c.SendTo("telegram:-100123456", message.Text("Hello"))
```

机器人有多个账号时，用 `sdk.Via` 指定用哪个发：

```go
_, err := c.SendTo(session, message.Text("Hello"), sdk.Via("main"))
```

会话标识的格式是「平台:会话 ID」。通常不用自己拼，用 `c.Session()` 取到后保存即可；需要拼时用 `message.SID("telegram", "-100123456", "")`。

机器人主人可以限制插件能往哪些账号主动发消息。回复当前消息不受这个限制。

## 交给其他插件读取

媒体只能由上传它的插件读取。要交给另一个插件时，用 `media.Grant(c, token, 对方插件 ID, 会话...)` 签发一个新 token；新 token 只能和原来一样或更窄，不能扩大可用的会话或期限。

例如，在当前会话授权 `alonabot-plugin-preview` 读取文件，再通过已有的 Service 把 `sharedToken` 交给它。授权失败时直接返回错误。

```go
sharedToken, err := media.Grant(c, token, "alonabot-plugin-preview", c.Session())
if err != nil {
    return err
}
```

## 读取合并转发

收到合并转发的消息时，用 `c.ReadNodes(forward)` 展开（`forward` 是消息里的 `message.ForwardSegment`）。返回的每一项保留作者、时间和消息内容，可以继续嵌套；里面的图片和文件可以直接用 `media.Open(c, segment.Source)` 读取。后台任务里用 `sdk.ReadNodes(ctx, 会话, forward, sdk.Via(账号名))`。

例如，从 Handler 展开已有的 `forward` 片段，把一级条目里的文本追加到 `lines`（`[]string`）。`Source` 可能为空，`Chain` 只在平台返回正文时含有消息片段。

```go
items, err := c.ReadNodes(forward)
if err != nil {
    return err
}
for _, item := range items {
    for _, segment := range item.Chain {
        if text, ok := segment.(message.TextSegment); ok {
            lines = append(lines, text.Text)
        }
    }
}
```

## 发送 Markdown

```go
md := message.Markdown("**Title**\n[Link](https://example.com)")
_, err := c.Send(md)             // 平台支持时转换成富文本
_, err = c.Send(md.PlainText())  // 明确发送纯文本
```

写法是 CommonMark 加删除线。平台不支持 Markdown，或者内容里有图片、HTML 时，`c.Send(md)` 返回 `UNSUPPORTED`，这时改发 `md.PlainText()`。
