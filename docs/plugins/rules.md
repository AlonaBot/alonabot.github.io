---
sidebar_position: 3
title: 插件规范
description: 插件在依赖、存储、日志、生命周期与协作上必须遵守的规则。
---

本页是 [插件开发规范](https://github.com/AlonaBot/AlonaBot/blob/main/docs/plugin-guide.md) 的摘要。官方插件、Adapter、Agent 与示例同样遵守这些规则；与契约冲突时以 [CONTRACTS](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md) 为准。

## 内存与依赖

- 没启用的插件不运行进程；启用后，依赖初始化与常驻对象占用用户机器的内存。
- 只导入用到的包。能用标准库就不引入第三方库；HTTP 用 `net/http`。
- 不要内嵌模型厂商的 SDK。需要模型能力时，调用 Agent 组件的 `llm.generate`（`sdk/llm` 提供类型与调用辅助）。
- 包级变量与 `init` 不做重活，推迟到 `OnStart` 或首次使用。
- 优先纯 Go。确需 CGO 时，必须为每个声明支持的平台提供真实可运行的二进制。

## 存储

- 业务数据放在受管 SQLite：`sqlitedb.Open(ctx)` 返回 `*sql.DB`，`gormdb.Open(ctx)` 返回 `*gorm.DB`，两者共用同一个连接。没有特别需要时用 `sqlitedb`，它直接使用标准库 database/sql API，保持 GORM 按需链接。
- 已安装组件重载配置或更新版本时，受管 SQLite 使用独立候选副本，准备失败会回到旧数据。开发 `run` 直接复用 `dev.sqlite`；插件文件与外部数据库的恢复由插件负责。见[存储数据](storage.md)。
- 内存缓存必须有上限；索引、缓存与向量放进受管 SQLite 或 `sdk.PluginDataDir(ctx)` 中的文件。

## 日志与文案

- 用标准库 `log/slog` 记录，SDK 把记录交给 Core。**不要往 stdout 写内容**：stdio 传输下 stdout 是协议通道。
- 日志、错误字符串与 `safe_message` 用英文；给用户看的文字放进 `i18n/`，至少提供 en-US。
- 不记录 secret、token、完整配置与 DSN。

## 生命周期与调用

- 资源在 `OnStart` 中打开、在 `OnStop` 中关闭；后台 goroutine 随 `OnStop` 结束，并响应 ctx 取消。
- 普通请求的期限默认 30 秒，由 Core 的 `REQUEST_TIMEOUT` 调优参数控制。
- 有副作用的业务调用不自动重试。

## 跨插件协作

- 用 Service 调用与 Event Bus 协作，不直接读写其他插件的文件或数据库。
- Event Bus 是**非持久**广播：`bus.Event.Publish` 返回成功只表示 Core 已准入，不代表有人收到。需要回执或可靠送达时改用 Service 调用。
- 订阅回调串行执行，不要在其中阻塞；回调里没有 Actor 与默认 Target，发消息时要显式指定目标。

## 发布

市场 ID 按角色使用 `alonabot-plugin-`、`alonabot-adapter-`、`alonabot-agent-` 或 `alonabot-webui-` 前缀。安装包与外部 `release.json` 用 Ed25519 签名，签名私钥由作者保管，不放进仓库或构建日志。作者用 `alonabot check/build/pack` 检查、构建和打包；安装与来源更新使用 Core CLI，见[开发指南](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md)。
