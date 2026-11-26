---
title: 配置
description: 声明配置项，在代码里读取，保存密钥。
---

配置是留给机器人主人调整的选项。这一页给待办清单加一个「每人最多几条」的上限。

## 声明配置项

配置项写在 `plugin_config_schema.json` 里，一个键是一项：

```json title="plugin_config_schema.json"
{
  "limit": {
    "type": "int",
    "description": "Maximum items per user",
    "default": 20
  }
}
```

`description` 显示在管理界面的表单里，用英文写；`default` 是没有设置时的值。

## 读取

Handler 里用 `c.Config()`：

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

## 修改配置的值

开发时，配置的值放在 `data/plugins/alonabot-plugin-todo/config.json`：

```json title="data/plugins/alonabot-plugin-todo/config.json"
{ "limit": 3 }
```

保存后插件自动重启：

```text
> /todo add buy milk
Added: buy milk (limit 3)
```

正式部署后，机器人主人在 WebUI 的插件页面里填表单修改。插件第一次成功启动后，配置也会导出到数据目录下的 `plugins/<插件 ID>/config.json`（密钥项只保存引用），直接改文件后执行 `alonabot reload <插件 ID>` 生效。

删掉或改名后留下的旧配置项，WebUI 会列出来，机器人主人可以一键清理。

## 配置项的类型

| `type` | 读取方法 | 说明 |
| --- | --- | --- |
| `string` | `String(key)` | 单行文字 |
| `text` | `String(key)` | 多行文字 |
| `int` | `Int(key)` | 整数，返回 `int64` |
| `float` | `Float(key)` | 浮点数 |
| `bool` | `Bool(key)` | 开关 |
| `list` | `Strings(key)` | 一组文字 |
| `object` | `Object(key)` | 一组子配置项，再用同样的方法读里面的值 |

读取没有声明过的键，或者用错了方法（比如对 `int` 用 `String`），插件会直接报错退出，错误信息里有键名。这样写错的地方在开发时就能发现。

每一项还可以写的属性，以及列表、下拉选项、模板等更多类型，见[配置项参考](../reference/config-schema.md)。

## 密钥

API 密钥这类不能泄露的值，加上 `"secret": true`：

```json title="plugin_config_schema.json"
{
  "limit": { "type": "int", "description": "Maximum items per user", "default": 20 },
  "api_key": { "type": "string", "description": "API key", "secret": true }
}
```

读取方法不变，`c.Config().String("api_key")` 拿到的就是原值。区别在于管理界面不会把它显示出来，导出诊断信息时也会被遮盖。密钥项不能写 `default`。

不要把密钥写进日志或错误信息。

## 在启动时读取

Handler 之外（比如启动时要用配置建立连接），用 `p.Config()`：

```go
	p.OnStart(func(ctx context.Context) error {
		slog.Info("todo plugin starting", "limit", p.Config().Int("limit"))
		return nil
	})
```

`OnStart` 在插件每次启动时执行一次，见[生命周期回调](../advanced/hooks.md#生命周期回调)。`p.Config()` 从 `OnStart` 起可用，在 `OnConfigLoad` 里或更早调用会 panic。

## 翻译配置项的说明

```json title="i18n/zh-CN.json"
{
  "config": {
    "limit": { "description": "每人最多几条待办" },
    "api_key": { "description": "API 密钥" }
  }
}
```

下一页：[存储数据](storage.md)。
