---
title: 事件、权限与标识
description: 标准事件、权限名，以及用户、会话、消息标识的格式。
---

## 事件

| 常量 | 名称 | 什么时候发生 | 内容的类型 |
| --- | --- | --- | --- |
| `sdk.MessageCreated` | `message.created` | 有新消息 | `*message.CreatedPayload` |
| `sdk.MessageEdited` | `message.edited` | 消息被编辑 | `*message.EditedPayload` |
| `sdk.MessageDeleted` | `message.deleted` | 消息被撤回 | `*message.DeletedPayload` |
| `sdk.ButtonClicked` | `button.clicked` | 按钮被点击。一般用 [`button.On`](../advanced/buttons.md) 处理 | `*message.ButtonClickedPayload` |
| `sdk.MemberJoined` | `member.joined` | 有人进群 | `*message.MemberPayload` |
| `sdk.MemberLeft` | `member.left` | 有人退群 | `*message.MemberPayload` |
| `sdk.ReactionAdded` | `reaction.added` | 有人给消息加了表情回应 | `*message.ReactionAddedPayload` |
| `sdk.BotOnline` | `bot.online` | 机器人账号上线 | `*message.BotOnlinePayload` |
| `sdk.BotOffline` | `bot.offline` | 机器人账号下线 | `*message.BotOfflinePayload` |
| `sdk.CommandInvoked` | `command.invoked` | 有命令被执行。只有命令的名字和结果，没有参数和聊天内容，适合做统计 | `*message.CommandInvokedPayload` |

用法见[文本匹配与事件](../advanced/matching.md)。平台专属事件见 [Telegram SDK](../platforms/telegram-sdk.md) 与 [OneBot 11 SDK](../platforms/onebot11-sdk.md)。

### 新消息的内容

```go
type CreatedPayload struct {
	PlatformMessageID string         // 平台上的消息 ID
	Chain             message.Chain  // 消息内容
	ToMe              bool           // 是不是发给机器人的
}
```

`ToMe` 在这些情况下为 `true`：私聊、@ 了机器人、回复了机器人的消息。

## Context 上的方法

| 方法 | 返回 |
| --- | --- |
| `c.User()` | 触发这次调用的用户。没有用户时（定时任务）是 `""` |
| `c.Session()` | 所在的会话。没有时是 `""` |
| `c.Instance()` | 收到消息的机器人账号的名字 |
| `c.Text()` | 消息里的文字 |
| `c.Event()` | 完整的事件 |
| `c.ChatType()`、`c.IsPrivate()`、`c.IsGroup()`、`c.IsChannel()` | 当前事件或 Service 调用继承的会话类型。没有真实入站事件时为 `message.ChatUnspecified` |
| `c.Has(权限)` | 用户有没有这个权限 |
| `c.Config()` | 配置 |
| `c.Logger()` | 日志 |
| `c.T(键, ...)` | 取当前用户语言的文字 |
| `c.Match()` | 正则匹配的结果 |
| `c.Reply(...)`、`c.Send(...)`、`c.SendTo(...)` | 发消息 |
| `c.Edit(...)`、`c.Delete(...)` | 编辑、撤回 |
| `c.Stream(...)` | 流式输出 |
| `c.Wait(时长)` | 等用户的下一条消息 |
| `c.StopPropagation()` | 不让后面的 Handler 处理这条消息 |

`c` 本身可以当作 `context.Context` 传给需要它的函数，如 `kv.Set(c, ...)`、`db.QueryContext(c, ...)`。

`c` 只在 Handler 运行期间有效。不要把它存起来在 Handler 返回之后用，也不要传给后台协程。

## 权限

| 常量 | 名称 | 含义 |
| --- | --- | --- |
| `sdk.Anyone` | | 任何来源 |
| `sdk.User` | `user` | 平台确认了身份的用户 |
| `sdk.Admin` | `admin` | 机器人管理员 |
| `sdk.ChatAdmin` | `chat_admin` | 当前群的管理员或群主 |

平台权限常量见 [Telegram SDK](../platforms/telegram-sdk.md) 与 [OneBot 11 SDK](../platforms/onebot11-sdk.md)。

## 标识的格式

用户、会话、消息的标识都是字符串，可以直接存进数据库。

| 标识 | 格式 | 例子 | 取得 | 手动生成 |
| --- | --- | --- | --- | --- |
| 用户 | `平台:用户ID` | `telegram:123456789` | `c.User()` | `message.UID(平台, 用户ID)` |
| 会话 | `平台:会话ID` | `telegram:-100123456` | `c.Session()` | `message.SID(平台, 会话ID, "")` |
| 会话里的话题 | `平台:会话ID#话题ID` | `telegram:-100123456#42` | `c.Session()` | `message.SID(平台, 会话ID, 话题ID)` |
| 消息 | `会话/消息ID@账号名` | `telegram:-100123456/789@main` | `sent.Ref()`、`c.Event().Ref()` | `message.Ref(会话, 消息ID, 账号名)` |

需要拆开时用 `message.ParseUID`、`message.ParseSID`、`message.ParseRef`。ID 里有特殊字符时这些函数会处理转义，所以不要自己用字符串拼接或切分。

## 消息内容

`message.Chain` 是一组片段。构造：

| 函数 | 片段 |
| --- | --- |
| `message.Text(s)` | 文字 |
| `message.ImageURL(url)`、`message.Image(来源)` | 图片 |
| `message.VideoURL(url)` | 视频 |
| `message.VoiceURL(url)` | 语音 |
| `message.FileURL(url)`、`message.File(来源, 文件名)` | 文件 |
| `message.Mention(用户ID)` | @某人。参数是平台上的用户 ID，不带平台前缀 |
| `message.Quote(消息标识)` | 引用一条消息 |
| `message.Buttons(行...)` | 按钮 |
| `message.Forward(...)` | 合并转发 |

`chain.Text()` 把其中的文字连起来返回。
