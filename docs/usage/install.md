---
title: 安装
description: 在服务器或自己的电脑上安装并长期运行 AlonaBot。
---

这一页面向要部署机器人的人。只是想开发插件的话，看[快速上手](../quick-start.md)就够了。

官方安装包里带有 Core、Telegram Adapter、Agent、WebUI 和一个 `/help` 插件，装好就能用。

选一种方式：

| 方式 | 适合 |
| --- | --- |
| [安装脚本](#安装脚本) | Linux 服务器、macOS，装成开机自启的服务 |
| [Docker](#docker) | 已经在用 Docker |
| [手动](#手动) | Windows，或者想自己管理进程 |

## 安装脚本

支持 Linux（需要 systemd）和 macOS，amd64 与 arm64。

```sh
curl --fail --location -o install.sh https://github.com/AlonaBot/AlonaBot/releases/latest/download/install.sh

# Linux
sudo sh install.sh

# macOS
sh install.sh
```

脚本会下载安装包、校验完整性、注册成系统服务并启动。安装结束时终端里会显示一次**管理 token**，登录 WebUI 要用，请保存好。

| | Linux | macOS |
| --- | --- | --- |
| 程序位置 | `/opt/alonabot/` | `~/Library/Application Support/AlonaBot/` |
| 数据位置 | `/var/lib/alonabot` | `~/Library/Application Support/AlonaBot/data` |
| 服务 | `alonabot.service`，开机启动 | 登录后启动 |

没看到 token（比如通过管道运行脚本）时这样读取：

```sh
# Linux
sudo runuser -u alonabot -- /opt/alonabot/alonabot admin-token show --data-dir /var/lib/alonabot

# macOS
"$HOME/Library/Application Support/AlonaBot/alonabot" admin-token show \
  --data-dir "$HOME/Library/Application Support/AlonaBot/data"
```

**升级**：再运行一次同样的命令，数据和设置保留。安装指定版本用 `sh install.sh --version 0.1.0`。

**卸载**：`sudo sh install.sh --uninstall`（macOS 不加 `sudo`）。程序被删除，数据目录保留，脚本会告诉你它在哪。

## Docker

```yaml title="compose.yaml"
services:
  alonabot:
    image: ghcr.io/alonabot/alonabot:0.1.0
    init: true
    volumes:
      - alonabot-data:/data
    ports:
      - "127.0.0.1:7650:7650"

volumes:
  alonabot-data:
```

```sh
docker compose up -d
docker compose exec alonabot alonabot admin-token show --data-dir /data
```

第二条命令输出管理 token。数据都在 `alonabot-data` 这个卷里，保留它就保留了全部设置和数据。

要给机器人传 token 等环境变量，在 compose 文件里加 `environment`，然后在设置里用 `${变量名}` 引用，见[设置](settings.md)。

## 手动

从 [Releases](https://github.com/AlonaBot/AlonaBot/releases) 下载对应系统的压缩包并解压，里面有 `alonabot` 程序和 `packages/` 目录，两者要放在一起。

```sh
./alonabot run --data-dir ./data
```

第一次启动时管理 token 显示在终端里。要长期运行的话，自己用系统的服务管理工具让它保持运行。

## 打开管理界面

浏览器访问 `http://127.0.0.1:7650`，用管理 token 登录。

装在远程服务器上时，管理界面缺省只允许本机访问。最简单的办法是用 SSH 转发端口：

```sh
ssh -N -L 7650:127.0.0.1:7650 user@your-server
```

然后在自己电脑上打开 `http://127.0.0.1:7650`。要通过域名公开访问，见[设置](settings.md#通过域名访问)。

## 忘了管理 token

停止 Core 后重新生成，旧的随之失效：

```sh
alonabot admin-token reset --data-dir <数据目录>
```

## 接下来

- [接入 Telegram](telegram.md) 或 [OneBot 11](onebot11.md)。
- [安装插件和日常管理](manage.md)。

## 备份

停止 Core，复制整个数据目录。恢复时同样先停止，把目录放回去再启动。只复制其中某个文件是不够的。
