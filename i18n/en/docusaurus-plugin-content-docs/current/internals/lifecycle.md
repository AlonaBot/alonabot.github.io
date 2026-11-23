---
title: Component startup and updates
description: Startup and shutdown stages, and recovery after a failed update.
---

import UpdateFlow from "@site/static/img/diagrams/en/update-flow.svg";

## Startup order

Core starts separate-process plugins in the following order, then begins delivering messages.

| Step | Action | Plugin code |
| --- | --- | --- |
| 1 | Start the process and connect | `New()` |
| 2 | Load configuration and fill defaults | `OnConfigLoad` |
| 3 | Apply pending database migrations | Functions in `Migrations` |
| 4 | Run startup callback | `OnStart` |
| 5 | Register commands and check conflicts | |
| 6 | Commit this version as active | |
| 7 | Prepare to receive messages | `OnReady` |
| 8 | Receive messages | Handler |

Step 6 is the commit point:

- **Failure before commit** discards the startup attempt. During updates, the previous version and data remain active.
- **Failure after commit** leaves this version active. Core attempts to restart it.

Check configuration and external connections in `OnStart`. Failed preparation leaves the original version active.

## Shutdown order

| Step | Action |
| --- | --- |
| 1 | Stop delivering new messages |
| 2 | Wait a few seconds for active Handlers |
| 3 | Run `OnStop` |
| 4 | Exit the process |

Shutdown has a deadline, 10 seconds by default. Core terminates the process if it expires.

## Crash recovery

Core restarts unexpectedly exited plugins. Three consecutive exits within 5 minutes disable the plugin and report an issue in logs and management. Re-enable it after fixing the cause.

A Handler panic is recovered and logged. The call fails while the plugin continues running.

## Failed update recovery

A generation stores a component's executable, configuration, and database state.

Core prepares updates on a database copy:

<div className="doc-diagram-scroll"><UpdateFlow className="doc-diagram" /></div>

Configuration changes use the same process. A configuration that fails startup restores the previous configuration.

Use `alonabot rollback <ID> <generation-ID>` for manual rollback. Find retained generation IDs in WebUI. After confirmation, Core creates a new generation and database copy from the target, restoring its executable, configuration, and database. Data written after the target is discarded.

Recovery covers framework-managed databases. Plugin-managed files and external databases require their own recovery procedure.

Development projects run by `alonabot run` use one database file directly on each restart.

## Applying configuration

`p.Config()` stays stable during a plugin run. Reload after an owner changes configuration; management prompts for this and starts the plugin with the new values.

[Session profile](../advanced/profiles.md) changes apply from the next message without reloading.

## Idle hibernation

With [memory saving](../usage/settings.md#save-memory) enabled, unused plugins stop normally. Core restarts them when needed by a message, service call, or HTTP request, then delivers the request.

Wakeup reuses the same generation without copying the database or running migrations. `OnStart` and `OnReady` run again, so they must support repeated execution.

Only plugins declaring hibernation support are eligible. Plugins with background goroutines or persistent connections should stay running.
