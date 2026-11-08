---
sidebar_position: 3
title: 线协议
description: Core 与组件之间的帧格式、传输方式与调用语义。
---

Core 与每个组件进程之间使用同一种协议。产品版本 v0.1 与传输协议版本 **1.0** 分开计数。字段级定义以 [WIRE-FORMAT.md](https://github.com/AlonaBot/AlonaBot/blob/main/spec/WIRE-FORMAT.md) 为准。

## 帧

每帧是 **4 字节大端无符号长度 + Protobuf Envelope**，长度不含前缀，有效范围 1～4,194,304 字节（4 MiB）。长度为 0、超限、无法解码或状态不合法的帧会让当前 Session 失败，不会继续猜测帧边界。

Envelope 的主要字段：

| 字段 | 说明 |
| --- | --- |
| `protocol_major` / `protocol_minor` | 首发 1.0；主版本不一致拒绝握手，次版本取双方支持的较小值 |
| `session_id` | HELLO_ACK 起使用 Core 分配的 16 字节随机 ID |
| `initiator_side` + `call_id` | 与 `session_id` 一起作为调用的匹配键，支持并发与乱序响应 |
| `kind` | HELLO、HELLO_ACK、REGISTER、PREPARED、ACTIVATE、ACTIVATED、REQUEST、RESPONSE、CANCEL、EVENT、STOPPING、HEARTBEAT、SESSION_ERROR |
| `deadline_unix_ms` | REQUEST 必需；子请求不得延长父请求的期限 |
| `payload_encoding` / `schema_id` / `schema_version` | 载荷按 Protobuf 或 JSON 编码，并标明契约 ID 与版本 |
| `error` | 失败时的 ErrorInfo，`safe_message` 不含 secret、堆栈或本地绝对路径 |

## 两种传输

- **TCP**（缺省）：Core 持有在 loopback 上以端口 0 分配的 Listener。
- **stdio**（可选）：stdout 只传协议，日志写 stderr。所以插件**不要往 stdout 写任何内容**。

两种传输的编码完全相同。每个进程有独立的随机凭证与 Session，完整的首帧鉴权通过后 Core 才下发 Bootstrap。

## 调用语义

- 读帧与响应配对独立于 Handler；唯一的 writer 保证帧不交错；控制帧、响应与取消不会被业务排队堵住。
- 在途调用的条数与字节都有预算，超额立即拒绝，不会因嵌套调用等待自己的额度。
- **有副作用的业务调用不自动重试。** 取消只是合作式终止，迟到的响应不会重新完成请求；超时与取消不代表对端没有执行。
- Service 与 Send 的父调用关联由 Core 记录，Core 不采信插件自己提交的 Actor 或权限。
