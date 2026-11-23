---
title: Session-specific configuration
description: Use different configuration values in different groups.
---

A **profile** stores configuration overrides that can be assigned to a bot account or session. For example, a work group can use a todo limit of 50 while a social group uses 10. Unassigned sessions use `default`.

## Declare overridable fields

Add `"profile": true` to fields that may vary by session.

```json title="plugin_config_schema.json"
{
  "limit": {
    "type": "int",
    "description": "Maximum items per user",
    "default": 20,
    "profile": true
  }
}
```

The code stays the same. `c.Config().Int("limit")` reads the current session's effective value.

## Create and assign a profile

Use WebUI or the CLI:

```sh
# Create a profile
alonabot profile create work

# Find its ID
alonabot profile list

# Set limit to 50 in this profile
alonabot profile set <ID> alonabot-plugin-todo limit 50

# Assign it to a group on the main account
alonabot profile assign <ID> main 'telegram:-100123456'
```

That group now allows 50 todos per user; other groups still allow 20.

Profile selection order:

1. The profile assigned to the session.
2. The profile assigned to the bot account.
3. `default`。

## Choose fields to override

Use overrides for values read during message handling: limits, toggles, reply styles, and model selection.

Keep these at the base level:

- **Startup values**, such as database addresses and background intervals. `p.Config()` in `OnStart` reads base values before a current session exists.
- **Secrets**. Fields with `"secret": true` cannot use profile overrides.

## c.Config and p.Config

| Expression | Use | Values |
| --- | --- | --- |
| `c.Config()` | Handlers | Effective values after session profile overrides |
| `p.Config()` | Startup callbacks and background goroutines | Base values without profile overrides |

`c.Config()` remains stable during one call. Owner changes apply from the next message.

## Disable a plugin in a session

Owners can disable a plugin within a profile. In sessions assigned to that profile:

- Commands are unavailable; text matchers and event Handlers are skipped.
- Scheduled tasks and services called by other plugins continue running.

The framework applies this automatically.

## Session access

Open Platform & messaging in a WebUI profile and select an access mode:

| Mode | Behavior |
| --- | --- |
| All | Allow every session |
| Allow selected sessions | Allow only listed accounts and full session IDs |
| Block selected sessions | Deny listed sessions |

Rules apply to commands, Agent, events, and sending. Configure topics separately using full session IDs.
