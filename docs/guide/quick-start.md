---
sidebar_position: 1
title: 快速开始
description: 从源码构建 AlonaBot，用开发入口运行一个示例插件。
---

AlonaBot 还没有正式发行版，现在只能从源码构建，并用开发入口 `alonabot run` 启动**单个插件**。本页带你跑起仓库自带的 `lifecycle` 示例插件。

## 准备环境

- Go **1.27.1**，与 `go.mod` 的 go 指令一致。
- Git。

只运行插件不需要 protoc；修改 `.proto` 时才需要，见仓库的 [开发指南](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md)。

## 构建

在仓库根目录执行：

```sh
go build -o bin/alonabot ./cmd/alonabot
go build -o bin/lifecycle ./examples/plugins/lifecycle
```

## 运行一个插件

```sh
bin/alonabot run --data-dir ./data --plugin-id demo --entry bin/lifecycle
```

插件默认通过 TCP loopback 与 Core 通信；加上 `--stdio` 改用 stdio 传输：

```sh
bin/alonabot run --data-dir ./data --plugin-id demo --entry bin/lifecycle --stdio
```

你会在日志中看到插件依次记录 `OnStart`、`OnReady`。按 Ctrl-C（或发送 SIGTERM）后，Core 先排空在途请求，插件进入 STOPPING 并执行 `OnStop`，然后退出。

:::note

- 同一个 `data_dir` 只能运行一个 Core。
- 首次运行会登记开发用的安装记录并提交新代次，之后复用已提交的代次。
- `run` 会读取 `<data_dir>/alonabot.yaml`；文件不存在时以 0600 权限写入缺省值。修改设置文件后重启生效。

:::

## 访问插件的 HTTP 路由

Core 在 `listen` 地址（缺省 `127.0.0.1:7650`）上提供唯一的公开 HTTP 入口，并按请求的 Host 分派：管理入口与插件入口使用不同的主机名，其他 Host 返回 421。缺省设置下，用下面的地址访问插件 `demo` 的路由：

```text
http://localhost:7650/plugins/demo/...
```

`--listen`、`--log-level`、`--log-format` 只在命令行显式给出时覆盖设置，只对本次运行有效，不会改写设置文件。

## 下一步

- 了解这个示例插件做了什么：[组件生命周期](../concepts/lifecycle.md)
- 自己写一个：[插件入门](../plugins/first-plugin.md)
