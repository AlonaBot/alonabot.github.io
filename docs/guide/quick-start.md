---
sidebar_position: 1
title: 快速开始
description: 从源码启动插件和本地回环 Adapter，看到第一条真实回复。
---

先在本机发出 `/hello`，收到 `Hello from devbot!`。仓库的 `devbot` 示例使用真实 Core、插件与回环 Adapter，把回复写到文件；整个流程无需平台账号。

## 准备环境

需要 Git 和 Go **1.27.1**（与主仓库 `go.mod` 一致）。以下命令使用 fish。普通构建使用仓库中的 Protobuf 生成文件，修改 `.proto` 时再按[开发指南](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md)准备工具链。

## 启动 Core、插件与 Adapter

```fish
git clone https://github.com/AlonaBot/AlonaBot.git
cd AlonaBot
go build -o bin/alonabot ./cmd/alonabot
set -gx DEVBOT_DATA (mktemp -d)
set -gx DEVBOT_OUTPUT (mktemp)
cp examples/devbot/core_config.example.json $DEVBOT_DATA/core_config.json
printf 'DEVBOT_DATA=%s\nDEVBOT_OUTPUT=%s\n' $DEVBOT_DATA $DEVBOT_OUTPUT
bin/alonabot run examples/devbot/plugin examples/devbot/adapter --data-dir $DEVBOT_DATA --reload
```

保存打印的两个临时路径。`run` 占用当前终端，检查并构建两个组件，完成准备和激活后接收事件。`core_config.json` 将 `devloop` 的实例 `one` 绑定到回环 Adapter，并把输出文件路径从环境变量写入实例配置。

示例监听 `127.0.0.1:7650`，启动前先确认该端口空闲；已有 Core 运行时，使用其专用设置和数据目录。[devbot README](https://github.com/AlonaBot/AlonaBot/blob/main/examples/devbot/README.md)提供完整配置。

## 发出命令

另开终端，切到同一仓库，把以下两行的路径替换为启动终端打印的实际路径：

```fish
set -gx DEVBOT_DATA '/实际的数据目录'
set -gx DEVBOT_OUTPUT '/实际的输出文件'
```

首次终端启动会向 stderr 显示一次管理 token，在新终端用 `set token '显示的 token'` 保存。非终端启动时，可通过官方 CLI 读取首次交付文件：

```fish
set token (bin/alonabot admin-token show --data-dir $DEVBOT_DATA)
```

使用该 token 注入 `/hello`：

```fish
curl --fail-with-body -X POST \
  -H "Authorization: Bearer $token" \
  'http://127.0.0.1:7650/plugins/alonabot-adapter-devbot/inject?instance=one&text=%2Fhello'
cat $DEVBOT_OUTPUT
```

请求返回 **HTTP 204**，消息异步分发；发送完成后，文件内容为 **`Hello from devbot!`**。若刚返回时文件仍为空，再执行 `cat $DEVBOT_OUTPUT` 查看。把 URL 的 `text` 改为 `hello`，普通文本会原样回声。

`/inject` 是私有插件路由，使用 Core 的管理 Bearer token。管理入口与插件入口共用 `base_url` 主机名；示例为 `http://127.0.0.1:7650`。Cookie 认证的 POST 还需要 Origin 与 CSRF 校验。

## 看见改动

保持 `--reload` 运行，修改 `examples/devbot/plugin/i18n/en-US.json` 的 `messages.hello`，再次注入 `/hello`，即可看到新译文。源码或资源变化后只重新构建、重启变化的组件；编译失败保留完整诊断，旧组件继续回复。

组件默认使用 TCP loopback，加 `--stdio` 切换开发传输。按 Ctrl-C 后，Core 排空在途工作并执行停止回调。同一个数据目录由 `core.lock` 保证只运行一个 Core；本例使用临时目录，保留原有机器人数据。

## 下一步

- [插件入门](../plugins/first-plugin.md)：创建自己的 `/ping` 工程。
- [命令与事件](../plugins/commands.md)：添加参数、权限和事件 Handler。
- [发送消息与媒体](../plugins/messages.md)：查看发送结果和媒体用法。
- [实现状态](status.md)：当前已接通的能力与后继工作。
