---
slug: /
sidebar_position: 0
sidebar_label: 介绍
title: 什么是 AlonaBot
description: AlonaBot 是一个用 Go 写的轻量级、跨平台聊天机器人框架。
---

AlonaBot 是一个用 Go 写的聊天机器人框架。你写的功能是**插件**，每个插件都是一个普通的 Go 程序；消息从 Telegram 来还是从 QQ 来，交给 **Core** 和**适配器**去处理。

整个框架由一个 Core 加上几类可以替换的组件组成：

- **插件**：机器人的具体功能，比如回复命令、订阅 RSS。每个插件单独跑一个进程。
- **适配器（Adapter）**：负责连接聊天平台。官方提供 Telegram 和 OneBot 11 两个。
- **Agent**：官方 Agent 负责对话、记忆和工具调用，调用工具之前会先问用户。
- **WebUI**：管理界面，只是一组静态网页。

组件之间不会直接互相调用，都要经过 Core。命令该交给哪个插件、谁有权限、消息怎么发出去、插件之间怎么协作、定时任务、HTTP 入口、配置和密钥、安装和升级，这些都由 Core 统一管。

:::warning 还在早期开发中

这份文档对应 **0.1-beta**。很多功能还在写，每一页都标了目前做到哪一步。如果文档和仓库里的 [规格](https://github.com/AlonaBot/AlonaBot/blob/main/spec/README.md) 说法不一样，以规格为准。

:::

## 我们在意什么

- **轻**：一个只用 SDK 的插件大约占 7.5 MiB 内存。用不到的库不会被编进去。
- **写起来顺手**：插件就是普通的 Go 代码，用 goroutine、`net/http` 都没问题。注册方式只有一种，方法签名写错了编译时就会报出来。
- **少配置**：装好就能用，只有需要改的地方才写进设置文件。
- **说到做到**：一项功能算不算完成，要看有没有编译、集成测试和目标平台上的实际运行记录。交叉编译通过不算数。

## 0.1 打算做到什么

命令、关键词匹配和事件处理，多轮对话，插件之间的服务调用和广播，定时任务，配置和数据库，插件自己的 HTTP 接口，管理命令行，组件的安装和升级，中英文两种界面文案。

普通用户可以用发行包、`install.sh`（Linux 的 systemd、macOS 的 launchd）或 `docker compose` 一键装好官方整合包。开发者也可以在自己的 `main.go` 里把框架当成 Go 库来用，再用插件测试套件在 `go test` 里启动真实的 Core 来测插件。

现在实际做到了哪些，看 [当前进度](guide/status.md)。

## 从哪里开始

- 想先跑起来看看：[快速开始](guide/quick-start.md)
- 想知道整体怎么搭起来的：[架构](concepts/architecture.md)
- 想直接写插件：[编写第一个插件](plugins/first-plugin.md)
