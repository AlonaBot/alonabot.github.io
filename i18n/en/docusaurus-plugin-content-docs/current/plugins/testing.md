---
sidebar_position: 10
title: Test Plugins with plugintest
description: Run real Core in go test, inject messages and assert replies, interactions and model calls.
---

Add a test for `/ping` from [Plugin Basics](first-plugin.md): inject a message and verify exactly one `pong` reply. `plugintest` assembles real Core, SDK Sessions and a loopback test Adapter. Argument binding, permissions, configuration and databases follow their actual runtime paths.

## Your first test

Create `plugin_test.go` beside `plugin.go`, using the same package:

```go title="plugin_test.go"
package plugin

import (
    "testing"

    "github.com/AlonaBot/AlonaBot/plugintest"
)

func TestPing(t *testing.T) {
    h := plugintest.Start(t, plugintest.Plugin(New()))
    alice := plugintest.User{ID: "alice"}
    result := h.Text(plugintest.Private(alice.ID), alice, "/ping")
    requireReply(t, result, "pong")
}

func requireReply(t *testing.T, result plugintest.Result, want string) {
    t.Helper()
    for _, outcome := range result.Outcomes {
        if outcome.Err != nil {
            t.Fatalf("handler %s/%s: %v", outcome.PluginID, outcome.RouteID, outcome.Err)
        }
    }
    if len(result.Sends) != 1 || result.Sends[0].Text() != want {
        t.Fatalf("result = %+v, want one reply %q", result, want)
    }
}
```

Run from the main repository root:

```fish
go test -v ./alonabot-plugin-ping
```

For an independent module, run `go test -v ./...` from its directory. Use the Go version required by `go.mod` and keep `plugin.yaml`, schemas and `i18n/`. The harness locates the entry package containing `sdk.NewPlugin()` through `go list`, scans its resources with the same scanner as the CLI, and follows the test binary's GOOS, GOARCH and build tags. Each entry package is scanned once per process. Run tests directly; no component binary or generated file is needed first.

Each `Start` creates its own `t.TempDir()`, configuration and `dev.sqlite`. Components run in-process, and the management listener uses a temporary loopback port. `t.Cleanup` stops Core and the components. Scan or activation failures fail the test with the full diagnostic. Call `New()` for a fresh plugin object in each test.

## Read the result

`Text` is shorthand for `Message(chat, user, message.Text(text))`. Use `Message` with `message.Chain` for mixed input. `Private("alice")` has chat ID `private:alice`; `Group("room")` has `group:room`. The default Adapter ID is `plugintest`, instance ID `test` and bot account `bot`. Private messages target the bot; in groups, `message.Mention(plugintest.AccountID)` can set ToMe.

- `Result.Sends`: sends and edits accepted by the test Adapter between injection start and Core's completion or wait notification, in acceptance order.
- `Sent.Text()`: concatenated text. Inspect `Chain` for buttons and media, `To` for the chat and `Result` for the receipt. `Op` is `send` or `edit`; `Edited` holds the edited message's reference.
- `Result.Outcomes`: each route's `PluginID`, `RouteID`, safe error `Err` and `Waiting` flag. `Err` retains the error code and `safe_message`; nil means success. Use the test log for full diagnostics.
- `Result.Waiting`: the call entered a multi-turn wait; the next matching user and chat message can resume it.

Call a Harness's `Text/Message/Event/Click/Trigger/TriggerTask/Background` **sequentially**. Concurrent injection fails the test. Event methods wait for Core's completion or wait notification, so tests need no sleep to guess when a reply is ready. Permission rejection before the handler usually produces no Outcome. For rejected sends, inspect the Outcome error and any sends already recorded.

## Choose the test environment

Pass options to `Start(t, ...)`. Use the same `p` in `Config`, `AllowedInstances` and `Plugin`:

