---
sidebar_position: 8
title: Background Tasks and Interaction
description: Wait for replies with continuations, schedule work and handle typed button clicks.
---

Use a continuation for the next user message, and Core Scheduler for timed work. Both have separate call deadlines, allowing ordinary handlers to return promptly.

## Wait for a reply

Register `p.Command("ask").Continue().Handle(ask)` in `New()`. Import `sdk` and standard-library `time`:

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

`/ask` waits for the next message from the same user in the same chat, including thread. Waiting consumes that message and returns its new Context; other users and chats dispatch normally. `CONTINUATION_TIMEOUT` and the Wait argument constrain the deadline. Stopping or replacing the plugin ends the wait.

`.Continue()` moves the whole handler into a continuation. `c.Continue(fn)` runs fn after the original handler succeeds; the original call still decides propagation. Finish required sends within the continuation. Waiting state belongs to this runtime; start a new conversation after a restart.

## Static schedules

In `New()`, register `p.Every("tick", time.Minute).Handle(fn)` or `p.Cron("daily", "0 9 * * *").Timezone("Asia/Shanghai").Handle(fn)`. fn is `func(*sdk.Context) error`, with no user or default sending target; choose a chat explicitly.

After activation, manage static jobs with `task.Pause/Resume/Status(ctx, jobID)`. Pause state persists across restarts. Pausing lets the current call finish; resuming schedules the next future trigger.

## Create a requested reminder

Call `registerTasks(p)` in `New()` and import `sdk`, `sdk/task`, `sdk/message` and `time`:

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

`/remind take a break` creates a one-minute reminder and returns a random key. Its target chat and instance come from the creating command's trusted Context. The task explicitly uses that target, with sending still admitted by Core permissions.

`At` schedules once, `Every` uses an interval and `Cron` supports `task.Timezone(...)`. Omitting a key returns a generated random key. `task.Key(key)` gives a stable identity; creating the same task name and key replaces the rule and arguments. Scope user-provided keys by user/chat to prevent accidental replacement; see the [complete reminder example](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#动态提醒与静态任务暂停恢复).

`remind.Cancel(ctx, key)` deletes an instance and cooperatively cancels its active call; `remind.List(ctx)` lists instances. Core stores definitions and interval origins, discards missed triggers and schedules only future work on recovery. Task clients require an Activated Session; `OnStart/OnReady` and expired handler Contexts return `FAILED_PRECONDITION`.

## Typed buttons

Import `sdk/button`, `sdk/message` and `sdk`, then call `registerButtons(p)` in `New()`:

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

Typed actions carry JSON values and Core-issued callback tokens. The click handler's Actor is the actual clicking user. Add permissions, Rules or `.Continue()` on the `button.On` chain. Sending requires the instance's `message.buttons` capability; absent support returns an error. Add a text entry if the product requires one. Link buttons use `message.URLButton(label, url)`.

Sources: [continuations](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/continuation.go), [tasks](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/task/task.go), [buttons](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/button/button.go). Next: [HTTP and Plugin Pages](http.md).
