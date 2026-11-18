---
sidebar_position: 1
title: 插件入门
description: 创建一个回复 /ping 的插件，用当前 SDK 构建并运行。
---

发出 `/ping`，收到 `pong`。这个插件只需要导出 `New() *sdk.Plugin`，创建插件对象并登记命令。

## 创建工程

先按[快速开始](../guide/quick-start.md)克隆主仓库并构建 CLI。以下在仓库根目录执行，工程复用仓库的 `go.mod`：

```fish
bin/alonabot init ./alonabot-plugin-ping
```

`init` 要求空目录，生成 `plugin.go`、`plugin.yaml`、`config_schema.json` 和 `i18n/`。组件 ID 来自 `plugin.yaml`，这里为 `alonabot-plugin-ping`；包导出 `New()`，方便独立进程运行和 `go test` 中的同进程测试。

把生成的 `plugin.go` 替换为：

```go title="alonabot-plugin-ping/plugin.go"
package plugin

import (
    "github.com/AlonaBot/AlonaBot/sdk"
    "github.com/AlonaBot/AlonaBot/sdk/message"
)

func New() *sdk.Plugin {
    p := sdk.NewPlugin()
    p.Command("ping").Description("Check whether the bot is responding").
        Handle(func(*sdk.Context) (message.Content, error) {
            return message.Text("pong"), nil
        })
    return p
}
```

`New()` 每次返回独立对象。在这里登记路由和生命周期回调，业务状态也在这里创建，避免不同测试共享状态。

## 检查与构建

```fish
bin/alonabot check ./alonabot-plugin-ping
bin/alonabot build ./alonabot-plugin-ping
```

`check` 核对工程、配置、翻译和 Handler 签名；`build` 执行相同检查并输出组件二进制到工程的 `bin/`。作者源码中保持可导入包，构建器生成调用 `sdk.Run(New())` 的入口，并通过 Go overlay 编入 manifest、Schema 和翻译。

工程无需保存生成文件。编译组件使用 `alonabot build`；`go build` 仍用于构建 Core CLI。创建仓库外的工程时可指定 `--module example.com/ping`；开发版 CLI 会提示你用 `go get github.com/AlonaBot/AlonaBot@<version>` 选定 SDK 版本，详细步骤见[作者工具说明](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#开发运行与热部署)。

## 运行与查看回复

```fish
bin/alonabot run ./alonabot-plugin-ping --data-dir ./data --reload
```

这会启动 Core 和插件。要从聊天中调用 `/ping`，还需配置并启动 Adapter 实例；[快速开始](../guide/quick-start.md)提供本地回环 Adapter 和可见回复步骤。`run` 可以同时接受多个组件目录，`--reload` 在源码或资源变化后重新构建，只重启变化的组件，编译失败时旧组件继续运行。

默认传输为 TCP loopback；使用 `--stdio` 切换开发组件的传输。按 Ctrl-C 停止 Core 与组件。

## 选择回复方式

- 返回 `(message.Content, error)`：成功返回的非空内容自动回复一次，排在本次调用的全部显式发送之后。`nil` 或空 Chain 表示跳过自动回复。
- 返回 `error`：用 `c.Reply(text)` 或 `c.Send(content)` 显式回复。发送错误原样返回。

两种 Handler 都可以显式发送，内容既可以是 `message.Text("pong")`，也可以是 `message.Chain{...}`。Handler 的第一个参数始终为 `*sdk.Context`。

## 接着写

- [命令与事件](commands.md)：分组、参数、权限、文本匹配和类型化事件。
- [发送消息与媒体](messages.md)：混合消息、发送回执、编辑与流式文本。
- [配置 Schema 与 Secret](config.md)：读取只读配置，保存秘密值。
- [存储数据](storage.md)：KV、受管 SQLite 和插件文件。
- [服务、广播与模型](services.md)：共享接口、变化通知与模型调用。
- [后台任务与交互](background.md)：等待回复、提醒与按钮。
- [HTTP 与插件页面](http.md)：私有路由与页面套件。
- [用 plugintest 测试插件](testing.md)：在 go test 中断言回复、交互与模型调用。
- [插件规范](rules.md)：资源、存储和发布约定。

仓库示例：[lifecycle](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/lifecycle/main.go) 展示显式生命周期回调与 HTTP，[echo](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/echo/main.go) 展示命令、事件与服务，[showcase](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/showcase/main.go) 展示配置、HTTP 和任务的组合。
