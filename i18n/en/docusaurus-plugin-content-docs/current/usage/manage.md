---
title: Component management
description: Install, update and diagnose components with persistent local credentials.
---

Keep Core running and open a second terminal on its machine. Management commands read core_config.json and admin_token from the same data directory.

## Preparation

These examples use `./data`. Script and Docker installations should use the program, user and directory described under [official components](install.md#official-components).

```fish
alonabot list --data-dir ./data
```

The CLI connects directly to local listen while preserving base_url as Host. Override the local connection with `--admin-url http://127.0.0.1:7650`. Use SSH to run commands on a remote machine, or docker compose exec inside the container.

## Plugins

```fish
alonabot install --source yourname/alonabot-plugin-todo --data-dir ./data
alonabot install --source yourname/alonabot-plugin-todo --data-dir ./data --yes
alonabot install ./alonabot-plugin-todo-0.2.0-linux-amd64.tar.gz --data-dir ./data --yes
alonabot list --data-dir ./data
alonabot enable alonabot-plugin-todo --data-dir ./data --yes
alonabot disable alonabot-plugin-todo --data-dir ./data --yes
alonabot update alonabot-plugin-todo --data-dir ./data --yes
```

Without yes, commands show a confirmation preview. Review the source and affected objects before confirming. `install --yes` without a positional argument discovers the unique host archive under the current directory, or bin/ in a component project, including direct package subdirectories. Multiple candidates are reported as an error.

```fish
alonabot rollback alonabot-plugin-todo GENERATION_ID --data-dir ./data --yes
alonabot uninstall alonabot-plugin-todo --data-dir ./data --yes
```

Find retained generation IDs in component details in WebUI. Rollback creates a new generation from the selected program, configuration and database; later data is discarded. Uninstall retains data by default. purge-data deletes managed data; purge also removes configuration and the install binding. Review the preview first.

For existing components declaring prepare_effects: external, disable and back up external data before approving the candidate with manual-migration-approved.

:::caution Trusted code
Components run with Core's operating-system user. Review their repository source and required data access before installation.
:::

## Develop with a third-party adapter

Terminal one:

```fish
alonabot run ./my-plugin --data-dir ./qq-dev-data --log-level debug
```

Terminal two, replacing the example repository and component ID:

```fish
alonabot install --source author/alonabot-adapter-qq --data-dir ./qq-dev-data --yes
alonabot adapter instance create alonabot-adapter-qq qq-main --config ./qq-account.json --data-dir ./qq-dev-data
```

The account JSON follows that adapter's schema. The installed adapter keeps its release version; the plugin reloads on save. To edit the adapter itself, use [source debugging](../develop/adapter.md#third-party-source).

## Bot administrators

```fish
alonabot admin list
alonabot admin add telegram:123456789
alonabot admin remove telegram:123456789
```

These short commands use default ./data. The official help plugin's /whoami reports the identity to add.

## Accounts

```fish
alonabot adapter instance create alonabot-adapter-telegram main --config tg.json
alonabot adapter instance stop main
alonabot adapter instance start main
alonabot adapter instance delete main
```

The instance file contains settings such as `{"token":"${TELEGRAM_BOT_TOKEN}"}`. The variable must exist in Core's environment. Creating an account binds the component and starts the instance.

## Logs and sleep

```fish
alonabot logs --follow
alonabot logs --source alonabot-plugin-todo --level error
alonabot logs --date 2026-11-22
alonabot log-level alonabot-plugin-todo debug
alonabot sleep-policy
alonabot sleep-policy alonabot-plugin-todo never
alonabot sleep-policy alonabot-plugin-todo auto
```

log-level persists the source threshold. Files are under data/logs/. Sleep overrides accept never, a positive duration, or auto to remove the override; writes take effect immediately.

## Diagnostics

```fish
alonabot diagnose --data-dir ./data -o diagnose.zip
```

Defaults collect 24 hours of logs, settings and component information with credential redaction. Logs can still contain chat content; inspect before sharing. A refused connection triggers an offline read-only attempt when the original data lock is free. See the [CLI reference](../reference/cli.md).
