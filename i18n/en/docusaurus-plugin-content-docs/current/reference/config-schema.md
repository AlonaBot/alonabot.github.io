---
title: Configuration schema
description: Types and properties supported by config_schema.json.
---

`config_schema.json` maps setting keys to declarations. Key order determines form order. Adapters use the same format in `adapter_config_schema.json`.

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

Keys contain letters, digits, underscores or hyphens.

## Types

| type | Value and form | Accessor |
| --- | --- | --- |
| string | Text input; dropdown with options | String(key) |
| text | Multiline text | String(key) |
| int | Integer input | Int(key), returning int64 |
| float | Decimal input | Float(key), returning float64 |
| bool | Toggle | Bool(key) |
| list | Strings; multi-select with options | Strings(key) |
| list with items | Repeatable objects | Objects(key) |
| object | Group of settings | Object(key) |
| dict | Arbitrary key/value entries | Dict(key) |
| template | One named choice with its own fields | Template(key) |
| template_list | Repeatable template choices | TemplateList(key) |

## Properties

| Property | Applies to | Meaning |
| --- | --- | --- |
| type | All | Required type name |
| description | All | Form label; defaults to the key |
| hint | All | Supporting text |
| obvious_hint | All | Emphasizes the hint when true |
| default | Except object | Value used when unset |
| required | string, text, list, dict, template, template_list | Rejects an empty corrected value |
| secret | string, text | Secret value; excludes default and options |
| options | string, list without items | Allowed values |
| labels | Same as options | Display labels in matching order |
| options_from | Same as options | Runtime [dynamic options](#dynamic-options) |
| slider | int, float | Bounds and step, for example `{"min":0,"max":100,"step":5}` |
| editor_mode | string, text | Enables code editing |
| editor_language | string, text | Editor language; defaults to json |
| condition | All | Shows the field when another key matches, for example `{"enabled":true}`; presentation only |
| invisible | All | Hides the field |
| items | object, list | Child fields |
| templates | template, template_list | Named template declarations |
| profile | Non-secret fields | Allows [per-session overrides](../advanced/profiles.md) |
| example | All | [Reply preview](#reply-previews) |

## Unset values

The declared default is used first. Otherwise strings are empty, numbers are zero, booleans are false, collections are empty, and an unselected template has `Key() == ""`.

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

The stored value comes from options; labels affect display.

### Group

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

### Object list

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

### Template choice

Use a template when each choice needs different fields:

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

The notify_session field appears when notify is enabled.

## Dynamic options

Use options_from for choices only known at runtime, such as configured accounts:

```json
{
  "account": {
    "type": "string",
    "description": "Bot account",
    "options_from": { "source": "core.adapter_instances" }
  }
}
```

| Source | Choices | Filters |
| --- | --- | --- |
| core.adapter_instances | Configured accounts | adapter_id |
| core.chats | Chats seen by Core | adapter_id, chat_type (private/group/channel) |

```json
{ "options_from": { "source": "core.chats", "filter": { "chat_type": "group" } } }
```

A plugin can provide its own source:

```json
{ "options_from": { "source": "alonabot-plugin-todo/lists" } }
```

```go
import "github.com/AlonaBot/AlonaBot/sdk/options"

	options.Serve(p, "lists", func(ctx context.Context, q options.Query) (options.Page, error) {
		return options.Page{}, nil
	})
```

The callback receives `q.Search` for search text and `q.Values` when resolving labels for stored values. Return the matching `options.Page`. Stored settings remain strings; handle obsolete selections, such as a deleted account, in your plugin.

## Reply previews

An example displays the effect of a setting in the form:

```json
{
  "greeting": {
    "type": "string",
    "default": "Hello",
    "example": { "input": "hello", "reply": "{greeting}, Alice!" }
  }
}
```

The form shows the user sending /hello and the bot replying Hello, Alice! Editing the field updates the preview. input omits the command prefix. Placeholders such as `{greeting}` use current form values.

For images, use an array and place assets under the project's examples/ directory:

```json
"reply": [
  { "text": "{greeting}" },
  { "image": "examples/greeting.png", "alt": "A greeting card" }
]
```

The preview renders an illustration without executing your plugin.

## Translation

Write descriptions, hints and labels in English. Put translations under config in `i18n/<locale>.json`:

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

Core calls OnConfigLoad before schema correction. Convertible types are converted, such as a numeric string to an integer. Unconvertible values, invalid options and values outside slider bounds use defaults. If a required field remains empty, startup fails with the field path. Corrections appear in logs and the management UI.

## Rename or remove fields

Unknown old fields remain stored. Migrate a renamed key with OnConfigLoad:

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

This runs on every config load. Keep it repeatable and limit it to configuration transformation; database and network access belong in later lifecycle stages.
