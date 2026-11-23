---
title: Telegram SDK
description: 在插件中使用 Telegram 权限、事件与平台动作。
---

账号接入见 [Telegram](telegram.md)。通用命令、消息与按钮使用 AlonaBot SDK；Telegram 专属操作由 Adapter 的 Go module 提供。

## 导入平台包

| 包 | 用途 |
| --- | --- |
| `github.com/AlonaBot/alonabot-adapter-telegram/perm` | 群主与管理员权限 |
| `github.com/AlonaBot/alonabot-adapter-telegram/event` | 平台事件声明 |
| `github.com/AlonaBot/alonabot-adapter-telegram/action` | 类型化平台动作 |

## 平台权限

```go
import (
    "github.com/AlonaBot/AlonaBot/sdk"
    "github.com/AlonaBot/alonabot-adapter-telegram/perm"
)

func New() *sdk.Plugin {
    p := sdk.NewPlugin()
    p.Command("owner").Permission(sdk.PermissionName(perm.ChatOwner)).
        Handle(func(c *sdk.Context) error { return c.Reply("You own this chat.") })
    return p
}
```

`perm.ChatOwner` 表示群主，`perm.ChatAdmin` 表示群管理员。通用群管理权限使用 `sdk.ChatAdmin`。

## 查询聊天信息

```go
import (
    "github.com/AlonaBot/AlonaBot/sdk"
    tg "github.com/AlonaBot/alonabot-adapter-telegram/action"
)

func chatInfo(c *sdk.Context) error {
    chat, err := tg.GetChat(c, c.Session())
    if err != nil {
        return err
    }
    return c.Reply(chat.Title)
}
```

同一包还提供成员管理、置顶和消息回应等动作。消息动作传入消息句柄，账号随句柄选择；后台发送或多账号操作可用 `sdk.Via` 指定实例。

## 查询账号操作

```fish
alonabot adapter actions main
```

结果列出当前账号的操作名称与输入 Schema，用于确认平台调用参数。联调流程见[在平台上联调插件](development.md)。
