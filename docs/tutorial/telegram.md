---
title: 接入 Telegram
description: 把开发中的插件接到真实的 Telegram 机器人上。
---

终端对话方便开发，但最终插件要在真实平台上运行。这一页把待办清单接到 Telegram。

## CLI 准备

使用 [v0.2.0 CLI](../quick-start.md)，并保留 Go 1.27.1 或更高版本用于编译插件。运行 `command -v alonabot` 确认使用的可执行文件。

继续在待办插件工程目录运行，沿用该工程的 `./data`。

## 1. 申请机器人

在 Telegram 里找 [@BotFather](https://t.me/BotFather)，发送 `/newbot`，按提示起名。完成后它会给你一串 token，形如 `123456:ABC-DEF...`。

## 2. 写进设置

Core 的设置在 `data/core_config.json`，运行过一次 `alonabot run` 就会生成。在里面加上 `adapters`：

```json title="data/core_config.json"
{
  "adapters": {
    "telegram": {
      "instances": {
        "main": { "token": "${TELEGRAM_BOT_TOKEN}" }
      }
    }
  }
}
```

文件里已有的其他内容保留，只加 `adapters` 这一段。`main` 是你给这个机器人账号起的名字。`${TELEGRAM_BOT_TOKEN}` 表示从环境变量读取，这样 token 不用写在文件里。

## 3. 运行

```fish
set -gx TELEGRAM_BOT_TOKEN '123456:ABC-DEF...'
alonabot run
```

Core 启动时发现设置里有 Telegram 账号，会自动启用对应的 Adapter；尚未安装时，会先从官方组件仓库下载平台归档并安装，因此首次接入需要联网。曾手动卸载过的 Adapter 需要[手动重装](../usage/install.md#安装官方组件)。设置了平台账号后，终端对话不再自动打开。

在 Telegram 里给你的机器人发 `/todo add buy milk`，会收到 `Added: buy milk`。修改代码后同样自动重新加载。

:::tip 连不上 Telegram？
在 `core_config.json` 里设置代理，并让这个账号使用它：

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
:::

## 4. 把自己设为管理员

用了 `sdk.Admin` 的命令只有机器人管理员能用。先按[Telegram 接入说明](../usage/telegram.md#接入)安装并启用 help 插件，再在 Telegram 里发 `/whoami`，机器人会回复你的用户标识：

```text
telegram:123456789
```

把它加到 `core_config.json` 的 `admins` 里：

```json
{
  "admins": ["telegram:123456789"]
}
```

本页的开发运行启用了自动重载，保存后立即生效；部署运行手改文件后重启 Core，也可用 `alonabot admin add telegram:123456789` 在线保存。

## 同时保留终端对话

想一边连着 Telegram 一边在终端里试，加上 `--console`：

```sh
alonabot run --console
```

## 不同平台的差别

你的代码不用改，但各平台支持的功能不一样。比如有的平台不能编辑已发出的消息。在不支持的平台上调用对应功能会返回错误，错误码是 `UNSUPPORTED`。各平台支持什么见[平台功能对照](../usage/platforms.md)。

到这里教程结束。接下来可以：

- 按需要翻阅「进阶」里的各页：[定时任务](../advanced/schedule.md)、[按钮](../advanced/buttons.md)、[调用大模型](../advanced/llm.md)等。
- 准备发布时看[打包与发布](../advanced/publish.md)。
- 部署到服务器看[安装](../usage/install.md)。
