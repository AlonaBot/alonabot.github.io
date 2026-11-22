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

处理任意消息里的图片时，遍历消息内容并累计大小；另导入 `errors`，通过 `errors.Join` 保留读取和关闭错误：

```go
	p.On(sdk.MessageCreated).Handle(func(c *sdk.Context, e *message.CreatedPayload) error {
		var total int64
		for _, seg := range e.Chain {
			if img, ok := seg.(message.ImageSegment); ok {
				r, err := media.Open(c, img.Source)
				if err != nil {
					return err
				}
				n, readErr := io.Copy(io.Discard, r)
				closeErr := r.Close()
				if err := errors.Join(readErr, closeErr); err != nil {
					return err
				}
				total += n
			}
		}
		if total == 0 {
			return nil
		}
		return c.Reply(fmt.Sprintf("Images: %d bytes", total))
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

- 平台支持编辑时，先发送，再节流编辑；超过实例文本上限时换条。已有发送回执在失败时仍会返回。
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

机器人主人可以限制插件主动发送的账号。可信入站事件的原实例、原会话回复沿用回复许可。

## 引用与递归节点

OneBot11 的 `message.ForwardSegment` 可交给 `c.ReadNodes(segment)`，返回递归 `[]message.ForwardItem`，保留作者、时间与已授权媒体。节点 Chain 中仍可包含子转发，继续遍历其 Items。后台使用 `sdk.ReadNodes(ctx, session, segment, sdk.Via(instance))`。读取失败可同时带部分节点，保留并处理错误后再使用结果。引用查询与 SnowLuma 已知问题见 [OneBot11](../usage/onebot11.md#forward-nodes)。

`media.Open` 读取受管引用或平台文件；HTTPS URL 出站时交给平台，Open 对 URL 来源返回 `INVALID_ARGUMENT`。上传 MIME 由媒体系统保存，Adapter 获得可信 MIME；发送时使用 `ref.Source()`，保持来源元数据由 Core 提供。
