---
title: Configuration schema
description: Types and properties in plugin_config_schema.json.
---

`plugin_config_schema.json` maps keys to fields in form display order. Adapters use the same format in `adapter_config_schema.json`.

```json
{
  "greeting": {
    "type": "string",
    "description": "Greeting",
    "hint": "Shown when a user says hello",
    "default": "Hello"
  }
}
```

Keys accept letters, numbers, `_`, and `-`.

## Types

| `type` | Value | Form | Accessor |
| --- | --- | --- | --- |
| `string` | Text | Single line, or dropdown with `options` | `String(key)` |
| `text` | Text | Multiline | `String(key)` |
| `int` | Integer | Number input | `Int(key)`, returns `int64` |
| `float` | Number | Number input | `Float(key)`, returns `float64` |
| `bool` | Boolean | Toggle | `Bool(key)` |
| `list` | Strings | Editable rows, or multiselect with `options` | `Strings(key)` |
| `list` with `items` | Objects | Editable rows of child fields | `Objects(key)` |
| `object` | Child fields | Group | `Object(key)` |
| `dict` | Arbitrary key-value pairs | Key-value editor | `Dict(key)` |
| `template` | One option with its own fields | Selection with matching fields | `Template(key)` |
| `template_list` | Templates | Editable rows | `TemplateList(key)` |

## Properties

