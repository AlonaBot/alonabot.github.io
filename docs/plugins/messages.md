---
sidebar_position: 5
title: 发送消息与媒体
description: 发送混合消息，保留回执，并使用媒体、编辑和流式文本。
---

一段文本用 `c.Reply("Hello")`；需要图片、文件或发送回执时用 `c.Send(content)`。本页 Handler 可通过 `p.Command("name").Handle(handler)` 在 `New()` 中登记。

## 单片段与混合内容

`message.Content` 同时接受单片段和 `message.Chain`：

```go
func sendPicture(c *sdk.Context) error {
    _, err := c.Send(message.Chain{
        message.Text("A picture"),
        message.ImageURL("https://example.com/photo.png"),
    })
    return err
}
```

将示例 URL 换成真实可访问的 HTTPS 图片。常用构造函数还有 `VideoURL`、`VoiceURL`、`FileURL`、`Mention`、`Quote` 和 `Forward`。链中顺序保留，Adapter 根据实例能力拆分成平台操作；跨平台用法详见[消息模型](https://github.com/AlonaBot/AlonaBot/blob/main/spec/MESSAGE-MODEL.md)。

## 读取回执与编辑

`Send`、`SendTo`、`Edit` 返回 `*message.SendResult` 和 `error`。发生部分失败时，两者可能同时存在；保留返回的回执与错误，用 `PartResults` 查看每个物理操作的状态与原片段索引。`Status` 为 Accepted、Partial、Rejected 或 Unknown。

以下例子需要 `sdk`、`message` 和标准库 `fmt`，目标实例须支持 `message.edit`：

```go
func sendAndEdit(c *sdk.Context) error {
    sent, err := c.Send(message.Text("Working..."))
    if err != nil {
        c.Logger().Error("send failed", "receipt", sent, "err", err)
        return err
    }
    ref := sent.Ref()
    if ref == "" {
        return fmt.Errorf("send receipt has no confirmed message ID")
    }
    _, err = c.Edit(ref, message.Text("Done"))
    return err
}
```

`Ref()` 提供首条已确认消息的句柄，`Refs()` 返回全部已确认消息的句柄。平台未提供消息 ID 时句柄为空；此时按业务需求保留原消息。`c.Delete(refs...)` 删除已确认消息，保留分项删除结果；这些操作取决于 Adapter 的相应能力。

## 发送到其他会话

- `c.Send` / `c.Reply` 使用当前默认会话。
- `c.SendTo(sid, content, sdk.Via("instance"))` 关联当前 Handler，发送到指定会话。
- 后台任务使用 `sdk.Send(ctx, sid, content, ...)` 或只需错误的 `sdk.SendText(ctx, sid, text, ...)`。

用 `message.SID(adapterID, chatID, threadID)` 构造会话字符串，`c.Session()`、`c.Instance()` 读取当前目标；`message.UID(adapterID, userID)` 构造用户字符串。显式其他目标、实例切换与后台发送按 Core 的实例发信许可逐次准入。后台使用 SDK 的 lifetime context；Handler 返回后结束其 Context 的使用。

## 从内存发送媒体

导入 `sdk/media`、`sdk/message` 和 `sdk`：

```go
func sendFile(c *sdk.Context) error {
    file, err := media.File(c.Context(), []byte("report contents"), "report.txt", "text/plain")
    if err != nil {
        return err
    }
    _, err = c.Send(message.Chain{message.Text("Report"), file})
    return err
}
```

`media.Image`、`Video`、`File` 将最多 **1 MiB** 的非空字节内联，较大内容先经 Core 上传。大文件或已有 reader 使用 `media.Upload(ctx, reader, mime)`，得到的 `ref.Source()` 可交给 `message.Image`、`message.File` 等构造函数。框架上传使用分块传输，避免为整文件再构造一份内联字符串。

收到图片时，使用载荷中的 `message.ImageSegment.Source`；若带 `IncomingMedia`，通过 `Source.Incoming.Source()` 取得来源。`media.Open(ctx, source)` 按需读取 incoming/media_ref 令牌，成功后关闭 reader。需要转交其他插件时使用 `media.Grant(ctx, token, granteePluginID, sessions...)`，按目标会话申请新授权。

## 流式文本

已有文本增量来源时，将它接到 `c.Stream`。以下使用 `sdk`、标准库 `context` 和 `io`：

```go
func streamText(c *sdk.Context) error {
    chunks := []string{"Hello", ", world!"}
    i := 0
    receipts, err := c.Stream(func(ctx context.Context) (string, error) {
        if err := ctx.Err(); err != nil {
            return "", err
        }
        if i == len(chunks) {
            return "", io.EOF
        }
        text := chunks[i]
        i++
        return text, nil
    })
    if err != nil {
        c.Logger().Error("stream failed", "receipts", receipts, "err", err)
    }
    return err
}
```

`next` 接收本次调用的 context，返回下一段文本；`io.EOF` 正常结束，同次返回的文本仍会处理。实例支持 `message.edit` 时先发送再节流编辑，按文本上限换条；缺少编辑能力时缓存增量，在正常结束后发送。返回值保留已经得到的全部回执，来源错误和发送错误原样交给调用者。流式输出使用真实事件的默认目标。

## 撤回与平台动作

`c.Delete(refs...)` 用消息句柄撤回同一会话和实例的消息，后台使用 `sdk.Delete(ctx, refs...)`。同时检查返回的 `message.DeleteResult.Items` 与错误，保留逐项结果。目标实例需支持 `message.delete`，官方平台实现进度见 [Adapter 概述](../adapters/index.md)。

调用 Adapter 已声明的动作时，Handler 使用 `c.CallAction(to, name, version, params, sdk.Via("instance"))`，返回原样 JSON 与错误，Core 按声明校验输入/结果 Schema。账号动作传空会话字符串；后台导入 `sdk/action`，用 `action.NewClient(ctx).CallAction(...)` 保留任务的取消与期限。动作名称和参数以 Adapter 声明为准；官方 Telegram、OneBot 11 的带类型动作助手仍在对应[实施计划](../adapters/index.md)中。

## 用户文案

业务回复通过 `c.T("message.key", "name", value)` 取翻译。文案放在 `i18n/en-US.json` 和 `i18n/zh-CN.json` 的 `messages` 节点下；日志和错误用英文。静态 `pong` 便于演示，发布时按用户语言提供文案。

依据：[发送](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/send.go)、[流式输出](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/stream.go)、[媒体](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/media/media.go)、[撤回](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/delete.go)、[平台动作](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/action/action.go)。继续阅读：[命令与事件](commands.md)、[配置 Schema 与 Secret](config.md)。
