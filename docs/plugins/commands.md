---
sidebar_position: 4
title: 命令与事件
description: 注册命令、绑定参数，用权限和 Rule 选择要处理的事件。
---

在[插件入门](first-plugin.md)的 `New()` 中调用本页的登记函数，放在 `return p` 之前。它们都在同一个 `plugin` 包，使用 `sdk`、`message`；结构体参数示例还需要标准库 `fmt`。

## 分组、别名与权限

```go
func registerCommands(p *sdk.Plugin) {
    g := p.Group("demo")
    g.Command("echo").Alias("say").Args("text").RawTail().
        Handle(func(c *sdk.Context, text string) error {
            return c.Reply(text)
        })
    g.Command("admin").Permission(sdk.Admin.Or(sdk.ChatAdmin)).
        Handle(func(c *sdk.Context) error {
            return c.Reply("admin command")
        })
}
```

`/demo echo hello world` 把 `hello world` 作为一个 raw 尾部参数；别名 `/say hello world` 使用完整别名路径。`Group("demo")` 给主命令加前缀，`Alias` 写完整 token 路径。Core 优先选择最长完整路径或别名。

命令和文本匹配默认要求 `sdk.User`。在插件、子插件、组或路由上设置权限时，采用最近一层的显式设置；`Or` 表示任一权限匹配。常用值为 `sdk.Anyone`、`sdk.User`、`sdk.Admin`、`sdk.ChatAdmin`，平台权限用 `sdk.PermissionName("adapter.permission")`。Core 计算 Actor 权限；Handler 内可用 `c.Has(permission)` 判断。

## 按位置绑定参数

Handler 的第一个参数为 `*sdk.Context`，后续位置参数支持：

| Go 类型 | 命令输入 |
| --- | --- |
| `string` | 文本 token，末位可用 `RawTail()` 接收余下原文 |
| `int`、`int64`、`float64`、`bool` | 按声明类型解析 |
| `sdk.UserID` | 用户标识或提及 |
| `*message.ImageSegment` | 图片片段 |
| `message.Chain` | 消息链参数 |

`Args("text")` 显式提供参数名；构建器也会从源码提取名字。`Optional("text", "hello")` 设置可选参数与默认值，`RawTail()` 只用于末位字符串或消息参数。绑定失败时 Core 发送 usage；`Silent()` 可静默处理绑定失败。给命令设置 `Description` 和 `UsageKey`，并在 `i18n/` 提供翻译。

## 用结构体表达默认值

`/search cats` 使用 limit 10，`/search cats 3` 使用 limit 3：

```go
type SearchArgs struct {
    Query string `arg:"query"`
    Limit int64  `arg:"limit" default:"10"`
}

func search(c *sdk.Context, args SearchArgs) error {
    return c.Reply(fmt.Sprintf("query=%s limit=%d", args.Query, args.Limit))
}

func registerSearch(p *sdk.Plugin) {
    p.Command("search").Handle(search)
}
```

结构体是 Context 后唯一的参数，字段按顺序绑定；`arg` 指定名字，`default` 声明默认值，指针字段表示可选且缺失为 nil。末位 raw 字段用 `arg:"text,raw"`。结构体方式保持字段标签为唯一参数声明，省略链上的 `Args`、`Optional`、`RawTail`。需要检查业务取值时，在 Handler 中返回具体错误。

## 匹配普通文本

```go
func registerText(p *sdk.Plugin) {
    p.FullMatch("hello", "hello").IgnoreCase().
        Handle(func(c *sdk.Context) error { return c.Reply("Hello!") })
    p.Regex("number", `^number (\d+)$`).
        Handle(func(c *sdk.Context) error { return c.Reply(c.Match()[1]) })
}
```

`FullMatch` 匹配完整文本；`Keyword`、`StartsWith`、`EndsWith` 分别匹配包含、开头和结尾，`IgnoreCase()` 忽略大小写。`Regex` 的 `c.Match()` 包含完整匹配和捕获组。`Raw(routeID)` 把文本交给自己的 Rule 判断。Handler 中 `c.Text()` 取得文本。

## 处理类型化事件

```go
func registerEvents(p *sdk.Plugin) {
    p.On("echo-text", sdk.MessageCreated).Rule(sdk.NotCommand()).
        Handle(func(c *sdk.Context, e *message.CreatedPayload) error {
            text := e.Chain.Text()
            if text == "" {
                return nil
            }
            return c.Reply(text)
        })
}
```

事件名使用 `sdk.MessageCreated` 等标准常量，载荷参数使用对应类型的指针。上例的 `sdk.NotCommand()` 让已经被命令层消费的消息跳过回声，避免 `/ping` 收到两份回复。也可以只收 `*sdk.Context`，通过 `c.Event()` 读取 `*message.Event`。

`Rule` 的签名为 `func(*sdk.Context) (bool, error)`；链上多个 Rule 全部匹配才执行 Handler，`sdk.Any(...)` 表示任一条件匹配，`sdk.ToMe()` 检查消息是否指向机器人。Core 侧消息过滤可以在事件链上声明 `.Filter(sdk.MessageFilter{ToMe: true})`；其中多个条件按 OR 匹配，与 SDK Rule 分开执行。

其他事件包括 `sdk.MessageEdited`、`sdk.MessageDeleted`、`sdk.MemberJoined`。平台扩展用 `sdk.AdapterEvent[T]("adapter.event", version)` 声明，Handler 的载荷为 `*T`，实际接收还需 Adapter 声明事件 Schema。

## 注册与传播

在 `New()` 中完成登记，builder 以 `Handle` 结束。缺少或重复 `Handle`、签名不匹配、运行后再次登记都会报告错误。业务回调可登记在 `p.Sub("name")` 子插件中，子插件共享进程、资源和生命周期。

`Priority` 数字越小越先执行；有效的普通 Handler 中 `c.StopPropagation()` 停止后续传播。长时间等待回复使用 `.Continue()` 和 `c.Wait(timeout)`；见仓库的 [echo 多轮示例](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/echo/commands.go)。

`command.List(c.Context())`（导入 `sdk/command`）返回 Core 为当前 Actor 和默认会话筛选、本地化的可用命令，适合帮助列表；官方 [help 插件](https://github.com/AlonaBot/AlonaBot/blob/main/plugins/help/help.go)展示完整用法。

继续阅读：[发送消息与媒体](messages.md)。签名依据：[参数绑定实现](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/arguments.go)、[插件开发指南](https://github.com/AlonaBot/AlonaBot/blob/main/docs/plugin-guide.md)。
