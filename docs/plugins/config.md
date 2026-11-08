---
sidebar_position: 2
title: 配置与 secret
description: 用 config_schema.json 声明插件配置，并在运行时读取。
---

插件的配置不定义 Go 类型，而是在 `plugin.yaml` 同目录手写一个 `config_schema.json`。生成器检查声明并把规范 JSON 嵌入生成文件。声明格式见 [CONTRACTS §5.1](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md)。

## 声明

```json title="config_schema.json"
{
  "$version": 2,
  "$migrations": [{"to": 2, "rename": {"hello": "greeting"}}],
  "greeting": {"type": "string", "description": "Greeting", "default": "Hello"},
  "enabled": {"type": "bool", "default": true},
  "token": {"type": "string", "description": "Access token", "secret": true}
}
```

- `$version` 是配置格式版本，缺省为 1。SDK 从已保存的版本依次执行 `$migrations`，首装时跳过。每步按 `rename` → `map` → `wrap` → `remove` 执行。
- 声明式迁移之后，SDK 调用根插件的 `OnConfigLoad`，你可以在这里做额外转换或业务取值检查。它应当是可重复的纯配置变换，不要访问数据库、文件或网络。
- 然后 SDK 只给缺失的键补 `default` 或类型零值，再按 schema 校验。显式的 `false`、`0`、空串与空集合保持原样。

## 读取

从 `OnStart` 开始，通过 `p.Config()` 读取：

```go
greeting := p.Config().String("greeting")
```

| 声明类型 | 取值方法 |
| --- | --- |
| `string`、`text` | `String(key)` |
| `int`、`float`、`bool` | `Int(key)`（int64）、`Float(key)`（float64）、`Bool(key)` |
| 没有 `items` 的 `list` | `Strings(key)` |
| `object`、有 `items` 的 `list` | `Object(key)`、`Objects(key)` |
| `dict` | `Dict(key)` |
| `template`、`template_list` | `Template(key)`、`TemplateList(key)` |

在 `OnConfigLoad` 中或更早调用 `Config()` 会 panic；读取未声明的键或用错取值方法也会 panic，消息会指明字段路径。

## secret

secret 只用于 `string` 与 `text`：声明 `"secret": true`，并省略 `default` 与 `options`。Core 把非空的秘密值保存为不可变引用，启动时解析为明文交给插件；空串表示未设置。日志、错误和业务数据库中都不能存放秘密值的明文。

## 翻译

配置文案的翻译写在 `i18n/<locale>.json` 的 `config` 节点下：

```json title="i18n/zh-CN.json"
{"config": {"greeting": {"description": "问候语"}, "token": {"description": "访问令牌"}}}
```

源文案用英文，翻译可以覆盖 `description`、`hint` 与 `labels`。生成器会核对翻译的键与 schema 是否对应。
