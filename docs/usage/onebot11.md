---
title: OneBot 11
description: 通过正反向 WebSocket 接入，收发媒体并读取递归转发节点。
---

OneBot11 Adapter 将协议端（如 NapCat、Lagrange、SnowLuma）连接到 Core。先登录并配置协议端，再选择正向或反向 WebSocket。各实现的账号政策与平台能力以其说明为准。

## 正向 WebSocket {#forward-ws}

协议端开放 Universal 正向 WebSocket，消息上报选择数组格式。在 `core_config.json` 中合并：

```json
{
  "adapters": {
    "onebot11": {
      "default_instance": "qq-main",
      "instances": {
        "qq-main": {
          "mode": "forward",
          "ws_url": "ws://127.0.0.1:3001",
          "access_token": "${ONEBOT_TOKEN}"
        }
      }
    }
  }
}
```

确保环境变量在 Core 中可用，重启 Core，首次按需安装官方 Adapter。曾卸载过时[显式重装](install.md#安装官方组件)。正向启动和每次重连通过 `get_login_info` 核对账号；账号变化会报告故障。

安装 help 后给机器人发 `/help` 检查收发：

```fish
alonabot install --source AlonaBot/alonabot-plugin-help --yes
alonabot enable alonabot-plugin-help-official --yes
```

## 反向 WebSocket {#reverse-ws}

Core 保存反向实例：

```json
{
  "adapters": {
    "onebot11": {
      "instances": {
        "qq-reverse": {
          "mode": "reverse",
          "self_id": "10001",
          "access_token": "${ONEBOT_REVERSE_TOKEN}"
        }
      }
    }
  }
}
```

协议端配置 Universal 反向连接至：

```text
ws://127.0.0.1:7650/plugins/alonabot-adapter-onebot11/ws/qq-reverse
```

远程用与 Core `base_url` 对应的 `wss` 地址及受信反代，见[设置](settings.md#通过域名访问)。协议端须发送 `X-Self-ID: 10001`、`X-Client-Role: Universal` 和 Bearer token；也支持 `access_token` query。令牌与账号需和实例一致。同一实例已有连接时返回 409，身份或角色不符返回 403，认证失败返回 401。

反向实例启动后等待协议端接入；接入后复核 `get_login_info`。断开期间发送和动作返回不可用错误，接收连接恢复由协议端发起。

## 多实例与配置

两种模式可放在同一个 `adapters.onebot11.instances`，使用全 Core 唯一的实例名。每个实例独立连接；主动发消息使用 `sdk.Via("qq-main")`，默认实例写在 `default_instance`。

| 键 | 缺省值 | 含义 |
| --- | --- | --- |
| `mode` | `forward` | `forward` 或 `reverse` |
| `ws_url` | 空 | 正向必填，`ws`/`wss` 地址 |
| `access_token` | 空 | 正向按协议端要求；反向必填 |
| `self_id` | 空 | 反向必填，正整数账号字符串 |
| `media_url_base` | 空 | Core 临时媒体 URL 的可达根地址，空时使用 Core 配置 |
| `media_dir.local` | 空 | Adapter 可写的共享目录 |
| `media_dir.remote` | 空 | 协议端所见同一目录，空时与 local 相同 |

正向断线后按实现的退避策略重连，连接恢复后重新验证账号。已经写出的动作在结果未知时保留错误，业务发送由调用方决定后续操作。

## 消息与媒体

支持文字、图片、视频、语音、文件、提及、引用、表情、全体提及和合并转发。私聊会话如 `onebot11:private:10001`，群聊如 `onebot11:group:123456`。用 `c.Session()` 保存实际会话，`c.Event().Ref()` 保存消息句柄。

HTTPS 媒体 URL 直接交给协议端下载；内联内容使用 `base64://`。受管媒体引用缺省通过 Core 临时 URL 提供，协议端需能访问该地址。两个进程在不同机器或容器时，设置可达的 `media_url_base`，并核对网络和 Core Host 设置。

也可以用共享目录交付：

```json
{
  "media_dir": { "local": "/srv/alonabot/media", "remote": "/app/media" }
}
```

这是单个实例的配置片段。目录预先存在，两个进程具有读写权限，并挂载到同一份文件。Adapter 建临时文件，通过协议端所见的 `file://` 路径提交，父操作结束后清理临时文件。

入站图片、视频、语音和文件映射为 SDK 媒体片段，Handler 用 `media.Open(c, segment.Source)` 按需读取；协议文件 ID 经群聊/私聊文件 API 解析。不可读来源保留 `Unreadable` 标记和原始平台信息。撤回使用 `c.Delete(ref)`，Adapter 按输入顺序调用 `delete_msg`，失败后的项保持未尝试。Markdown、按钮、编辑和平台相册当前返回 `UNSUPPORTED`；流式输出在正常结束时整段发送。

## 类型化事件与动作

标准事件覆盖新消息、消息撤回、成员加入和离开。扩展事件包为 `github.com/AlonaBot/alonabot-adapter-onebot11/event`：

```go
import obevent "github.com/AlonaBot/alonabot-adapter-onebot11/event"

// 在 New 中登记。
p.On(obevent.Poke).Handle(func(c *sdk.Context, e *obevent.Target) error {
    return c.Reply("Poke received for " + e.TargetID)
})
```

还提供 LuckyKing、Honor、GroupAdmin、GroupBan、GroupUpload、FriendAdd、FriendRequest、GroupRequest 和 InputStatus；未知通知或请求通过 Notice/Request 保留完整 JSON 字符串。

公开 `client` 包将动作绑定到当前可信账号和会话：

```go
import obclient "github.com/AlonaBot/alonabot-adapter-onebot11/client"

func group(c *sdk.Context) error {
    bound, err := obclient.From(c)
    if err != nil {
        return err
    }
    info, err := bound.GetGroupInfo(obclient.GetGroupInfoParams{})
    if err != nil {
        return err
    }
    return c.Reply(info.Value.GroupName)
}
```

动作包括账号/群/好友查询、群管理、审批、文件 URL、戳一戳与点赞。具体方法、参数和结果见[公开客户端](https://github.com/AlonaBot/alonabot-adapter-onebot11/tree/v0.2.0/client)，通用 Call 按声明的动作清单执行。

## 引用与递归转发节点 {#forward-nodes}

`c.ReadNodes(forward)` 读取 `message.ForwardSegment`；`obclient.From(c)` 得到的客户端还提供 `ReadReply(reference)`，验证引用属于当前会话与实例。SDK 返回递归 `[]message.ForwardItem`，每个节点保留作者、时间、正文、子转发与媒体来源。

```go
func inspect(c *sdk.Context, forward message.ForwardSegment) error {
    nodes, err := c.ReadNodes(forward)
    if err != nil {
        return err
    }
    return c.Reply(fmt.Sprintf("Read %d top-level nodes", len(nodes)))
}
```

上例是辅助函数，导入 `fmt`、`sdk` 和 `sdk/message` 后由消息 Handler 调用。遍历节点 Chain 中的 `message.ForwardSegment.Items` 可访问子节点；媒体可直接用 `media.Open(c, source)` 读取。查询兼容标准 `message` 节点数组和 SnowLuma `messages`，在查询入口解析 CQ 字符串并递归展开子资源/引用。检测到环或读取失败时同时返回已解析节点和带节点路径的原始错误，调用方处理错误后再使用部分内容。

发送 `message.Forward(message.ForwardItem{Chain: ...})` 可组合节点。纯嵌套节点按 node 数组发出；正文与子转发混合时先上传子转发，再发送父消息，保留部分成功回执与错误。

:::warning SnowLuma v2.4.2 已知问题
实测部分群聊反向发送及混合正文/子转发读取中，SnowLuma 的嵌套转发 XML 返回空 `m_resid`，造成正文与子节点缺失。Adapter 保留已解析内容并返回带路径的 `UNSUPPORTED` 原始错误。遇到此错误应检查协议端返回资源，改用普通消息或平铺节点，保留诊断信息供协议端排查。
:::

[平台功能对照](platforms.md)和[实现状态](../internals/status.md)记录其余能力与限制。
