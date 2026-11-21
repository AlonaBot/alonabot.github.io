---
slug: /
title: 概述
description: AlonaBot 是什么，由哪几部分组成，从哪里开始读。
---

AlonaBot 是用 Go 写聊天机器人的框架。你写一个插件处理命令和消息，同一份代码可以接到 Telegram、QQ（OneBot 11）等不同平台。

```go
p.Command("ping").Handle(func(c *sdk.Context) error {
    return c.Reply("pong")
})
```

```text
> /ping
pong
```

## 组成

| 名字 | 是什么 |
| --- | --- |
| **Core** | 机器人的主程序，就是 `alonabot` 这个命令。它收消息、找到该处理的插件、检查权限、把回复发出去 |
| **插件** | 你写的业务代码：命令、定时任务、网页。每个插件是一个独立的小程序，由 Core 启动 |
| **Adapter** | 平台接入。Telegram 的 Adapter 负责和 Telegram 通信，把消息转成统一格式交给 Core |
| **Agent** | 可选的 AI 对话组件，插件也可以通过它调用大模型 |
| **WebUI** | 浏览器里的管理界面 |

插件、Adapter、Agent、WebUI 统称**组件**，都可以单独安装和替换。

## 从哪里开始

- 想写插件：先看[快速上手](quick-start.md)，五分钟内在终端里和自己的插件对话，再顺着[教程](tutorial/project.md)往下读。
- 想部署一个机器人：看[安装](usage/install.md)和[接入 Telegram](usage/telegram.md)。
- 想接入新的聊天平台：看[编写 Adapter](develop/adapter.md)。
- 遇到不认识的词：查[术语表](reference/glossary.md)。

:::note 版本
当前版本 **0.1.0**，于 2026-11-21 发布。安装方式见[安装](usage/install.md)，功能和平台支持情况见[实现状态](internals/status.md)。
:::
