---
title: Installation
description: Install AlonaBot 0.3.0, set up management, and run it as a service.
---

For deployment, use **Docker Compose**: WebUI and Agent are preinstalled on first startup. Configure bot accounts in WebUI, then restart Core to install and enable the official Adapter automatically. For plugin development, start with [Quick start](../quick-start.md).

The 0.3.0 platform archives and installation script provide Core. Install other components as needed.

| Method | Suitable for | Includes |
| --- | --- | --- |
| [Docker](#docker) | Existing Docker installation, browser-based management | Core, WebUI, Agent |
| [Installation script](#installation-script) | Linux or macOS, system service | Core |
| [Manual](#manual) | Windows or custom process management | Core |

## Docker

Download the Compose file for 0.3.0:

```sh
curl --fail --location -o docker-compose.yml https://raw.githubusercontent.com/AlonaBot/AlonaBot/v0.3.0/docker-compose.yml
docker compose up -d
docker compose exec alonabot alonabot admin-token show --data-dir /data
```

Open `http://127.0.0.1:7650`, copy the displayed token, and confirm you have saved it to sign in. The third command also reads the token.

Compose uses `ghcr.io/alonabot/alonabot:0.3.0`, supports Linux amd64 and arm64, and runs as UID/GID `10001:10001`. Data is stored in a named volume; retain the same volume when replacing the container.

The port is published only on host `127.0.0.1`. Keep it that way until you have claimed and confirmed the management token locally: before confirmation, anyone who can reach the port can claim the token and gain full management access.

WebUI is enabled. Configure a Provider and model before enabling Agent. Telegram and OneBot 11 Adapters install automatically after account configuration and a Core restart. Install the builtin plugin [separately](#install-official-components).

To supply tokens through environment variables, add `environment` to the Compose service and reference `${VARIABLE}` in settings; see [Settings](settings.md). The image includes CA certificates. For MCP stdio services requiring a shell, Node, or Python, use a custom image with those runtimes.

## Installation script

Supports Linux with systemd and the current user's macOS login session, on amd64 and arm64.

```sh
curl --fail --location -o install.sh https://raw.githubusercontent.com/AlonaBot/AlonaBot/main/deploy/install.sh

# Linux
sudo sh install.sh --version 0.3.0

# macOS
sh install.sh --version 0.3.0
```

The script downloads and verifies the archive, registers a service, and starts it. First startup saves management credentials. Read them with the commands below.

| | Linux | macOS |
| --- | --- | --- |
| Program | `/opt/alonabot/` | `~/Library/Application Support/AlonaBot/` |
| Data | `/var/lib/alonabot` | `~/Library/Application Support/AlonaBot/data` |
| Service | `alonabot.service`, starts at boot | Current user's launchd service, starts at login |

Read credentials with `alonabot admin-token show --data-dir <data-directory>`.

With Core running, [install official components](#install-official-components) in another terminal.

**Uninstall**: run `sudo sh install.sh --uninstall` on Linux or `sh install.sh --uninstall` on macOS. The script removes the service and program, retains the data directory, and prints its location.

## Manual

Download the archive for your system and architecture from the [0.3.0 Release](https://github.com/AlonaBot/AlonaBot/releases/tag/v0.3.0):

| System | Architecture | Format |
| --- | --- | --- |
| Linux | amd64、arm64 | `.tar.gz` |
| macOS | amd64、arm64 | `.tar.gz` |
| Windows | amd64 | `.zip` |

Extract the archive to find `alonabot` (`alonabot.exe` on Windows), `LICENSE`, and `source.json`. Run in that directory:

```sh
./alonabot run --data-dir ./data
```

First startup prints the management address and credentials file location. Keep Core running and [install components](#install-official-components) in another terminal. The following chapters assume `alonabot` is on `PATH`; from the extracted directory use `./alonabot`, or `alonabot.exe` on Windows.

For continuous operation, manage the process with your system's service manager.

## Install official components

Official Telegram and OneBot 11 Adapters support installation from account configuration. Add at least one instance under `adapters` in `core_config.json`, then start or restart Core. Core reuses an installed Adapter or downloads, installs, and enables its latest Release from the official repository. The first download requires internet access.

See [Platform connections](../platforms/index.md) for account creation and Adapter setup.

After installing an archive, install and enable WebUI in another terminal:

```fish
alonabot install --source AlonaBot/alonabot-webui --yes
alonabot enable alonabot-webui-admin
```

Examples use `alonabot` on PATH and run from the directory where Core was started. Manual installation uses the default `data` directory; for a system service, append its data directory to management commands. Docker Compose enables WebUI automatically.

Install other components from the WebUI store. See [Telegram](../platforms/telegram.md), [OneBot 11](../platforms/onebot11.md), and [Agent](agent.md) for configuration.

## Open management

After installing and enabling WebUI, visit `http://127.0.0.1:7650` and sign in with the management token. On first local access, claim the token and confirm it is saved. Credentials are stored in `admin_token` in the data directory.

For a remote server, forward the port with SSH:

```sh
ssh -N -L 7650:127.0.0.1:7650 user@your-server
```

Then open `http://127.0.0.1:7650` on your computer. See [Settings](settings.md#domain-access) for domain access.

## Reset the management token

Stop Core before regenerating the token. The previous token and active management sessions will expire:

```sh
alonabot admin-token reset --data-dir <data-directory>
```

## Next steps

- Connect [Telegram](../platforms/telegram.md) or [OneBot 11](../platforms/onebot11.md).
- [Configure Agent](agent.md) for model-powered conversations.
- [Install plugins and manage the bot](manage.md).
