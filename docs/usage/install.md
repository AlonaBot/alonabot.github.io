---
title: 安装
description: 安装 AlonaBot 0.3.0，配置管理界面并长期运行。
---

想直接部署机器人，建议使用 **Docker Compose**：首次启动已预装 WebUI 与 Agent，打开管理界面后配置机器人账号，重启 Core 即可自动安装并启用对应的官方 Adapter。想开发插件，可以从[快速上手](../quick-start.md)开始。

0.3.0 的平台归档和安装脚本提供 Core，其他组件按需安装。

| 方式 | 适合 | 包含内容 |
| --- | --- | --- |
| [Docker](#docker) | 已有 Docker，希望直接使用管理界面 | Core、WebUI、Agent |
| [安装脚本](#安装脚本) | Linux、macOS，注册为系统服务 | Core |
| [手动](#手动) | Windows，或自行管理进程 | Core |

## Docker

下载 0.3.0 对应的 Compose 文件：

```sh
curl --fail --location -o docker-compose.yml https://raw.githubusercontent.com/AlonaBot/AlonaBot/v0.3.0/docker-compose.yml
docker compose up -d
docker compose exec alonabot alonabot admin-token show --data-dir /data
```

打开 `http://127.0.0.1:7650`，复制界面显示的 token 并确认保存，即可登录。第三条命令也可读取 token。

Compose 使用 `ghcr.io/alonabot/alonabot:0.3.0`，支持 Linux amd64 和 arm64，以 UID/GID `10001:10001` 运行。数据保存在命名卷中；更新容器时保留同一个卷。

WebUI 已启用，Agent 需先配置 Provider 和模型再启用。Telegram、OneBot 11 Adapter 会在配置账号并重启 Core 后自动安装；help 插件需[单独安装](#安装官方组件)。

给机器人传入 token 等环境变量时，在 Compose 服务中添加 `environment`，再在设置里用 `${变量名}` 引用，见[设置](settings.md)。镜像包含 CA 证书；需要 shell、Node 或 Python 的 MCP stdio 服务，应使用包含这些运行时的自定义镜像。

## 安装脚本

支持使用 systemd 的 Linux 和当前用户登录会话中的 macOS，两者均提供 amd64 与 arm64。

```sh
curl --fail --location -o install.sh https://raw.githubusercontent.com/AlonaBot/AlonaBot/main/deploy/install.sh

# Linux
sudo sh install.sh --version 0.3.0

# macOS
sh install.sh --version 0.3.0
```

脚本下载安装包、校验完整性、注册服务并启动。首次启动会保存管理凭据。按下表命令读取。

| | Linux | macOS |
| --- | --- | --- |
| 程序位置 | `/opt/alonabot/` | `~/Library/Application Support/AlonaBot/` |
| 数据位置 | `/var/lib/alonabot` | `~/Library/Application Support/AlonaBot/data` |
| 服务 | `alonabot.service`，开机启动 | 当前用户的 launchd 服务，登录后启动 |

凭据可通过 `alonabot admin-token show --data-dir <数据目录>` 读取。

Core 启动后，在另一终端[安装官方组件](#安装官方组件)。

**卸载**：Linux 使用 `sudo sh install.sh --uninstall`，macOS 使用 `sh install.sh --uninstall`。脚本删除服务和程序，保留数据目录，并输出其位置。

## 手动

从 [0.3.0 Release](https://github.com/AlonaBot/AlonaBot/releases/tag/v0.3.0) 下载对应系统和架构的归档：

| 系统 | 架构 | 格式 |
| --- | --- | --- |
| Linux | amd64、arm64 | `.tar.gz` |
| macOS | amd64、arm64 | `.tar.gz` |
| Windows | amd64 | `.zip` |

解压后可见 `alonabot`（Windows 为 `alonabot.exe`）、`LICENSE` 和 `source.json`。在解压目录运行：

```sh
./alonabot run --data-dir ./data
```

首次启动后，终端显示管理地址和凭据文件位置。保持 Core 运行，在另一终端[安装所需组件](#安装官方组件)。后文假定 `alonabot` 已加入 `PATH`；在解压目录中执行时使用 `./alonabot`，Windows 使用 `alonabot.exe`。

要长期运行，可以用系统的服务管理工具管理进程。

## 安装官方组件

官方 Telegram 和 OneBot 11 Adapter 支持按账号配置自动安装：在 `core_config.json` 的 `adapters` 中添加至少一个实例，启动或重启 Core，Core 会复用已安装的 Adapter；尚未安装时，从对应官方仓库的最新 Release 下载、安装并启用。首次下载需要联网。

平台账号的创建与 Adapter 安装步骤见[平台接入](../platforms/index.md)。

归档安装后，在另一个终端安装并启用 WebUI：

```fish
alonabot install --source AlonaBot/alonabot-webui --yes
alonabot enable alonabot-webui-admin
```

命令示例使用已加入 PATH 的 `alonabot`，并在启动 Core 的目录执行。手动安装使用默认 `data`；系统服务的管理命令追加该服务的数据目录。Docker Compose 已启用 WebUI，直接打开管理界面。

其他组件在 WebUI 商店安装。平台配置见 [Telegram](../platforms/telegram.md) 与 [OneBot 11](../platforms/onebot11.md)，AI 配置见 [Agent](agent.md)。

## 打开管理界面

安装并启用 WebUI 后，访问 `http://127.0.0.1:7650`，用管理 token 登录。本机首次打开时可直接领取 token，保存后确认登录；凭据保存在数据目录的 `admin_token` 中。

远程部署时可以用 SSH 转发端口：

```sh
ssh -N -L 7650:127.0.0.1:7650 user@your-server
```

然后在自己电脑上打开 `http://127.0.0.1:7650`。通过域名访问的设置见[设置](settings.md#通过域名访问)。

## 忘了管理 token

停止 Core 后重新生成，旧 token 和现有管理会话随之失效：

```sh
alonabot admin-token reset --data-dir <数据目录>
```

## 接下来

- [接入 Telegram](../platforms/telegram.md) 或 [OneBot 11](../platforms/onebot11.md)。
- [配置 Agent](agent.md)，让机器人使用大模型。
- [安装插件和日常管理](manage.md)。