- `Plugin(p)`: Register a tested plugin; repeat for multiple plugins, with distinct component IDs for cross-plugin Services
- `Config(p, json)`: Supply base configuration following the plugin schema; omission uses configuration preparation defaults
- `Admin("root")`: Register a Core Admin for the current test Adapter
- `AllowedInstances(p, ids...)`: Narrow sending access; all instances by default, an empty list denies proactive sending to every instance
- `Capabilities(names...)`: Replace the complete test instance capability set
- `Adapter(id, declarations...)`: Replace the Adapter ID and register permissions, events, extensions or actions
- `LLM(handler)`: Register a test Agent providing `llm.generate` through your substitute function

Default capabilities are `message.send`, `message.markdown`, `message.album`, `message.reference`, `message.buttons`, `message.forward` and `message.edit`. Sends and edits passing capability checks return Accepted with a message ID; missing capabilities return `UNSUPPORTED`. Use `Capabilities("message.send")` to test button or album error handling. `AllowedInstances(p)` can verify a task's `PERMISSION_DENIED`; replies to the trusted incoming message's original target retain their exemption.

For example, add `registerConfig` and the schema from [Configuration](config.md) to the plugin, registering before `New()` returns, then add this test:

```go
func TestGreeting(t *testing.T) {
    p := New()
    h := plugintest.Start(t, plugintest.Plugin(p),
        plugintest.Config(p, `{"greeting":"Welcome","enabled":true}`))
    alice := plugintest.User{ID: "alice"}
    requireReply(t, h.Text(plugintest.Private(alice.ID), alice, "/greet"), "Welcome")
}
```

## Wait for another message

