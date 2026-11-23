---
title: 配置项参考
description: plugin_config_schema.json 里可以写的全部类型和属性。
---

`plugin_config_schema.json` 是一个 JSON 对象，每个键是一个配置项。键的顺序就是表单里显示的顺序。Adapter 的 `adapter_config_schema.json` 格式相同。

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

键只能用字母、数字、`_`、`-`。

## 类型

| `type` | 值 | 表单 | 读取 |
| --- | --- | --- | --- |
| `string` | 文字 | 单行输入；有 `options` 时是下拉框 | `String(key)` |
| `text` | 文字 | 多行输入 | `String(key)` |
| `int` | 整数 | 数字输入 | `Int(key)`，返回 `int64` |
| `float` | 浮点数 | 数字输入 | `Float(key)`，返回 `float64` |
| `bool` | 布尔值 | 开关 | `Bool(key)` |
| `list` | 一组文字 | 可增删的行；有 `options` 时是多选 | `Strings(key)` |
| `list` 带 `items` | 一组对象 | 可增删的行，每行是一组子项 | `Objects(key)` |
| `object` | 一组子配置项 | 分组 | `Object(key)` |
| `dict` | 任意键值 | 键值对编辑 | `Dict(key)` |
| `template` | 多选一，每个选项有自己的子项 | 选择后显示对应的子项 | `Template(key)` |
| `template_list` | 一组 `template` | 可增删的行 | `TemplateList(key)` |

## 属性

| 属性 | 用于 | 含义 |
| --- | --- | --- |
| `type` | 全部 | 必填 |
| `description` | 全部 | 表单里的标题。不写时显示键名 |
| `hint` | 全部 | 标题下面的说明文字 |
| `obvious_hint` | 全部 | 为 `true` 时醒目地显示 `hint` |
| `default` | 除 `object` 外 | 没有设置时的值 |
| `required` | `string`、`text`、`list`、`dict`、`template`、`template_list` | 为 `true` 时不能为空 |
| `secret` | `string`、`text` | 为 `true` 时是密钥，不能同时写 `default` 或 `options` |
| `options` | `string`、不带 `items` 的 `list` | 可选的值 |
| `labels` | 同上 | 各选项显示的文字，和 `options` 按顺序对应 |
| `options_from` | 同上 | 选项来自运行时，见[动态选项](#动态选项) |
| `slider` | `int`、`float` | `{"min": 0, "max": 100, "step": 5}`，显示成滑块，并限制取值范围 |
| `editor_mode` | `string`、`text` | 为 `true` 时用代码编辑器输入 |
| `editor_language` | `string`、`text` | 代码编辑器的语言，缺省 `json` |
| `condition` | 全部 | `{"另一项的键": 值}`，另一项等于这个值时才显示。只影响显示 |
| `invisible` | 全部 | 为 `true` 时不在表单里显示 |
| `items` | `object`、`list` | 子配置项 |
| `templates` | `template`、`template_list` | 各个模板 |
| `profile` | 非密钥项 | 为 `true` 时可以[按会话设置不同的值](../advanced/profiles.md) |
| `example` | 全部 | 在表单里预览「这样设置机器人会怎么回复」，见[回复预览](#回复预览) |

## 默认值

每个配置项都一定有值。没设置时用 `default`；没写 `default` 时：

| 类型 | 值 |
| --- | --- |
| `string`、`text` | `""` |
| `int`、`float` | `0` |
| `bool` | `false` |
| `list`、`template_list` | 空 |
| `dict` | 空 |
| `template` | 没有选择，`Key()` 返回 `""` |

## 例子

### 下拉选项

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

存下来的是 `options` 里的值，`labels` 只用于显示。

### 分组

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

### 一组对象

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

### 多选一

不同的选项需要填不同的内容时用 `template`：

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

### 条件显示

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

`notify` 打开时才显示 `notify_session`。

## 动态选项

选项在运行时才知道（比如「选一个机器人账号」）时用 `options_from`：

```json
{
  "account": {
    "type": "string",
    "description": "Bot account",
    "options_from": { "source": "core.adapter_instances" }
  }
}
```

内置的来源：

| `source` | 选项 | `filter` |
| --- | --- | --- |
| `core.adapter_instances` | 已配置的机器人账号 | `adapter_id` |
| `core.chats` | 机器人见过的会话 | `adapter_id`、`chat_type`（`private`、`group`、`channel`） |

```json
{ "options_from": { "source": "core.chats", "filter": { "chat_type": "group" } } }
```

选项也可以由插件自己提供：

```json
{ "options_from": { "source": "alonabot-plugin-todo/lists" } }
```

```go
import "github.com/AlonaBot/AlonaBot/sdk/options"

	options.Serve(p, "lists", func(ctx context.Context, q options.Query) (options.Page, error) {
		// q.Search 是用户在输入框里打的字，返回匹配的选项
		// q.Values 不为空时，返回这些值对应的显示名
		return options.Page{}, nil
	})
```

存下来的仍然是普通的字符串。选项后来不存在了（比如账号被删除），配置照常加载，插件要自己处理不认识的值。

## 回复预览

`example` 让机器人主人在填表单时看到效果：

```json
{
  "greeting": {
    "type": "string",
    "default": "Hello",
    "example": { "input": "hello", "reply": "{greeting}, Alice!" }
  }
}
```

表单里这一项下面会显示一段对话：用户发 `/hello`，机器人回 `Hello, Alice!`。机器人主人修改输入框的内容时，预览跟着变。

- `input` 是用户发的内容，不写命令前缀。
- `reply` 是机器人的回复。`{键}` 会换成表单里当前的值。
- 回复里要带图片时，`reply` 写成数组，图片放在工程的 `examples/` 目录下：

```json
"reply": [
  { "text": "{greeting}" },
  { "image": "examples/greeting.png", "alt": "A greeting card" }
]
```

预览只是展示，不会真的运行插件。

## 翻译

`description`、`hint`、`labels` 用英文写，其他语言放在 `i18n/<语言>.json` 的 `config` 下：

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

## 值不合法时

配置加载时，框架按 Schema 转换和校验输入值：

- 类型不对但能转换（比如数字写成了字符串 `"20"`）：自动转换。
- 转换不了，或者不在 `options` 里、超出 `slider` 范围：用默认值。
- 修正后 `required` 的项仍然为空：插件启动失败，错误信息里指出是哪一项。

每次修正都会记在日志里，并在管理界面上提示。

## 改名和删除配置项

删掉或改名的配置项，旧的值会留在用户的配置里，不影响运行。想把旧值搬到新的键上，用 `OnConfigLoad`：

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

它在每次加载配置时执行，所以要写成执行多次结果也一样。里面只处理配置，不要访问数据库或网络。
