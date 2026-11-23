---
title: CLI reference
description: alonabot subcommands and options.
---

Use `alonabot --version` for version and build date, and `<subcommand> --help` for options.

## Development

### alonabot init

```sh
alonabot init [directory]
```

Create a component project in an empty directory; defaults to the current directory.

| Option | Default | Meaning |
| --- | --- | --- |
| `--role` | `plugin` | `plugin`, `adapter`, `agent`, or `webui` |
| `--id` | Directory name | Component ID |
| `--adapter-id` | Component ID | Adapter platform identifier |
| `--module` | Directory name | Go module path; reuses an existing module |

### alonabot run

```sh
alonabot run [directories...]
```

Start Core and compile and run supplied component directories. With no arguments, run the current component project if present. `alonabot` without a subcommand is equivalent.

| Option | Default | Meaning |
| --- | --- | --- |
| `--data-dir` | `data` | Data directory; one Core per directory |
| `--console` | Automatic | Terminal chat opens in a terminal when no platform accounts exist. Force with `--console`, disable with `--console=false` |
| `--reload` | Enabled for development directories | Recompile and restart changed components; disable with `--reload=false` |
| `--listen` | Configuration value | Listen address for this run |
| `--log-level` | `info` | Console log level; terminal chat defaults to `warn` and above |
| `--log-format` | `text` | `text` or `json` |
| `--stdio` | Disabled | Use stdin/stdout for development component communication |

In terminal chat:

| Input | Result |
| --- | --- |
| Text | Send a private message as bot administrator `console:local` |
| `#number` | Click the numbered button on the latest message |

### alonabot check

```sh
alonabot check [directory]
```

Validate metadata, configuration declarations, translations, and Handlers without generating files.

### alonabot build

```sh
alonabot build [directory]
```

Compile into the project's `bin/` directory.

| Option | Meaning |
| --- | --- |
| `--out` | Output directory |
| `--goos`, `--goarch` | Target system and architecture; defaults to host |
| `--tags` | Comma-separated Go build tags |

### alonabot test

```sh
alonabot test [directory]
```

Compile and run offline preparation checks. Use `go test` for message and lifecycle validation; see [Testing](../tutorial/testing.md).

### alonabot pack

```sh
alonabot pack [directory]
```

Produce platform archives; see [Packaging and publishing](../advanced/publish.md).

| Option | Meaning |
| --- | --- |
| `--target` | Target such as `linux/amd64`; repeatable; defaults to host |
| `--out` | Output directory |
| `--tags` | Go build tags |

## Management

These commands connect to a running Core and read credentials from the selected data directory. For remote access set `ALONABOT_ADMIN_TOKEN` or pass `--token-file <file>`. Add `--admin-url <URL>` for a non-default address.

### Components

| Command | Action |
| --- | --- |
| `alonabot list` | List installed components |
| `alonabot install <file-or-component-ID>` | Install a local archive or component from `packages/` beside the executable |
| `alonabot install --source <owner/repo>` | Install from GitHub Releases |
| `alonabot enable <ID>`, `disable <ID>` | Enable or disable |
| `alonabot restart <ID>` | Restart |
| `alonabot reload <ID>` | Apply changed configuration |
| `alonabot update <ID>` | Update to latest |
| `alonabot rollback <ID> <generation-ID>` | Restore executable, configuration, and database |
| `alonabot pin <ID>` | Pin version for subsequent updates |
| `alonabot uninstall <ID>` | Uninstall |

| Option | Commands | Meaning |
| --- | --- | --- |
| `--yes` | All | Execute; otherwise preview affected resources |
| `--replace` | `install` | Replace the installed Agent or WebUI |
| `--purge-data` | `uninstall` | Delete data too |
| `--purge` | `uninstall` | Delete data and configuration |

### Bot administrators

| Command | Action |
| --- | --- |
| `alonabot admin list` | List |
| `alonabot admin add <platform:user-ID>` | Add |
| `alonabot admin remove <platform:user-ID>` | Remove |

### Platform accounts

| Command | Action |
| --- | --- |
| `alonabot adapter instance create <component-ID> <account> [--config file]` | Add account |
| `alonabot adapter instance start <account>`, `stop <account>` | Start or stop |
| `alonabot adapter instance delete <account>` | Delete |
| `alonabot adapter instance list` | List accounts and status |
| `alonabot adapter actions <account> [operation]` | Query live operations and input schemas |
| `alonabot adapter call <account> <operation> --params '{}'` | Invoke operation |

### Profiles

See [Session-specific configuration](../advanced/profiles.md).

| Command | Action |
| --- | --- |
| `alonabot profile list` | List |
| `alonabot profile create <name> [--from ID]` | Create, optionally copying an existing profile |
| `alonabot profile rename <ID> <name>` | Rename |
| `alonabot profile delete <ID>` | Delete |
| `alonabot profile assign <ID> <account> [session]` | Assign to an account or session |
| `alonabot profile unassign <account> [session]` | Remove assignment |
| `alonabot profile set <ID> <plugin-ID> <field> <JSON-value>` | Set override |
| `alonabot profile unset <ID> <plugin-ID> <field>` | Restore base value |

### Logs

| Command | Action |
| --- | --- |
| `alonabot logs` | Show recent logs |
| `alonabot log-level` | List component log levels |
| `alonabot log-level <ID> <level>` | Set level; `global` selects the global level |

`logs` options:

| Option | Meaning |
| --- | --- |
| `--follow` | Follow new entries |
| `--source` | Filter by component |
| `--level` | Include this severity and above |
| `--date` | Select a date, such as `2026-11-18` |
| `--trace` | Filter by call trace |

## Maintenance

### alonabot admin-token

| Command | Action |
| --- | --- |
| `alonabot admin-token show` | Read persisted token |
| `alonabot admin-token init` | Generate before starting Core |
| `alonabot admin-token reset` | Regenerate and invalidate the old token; stop Core first |

All require `--data-dir`.

### alonabot diagnose

```sh
alonabot diagnose --data-dir <data-directory> -o diagnose.zip
```

Export diagnostics.

| Option | Default | Meaning |
| --- | --- | --- |
| `--since` | `24h` | Log time range |
| `--no-logs`, `--no-settings`, `--no-components` | | Exclude the corresponding content |
| `--no-redact` | | Include plaintext secrets |

### alonabot tune list

List internal tuning values, including deadlines and limits. Change them with `--args` when needed:

```sh
alonabot run --args REQUEST_TIMEOUT=60s
```