Register `/ask` from [Background Tasks](background.md#wait-for-a-reply) in `New()` first. All remaining tests reuse `requireReply`:

```go
func TestWait(t *testing.T) {
    h := plugintest.Start(t, plugintest.Plugin(New()))
    alice := plugintest.User{ID: "alice"}
    chat := plugintest.Private(alice.ID)
    question := h.Text(chat, alice, "/ask")
    requireReply(t, question, "Your answer?")
    if !question.Waiting {
        t.Fatalf("question = %+v, want waiting", question)
    }
    answer := h.Text(chat, alice, "Blue")
    requireReply(t, answer, "Blue")
    if answer.Waiting {
        t.Fatalf("answer = %+v, want completed", answer)
    }
}
```

The question belongs to the first result. Replies and final errors after resumption belong to the injection consumed by the continuation, until it completes or waits again. Other users and chats continue normal dispatch.

## Click a sent button

Register `registerButtons` from [Typed Buttons](background.md#typed-buttons) in `New()`, then test:

```go
func TestClick(t *testing.T) {
    h := plugintest.Start(t, plugintest.Plugin(New()))
    alice := plugintest.User{ID: "alice"}
    menu := h.Text(plugintest.Group("room"), alice, "/choose")
    requireReply(t, menu, "Choose a value")
    clicked := h.Click(plugintest.User{ID: "bob"}, menu.Sends[0], "choose")
    requireReply(t, clicked, "yes")
}
```

`Click` uses the sent button with action name `choose` and its Core-issued token. The Actor is bob, and permissions are checked again for that user. Missing actions, URL buttons or missing receipts fail the test. Permission rejection, stale tokens and stale generations skip the handler, returning empty sends and Outcomes.

## Trigger a reminder now

Register `registerTasks` from the [reminder example](background.md#create-a-requested-reminder) in `New()`:

```go
func TestReminder(t *testing.T) {
    p := New()
    h := plugintest.Start(t, plugintest.Plugin(p))
    alice := plugintest.User{ID: "alice"}
    created := h.Text(plugintest.Private(alice.ID), alice, "/remind take a break")
    for _, outcome := range created.Outcomes {
        if outcome.Err != nil {
            t.Fatal(outcome.Err)
        }
    }
    if len(created.Sends) != 1 {
        t.Fatalf("create reminder = %+v", created)
    }
    key := created.Sends[0].Text()
    requireReply(t, h.TriggerTask(p, "remind", key), "take a break")
}
```

`TriggerTask` uses Core's stored arguments and real Scheduler calls, dispatching an existing instance immediately so the test needs no one-minute wait. For static jobs, use `h.Trigger(p, "tick")`, where `tick` is the job ID from `p.Every/Cron`. Use the same `p` registered with this Harness. Lookup or admission errors fail the test; dispatched handler errors appear in Outcomes. One-shot instances are consumed at dispatch.

## Inspect a model request

Register `/draft` from the [model example](services.md#use-a-model) in `New()`. Add standard library `context`, `reflect` and `sdk/llm` imports to the test file:

```go
func TestDraft(t *testing.T) {
    requests := make(chan llm.Request, 1)
    h := plugintest.Start(t, plugintest.Plugin(New()),
        plugintest.LLM(func(_ context.Context, req llm.Request) (llm.Response, error) {
            requests <- req
            return llm.Response{Text: "Test draft", Model: "synthetic"}, nil
        }))
    alice := plugintest.User{ID: "alice"}
    result := h.Text(plugintest.Private(alice.ID), alice, "/draft Write a note")
    requireReply(t, result, "Test draft")
    req := <-requests
    want := []llm.Message{{Role: "user", Text: "Write a note"}}
    if !reflect.DeepEqual(req.Messages, want) {
        t.Fatalf("messages = %+v, want %+v", req.Messages, want)
    }
}
```

Requests still pass through `@agent` lookup, Service calls and schema validation. Your substitute handles generation, so no model key or Provider network is needed. For a failure scenario, return `errcode.Unavailable.New("synthetic generation failure")` and inspect `errcode.Of(outcome.Err)` and `outcome.Err.Message`. With no LLM option, the model target is inactive and calls return `UNAVAILABLE`. The substitute runs in a component goroutine; assert in the test thread after receiving the result.

## Platform events and background sends

Set platform permissions in `User.Permissions` and declare their names and `Implies` through `Adapter` with `adapter.PermissionDeclaration`. Use `Admin` for Core Admin routes. Assert empty sends and Outcomes when an ordinary user is rejected.

Share event payload types with the Adapter. For example, define `Notice` in the plugin package and call `registerNotice(p)` in `New()`. This also needs `sdk` and `sdk/adapter` imports:

```go
type Notice struct { Text string `json:"text"` }
var notice = sdk.AdapterEvent[Notice]("demo.notice", 1)

func registerNotice(p *sdk.Plugin) {
    p.On("notice", notice).Handle(func(c *sdk.Context, in *Notice) error {
        return c.Reply(in.Text)
    })
}
```

Select the platform and inject the event in the test:

```go
func TestNotice(t *testing.T) {
    h := plugintest.Start(t, plugintest.Plugin(New()),
        plugintest.Adapter("demo", adapter.Event[Notice]("demo.notice", 1)))
    alice := plugintest.User{ID: "alice"}
    result := h.Event(plugintest.Group("room"), alice, notice, Notice{Text: "Joined"})
    requireReply(t, result, "Joined")
}
```

Core validates `Event` payloads against the Adapter's declared schema. When changing Adapter IDs, also use the new platform prefix in user and chat identifiers.

`h.Background()` returns and clears sends and edits outside injection intervals in acceptance order, consuming each record once. It reads existing records. Control background work with your own channel and read after Send returns. A normal handler's Context expires on return; end background resources in `OnStop`. For lifecycle and synchronization code, see the [background sending example in Development](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#插件测试).

## Verify a real platform

Use this harness for everyday changes to commands, configuration, databases, interactions and services: replies are repeatable assertions, and data and ports are isolated. Verify physical platform API splitting, network send/receive and component process reload through [Quick Start](../guide/quick-start.md) and the relevant [Adapter](../adapters/index.md) runtime steps.

Full examples: [plugintest tests](https://github.com/AlonaBot/AlonaBot/blob/main/plugintest/plugintest_test.go), [LLM tests](https://github.com/AlonaBot/AlonaBot/blob/main/plugintest/llm_test.go). Source: [CONTRACTS §17](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#17-插件测试套件).
