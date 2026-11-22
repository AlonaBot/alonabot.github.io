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
| Default persona | 默认人格，具体内容在 Agent 人格页面维护 |
| History entries | 每次带上多少条历史消息 |
| Separate group conversations by member | 群里每个人各自一段对话，还是全群共用一段 |
| Image caption model | 用户发图片时用哪个模型看图 |
| MCP servers | 接入外部的 MCP 工具服务 |
| Skills directory | 技能文件所在的目录 |
| Plugins allowed to generate text | 哪些插件可以调用模型，缺省全部允许 |

`triggers` 缺省为空；MCP 支持 stdio 与 streamable-http，技能目录为空时停用技能，编辑后使用 Reload skills。

模型、人格、触发方式可以按[配置文件](../advanced/profiles.md)设置，让不同的群用不同的模型和人格。

## 工具调用与确认

模型在对话中可以调用插件提供的工具（比如查天气、加待办）。工具按当前 Profile、全局策略和声明依次取生效策略：allow 直接执行，confirm 发按钮等待用户确认，deny 拒绝。写入或删除类别用于展示，确认要求由策略决定。确认需要可信用户和支持按钮的实例；OneBot11 上需要确认的调用返回 `UNSUPPORTED`。

哪些工具可以直接执行、哪些要确认、哪些禁用，在 WebUI 的权限页面里调整。

## 引用、转发和图片

普通触发与 `/ask` 保留完整消息链，递归读取引用与转发节点，保留作者、时间、正文及图片来源路径。图片输入模型接收实际图片，文本模型可使用 Image caption model；历史保留图片归属。节点或媒体读取失败会回复具体错误并停止本次模型请求。SnowLuma 的空资源问题见 [OneBot11](onebot11.md#forward-nodes)。

## 记忆

Agent 可以记住跨对话的信息（比如用户的偏好）。记忆内容可以在 Agent 的页面里查看和修改。

## 不用 Agent

Agent 可以停用或卸载，不影响其他功能。此时插件调用大模型会失败，写得好的插件会提示「AI 未配置」。也可以换成社区制作的其他 Agent 组件。
