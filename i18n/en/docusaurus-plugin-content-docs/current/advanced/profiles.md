---
title: Configuration profiles
description: Use different settings in different chats.
---

A Profile is a named set of overrides. Assign work chats a limit of 50 and casual chats a limit of 10; unassigned chats use default.

## Mark an overridable field

```json title="config_schema.json"
{
  "limit": {
    "type": "int",
    "description": "Maximum items per user",
    "default": 20,
    "profile": true
  }
}
```

The handler keeps using `c.Config().Int("limit")` and receives the current chat's effective value.

## Configure and assign

```fish
alonabot profile create work
alonabot profile list
alonabot profile set <ID> alonabot-plugin-todo limit 50
alonabot profile assign <ID> main 'telegram:-100123456'
```

Use the ID returned by create/list. Selection order is explicit chat assignment, instance assignment, then default. These management commands use Core's persistent local credentials and data directory.

## Choose fields carefully

Per-invocation values such as limits, reply style and model choice fit profiles. Startup connections and worker intervals use base configuration. Secret fields are ineligible for profile overrides.

| View | Values |
| --- | --- |
| c.Config() | Frozen effective configuration for this invocation |
| p.Config() | Base configuration, including startup callbacks |

Editing default writes Pending; reload the plugin with `alonabot reload <pluginID> --yes`. Other Profile overrides apply to the next invocation. An existing invocation keeps its snapshot.

## Disable a plugin in a chat

Profile plugin switches disable that chat's commands, text matching and events. Scheduled work and service calls retain their own access rules. Core rechecks actual execution even when a menu entry was published earlier.
