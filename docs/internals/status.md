---
title: 实现状态
description: v0.2.0 可用能力、官方组件和已知问题。
---

**Core v0.2.0 于 2026-11-22 发布。** 五个官方组件也分别发布 v0.2.0，可独立安装与更新。

## 发行内容

| 方式 | 包含内容 |
| --- | --- |
| 五平台归档、安装脚本 | Core；组件按需安装 |
| Docker Compose | Core、WebUI、Agent；配置模型后启用 Agent |

配置账号并启动 Core 可自动安装 Telegram、OneBot11 官方 Adapter。升级顺序为 Core、WebUI、其他组件。历史旁车清理后，旧 Core 在线安装和更新需要先升级。

## 已经可用

插件具备命令参数/分组/别名、文本匹配、权限、规则、类型化标准和扩展事件、消息与媒体、按钮、编辑/撤回接口、流式输出、多轮等待、SQLite/KV、Profile、静态和动态任务、Service/Bus、LLM、HTTP/页面与多语言。`plugintest` 使用真实 Core 验证插件主路径。

管理支持归档安装、自动发现本机包、更新、回退、持久本机凭据、开发热重载、诊断、日志、休眠与按需唤醒。新增菜单按 `.Menu()`、账号、聊天、语言和权限分域，支持手动 owner 生命周期。

| 官方组件 | 当前能力 |
| --- | --- |
| Telegram | long polling；文字/媒体、按钮、引用、编辑、撤回、分域菜单、类型化动作与事件 |
| OneBot11 | 正反向 WS；收发消息/媒体、引用、合并转发、递归节点、动作与事件 |
| Agent | 多协议 Provider、工具与确认、MCP、技能、记忆；递归读取引用/转发与图片来源 |
| WebUI | Go 后台与前端；组件/商店/账号/Profile/权限/日志/数据管理，单归档上传 |
| help | 按会话列出可用命令，`/whoami` 显示身份；显式菜单项 |

## 已知问题与限制

- SnowLuma v2.4.2 实测部分嵌套转发 XML 的 `m_resid` 为空，影响部分群聊反向发送及混合正文/子节点读取。Adapter 返回已解析节点和带路径的错误，见 [OneBot11](../usage/onebot11.md#forward-nodes)。
- OneBot11 暂无通用按钮、编辑、相册和命令菜单；Telegram 暂无通用转发节点读取、普通消息删除事件。见[功能表](../usage/platforms.md)。
- Telegram getFile 最大 20 MiB；静态贴纸转图片，入站相册逐条交付，编辑接受文字与可选按钮。
- 插件自行管理的文件和外部数据库需独立备份；代次回退覆盖受管 SQLite、程序与配置。
- 同进程组件共享进程，未捕获 panic 会影响宿主。停止超时后的后台 goroutine 由组件负责终止。

## 平台验证记录

五个目标为 Linux/macOS amd64/arm64、Windows amd64。现行发行延续已有平台证据：

| 目标 | 已记录环境 |
| --- | --- |
| macOS arm64 | Apple Silicon 原生运行及 launchd |
| macOS amd64 | Rosetta；Intel Mac 原生运行尚未记录 |
| Linux amd64 | x86_64 Linux VM 及 systemd |
| Linux arm64 | ARM 宿主容器；VM/物理机尚未记录 |
| Windows amd64 | 交叉构建与静态检查；实际运行、CGO 和资源测量延期 |

已有整合验收使用本地 Telegram Bot API 与合成 Provider；最终候选的真实 Telegram 和付费 LLM 凭据验证仍未记录。v0.2.0 延续交叉构建与模拟外部服务各自原有的验证范围，OneBot11 的 SnowLuma 实测问题按上文单独保留。完整发行依据见 [v0.2.0 发布说明](https://github.com/AlonaBot/AlonaBot/blob/main/changelog/v0.2.0/zh-CN.md)。升级和恢复见[安装](../usage/install.md#升级与恢复)。