| Property | Applies to | Meaning |
| --- | --- | --- |
| `type` | All | Required |
| `description` | All | Form label; defaults to key |
| `hint` | All | Help text below label |
| `obvious_hint` | All | Highlight `hint` when true |
| `default` | Except `object` | Value when unset |
| `required` | `string`, `text`, `list`, `dict`, `template`, `template_list` | Require a nonempty value |
| `secret` | `string`, `text` | Sensitive value; excludes `default` and `options` |
| `options` | `string`, `list` without `items` | Allowed values |
| `labels` | Same | Display labels in option order |
| `options_from` | Same | Runtime choices; see [Dynamic options](#dynamic-options) |
| `slider` | `int`, `float` | ` {"min": 0, "max": 100, "step": 5}`; slider and allowed range |
| `editor_mode` | `string`, `text` | Use a code editor |
| `editor_language` | `string`, `text` | Editor language; defaults to `json` |
| `condition` | All | `{"other_key": value}`; show when the other field matches; affects display only |
| `invisible` | All | Hide from form |
| `items` | `object`, `list` | Child fields |
| `templates` | `template`, `template_list` | Available templates |
| `profile` | Non-secret fields | Allow [session overrides](../advanced/profiles.md) |
| `example` | All | Preview replies in the form; see [Reply previews](#reply-previews) |

## Defaults

Fields always have a value. Unset fields use `default`; without one:

| Type | Value |
| --- | --- |
| `string`、`text` | `""` |
| `int`、`float` | `0` |
| `bool` | `false` |
| `list`, `template_list` | Empty |
| `dict` | Empty |
| `template` | No selection; `Key()` returns `""` |

## Examples

### Dropdown

```json
{
  "style": {
    "type": "string",
    "description": "Reply style",
    "options": ["short", "detailed"],
    "labels": ["Short", "Detailed"],
    "default": "short"
  }
}
```

```go
if c.Config().String("style") == "detailed" { ... }
```

Stored values come from `options`; `labels` affect display only.

### Groups

```json
{
  "limits": {
    "type": "object",
    "description": "Limits",
    "items": {
      "per_user": { "type": "int", "default": 20 },
      "per_chat": { "type": "int", "default": 100 }
    }
  }
}
```

```go
limits := c.Config().Object("limits")
perUser := limits.Int("per_user")
```

### Object lists

```json
{
  "feeds": {
    "type": "list",
    "description": "Feeds",
    "items": {
      "name": { "type": "string" },
      "url":  { "type": "string", "required": true }
    }
  }
}
```

```go
for _, feed := range c.Config().Objects("feeds") {
	url := feed.String("url")
}
```

### Templates

Use `template` when each choice needs different fields:

```json
{
  "storage": {
    "type": "template",
    "description": "Storage",
    "templates": {
      "local": {
        "name": "Local disk",
        "items": { "path": { "type": "string", "default": "./files" } }
      },
      "s3": {
        "name": "S3",
        "items": {
          "bucket": { "type": "string", "required": true },
          "secret_key": { "type": "string", "secret": true }
        }
      }
    }
  }
}
```

```go
storage := c.Config().Template("storage")
switch storage.Key() {
case "local":
	path := storage.String("path")
case "s3":
	bucket := storage.String("bucket")
}
```

### Conditional display

```json
{
  "notify": { "type": "bool", "default": false },
  "notify_session": {
    "type": "string",
    "description": "Where to send notifications",
    "condition": { "notify": true }
  }
}
```

`notify_session` appears only when `notify` is enabled.

## Dynamic options

Use `options_from` for runtime choices such as bot accounts:

```json
{
  "account": {
    "type": "string",
    "description": "Bot account",
    "options_from": { "source": "core.adapter_instances" }
  }
}
```

Built-in sources:

| `source` | Options | `filter` |
| --- | --- | --- |
| `core.adapter_instances` | Configured accounts | `adapter_id` |
| `core.chats` | Known sessions | `adapter_id`, `chat_type` (`private`, `group`, `channel`) |

```json
{ "options_from": { "source": "core.chats", "filter": { "chat_type": "group" } } }
```

Plugins can supply options:

```json
{ "options_from": { "source": "alonabot-plugin-todo/lists" } }
```

```go
import "github.com/AlonaBot/AlonaBot/sdk/options"

	options.Serve(p, "lists", func(ctx context.Context, q options.Query) (options.Page, error) {
		// Return matching options for q.Search, the user's search text
		// If q.Values is nonempty, return labels for those values
		return options.Page{}, nil
	})
```

Values remain ordinary strings. Configuration still loads if a choice later disappears, such as a deleted account. Handle unknown values in the plugin.

## Reply previews

`example` shows the effect while owners edit the form:

```json
{
  "greeting": {
    "type": "string",
    "default": "Hello",
    "example": { "input": "hello", "reply": "{greeting}, Alice!" }
  }
}
```

The form displays a conversation: `/hello` produces `Hello, Alice!`. Editing the value updates the preview.

- `input` is user input without a command prefix.
- `reply` is the bot reply; `{key}` uses the current form value.
- For images, use an array in `reply` and place images in the project `examples/` directory:

```json
"reply": [
  { "text": "{greeting}" },
  { "image": "examples/greeting.png", "alt": "A greeting card" }
]
```

Images may be PNG, JPEG, WebP or GIF, and the extension must match the content; `alonabot check`, `build` and `pack` verify references, and `pack` includes only referenced images.

- Refer to object fields as `{group.greeting}`; options with `labels` show the label in the current language.
- For templates, `{mode.$key}` is the selected template and `{mode.<template key>.<field>}` is one of its fields; unselected templates render as empty.
- Secrets, `list`, `dict`, `object` and `template_list` fields cannot be referenced. Write literal braces as `{{` and `}}`.
- A field can have several examples by making `example` an array. Add `condition` to show one only when it holds, for example `"condition": {"mode.$key": "simple", "enabled": true}`.

Translate examples under `config.<field>.example` in `i18n/<locale>.json`, mirroring the original shape and overriding `input`, `reply` and segment `text` or `alt` by position; omitted items keep the original, and a skipped array item is written as `{}`.

Previews display examples without executing the plugin.

## Translation

Write `description`, `hint`, and `labels` in English. Add translations under `config` in `i18n/<locale>.json`:

```json title="i18n/zh-CN.json"
{
  "config": {
    "style": {
      "description": "回复风格",
      "labels": ["简短", "详细"]
    },
    "limits": {
      "description": "上限",
      "items": {
        "per_user": { "description": "每人" }
      }
    }
  }
}
```

## Invalid values

During loading, the framework converts and validates values against the schema:

- Convertible types, such as the string `"20"` for a number, are converted.
- Unconvertible values, unknown options, and out-of-range slider values use defaults.
- A required field that remains empty fails startup with the field identified in the error.

Corrections are logged and shown in management.

## Rename or remove fields

Old values remain in configuration after a field is renamed or removed. To move them to a new key, use `OnConfigLoad`:

```go
	p.OnConfigLoad(func(ctx context.Context, raw json.RawMessage) (json.RawMessage, error) {
		var fields map[string]json.RawMessage
		if err := json.Unmarshal(raw, &fields); err != nil {
			return nil, err
		}
		if old, ok := fields["max"]; ok {
			if _, exists := fields["limit"]; !exists {
				fields["limit"] = old
			}
			delete(fields, "max")
		}
		return json.Marshal(fields)
	})
```

It runs on every load, so make changes idempotent. Keep this callback limited to configuration processing, without database or network access.
