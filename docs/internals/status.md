---
title: 实现状态
description: 0.1.0 的可用功能、平台支持与已知限制。
---

**AlonaBot 0.1.0 已于 2026-11-21 发布。** Core、WebUI、Agent、Telegram Adapter、OneBot 11 Adapter 与 help 插件均已发布 0.1.0，组件可独立安装和更新。

## 发行内容

| 安装方式 | 包含内容 | 首次使用 |
| --- | --- | --- |
| 平台归档、安装脚本 | Core | 按需安装 WebUI、Agent、Adapter 和插件 |
| Docker Compose | Core、WebUI、Agent | WebUI 自动启用；配置 Provider 和模型后启用 Agent |

官方 Telegram 和 OneBot 11 Adapter 会在配置账号并启动 Core 后按需自动安装。安装步骤见[安装](../usage/install.md)。各组件使用各自的版本号，后续可独立更新。

## 已经可用

**写插件**

- 命令：参数、别名、分组、权限
- 文本匹配、事件、规则
- 回复文字、图片、文件、按钮；编辑消息；流式输出
- 配置项、密钥、按会话设置
- 键值存储、SQLite 数据库、更新失败自动恢复受管数据库
- 多轮对话
- 定时任务、用户创建的任务
- 插件之间的服务调用和广播
- 调用大模型
- HTTP 接口和插件页面
- 多语言
- 用 `plugintest` 测试

**运行和管理**

- 安装、更新、回退、卸载组件
- 开发时修改代码后自动重新加载
- 终端对话
- 日志、诊断包
- 安装脚本、Docker 镜像

**官方组件**

| 组件 | 提供什么 |
| --- | --- |
| Telegram Adapter | 接收消息、发送文字和媒体、按钮、编辑与流式输出 |
| OneBot 11 Adapter | 接收消息和事件；发送返回 `UNSUPPORTED` |
| Agent | 对话、工具调用与确认、MCP、记忆、技能 |
| WebUI | 在浏览器中管理组件、配置、权限、日志和数据 |
| help 插件 | 查看可用命令，用 `/whoami` 查询用户标识 |

## 已知限制

- **OneBot 11**：当前仅支持接收消息和事件。
- **Telegram**：语音、贴纸、动图、撤回消息和命令菜单留待后续版本。
- **撤回消息**：SDK 已提供接口，当前两个官方 Adapter 均未实现。
- **同进程组件**：未捕获的 panic 会结束 Core 进程；停止超时后，仍在运行的 goroutine 需要由组件自行结束。
- **外部数据**：组件自行管理的文件和外部数据库，需要按组件说明另外备份和恢复。

各平台的逐项对照见[平台功能对照](../usage/platforms.md)。

## 平台验证情况

0.1.0 提供以下五个平台的归档。发布记录中的运行验证情况如下：

| 目标 | 已记录的验证环境 |
| --- | --- |
| macOS arm64 | Apple Silicon 原生运行，安装更新与 launchd 服务验证通过 |
| macOS amd64 | Rosetta 下运行通过；Intel Mac 原生运行未验证 |
| Linux amd64 | x86_64 Linux VM 中运行通过，systemd 服务验证通过 |
| Linux arm64 | ARM 宿主上的 Docker 容器中运行通过；ARM Linux VM 或物理机未验证 |
| Windows amd64 | 交叉构建与发行资产静态检查通过；Windows 实际运行和 CGO 验证延期 |

业务验证使用本地 Telegram Bot API 与合成 Provider。最终候选的真实 Telegram 和付费 LLM Provider 凭据未验证。完整发行说明见 [v0.1.0 Release](https://github.com/AlonaBot/AlonaBot/releases/tag/v0.1.0)。

## 从开发版本升级

升级前停止 Core 和全部组件，备份完整数据目录、程序及外部组件数据。开发期间组件 ID、状态结构和初始迁移曾有调整；请保留原版本的程序与数据，以便恢复。

新建插件使用 SDK `v0.1.0`。升级与恢复步骤见[安装](../usage/install.md#升级与恢复)。
