---
sidebar_position: 8
title: 后台任务与交互
description: 使用延续调用等待回复，用 Scheduler 安排任务，用类型化按钮处理点击。
---

等待用户下一条消息用延续调用；按时间运行的工作用 Core Scheduler。两者都有独立调用期限，普通 Handler 可以及时返回。

## 等待下一条回复

在 `New()` 中登记 `p.Command("ask").Continue().Handle(ask)`。导入 `sdk`、标准库 `time`：

```go
func ask(c *sdk.Context) error {
    if err := c.Reply("Your answer?"); err != nil {
        return err
    }
    next, err := c.Wait(time.Minute)
    if err != nil {
        return err
    }
    return c.Reply(next.Text())
}
```

`/ask` 发出提问后，等待同一用户在同一会话（含话题）的下一条消息。等待消费该消息，返回新 Context；其他用户或会话继续正常分发。期限受 `CONTINUATION_TIMEOUT` 与 `Wait` 参数共同约束，停止或替换插件时结束。

`.Continue()` 将整个 Handler 移到延续调用；`c.Continue(fn)` 则在原 Handler 成功返回后执行 fn，原调用仍决定传播。延续内完成需要的发送，保持等待状态在本次运行中；重启后重新开始对话。

## 静态周期任务

在 `New()` 中登记 `p.Every("tick", time.Minute).Handle(fn)`，或 `p.Cron("daily", "0 9 * * *").Timezone("Asia/Shanghai").Handle(fn)`。fn 为 `func(*sdk.Context) error`，没有用户与默认发送目标，需要显式选择会话。

激活后可用 `task.Pause/Resume/Status(ctx, jobID)` 管理静态任务；暂停状态跨重启保存，暂停保留当前在途调用继续完成，恢复安排下一未来触发。

## 按用户请求创建提醒

在 `New()` 中调用 `registerTasks(p)`，导入 `sdk`、`sdk/task`、`sdk/message` 和 `time`：

```go
type Reminder struct {
    Session string `json:"session"`
    Instance string `json:"instance"`
    Text string `json:"text"`
}
var remind = task.Define[Reminder]("remind")

func registerTasks(p *sdk.Plugin) {
    task.On(p, remind).Handle(func(c *sdk.Context, in Reminder) error {
        _, err := c.SendTo(in.Session, message.Text(in.Text), sdk.Via(in.Instance))
        return err
    })
    p.Command("remind").Args("text").RawTail().Handle(func(c *sdk.Context, text string) error {
        key, err := remind.At(c.Context(), time.Now().Add(time.Minute), Reminder{
            Session: c.Session(), Instance: c.Instance(), Text: text,
        })
        if err != nil {
            return err
        }
        return c.Reply(key)
    })
}
```

`/remind take a break` 创建一分钟后的单次提醒，并返回随机 key。目标会话和实例来自创建命令的可信 Context；任务回调显式使用保存的目标，发信仍按 Core 许可准入。

`At` 安排一次，`Every` 安排固定间隔，`Cron` 支持 `task.Timezone(...)`。省略 key 时返回 SDK 生成的随机 key；`task.Key(key)` 指定稳定身份，同任务名、同 key 再次创建会整体替换规则与参数。若让用户提供 key，业务先加入用户/会话作用域，避免互相覆盖；[完整提醒示例](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#动态提醒与静态任务暂停恢复)提供写法。

`remind.Cancel(ctx, key)` 删除实例并协作取消在途调用；`remind.List(ctx)` 返回实例。Core 保存任务定义与 interval 起点，错过的触发作废，恢复只安排未来触发。任务客户端在 Session Activated 后使用，`OnStart/OnReady` 和已失效的 Handler Context 会返回 `FAILED_PRECONDITION`。

## 类型化按钮

导入 `sdk/button`、`sdk/message` 和 `sdk`，在 `New()` 中调用 `registerButtons(p)`：

```go
type Choice struct { Value string `json:"value"` }
var choose = button.Define[Choice]("choose")

func registerButtons(p *sdk.Plugin) {
    button.On(p, choose).Handle(func(c *sdk.Context, value Choice) error {
        return c.Reply(value.Value)
    })
    p.Command("choose").Handle(func(c *sdk.Context) error {
        _, err := c.Send(message.Chain{
            message.Text("Choose a value"),
            message.Buttons([]message.Button{choose.Button("Yes", Choice{Value: "yes"})}),
        })
        return err
    })
}
```

按钮动作带类型化 JSON 值，Core 签发回调 token；点击 Handler 的 Actor 是实际点击用户。在 `button.On` 的链上声明权限、Rule 或 `.Continue()`。发送需要实例的 `message.buttons` 能力；无该能力时返回错误，业务可按实际产品需求提供文本入口。链接按钮使用 `message.URLButton(label, url)`。

依据：[延续调用](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/continuation.go)、[任务](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/task/task.go)、[按钮](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/button/button.go)。继续阅读：[HTTP 与插件页面](http.md)。
