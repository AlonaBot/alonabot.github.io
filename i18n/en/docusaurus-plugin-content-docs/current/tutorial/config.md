---
title: Configuration
description: Declare settings and read them in your plugin.
---

Give the bot owner a maximum number of items per user.

## Declare a setting

```json title="config_schema.json"
{
  "limit": {
    "type": "int",
    "description": "Maximum items per user",
    "default": 20
  }
}
```

The schema is a map of field names to declarations. English `description` labels the form; `default` is used when a value is absent.

## Read it

```go
	todo.Command("add").Description("Add a to-do item").RawTail().
		Handle(func(c *sdk.Context, text string) error {
			limit := c.Config().Int("limit")
			return c.Reply(fmt.Sprintf("Added: %s (limit %d)", text, limit))
		})
```

```text
> /todo add buy milk
Added: buy milk (limit 20)
```

## Change the value

Development values are stored in `data/plugins/alonabot-plugin-todo/config.json`:

```json title="data/plugins/alonabot-plugin-todo/config.json"
{ "limit": 3 }
```

Saving restarts the development plugin:

```text
> /todo add buy milk
Added: buy milk (limit 3)
```

Installed plugins use the WebUI form, then reload to activate pending changes.

## Types

| Type | Getter |
| --- | --- |
| `string`, `text` | `String(key)` |
| `int` | `Int(key)`, returns int64 |
| `float` | `Float(key)` |
| `bool` | `Bool(key)` |
| String `list` | `Strings(key)` |
| `object` | `Object(key)` followed by a child getter |

An undeclared key or wrong getter panics with the field path. See the [schema reference](../reference/config-schema.md) for object lists, dictionaries, templates and dynamic options.

## Secrets

```json title="config_schema.json"
{
  "limit": { "type": "int", "description": "Maximum items per user", "default": 20 },
  "api_key": { "type": "string", "description": "API key", "secret": true }
}
```

Read the plaintext with `c.Config().String("api_key")`. Management hides the existing value and diagnostic export redacts it by schema. Secret fields omit default/options. Keep plaintext out of logs, errors and business databases.

## Read at startup

```go
	p.OnStart(func(ctx context.Context) error {
		slog.Info("todo plugin starting", "limit", p.Config().Int("limit"))
		return nil
	})
```

Import `context` and `log/slog`. `p.Config()` reads base configuration; `c.Config()` also applies the invocation's Profile. See [lifecycle callbacks](../advanced/hooks.md#lifecycle-callbacks).

## Translate field labels

```json title="i18n/zh-CN.json"
{
  "config": {
    "limit": { "description": "每人最多几条待办" },
    "api_key": { "description": "API 密钥" }
  }
}
```

Next: [storage](storage.md).
