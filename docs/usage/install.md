---
title: 安装
description: 安装 AlonaBot 0.1.0，配置管理界面并长期运行。
---

想直接部署机器人，建议使用 **Docker Compose**：首次启动已预装 WebUI 与 Agent，打开管理界面后配置机器人账号，重启 Core 即可自动安装并启用对应的官方 Adapter。想开发插件，可以从[快速上手](../quick-start.md)开始。

0.1.0 的平台归档和安装脚本提供 Core，其他组件按需安装。

| 方式 | 适合 | 包含内容 |
| --- | --- | --- |
| [Docker](#docker) | 已有 Docker，希望直接使用管理界面 | Core、WebUI、Agent |
| [安装脚本](#安装脚本) | Linux、macOS，注册为系统服务 | Core |
| [手动](#手动) | Windows，或自行管理进程 | Core |

## Docker

下载 0.1.0 对应的 Compose 文件：

```sh
curl --fail --location -o docker-compose.yml https://raw.githubusercontent.com/AlonaBot/AlonaBot/v0.1.0/docker-compose.yml
docker compose up -d
docker compose exec alonabot alonabot admin-token show --data-dir /data
```

第三条命令输出首次登录的管理 token。打开 `http://127.0.0.1:7650` 登录，保存好 token，后续命令行管理也会用到它。

Compose 使用 `ghcr.io/alonabot/alonabot:0.1.0`，支持 Linux amd64 和 arm64，以 UID/GID `10001:10001` 运行。数据保存在命名卷中；更新容器时保留同一个卷。

WebUI 已启用，Agent 需先配置 Provider 和模型再启用。Telegram、OneBot 11 Adapter 会在配置账号并重启 Core 后自动安装；help 插件需[单独安装](#安装官方组件)。

给机器人传入 token 等环境变量时，在 Compose 服务中添加 `environment`，再在设置里用 `${变量名}` 引用，见[设置](settings.md)。镜像包含 CA 证书；需要 shell、Node 或 Python 的 MCP stdio 服务，应使用包含这些运行时的自定义镜像。

## 安装脚本

支持使用 systemd 的 Linux 和当前用户登录会话中的 macOS，两者均提供 amd64 与 arm64。

```sh
curl --fail --location -o install.sh https://raw.githubusercontent.com/AlonaBot/AlonaBot/main/deploy/install.sh

# Linux
sudo sh install.sh --version 0.1.0

# macOS
sh install.sh --version 0.1.0
```

脚本下载安装包、校验完整性、注册服务并启动。首次初始化凭证时，管理 token 只显示一次；请保存好。通过非交互方式启动时，按下表命令领取。

| | Linux | macOS |
| --- | --- | --- |
| 程序位置 | `/opt/alonabot/` | `~/Library/Application Support/AlonaBot/` |
| 数据位置 | `/var/lib/alonabot` | `~/Library/Application Support/AlonaBot/data` |
| 服务 | `alonabot.service`，开机启动 | 当前用户的 launchd 服务，登录后启动 |

```sh
# Linux
sudo runuser -u alonabot -- /opt/alonabot/alonabot admin-token show --data-dir /var/lib/alonabot

# macOS
"$HOME/Library/Application Support/AlonaBot/alonabot" admin-token show \
  --data-dir "$HOME/Library/Application Support/AlonaBot/data"
```

Core 启动后，在另一终端[安装官方组件](#安装官方组件)。

**卸载**：Linux 使用 `sudo sh install.sh --uninstall`，macOS 使用 `sh install.sh --uninstall`。脚本删除服务和程序，保留数据目录，并输出其位置。

## 手动

从 [0.1.0 Release](https://github.com/AlonaBot/AlonaBot/releases/tag/v0.1.0) 下载对应系统和架构的归档：

| 系统 | 架构 | 格式 |
| --- | --- | --- |
| Linux | amd64、arm64 | `.tar.gz` |
| macOS | amd64、arm64 | `.tar.gz` |
| Windows | amd64 | `.zip` |

解压后可见 `alonabot`（Windows 为 `alonabot.exe`）、`LICENSE` 和 `source.json`。在解压目录运行：

```sh
./alonabot run --data-dir ./data
```

首次交互启动时，管理 token 显示在终端里。保持 Core 运行，在另一终端[安装所需组件](#安装官方组件)。后文假定 `alonabot` 已加入 `PATH`；在解压目录中执行时使用 `./alonabot`，Windows 使用 `alonabot.exe`。

要长期运行，可以用系统的服务管理工具管理进程。

:::note 归档已于 2026-11-21 更新
0.1.0 的五个平台归档已改为纯 Core，原 Core 二进制和 tag 保持原值，归档校验值随内容更新。此前下载过整合归档的用户，请重新下载；已安装到数据目录中的组件继续保留。
:::

## 安装官方组件

官方 Telegram 和 OneBot 11 Adapter 支持按账号配置自动安装：在 `core_config.json` 的 `adapters` 中添加至少一个实例，启动或重启 Core，Core 会复用已安装的 Adapter；尚未安装时，从对应官方仓库的最新 Release 下载、验签、安装并启用。首次下载需要联网。

这条自动安装路径直接使用 Core 内置的官方仓库映射，无需在插件商店登记。例如，`adapters.telegram.instances` 中有账号时，Core 默认选择 `alonabot-adapter-telegram`，从内置映射找到 `AlonaBot/alonabot-adapter-telegram` 仓库，再用发行构建内置的官方公钥验证 Release 签名。自动下载支持 Telegram 和 OneBot 11；未知的 Adapter ID 会报 `unknown official adapter`。

曾手动卸载过的 Adapter 需要使用下表命令重装。也可以用这些命令提前安装官方 Adapter；第三方 Adapter 按其发布者的说明安装。

管理命令连接正在运行的 Core，并从同一个数据目录读取管理地址。以下在另一终端使用 fish，先设置保存的管理 token：

```fish
set -gx ALONABOT_ADMIN_TOKEN '你的管理 token'
```

按安装方式选择一个 `ab` 函数；后续示例用它调用正确的程序、用户和数据目录。手动安装时在解压目录执行，Docker 时在 Compose 文件所在目录执行。

```fish
# Linux 安装脚本服务
function ab
    sudo runuser -u alonabot -- env ALONABOT_ADMIN_TOKEN="$ALONABOT_ADMIN_TOKEN" /opt/alonabot/alonabot $argv --data-dir /var/lib/alonabot
end
```

```fish
# macOS 安装脚本服务
function ab
    "$HOME/Library/Application Support/AlonaBot/alonabot" $argv --data-dir "$HOME/Library/Application Support/AlonaBot/data"
end
```

```fish
# 手动解压后以 ./alonabot run --data-dir ./data 启动
function ab
    ./alonabot $argv --data-dir ./data
end
```

Windows 手动安装时使用 `alonabot.exe <子命令> --data-dir <启动时的数据目录>`，并在当前终端设置 `ALONABOT_ADMIN_TOKEN` 环境变量。

```fish
# Docker Compose
function ab
    docker compose exec -e ALONABOT_ADMIN_TOKEN="$ALONABOT_ADMIN_TOKEN" alonabot alonabot $argv --data-dir /data
end
```

使用归档或安装脚本时，先安装并启用 WebUI：

```sh
ab install --source AlonaBot/alonabot-webui --yes
ab enable alonabot-webui-admin
```

Docker Compose 已完成这一步。以上函数在当前 fish 会话中生效；以后打开新终端时，重新设置 token 并定义所选函数。

其他组件按需安装：

| 组件 | 安装命令 | 启用方式 |
| --- | --- | --- |
| Telegram（可选手动安装） | `ab install --source AlonaBot/alonabot-adapter-telegram --yes` | 配置[机器人账号](telegram.md)后启动 |
| OneBot 11（可选手动安装） | `ab install --source AlonaBot/alonabot-adapter-onebot11 --yes` | 配置[机器人账号](onebot11.md)后启动；当前仅支持接收 |
| Agent | `ab install --source AlonaBot/alonabot-agent --yes` | 配置 Provider 和模型后启用 `alonabot-agent-official` |
| help | `ab install --source AlonaBot/alonabot-plugin-help --yes` | `ab enable alonabot-plugin-help-official` |

组件从各自仓库的 Release 下载，官方组件使用签名确认发布来源。安装后可通过 WebUI 管理，也可用 `ab list` 查看。

## 打开管理界面

安装并启用 WebUI 后，访问 `http://127.0.0.1:7650`，用管理 token 登录。首次登录成功后，Core 会删除保存首次 token 的 `admin_token` 文件。

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

## 升级与恢复

1. 停止 Core 和全部组件，备份完整数据目录、当前程序与部署配置。组件自管的外部数据库和框架目录外文件，按组件说明另外备份。
2. 安装脚本用户再次运行指定版本的安装命令；手动安装用户替换 Core；Docker 用户修改固定版本后重建容器，保留同一数据卷。
3. 启动后检查登录、组件状态和业务数据。组件从各自来源独立更新，见[日常管理](manage.md)。

需要恢复时，先停止 Core 和组件，再还原同一备份时点的程序、完整数据目录和外部数据。恢复会舍弃备份之后的写入。

## 接下来

- [接入 Telegram](telegram.md) 或 [OneBot 11](onebot11.md)。
- [配置 Agent](agent.md)，让机器人使用大模型。
- [安装插件和日常管理](manage.md)。
