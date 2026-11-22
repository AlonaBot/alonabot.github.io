---
title: 安装
description: 安装 AlonaBot 0.2.0，打开管理界面并长期运行。
---

部署机器人建议使用 Docker Compose，首次启动包含 WebUI 与 Agent；平台归档和系统安装脚本提供纯 Core。插件开发从[快速上手](../quick-start.md)开始。

| 方式 | 适合 | 包含内容 |
| --- | --- | --- |
| [Docker](#docker) | 已有 Docker，直接打开管理界面 | Core、WebUI、Agent |
| [安装脚本](#安装脚本) | Linux systemd、macOS 登录服务 | Core |
| [手动](#手动) | Windows 或自行管理进程 | Core |

## Docker

```fish
curl --fail --location -o docker-compose.yml https://raw.githubusercontent.com/AlonaBot/AlonaBot/v0.2.0/docker-compose.yml
docker compose up -d
docker compose exec alonabot alonabot admin-token show --data-dir /data
```

打开 `http://127.0.0.1:7650`，使用输出的 token 登录。凭据持久保存在 `/data/admin_token`，登录后保留，供本机 CLI 使用。

Compose 固定 `ghcr.io/alonabot/alonabot:0.2.0`，支持 Linux amd64/arm64，以 UID/GID `10001:10001` 运行。命名卷挂载 `/data`；更新时保留同一卷。使用宿主目录挂载时，预先授予 UID/GID 10001 读写和遍历权限。

WebUI 自动启用，Agent 配置 Provider 和模型后再启用；Adapter 与 help 按需安装。将 token 等环境变量加入 Compose 服务的 `environment`，再在配置中使用 `${变量名}`。

镜像包含 CA 证书，采用 scratch。MCP stdio 工具若需要 shell、Node 或 Python，使用包含所需运行时的自定义镜像，保留运行用户、数据卷和 init。

## 安装脚本

支持 Linux systemd 和 macOS 当前用户的 LaunchAgent，均提供 amd64/arm64：

```fish
curl --fail --location -o install.sh https://raw.githubusercontent.com/AlonaBot/AlonaBot/main/deploy/install.sh
# Linux
sudo sh install.sh --version 0.2.0
# macOS
sh install.sh --version 0.2.0
```

脚本下载并校验归档，完成准备后停止服务、替换程序并启动。已有配置、数据和组件保留。

| | Linux | macOS |
| --- | --- | --- |
| 程序 | `/opt/alonabot/alonabot` | `~/Library/Application Support/AlonaBot/alonabot` |
| 数据 | `/var/lib/alonabot` | `~/Library/Application Support/AlonaBot/data` |
| 服务 | `alonabot.service`，系统用户 `alonabot` | 当前用户的 `io.github.alonabot`，登录后启动 |

读取登录 token：

```fish
# Linux
sudo runuser -u alonabot -- /opt/alonabot/alonabot admin-token show --data-dir /var/lib/alonabot
# macOS
"$HOME/Library/Application Support/AlonaBot/alonabot" admin-token show --data-dir "$HOME/Library/Application Support/AlonaBot/data"
```

卸载运行 `sudo sh install.sh --uninstall`（Linux）或 `sh install.sh --uninstall`（macOS）。脚本移除服务与程序，保留并输出数据目录。

## 手动

从 [v0.2.0 Release](https://github.com/AlonaBot/AlonaBot/releases/tag/v0.2.0) 下载本机归档：Linux/macOS 的 amd64/arm64 使用 `.tar.gz`，Windows amd64 使用 `.zip`。

解压后包含 `alonabot`（Windows 为 `alonabot.exe`）、`LICENSE` 与 `source.json`：

```fish
./alonabot run --data-dir ./data
```

首次启动将管理凭据以受限权限写入 `data/admin_token`，终端输出文件位置。另一终端运行 `./alonabot admin-token show --data-dir ./data` 读取。后文假定程序已在 PATH；从解压目录执行时使用 `./alonabot`。

## 安装官方组件

CLI 在 Core 所在机器以对应用户运行，从同一个数据目录读取持久凭据。按部署方式定义 fish 函数 `ab`，后续统一使用它：

```fish
# Linux 系统服务
function ab
    sudo runuser -u alonabot -- /opt/alonabot/alonabot $argv --data-dir /var/lib/alonabot
end
```

```fish
# macOS 登录服务
function ab
    "$HOME/Library/Application Support/AlonaBot/alonabot" $argv --data-dir "$HOME/Library/Application Support/AlonaBot/data"
end
```

```fish
# 手动解压，在解压目录执行
function ab
    ./alonabot $argv --data-dir ./data
end
```

```fish
# Docker Compose，在 Compose 目录执行
function ab
    docker compose exec alonabot alonabot $argv --data-dir /data
end
```

Windows 使用 `alonabot.exe <命令> --data-dir <实际目录>`。函数在当前 fish 会话内生效。

归档或脚本安装后先启用 WebUI：

```fish
ab install --source AlonaBot/alonabot-webui --yes
ab enable alonabot-webui-admin --yes
```

| 组件 | 安装 | 启用 |
| --- | --- | --- |
| Telegram | `ab install --source AlonaBot/alonabot-adapter-telegram --yes` | 添加[实例](telegram.md)后启动 |
| OneBot 11 | `ab install --source AlonaBot/alonabot-adapter-onebot11 --yes` | 添加[正向或反向 WS 实例](onebot11.md)后启动 |
| Agent | `ab install --source AlonaBot/alonabot-agent --yes` | 配置后 `ab enable alonabot-agent-official --yes` |
| help | `ab install --source AlonaBot/alonabot-plugin-help --yes` | `ab enable alonabot-plugin-help-official --yes` |

也可在 `core_config.json` 配置官方 Telegram 或 OneBot11 实例，启动 Core 时按需从内置官方仓库映射下载安装。首次需要联网；曾手动卸载的 Adapter 需显式重装。安装器读取平台归档内的身份、来源、版本与资源，保留来源绑定。

## 打开管理界面

打开 `http://127.0.0.1:7650`，输入 token。首次本机 WebUI 会显示待确认凭据，复制保存后确认。登录及确认保留凭据文件。远程浏览器可用 SSH 转发：

```fish
ssh -N -L 7650:127.0.0.1:7650 user@your-server
```

通过域名访问见[设置](settings.md#通过域名访问)。

## 忘了管理 token

在服务器上显式读取 `alonabot admin-token show --data-dir <数据目录>`。文件遗失时先停止 Core，再执行 `admin-token reset`，读取新文件；旧凭据与管理会话失效。初始化与重置输出文件位置。

## 升级与恢复

1. 停止 Core 和全部组件，备份完整数据目录、当前程序和部署配置；外部数据库及插件文件另按组件说明备份。
2. 先升级 Core 至 v0.2.0，再更新 WebUI 与其他组件。脚本用户重新安装指定版本；手动用户替换程序；容器用户更新固定镜像并保留数据卷。
3. 启动并检查登录、账号、组件和业务数据。旧的已安装数据与来源绑定继续保留。

历史组件旁车清理后，旧 Core 的在线安装和更新需要先升级。恢复时先停机，还原同一时点的程序、完整数据目录与外部数据；恢复会舍弃备份之后的写入。组件回退见[日常管理](manage.md)。
