---
title: Installation
description: Install AlonaBot 0.2.0 and open its management interface.
---

Docker Compose provides Core, WebUI and Agent together. Platform archives and the service installer provide Core alone. Plugin authors can start with the [quick start](../quick-start.md).

| Method | Use | Includes |
| --- | --- | --- |
| [Docker](#docker) | Open the management UI immediately | Core, WebUI, Agent |
| [Service installer](#service-installer) | Linux systemd or macOS login service | Core |
| [Manual](#manual) | Windows or your own process manager | Core |

## Docker

```fish
curl --fail --location -o docker-compose.yml https://raw.githubusercontent.com/AlonaBot/AlonaBot/v0.2.0/docker-compose.yml
docker compose up -d
docker compose exec alonabot alonabot admin-token show --data-dir /data
```

Open `http://127.0.0.1:7650` and sign in with the displayed token. Credentials persist in `/data/admin_token` after login and remain available to the local CLI.

Compose pins `ghcr.io/alonabot/alonabot:0.2.0`, supports Linux amd64/arm64 and runs as `10001:10001`. Keep the named volume mounted at `/data` when updating. For a host directory mount, grant that UID/GID read, write and traversal access first.

WebUI starts enabled. Configure a Provider and model before enabling Agent; install adapters and help as needed. Add secret environment variables to the Compose service, then reference them as `${NAME}` in configuration.

The scratch image includes CA certificates. MCP stdio tools needing a shell, Node or Python require a custom image with those runtimes; preserve the user, volume and init behavior.

## Service installer

Linux needs systemd and root; macOS uses the current user's LaunchAgent. Both support amd64/arm64:

```fish
curl --fail --location -o install.sh https://raw.githubusercontent.com/AlonaBot/AlonaBot/main/deploy/install.sh
# Linux
sudo sh install.sh --version 0.2.0
# macOS
sh install.sh --version 0.2.0
```

The installer downloads and validates the archive before stopping the service and replacing the program. Existing data, configuration and components remain.

| | Linux | macOS |
| --- | --- | --- |
| Program | `/opt/alonabot/alonabot` | `~/Library/Application Support/AlonaBot/alonabot` |
| Data | `/var/lib/alonabot` | `~/Library/Application Support/AlonaBot/data` |
| Service | `alonabot.service`, user alonabot | `io.github.alonabot`, current login user |

Read the login token (first command Linux, second macOS):

```fish
# Linux
sudo runuser -u alonabot -- /opt/alonabot/alonabot admin-token show --data-dir /var/lib/alonabot
# macOS
"$HOME/Library/Application Support/AlonaBot/alonabot" admin-token show --data-dir "$HOME/Library/Application Support/AlonaBot/data"
```

Uninstall with `sudo sh install.sh --uninstall` on Linux or `sh install.sh --uninstall` on macOS. The service and program are removed; the installer reports the preserved data path.

## Manual

Download the matching [v0.2.0 archive](https://github.com/AlonaBot/AlonaBot/releases/tag/v0.2.0). Linux/macOS amd64 and arm64 use tar.gz; Windows amd64 uses zip. Extract alonabot (alonabot.exe on Windows), LICENSE and source.json, then run:

```fish
./alonabot run --data-dir ./data
```

Core saves restricted credentials in `data/admin_token` and prints the file location. Read them from another terminal with `./alonabot admin-token show --data-dir ./data`. Later examples assume the executable is on PATH; otherwise use its explicit path.

## Official components

Run management commands on the Core machine as the owning user, using the same data directory. Define one fish function for your installation:

Linux service:

```fish
function ab
    sudo runuser -u alonabot -- /opt/alonabot/alonabot $argv --data-dir /var/lib/alonabot
end
```

macOS login service:

```fish
function ab
    "$HOME/Library/Application Support/AlonaBot/alonabot" $argv --data-dir "$HOME/Library/Application Support/AlonaBot/data"
end
```

Manual archive, from its directory:

```fish
function ab
    ./alonabot $argv --data-dir ./data
end
```

Docker, from the Compose directory:

```fish
function ab
    docker compose exec alonabot alonabot $argv --data-dir /data
end
```

Windows uses `alonabot.exe <command> --data-dir <actual-directory>`. Functions last for this fish session.

For archive or script installations, install WebUI first:

```fish
ab install --source AlonaBot/alonabot-webui --yes
ab enable alonabot-webui-admin --yes
```

| Component | Install source | Enable |
| --- | --- | --- |
| Telegram | `AlonaBot/alonabot-adapter-telegram` | Configure an [instance](telegram.md) |
| OneBot11 | `AlonaBot/alonabot-adapter-onebot11` | Configure [forward or reverse WS](onebot11.md) |
| Agent | `AlonaBot/alonabot-agent` | Configure, then enable alonabot-agent-official |
| help | `AlonaBot/alonabot-plugin-help` | Enable alonabot-plugin-help-official |

Use `ab install --source <source> --yes` and `ab enable <ID> --yes`. Core can also install official Telegram/OneBot11 adapters automatically on startup when account settings are present. First download needs network access; previously uninstalled adapters require explicit installation. Archives are checked for identity, source, version and resources, and the source binding is retained.

## Open WebUI

Sign in at `http://127.0.0.1:7650`. The first local page offers the pending token for saving and confirmation; login and confirmation retain the credential file. Remote browsers can use SSH forwarding:

```fish
ssh -N -L 7650:127.0.0.1:7650 user@your-server
```

See [domain access](settings.md#domain-access) for HTTPS reverse proxies.

## Recover a token

Read the current credential with admin-token show. If the file is lost, stop Core and run admin-token reset, then read the replacement file. Old credentials and sessions become invalid. Init/reset print the file location.

## Upgrade and recovery

1. Stop Core and all components. Back up the full data directory, current program and deployment settings, plus external databases and files as their components require.
2. Upgrade Core to v0.2.0 first, then WebUI and other components. Rerun the versioned installer, replace the manual executable, or recreate the container with the pinned new image and the same volume.
3. Check login, accounts, components and business data. Installed data and source bindings remain.

After historical sidecars are removed, older Core needs an upgrade for online installation or updates. To restore a backup, stop everything and restore matching program, full data and external state from one point in time; later writes are discarded. Component rollback is covered in [management](manage.md).
