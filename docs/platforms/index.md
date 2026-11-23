---
title: 平台接入
description: 选择 Adapter，将机器人接入聊天平台。
---

Adapter 负责平台连接与消息转换，插件通过统一 SDK 处理命令和事件。

| 平台 | Adapter | 配置 |
| --- | --- | --- |
| Telegram | alonabot-adapter-telegram | [机器人 token 与连接方式](telegram.md) |
| OneBot 11 | alonabot-adapter-onebot11 | [WebSocket 与访问令牌](onebot11.md) |
| 自定义平台 | 自行开发或安装社区 Adapter | [编写 Adapter](../develop/adapter.md) |

## 本地开发

运行 `alonabot run` 后可在终端输入消息验证插件。输入 `#编号` 点击按钮，编辑结果显示为带 `(edited)` 的新行。

## 查询账号能力

通过 CLI 查看正在运行的账号及其操作目录：

```fish
alonabot adapter instance list
alonabot adapter actions main
```

操作目录包含输入 Schema，联调步骤见[Adapter](../develop/adapter.md)。
