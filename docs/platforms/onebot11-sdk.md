---
title: OneBot 11 SDK
description: 在插件中使用 OneBot 11 权限、事件和平台客户端。
---

账号接入见 [OneBot 11](onebot11.md)。平台包位于 `github.com/AlonaBot/alonabot-adapter-onebot11`。

## 平台包

| 包 | 用途 |
| --- | --- |
| `perm` | 群主、群管理员与好友权限 |
| `event` | 平台专属事件 |
| `client` | 绑定当前账号的平台调用 |
| `segment` | 平台消息段 |

## 平台权限

```go
import (
    "github.com/AlonaBot/AlonaBot/sdk"
    "github.com/AlonaBot/alonabot-adapter-onebot11/perm"
)

func New() *sdk.Plugin {
    p := sdk.NewPlugin()
    p.Command("owner").Permission(sdk.PermissionName(perm.GroupOwner)).
        Handle(func(c *sdk.Context) error { return c.Reply("You own this group.") })
    return p
}
```

| 常量 | 权限 |
| --- | --- |
| `perm.GroupOwner` | 群主 |
| `perm.GroupAdmin` | 群管理员 |
| `perm.PrivateFriend` | 好友私聊 |

## 绑定当前账号

```go
import (
    "encoding/json"

    "github.com/AlonaBot/AlonaBot/sdk"
    "github.com/AlonaBot/alonabot-adapter-onebot11/client"
)

func friendList(c *sdk.Context) (json.RawMessage, error) {
    platform, err := client.From(c)
    if err != nil {
        return nil, err
    }
    return platform.Call("get_friend_list", struct{}{})
}
```

客户端使用当前事件的账号与可信调用上下文，保留平台完整结果和错误。查询接口也提供类型化结果，其 `Value` 保存解析值，`Raw` 保留原始 JSON。

## 查询账号操作

```fish
alonabot adapter actions qq
```

按返回的输入 Schema 准备参数，通过 `alonabot adapter call` 联调。通用消息处理见[回复消息](../tutorial/messages.md)。
