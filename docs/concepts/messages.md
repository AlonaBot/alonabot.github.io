---
sidebar_position: 4
title: 事件模型
description: Event、Actor、Target 与消息 Chain 的含义。
---

插件收到 Core 标准化之后的事件。标准事件使用 SDK 类型，平台扩展事件保留自己的名称与 JSON 载荷。精确定义见 [MESSAGE-MODEL.md](https://github.com/AlonaBot/AlonaBot/blob/main/spec/MESSAGE-MODEL.md)。

## Event、Actor 与 Target

| 类型 | 含义 |
| --- | --- |
| **Event** | 一次入站事件。`event_id` 由 Core 在标准化时产生，`event_type` 区分种类，平台相关字段只对相应来源存在 |
| **Actor** | 触发事件的用户。`permissions` 是 Core 计算出的权限名集合；Adapter 只提供本会话的平台权限 |
| **Target** | 消息发往哪里：Adapter、实例、账号、会话，以及可选的话题。默认 Target 只来自当前实际入站的事件 |

公共 JSON 中的各种 ID 都是字符串，时间是 UTC Unix 毫秒整数。缺失的字段就是缺失，不会用虚构的用户或零 ID 填补。

在 Go Handler 中，`c.Event()` 返回 `*message.Event`：`ID` / `Type` 标识事件，`OccurredAt` 是 `time.Time`，`Actor` 可缺省，`Payload` 使用 `*message.CreatedPayload` 等类型化载荷，`Session` 是平台会话字符串。插件代码使用[类型化事件登记](../plugins/commands.md)和[消息构造函数](../plugins/messages.md)。

## 常见事件类型

| `event_type` | 说明 |
| --- | --- |
| `message.created` | 新消息，含 `chain` 与 `to_me`（私聊、回复机器人或提及机器人时为 true） |
| `message.edited` / `message.deleted` | 消息被编辑或删除；平台没有对应通知就不会发出 |
| `button.clicked` | 按钮被点击；Actor 是本次点击的用户 |
| `member.joined` / `member.left` | 成员进出 |
| `reaction.added` | 表情回应 |
| `command.invoked` | 命令身份与调用结果，省略参数和聊天内容 |
| `scheduled` | 定时任务触发 |
| `bot.online` / `bot.offline` | Core 在 Adapter 实例上下线时生成 |

## 权限名

命令按权限名准入：

- `user`：具有可信 Actor 的用户。命令与文本匹配缺省要求它。
- `admin`：Core 配置的机器人管理员，按 Adapter ID 与外部用户 ID 标识。
- `chat_admin` 与 Adapter 声明的平台权限（例如 `onebot11.group_owner`）：只在该会话内有效，不会因此取得 Core 管理权限。

Core 的全局禁止规则始终生效，动态策略在每次派发前重新检查。

## 按平台能力使用

事件定义描述公共模型，各 Adapter 报告已实现的事件与操作。使用按钮、编辑或平台扩展时先核对 [Adapter 进度](../adapters/index.md)，本机断言可在[plugintest](../plugins/testing.md)中设置对应能力。
