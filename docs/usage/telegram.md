---
title: Telegram
description: 配置 long polling、代理、媒体、类型化动作和分域命令菜单。
---

## 接入

1. 向 [@BotFather](https://t.me/BotFather) 发送 `/newbot`，取得 token。
2. 在 Core 进程的环境中设置 `TELEGRAM_BOT_TOKEN`，在 `core_config.json` 合并下面的账号配置。
3. 重启 Core；首次会按需下载安装官方 Adapter。开发模式可直接保存并等待实例重载。

```json title="core_config.json"
{
  "adapters": {
    "telegram": {
      "default_instance": "main",
      "instances": {
        "main": { "token": "${TELEGRAM_BOT_TOKEN}" }
      }
    }
  }
}
```

在运行中的 Core 上安装 help 插件后发送 `/help` 验证；管理命令带上启动时的数据目录：

```fish
alonabot install --source AlonaBot/alonabot-plugin-help --yes
alonabot enable alonabot-plugin-help-official --yes
```

曾卸载过的 Adapter 需[显式重装](install.md#安装官方组件)。多个账号在 `instances` 下使用不同名字，插件通过 `sdk.Via("main")` 选择账号。

## Long polling

Adapter 启动时通过 `getMe` 核验账号、通过 `getWebhookInfo` 检查 webhook，再以 30 秒 long polling 调用 `getUpdates`。Core 保存接收游标，重启后从已确认的位置继续。

已有 webhook 会导致启动失败；先停用占用同一 token 的程序，调用 Bot API `deleteWebhook` 后再启动。同一个 token 保持一个轮询接收者，避免 `getUpdates` 冲突。普通 HTTP 出站访问即可接收消息。

## 账号设置与代理

| 键 | 缺省值 | 含义 |
| --- | --- | --- |
| `token` | 必填，secret | BotFather token |
| `api_base_url` | `https://api.telegram.org` | Bot API 根地址，可带路径前缀 |
| `file_base_url` | 空 | 文件下载根地址；空时沿用 API 根地址 |
| `proxy_mode` | `none` | `none` 直连；`core` 使用 Core 下发的代理环境；`custom` 使用实例代理 |
| `proxy` | 空 | custom 模式的 `http`、`https` 或 `socks5` URL |
| `auto_sync_commands` | `true` | 自动发布分域命令菜单 |
| `clear_commands_on_disable` | `true` | 自动转手动时清理受管菜单 |

```json
{
  "proxy": "http://127.0.0.1:7890",
  "adapters": {
    "telegram": {
      "instances": {
        "main": { "token": "${TELEGRAM_BOT_TOKEN}", "proxy_mode": "core" }
      }
    }
  }
}
```

API 请求和文件下载共用实例客户端。容器的 `127.0.0.1` 指向容器自身，代理地址需从容器可达。

## 媒体、按钮与编辑撤回

文字、图片、视频、语音和文件均可收发。入站 audio 映射为文件，animation/video note 映射为视频，静态 sticker 映射为图片；相册中的消息逐条交付。出站支持 HTTPS URL、同实例平台文件、内联字节和受管媒体引用。可信 MIME 为 `image/gif` 的图片或可识别的内联 GIF 以 animation 发送；HTTPS URL 由平台下载，按普通图片处理。

```go
func update(c *sdk.Context) error {
    sent, err := c.Send(message.Text("Working..."))
    if err != nil {
        return err
    }
    _, err = c.Edit(sent.Ref(), message.Text("Done."))
    return err
}
```

上例需导入 `sdk` 与 `sdk/message`；撤回使用 `c.Delete(sent.Ref())`。编辑接受单个文本片段及可选按钮；按钮教程见[按钮](../advanced/buttons.md)，引用用 `message.Quote(ref)`。撤回仍受 Telegram 的账号权限与平台规则约束。

| 项目 | Adapter 限制 |
| --- | --- |
| 普通文字 | 4096 UTF-16 码元 |
| 媒体说明 | 1024 UTF-16 码元 |
| 连续图片/视频分组 | 每组最多 10 项 |
| `getFile` 下载 | 最大 20 MiB |
| 平台回调数据 | 最大 64 字节，业务按钮由 Core 签发 token |

超限保留明确错误。流式文字使用 `c.Stream`，Core 按实例文本上限分条并节流编辑。

## 类型化动作与事件

公开包位于独立 Adapter module。动作使用 `github.com/AlonaBot/alonabot-adapter-telegram/action`，可直接传实现 `action.Caller` 的 `c`：

```go
import tgaction "github.com/AlonaBot/alonabot-adapter-telegram/action"

func pin(c *sdk.Context) error {
    _, err := tgaction.PinChatMessage(c, c.Event().Ref(), tgaction.PinChatMessageParams{})
    return err
}
```

另有封禁/解封、禁言、取消置顶、reaction、聊天及成员查询、改标题、离群、输入状态与草稿动作。`Typing(ctx, to, opts...)` 每 4 秒刷新，到 ctx 结束停止；`StreamDraft` 面向私聊，更新结束后通过普通 Send 发布最终文本。草稿动作与最终 Send 的 Hook 行为分别按动作和消息处理。

扩展事件使用公开 `event` 包的类型和名称：

```go
import tgevent "github.com/AlonaBot/alonabot-adapter-telegram/event"

var topicCreated = sdk.AdapterEvent[tgevent.ForumTopicCreated](tgevent.ForumTopicCreatedName, 1)

// 在 New 中登记。
p.On(topicCreated).Handle(func(c *sdk.Context, e *tgevent.ForumTopicCreated) error {
    return c.Reply("Topic created: " + e.Name)
})
```

事件包括话题创建、编辑、关闭、重开，消息置顶、群标题变化和群迁移。标准事件还覆盖消息创建/编辑、成员进退、reaction 和按钮点击；普通消息删除通知由 Telegram 提供情况决定，当前无标准删除入站映射。

## 分域命令菜单 {#command-menus}

希望根命令出现在菜单时显式加 `.Menu()`：

```go
p.Command("hello").Menu().Description("Say hello").Handle(hello)
```

自动菜单按账号、聊天、语言、Profile、实例许可、插件开关、命令策略与 `/` 前缀计算，只选主名胜出的单 token 公开命令。论坛话题共用聊天菜单，实际执行仍逐话题鉴权。英文说明写在 `Description`；其他语言在插件 `i18n/<locale>.json` 的 `commands` 下翻译。

手动接管先将实例 `auto_sync_commands` 设为 false，保存并重启实例。缺省先清理受管位置；`clear_commands_on_disable: false` 保留菜单。首次手动与手动重启保留已有菜单。

```go
import "github.com/AlonaBot/AlonaBot/sdk/command"

// 在 New 中登记；同时导入 sdk/message。
p.On(sdk.CommandMenuReady).Handle(func(c *sdk.Context, ready *message.CommandMenuReadyPayload) error {
    if ready.ChatID == "" {
        return nil
    }
    return command.Set(c, ready.AdapterInstanceID, command.Menu{
        Scope: command.Scope{Type: "chat", ChatID: ready.ChatID},
        LanguageCode: "en",
        Commands: []command.Item{{Name: "hello", Description: "Say hello"}},
    })
})
```

插件可写 `chat`、`chat_administrators`、带 UserID 的 `chat_member` scope；空语言为默认，其他语言取两位小写主语言。每份最多 100 条，名字匹配 `^[a-z0-9_]{1,32}$`，说明为 1～256 个 Unicode 字符。Set 覆盖整份菜单并转移该 scope+language 的所有权。

`command.Get` 读取平台菜单，`Delete` 删除明确位置，`Status` 查看 Ready、LastError 和所有权；`Sync` 在自动模式全量重建，在手动模式重新处理清理和 ready 通知。Set/Delete 要求手动且就绪。禁用、卸载或失去许可时回收该插件拥有的位置；平台失败完整保留在 LastError 中，修复原因后显式 Sync。历史外部工具写入的 scope 需明确定位后删除。

## 群聊排查

在 BotFather `/setprivacy` 中选 Disable，可接收普通群消息。频道、管理员动作和成员信息取决于 Telegram 授予的权限。完整能力对照见[平台表](platforms.md)。
