---
title: OneBot 11
description: 通过 OneBot 11 协议接入 QQ 等平台。
---

OneBot 11 是一个通用的机器人协议。AlonaBot 通过实现该协议的程序（比如 NapCat、Lagrange）与 QQ 通信。

## 接入

按下面的步骤配置账号后，Core 会在启动时自动安装并启用官方 OneBot 11 Adapter，首次接入需要联网。曾手动卸载过的 Adapter 需要[手动重装](../usage/install.md#安装官方组件)。

1. 安装并登录一个 OneBot 11 实现，在它的设置里开启**正向 WebSocket**，记下地址（如 `ws://127.0.0.1:3001`）和访问令牌。

2. 写进 `core_config.json`：

```json title="core_config.json"
{
  "adapters": {
    "onebot11": {
      "instances": {
        "qq": {
          "ws_url": "ws://127.0.0.1:3001",
          "access_token": "${ONEBOT_TOKEN}"
        }
      }
    }
  }
}
```

3. 重启 Core。

## 账号设置

| 键 | 缺省值 | 含义 |
| --- | --- | --- |
| `ws_url` | 必填 | OneBot 实现的正向 WebSocket 地址 |
| `access_token` | 空 | 访问令牌，对方设置了才需要填 |

## 消息格式与重连

- OneBot 实现要设置成**数组格式**上报消息，不要用字符串（CQ 码）格式。
- 连接断开后会自动重连。

## 查询账号操作

见[查询账号能力](index.md#查询账号能力)。
