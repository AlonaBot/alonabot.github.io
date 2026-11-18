---
sidebar_position: 2
title: Configuration Schema and Secrets
description: Declare configuration, read immutable values and transform old fields during loading.
---

Make `/greet` reply with the administrator's greeting. Write `config_schema.json` beside `plugin.yaml` to declare defaults and form text:

```json title="config_schema.json"
{
  "greeting": {
    "type": "string",
    "description": "Greeting",
    "default": "Hello",
    "profile": true
  },
  "enabled": {
    "type": "bool",
    "default": true
  },
  "token": {
    "type": "string",
    "description": "Access token",
    "secret": true
  }
}
```

`alonabot check` validates the declaration; `alonabot build` embeds it through an overlay. Declare fields directly: the current format has removed the old `$version` and `$migrations` keys.

## Read immutable configuration

Call `registerConfig(p)` in `New()` and import `sdk`:

```go
func registerConfig(p *sdk.Plugin) {
    p.Command("greet").Handle(func(c *sdk.Context) error {
        if !c.Config().Bool("enabled") {
            return nil
        }
        return c.Reply(c.Config().String("greeting"))
    })
}
```

Read `p.Config()` from `OnStart` onward; a sub-plugin's `s.Config()` views its same-named top-level object. Both read the base configuration, fixed within the Session. In handlers, `c.Config()` returns the whole plugin configuration frozen at invocation start, including the current chat's field overrides. Values support concurrent reads; collection getters return copies.

| Declared type | Getter |
| --- | --- |
| `string`, `text` | `String(key)` |
| `int`, `float`, `bool` | `Int(key)` (int64), `Float(key)` (float64), `Bool(key)` |
| `list` without `items` | `Strings(key)` |
| `object`, `list` with `items` | `Object(key)`, `Objects(key)` |
| `dict` | `Dict(key)` |
| `template`, `template_list` | `Template(key)`, `TemplateList(key)`; `Key()` returns the selected template key |

Calling `Config()` before preparation completes, including inside `OnConfigLoad`, reading an undeclared key or using the wrong getter panics with the field path.

## Loading and correction

The order is **`OnConfigLoad` → defaults and corrections → required validation**:

- Missing or `null` fields receive their default or type's zero value. Explicit `false`, `0`, empty strings and valid empty collections are retained.
- Invalid types first undergo lossless conversion. Invalid ranges or options restore the default and record the original value, path and reason; secret records omit the original value.
- Unknown old keys remain in the original configuration for administrator cleanup. Preparation fails if required fields remain unsatisfied after correction.

To move old `hello` to `greeting`, register `p.OnConfigLoad(renameGreeting)` in `New()`. Import standard-library `context` and `encoding/json`:

```go
func renameGreeting(ctx context.Context, raw json.RawMessage) (json.RawMessage, error) {
    if err := ctx.Err(); err != nil {
        return nil, err
    }
    var fields map[string]json.RawMessage
    if err := json.Unmarshal(raw, &fields); err != nil {
        return nil, err
    }
    if old, exists := fields["hello"]; exists {
        if _, exists := fields["greeting"]; !exists {
            fields["greeting"] = old
        }
        delete(fields, "hello")
    }
    return json.Marshal(fields)
}
```

Keep the callback a repeatable configuration transform preserving other keys and numeric precision. Use the appropriate runtime phase for database, file or network access. Apply edited configuration to installed components with reload. An ordinary restart reuses its original snapshot and returns `FAILED_PRECONDITION` if the callback or correction changes the result. Development `run` prepares configuration from `config.json` on every startup and allows callback transformations to take effect.

## Use different configuration in different chats

The `greeting` above has `"profile": true`. Administrators can give work groups and private chats different greetings while retaining the same `/greet` handler:

- Create a profile with `alonabot profile create <name>`, save overrides with `profile set <ID> <pluginID> greeting <JSON-value>`, and assign it with `profile assign <ID> <instance> [<chat-string>]`. A chat-specific assignment takes priority, followed by the instance default, then `default`. See the [development guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#运行-core-与管理组件) for commands and management authentication.
- Overrides replace complete field paths on the loaded, defaulted and corrected base configuration; objects and lists are replaced as a whole. Mark leaves that actually vary by chat. Keep tokens, connections and background caches in base configuration. An overridable field's entire subtree must be free of secrets.
- Core sends changed overrides to the SDK; invocations starting after receipt use the new values, while an existing Context keeps its view. Rule, Service, Hook and continuation Contexts also carry invocation views. `p.Config()`, `s.Config()`, lifecycle and background reads retain base configuration.
- Ordinary profile overrides take effect directly. Editing `default` writes plugin Pending configuration and applies through reload. Profile plugin switches control incoming chat dispatch; Services, scheduled tasks and background sends continue running.

For an independent configuration view, `config.Values.WithOverrides(overrides map[string]json.RawMessage) (config.Values, error)` retains the current subpath. It validates and replaces individual values, reusing the existing loading and correction result.

Plugins can also call `core.profile.list/current/assign/set` through `sdk/service.Call`. current, assign and set use the in-flight parent invocation's trusted chat; assign/set require Core Admin, and set changes only marked fields in the calling plugin. Editing `default` returns `reloading: true`, with reload after the entire root invocation and continuations finish. Existing Pending configuration or occupied management locks return `FAILED_PRECONDITION`. Payloads are in [WIRE §3.5](https://github.com/AlonaBot/AlonaBot/blob/main/spec/WIRE-FORMAT.md#35-插件可调用的-core-固定服务); see [Services and Models](services.md) for the call API.

## Secrets and translations

Secrets apply to `string` and `text`: set `"secret": true` and omit `default` and `options`. Core stores non-empty values as immutable references and resolves plaintext at startup; an empty string means unset. Keep plaintext out of logs, errors and business databases.

Write source text in English. Under `config` in `i18n/zh-CN.json`, translations override `description`, `hint` and `labels`:

```json title="i18n/zh-CN.json"
{"config":{"greeting":{"description":"问候语"},"token":{"description":"访问令牌"}}}
```

## Dynamic options and reply previews

Use `options_from` for runtime choices, such as `{"source":"core.adapter_instances","filter":{"adapter_id":"telegram"}}`. To provide plugin options, register `options.Serve(p, "feeds", fn)` from `sdk/options`. The callback is `func(context.Context, options.Query) (options.Page, error)`, handling `Search`, `Values` and `Limit`. Core calls the private service from management forms; configuration still stores ordinary strings. Configuration loads even if the source is unavailable or a choice was deleted; handle actual stored values in business logic.

A field `example` such as `{"input":"greet","reply":"{greeting}"}` previews a reply from the form draft. Omit the command prefix in input. Images in mixed replies live under the project's `examples/` and are checked by author tools. See the [plugin guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/plugin-guide.md#7-配置与-secret) for fields, templates, options and previews.

Next: [Data Storage](storage.md), [Component Lifecycle](../concepts/lifecycle.md).
