---
title: CLI reference
description: Development, management and maintenance commands.
---

Add `--help` to any command for its current flags.

## Development

### alonabot init

```fish
alonabot init [目录]
```

Creates a component in an empty directory; defaults to the current directory.

| Flag | Default | Meaning |
| --- | --- | --- |
| `--role` | `plugin` | `plugin`, `adapter`, `agent` or `webui` |
| `--id` | Directory name | Component ID |
| `--adapter-id` | Component ID | Platform namespace for an Adapter |
| `--module` | Directory name | Go module path; an enclosing module is reused |

### alonabot run

```fish
alonabot run [目录...]
```

Starts Core and builds the supplied component directories. With no directories, it runs the current component project if present. Running `alonabot` alone has the same effect.

| Flag | Default | Meaning |
| --- | --- | --- |
| `--data-dir` | `data` | Data directory; one Core process may own it at a time |
| `--console` | Automatic | Enables private terminal chat when interactive and no accounts are configured; use `--console=false` to disable |
| `--reload` | Enabled for development directories | Rebuilds and restarts changed components; `--reload=false` disables it |
| `--listen` | From settings | Overrides the listen address for this run |
| `--log-level` | `info` | Terminal log threshold; console mode defaults to `warn` |
| `--log-format` | `text` | `text` or `json` |
| `--stdio` | Off | Uses stdin/stdout transport for development components |

In console mode, text becomes a private message from bot administrator `console:local`. Enter `#number` to click a numbered button in the latest reply.

### alonabot check

```fish
alonabot check [目录]
```

Read-only scan of the manifest, configuration schema, localization resources and Handler declarations. Select a target with `--goos`, `--goarch` and `--tags`. Use the Go toolchain declared in the project's go.mod.

### alonabot build

```fish
alonabot build [目录]
```

Builds into the project's `bin/` directory.

| Flag | Meaning |
| --- | --- |
| `--out` | Output directory |
| `--goos`, `--goarch` | Target OS and architecture; default to the current machine |
| `--tags` | Comma-separated Go build tags |

### alonabot test

```fish
alonabot test [目录]
```

Builds, connects, prepares, registers, activates and stops the component in a temporary environment. Reports registered commands and cleanup errors. Adapters run with zero platform instances; WebUI assets are checked. Use `go test` for business behavior; see [Testing](../tutorial/testing.md).

### alonabot pack

```fish
alonabot pack [目录]
```

Creates [platform archives](../advanced/publish.md).

| Flag | Meaning |
| --- | --- |
| `--target` | Target such as `linux/amd64`; repeat for multiple targets; defaults to this machine |
| `--out` | Output directory |
| `--tags` | Go build tags |

## Management

Run management commands on the Core machine with the same `--data-dir`. The CLI reads its persistent `admin_token` and connects to the local listen address, preserving `base_url` as the Host. `--admin-url` overrides the local connection URL. For a remote server, use SSH; for Compose, use `docker compose exec`.

### Components

| Command | Purpose |
| --- | --- |
| `alonabot list` | List installed components |
| `alonabot install [archive or ID]` | Install a local archive or a component from `packages/` beside the executable |
| `alonabot install --source <owner/repo>` | Install from a GitHub Release |
| `alonabot enable <ID>`, `disable <ID>` | Enable or disable |
| `alonabot restart <ID>` | Restart |
| `alonabot reload <ID>` | Activate pending configuration |
| `alonabot update <ID>` | Update to the latest version |
| `alonabot rollback <ID> <generationID>` | Restore a retained program, configuration and database |
| `alonabot pin <ID> [version]` | Set a version constraint; omit the version to clear it |
| `alonabot uninstall <ID>` | Uninstall |

| Flag | Applies to | Meaning |
| --- | --- | --- |
| `--yes` | Component installation and lifecycle | Confirm the previewed operation |
| `--replace` | `install` | Replace a same-platform Adapter, the unique Agent or WebUI |
| `--archive` | `install`, `update` | Choose a local archive; mutually exclusive with `--source` |
| `--manual-migration-approved` | `reload`, `update`, `rollback` | Confirm external migration after disabling and backing up external data |
| `--purge-data` | `uninstall` | Also remove data |
| `--purge` | `uninstall` | Also remove data and configuration |

Without a positional argument, `install` discovers a unique host archive in the current directory or the component's `bin/`, including direct package subdirectories. Multiple matches produce an error listing candidates. A positional argument, `--archive` and `--source` are mutually exclusive.

### Bot administrators

| Command | Purpose |
| --- | --- |
| `alonabot admin list` | List administrators |
| `alonabot admin add <platform:userID>` | Add one |
| `alonabot admin remove <platform:userID>` | Remove one |

### Platform accounts

| Command | Purpose |
| --- | --- |
| `alonabot adapter instance create <componentID> <name> [--config file]` | Create an account |
| `alonabot adapter instance start <name>`, `stop <name>` | Start or stop |
| `alonabot adapter instance delete <name>` | Delete |

### Profiles

See [Per-session configuration](../advanced/profiles.md).

| Command | Purpose |
| --- | --- |
| `alonabot profile list` | List profiles |
| `alonabot profile create <name> [--from ID]` | Create, optionally copying an existing profile |
| `alonabot profile rename <ID> <name>` | Rename |
| `alonabot profile delete <ID>` | Delete |
| `alonabot profile assign <ID> <instance> [session]` | Assign to an account or session |
| `alonabot profile unassign <instance> [session]` | Remove the assignment |
| `alonabot profile set <ID> <pluginID> <key> <JSON-value>` | Set an override |
| `alonabot profile unset <ID> <pluginID> <key>` | Restore the base value |

### Logs

| Command | Purpose |
| --- | --- |
| `alonabot logs` | Read recent logs |
| `alonabot log-level` | List log thresholds |
| `alonabot log-level <ID> <level>` | Set a threshold; `global` selects the global threshold |

`logs` accepts `--follow`, `--source`, `--level`, `--date` (for example `2026-11-18`) and `--trace`.

### Sleep policy

```fish
alonabot sleep-policy
alonabot sleep-policy alonabot-plugin-todo
alonabot sleep-policy alonabot-plugin-todo never
alonabot sleep-policy alonabot-plugin-todo 15m
alonabot sleep-policy alonabot-plugin-todo auto
```

Reads preserve the current sleep state. Writes are persisted immediately; `auto` removes the plugin override. Change the global mode in WebUI settings.

## Maintenance

### alonabot admin-token

| Command | Purpose |
| --- | --- |
| `alonabot admin-token show` | Explicitly read the persistent credential, including while Core is running |
| `alonabot admin-token init [--if-missing]` | Initialize while Core is stopped; prints the file path |
| `alonabot admin-token reset` | Replace the credential while Core is stopped; invalidates the old one |

Select the actual directory with `--data-dir`. Startup and initialization save the credential with restricted permissions. Login and confirmation preserve the file. If it is lost, stop Core and reset it.

### alonabot diagnose

```fish
alonabot diagnose --data-dir <数据目录> -o diagnose.zip
```

Exports a diagnostic archive. `--since` defaults to `24h`. Use `--no-logs`, `--no-settings` or `--no-components` to exclude sections. `--no-redact` includes plaintext secrets.

### alonabot tune list

Lists internal tuning parameters and effective values. Override a parameter through `--args` when needed:

```fish
alonabot run --args REQUEST_TIMEOUT=60s
```
