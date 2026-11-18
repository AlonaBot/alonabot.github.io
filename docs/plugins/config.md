---
sidebar_position: 2
title: 配置 Schema 与 Secret
description: 声明配置、读取只读值，并在加载时转换旧字段。
---

让 `/greet` 回复管理员设置的问候语。在 `plugin.yaml` 同目录写 `config_schema.json`，用字段声明默认值和界面文案：

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

`alonabot check` 检查声明，`alonabot build` 通过 overlay 编入资源。配置声明直接使用字段键；当前配置格式已移除旧 `$version`、`$migrations`。

## 读取只读配置

在 `New()` 中调用 `registerConfig(p)`，导入 `sdk`：

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

从 `OnStart` 开始可读 `p.Config()`，子插件的 `s.Config()` 是同名顶层 object 的只读视图；两者读取同一 Session 内固定的基础配置。Handler 中用 `c.Config()`，读取本次调用开始时冻结的整个插件配置，包含当前会话的字段覆盖。取值对象可并发读取，集合 getter 返回副本。

| 声明类型 | Getter |
| --- | --- |
| `string`、`text` | `String(key)` |
| `int`、`float`、`bool` | `Int(key)`（int64）、`Float(key)`（float64）、`Bool(key)` |
| 没有 `items` 的 `list` | `Strings(key)` |
| `object`、有 `items` 的 `list` | `Object(key)`、`Objects(key)` |
| `dict` | `Dict(key)` |
| `template`、`template_list` | `Template(key)`、`TemplateList(key)`；模板用 `Key()` 取选中键 |

准备完成前（包括 `OnConfigLoad` 中）调用 `Config()`、读取未声明的键或使用错误 Getter 会 panic，并给出字段路径。

## 加载与校正

加载顺序为 **`OnConfigLoad` → 补值与校正 → required 校验**：

- 缺失或 `null` 的字段补 `default` 或类型零值；显式的 `false`、`0`、空串和合法空集合保持原样。
- 类型不符时先尝试无损转换；范围或选项无效时恢复默认值，并记录原值、路径和原因。secret 记录省略原值。
- 未声明的旧键保持在原配置中，管理员可清理；required 在校正后仍未满足时准备失败。

需要把旧 `hello` 搬到 `greeting` 时，在 `New()` 中登记 `p.OnConfigLoad(renameGreeting)`。函数使用标准库 `context`、`encoding/json`：

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

回调只转换配置，保留其他键与数字精度，重复调用结果一致。数据库、文件和网络访问放到相应运行阶段。已安装组件编辑配置后用 reload 生效；普通 restart 复用原快照，回调或校正改变结果时会返回 `FAILED_PRECONDITION`。开发 `run` 每次启动都从 `config.json` 准备配置，允许回调转换后生效。

## 让不同会话使用不同配置

上面的 `greeting` 标记了 `"profile": true`，管理员可为工作群和私聊设置不同问候语，`/greet` 的业务代码保持原样：

- 用 `alonabot profile create <名字>` 建立配置文件；`profile set <ID> <插件ID> greeting <JSON值>` 保存覆盖，`profile assign <ID> <实例名> [<会话字符串>]` 指定用途。会话单独指定优先，其次是实例缺省，最后是 `default`。命令与管理认证见[开发指南](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#运行-core-与管理组件)。
- 覆盖以已载入、补值与校正的基础配置为基线，按完整字段路径替换；object/list 整体替换。标记实际按会话变化的叶字段，令牌、连接与后台缓存保留在基础配置中。可覆盖字段的完整子树须无 secret。
- 覆盖更新经 Core 下发，SDK 收到后开始的新调用使用新值；当前 Context 保持原视图。Rule、Service、Hook 与延续的 Context 同样携带调用视图。`p.Config()`、`s.Config()` 与生命周期、后台读取保持基础配置。
- 普通配置文件的覆盖更新直接生效；修改 `default` 写入插件 Pending，再经 reload 生效。配置文件的插件开关控制会话入站派发，Service、定时任务与后台发送继续运行。

需要自行建立配置视图时，`config.Values.WithOverrides(overrides map[string]json.RawMessage) (config.Values, error)` 返回独立只读视图，保留当前子路径；覆盖进行单值校验与替换，沿用已有载入和校正结果。

插件也可通过 `sdk/service.Call` 调用 `core.profile.list/current/assign/set`。current、assign、set 使用在途父调用的可信会话；assign/set 要求 Core Admin，set 只修改本插件标记的字段。set 修改 `default` 时返回 `reloading: true`，整条根调用及延续结束后 reload；已有 Pending 或管理互斥占用返回 `FAILED_PRECONDITION`。载荷见 [WIRE §3.5](https://github.com/AlonaBot/AlonaBot/blob/main/spec/WIRE-FORMAT.md#35-插件可调用的-core-固定服务)，用法入口见[服务与模型](services.md)。

## Secret 与翻译

secret 用于 `string`、`text`：声明 `"secret": true`，省略 `default` 和 `options`。Core 将非空值保存为不可变引用，启动时解析为明文；空串表示未设置。日志、错误和业务数据库中避免保存秘密值明文。

源文案写英文；翻译在 `i18n/zh-CN.json` 的 `config` 节点下，覆盖 `description`、`hint`、`labels`：

```json title="i18n/zh-CN.json"
{"config":{"greeting":{"description":"问候语"},"token":{"description":"访问令牌"}}}
```

## 动态选项与回复示例

字段的选项来自运行时，可声明 `options_from`，例如 `{"source":"core.adapter_instances","filter":{"adapter_id":"telegram"}}`。本插件提供选项时用 `options.Serve(p, "feeds", fn)`（`sdk/options`），函数为 `func(context.Context, options.Query) (options.Page, error)`，处理 `Search` 搜索、`Values` 回显和 `Limit` 分页。服务固定为私有，由 Core 在管理表单中调用；配置存储普通字符串。来源不可用或选项已删除时仍会加载配置，业务按实际值处理。

字段的 `example` 可写 `{"input":"greet","reply":"{greeting}"}`，在表单草稿中预览回复。命令文字省略前缀；混合回复的图片放在工程 `examples/` 中，构建工具校验引用。完整字段、模板、选项与示例格式见[插件开发指南](https://github.com/AlonaBot/AlonaBot/blob/main/docs/plugin-guide.md#7-配置与-secret)。

继续阅读：[存储数据](storage.md)、[组件生命周期](../concepts/lifecycle.md)。
