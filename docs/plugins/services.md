---
sidebar_position: 7
title: 服务、广播与模型
description: 调用类型化服务、发布事件，并复用 Agent 的模型与工具。
---

需要其他插件返回结果时用 Service；只需广播变化时用 Event Bus。声明放在提供方与调用方共用的可导入包中，两边使用同一组类型。

## 定义并调用 Service

以下在 ID 为 `alonabot-plugin-ping` 的工程中登记 `registerService(p)`，导入 `sdk`、`sdk/service`：

```go
type GreetIn struct { Name string `json:"name"` }
type GreetOut struct { Text string `json:"text"` }

var Greet = service.JSON[GreetIn, GreetOut]("alonabot-plugin-ping/greet")

func registerService(p *sdk.Plugin) {
    service.Serve(p, Greet).Access(service.AccessPublic).
        Handle(func(_ *sdk.Context, in GreetIn) (GreetOut, error) {
            return GreetOut{Text: "Hello, " + in.Name}, nil
        })
}
```

在另一个插件中将提供方的可导入声明包导入为 `api`，登记 `p.Command("service-greet").Handle(callGreeting)`：

```go
func callGreeting(c *sdk.Context, name string) error {
    out, err := api.Greet.Call(c.Context(), api.GreetIn{Name: name})
    if err != nil {
        return err
    }
    return c.Reply(out.Text)
}
```

调用方的 `/service-greet Alice` 收到 `Hello, Alice`。保持调用方与提供方的组件 ID 不同；Core 检查调用链，Handler 再调用自己插件的 Service 会返回 `CALL_CYCLE`。Service target 的组件部分与提供方 manifest ID 保持一致。

访问规则默认 `AccessPrivate`（Core 与本插件），`AccessAllowlist` 允许指定直接调用方，`AccessPublic` 允许已启用插件。权限 `.Permission(...)` 使用 Core 的可信 Actor。JSON 输入、输出按 Schema 校验；输入无效时 Handler 跳过，输出无效时调用失败。Protobuf 服务使用 `service.Proto` 和自己的 `proto.Message` 类型。

JSON Service、Bus 和任务的类型参数使用包级具名、非泛型类型。Schema 由构建器根据共享声明生成，类型可通过 `SchemaVersion() uint32` 声明版本，缺省为 1；修改类型后重新构建。

## 发布变化

在同一工程调用 `registerBus(p)`，导入 `sdk/bus`、`sdk/kv` 和 `sdk`：

```go
type Update struct { Text string `json:"text"` }
var updated = bus.Define[Update]("alonabot-plugin-ping/updated")

func registerBus(p *sdk.Plugin) {
    bus.Subscribe(p, updated).Handle(func(c *sdk.Context, in Update) error {
        return kv.Set(c.Context(), "latest-update", []byte(in.Text))
    })
    p.Command("publish").Handle(func(c *sdk.Context, text string) error {
        _, err := updated.Publish(c.Context(), Update{Text: text})
        return err
    })
}
```

`Publish` 成功表示 Core 已准入。广播非持久，离线、接收队列满或预算不足时会丢失；需要处理结果和回执时选择 Service。订阅回调串行执行，避免阻塞。回调只有组件身份，发消息时显式提供会话，使用 `sdk.Send` 或 `sdk.SendText`。

事件只发布到本插件的命名空间。订阅其他插件时导入其声明；同一事件登记多个订阅，用 `.ID(routeID)` 区分。

## 调用模型

登记 `p.Command("draft").Args("prompt").RawTail().Handle(draft)`，导入 `sdk/llm`：

```go
func draft(c *sdk.Context, prompt string) error {
    text, err := llm.Ask(c.Context(), prompt)
    if err != nil {
        return err
    }
    return c.Reply(text)
}
```

管理员需启用 Agent、配置模型，并把插件加入 `llm_service_allowed_plugins`。调用统一指向 `@agent/llm.generate`，沿用 Handler 的期限与调用关联。`llm.Ask` 发送一条 user 文本；`llm.Generate` 支持历史 `Messages`、`System`、`Model`、`MaxOutputTokens`，返回实际模型与可选 token 用量。一次生成为非流式请求；文本增量输出另用 [Context.Stream](messages.md#流式文本)。

## 将 Service 提供给 Agent

JSON Service 在 `Handle` 前加 `.Tool("Greet a user", tool.DefaultConfirm).Effect(tool.ReadOnly)`（`sdk/tool`），声明工具说明、缺省确认策略和副作用类别。`ReadOnly`、`Write`、`Destructive` 只描述操作，实际许可由 Core 当前策略决定。

Handler 或延续调用中，`tool.Invoke(ctx, target, args)` 按策略调用工具；`tool.Confirm(ctx, operation, summary, effect)` 为插件自执行的操作请求许可，成功后再执行。确认需要可信 Actor、默认会话与按钮能力。`tool.List(ctx)` 返回目录。

完整示例：[echo 服务与广播](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/echo/commands.go)。依据：[Service API](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/service/service.go)、[Bus API](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/bus/bus.go)。继续阅读：[后台任务与交互](background.md)。
