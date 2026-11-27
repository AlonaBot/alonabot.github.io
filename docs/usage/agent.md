---
title: AI 对话（Agent）
description: 让机器人用大模型聊天，并让其他插件共用模型。
---

Agent 是官方的 AI 对话组件。Docker Compose 已预装；使用归档或安装脚本时，先按[安装官方组件](install.md#安装官方组件)安装。它做两件事：

- 让用户和大模型聊天，对话中可以调用插件提供的工具。
- 让其他插件[调用大模型](../advanced/llm.md)，不用各自配置密钥。

## 配置模型

在 WebUI 里打开 Agent 的配置：

1. 在 **Providers** 里添加一个模型服务，填接口地址和 API 密钥。
2. 在 **Models** 里添加要用的模型。
3. 把 **Chat model** 设为其中一个。

支持的接口类型：OpenAI 兼容接口、OpenAI Responses、Anthropic Messages、Gemini、Ollama。市面上大部分模型服务都提供 OpenAI 兼容接口。

保存配置后启用 Agent；已经运行的 Agent 需要重新加载。发 `/ask 你好` 测试。

### 示例：接入 OpenAI 兼容服务

假设服务商提供的接口地址是 `https://llm.example.com/v1`，模型 ID 是 `example-chat`。实际配置时替换成服务商提供的值。

1. 在 **Providers** 添加 OpenAI 模板。**Name** 填 `example-provider`，**Protocol** 选 `openai-compatible`，**Base URL** 填接口地址，**API key** 填服务商发放的密钥。
2. 在 **Models** 添加模型。**Name** 填 `example-chat-local`，**Provider** 选 `example-provider`，**Model ID** 填 `example-chat`，**Model type** 选 `chat`。
3. 把 **Chat model** 设为 `example-chat-local`。保存并启用或重新加载 Agent 后，在聊天里发送 `/ask 用一句话解释什么是待办清单`。

## 怎么触发

| 方式 | 说明 |
| --- | --- |
| `/ask <内容>` | 任何时候都可以用 |
| 自由对话 | 不用命令，直接说话。在哪些情况下回应由 **Free conversation triggers** 决定：私聊、被 @、回复机器人 |
| 唤醒词 | 消息里出现 **Wake words** 里的词时回应 |

群里建议只在被 @ 或出现唤醒词时回应，否则机器人会接每一句话。

## 聊天中的命令

| 命令 | 谁能用 | 作用 |
| --- | --- | --- |
| `/ask <内容>` | 所有人 | 提问 |
| `/reset` | 所有人 | 清空当前对话的上下文 |
| `/agent on`、`/agent off` | 管理员 | 开关自由对话 |
| `/persona [名字]` | 管理员 | 查看或切换人格 |
| `/provider [名字]` | 管理员 | 查看或切换模型 |
| `/profile [名字]` | 管理员 | 查看或切换当前会话的配置文件 |

## 常用配置项

| 配置项 | 含义 |
| --- | --- |
| Chat model | 聊天用的模型 |
| Fallback chat models | 主模型出错时依次尝试的备用模型 |
| Personas、Default persona | 人格，即给模型的角色设定 |
| History entries | 每次带上多少条历史消息 |
| Separate group conversations by member | 群里每个人各自一段对话，还是全群共用一段 |
| Image caption model | 用户发图片时用哪个模型看图 |
| MCP servers | 接入外部的 MCP 工具服务 |
| Skills directory | 技能文件所在的目录 |
| Plugins allowed to generate text | 哪些插件可以调用模型，缺省全部允许 |

模型、人格、触发方式可以按[配置文件](../advanced/profiles.md)设置，让不同的群用不同的模型和人格。

## 工具调用与确认

模型在对话中可以调用插件提供的工具（比如查天气、加待办）。会修改数据的工具，执行前机器人会发一条带按钮的消息，**由用户点确认后才执行**。

哪些工具可以直接执行、哪些要确认、哪些禁用，在 WebUI 的权限页面里调整。

## 记忆

Agent 可以记住跨对话的信息（比如用户的偏好）。记忆内容可以在 Agent 的页面里查看和修改。

## 不用 Agent

Agent 可以停用或卸载，不影响其他功能。此时插件调用大模型会失败。也可以换成社区制作的其他 Agent 组件。
