---
title: Telegram
description: 接入 Telegram 机器人。
---

## 接入

按下面的步骤配置账号后，Core 会在启动时自动安装并启用官方 Telegram Adapter，首次接入需要联网。曾手动卸载过的 Adapter 需要[手动重装](install.md#安装官方组件)。

下面用 `/help` 检查接入结果。先在运行中的 Core 上[配置管理 token](manage.md#准备)，安装并启用 help 插件：

```sh
alonabot install --source AlonaBot/alonabot-plugin-help --yes
alonabot enable alonabot-plugin-help-official
```

1. 在 Telegram 里找 [@BotFather](https://t.me/BotFather)，发送 `/newbot` 创建机器人，得到 token。

2. 在 WebUI 的「机器人账号」里添加，或者写进 `core_config.json`：

```json title="core_config.json"
{
  "adapters": {
    "telegram": {
      "instances": {
        "main": { "token": "123456:ABC-DEF..." }
      }
    }
  }
}
```

3. 重启 Core。在 Telegram 里给机器人发 `/help`，收到命令列表就成功了。

## 账号设置

| 键 | 缺省值 | 含义 |
| --- | --- | --- |
| `token` | 必填 | BotFather 给的 token |
| `proxy_mode` | `none` | `none` 直连；`core` 使用 Core 设置里的 `proxy`；`custom` 使用下面的 `proxy` |
| `proxy` | 空 | `proxy_mode` 为 `custom` 时使用的代理地址，支持 `http`、`https`、`socks5` |
| `api_base_url` | `https://api.telegram.org` | 使用自建的 Bot API 服务时修改 |

网络访问不了 Telegram 时：

```json
{
  "proxy": "http://127.0.0.1:7890",
  "adapters": {
    "telegram": {
      "instances": {
        "main": { "token": "...", "proxy_mode": "core" }
      }
    }
  }
}
```

## 在群里使用

把机器人拉进群就能响应命令。要让它看到群里的普通消息（不是命令、也没有 @ 它），需要在 BotFather 里关闭隐私模式：发送 `/setprivacy`，选择机器人，选 `Disable`。

## 常见问题

**启动时报 webhook 冲突**

这个机器人之前被别的程序设置过 webhook。AlonaBot 用轮询的方式接收消息，两者不能同时用。访问下面的地址删除 webhook 后重启：

```text
https://api.telegram.org/bot<token>/deleteWebhook
```

**收不到图片或文件**

Telegram 限制机器人下载的文件不超过 20 MB。

**同一个 token 不能同时在两处运行**

两个程序用同一个 token 接收消息会互相抢，表现为消息时有时无。

## 支持的功能

见[平台功能对照](platforms.md)。
