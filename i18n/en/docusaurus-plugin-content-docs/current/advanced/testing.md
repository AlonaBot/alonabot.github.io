---
title: Advanced testing
description: Simulated platform responses, Adapter call records, multiple accounts in parallel, a controllable clock, and testing a running Core.
---

[Testing](../tutorial/testing.md) covers common scenarios. This page covers `plugintest` features for precise control over the platform and time.

## Simulate platform responses

`plugintest.Operations` sets how the test Adapter responds to sends, edits, platform actions, deletions, forwarded-message reads and command menus:

```go
behavior := plugintest.Behavior{
	Send: func(ctx context.Context, call plugintest.Call) (*message.SendResult, *errcode.Error) {
		return call.SendResult, errcode.Unavailable.New("platform accepted the message with a warning")
	},
}
h := plugintest.Start(t, plugintest.Plugin(New()), plugintest.Operations(behavior))
```

`call.SendResult` is the default success receipt; change it to partial success, failure or unknown before returning. With several accounts, put each in `InstanceConfig.Behavior`. Declared platform actions without a callback return `UNSUPPORTED`.

## Inspect calls the Adapter received

`h.Calls()` returns every completed Adapter operation and `h.WaitCalls(ctx, n)` waits for n of them. Each record has the operation, account, target, parameters, actual result and error. Calls produced by one injection are also in `result.Calls`.

## Failures before the Handler runs

Argument parsing failures and permission denials happen before the Handler is called, so they are recorded in `result.Diagnostics`, not `result.Outcomes`:

```go
result := h.Text(chat, alice, "/echo")
result.RequireReply(t, "Usage: /echo <text>")
d := result.Diagnostics[0]
if d.Phase != plugintest.PhaseArguments || errcode.Of(d.Err) != errcode.InvalidArgument {
	t.Fatalf("diagnostic = %+v", d)
}
```

`Phase` is `plugintest.PhaseArguments` (arguments) or `plugintest.PhaseAdmission` (permissions, lifecycle and other admission). `Outcomes` records only Handlers that actually ran.

## Images and files

Prepare a platform file with `h.Fixture` and inject a message referencing it; `result.Sends[i].Media` holds the bytes the Adapter actually fetched, ready to compare:

```go
source := h.Fixture(plugintest.InstanceID, "pixel", plugintest.Media{Data: pngBytes, MIME: "image/png"})
result := h.Message(plugintest.Private(alice.ID), alice,
	message.Chain{message.Text("copy"), message.File(source, "input.png")})
sent := result.Sends[0]
// sent.Media holds what the Adapter actually fetched, in chain order: Data, MIME, Filename
```

## Multiple accounts and parallel injection

```go
h := plugintest.Start(t, plugintest.Plugin(p),
	plugintest.Instance(plugintest.InstanceConfig{AdapterID: "first", InstanceID: "one", AccountID: "bot1"}),
	plugintest.Instance(plugintest.InstanceConfig{AdapterID: "first", InstanceID: "two", AccountID: "bot2"}),
	plugintest.DefaultInstance("first", "one"),
	plugintest.AllowedInstances(p, "one"))
first := h.Submit(plugintest.Private("alice").OnInstance("one"), alice, message.Text("/ping"))
second := h.Submit(plugintest.Private("bob").OnInstance("two"), bob, message.Text("/ping"))
for _, pending := range []*plugintest.Pending{first, second} {
	result, err := pending.Wait(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	result.RequireReply(t, "pong")
}
```

- Accounts listed with `plugintest.Instance` replace the default test account; `OnInstance` picks the receiving account and `DefaultInstance` picks the account for proactive sends.
- `AllowedInstances(p, ...)` limits which accounts the plugin may send proactively from, and `AdminOn(platform, user)` sets platform administrators.
- `h.Text` and `h.Message` wait for processing to finish; to inject in parallel, use `h.Submit` and `Wait` on each.

## Background sends

Read sends that belong to no injection (background goroutines, scheduled tasks) with `h.Background()`, or wait for n of them with `h.WaitBackground(ctx, n)`. Each record is returned once.

## A controllable clock

```go
clock := plugintest.NewClock(time.Date(2040, 1, 1, 0, 0, 0, 0, time.UTC))
t.Cleanup(clock.Close)
h := plugintest.Start(t, plugintest.Plugin(p), plugintest.WithClock(clock))
clock.Advance(time.Minute)
records, err := h.WaitBackground(t.Context(), 1)
```

Scheduled tasks, `task.At/Every`, continuation deadlines and `c.Wait` all use this clock. Build absolute task times from `clock.Now()`.

## Test a running Core

`plugintest.Connect` connects to a running Core and injects messages on a real Adapter account, with results in the same shape as local tests:

```go
token, err := os.ReadFile("../data/admin_token")
if err != nil {
	t.Fatal(err)
}
client := &debug.Client{URL: "http://127.0.0.1:7650", Token: strings.TrimSpace(string(token))}
conn, err := plugintest.Connect(context.Background(), client,
	plugintest.InstanceConfig{AdapterID: "telegram", InstanceID: "main", AccountID: "123456"})
if err != nil {
	t.Fatal(err)
}
defer conn.Close()
result, err := conn.Text(t.Context(), plugintest.Private("987654"), plugintest.User{ID: "987654"}, "/ping")
```

Injected messages go through normal command matching and permission checks, and replies really reach the platform. `conn.Client` can also list and call the Adapter's platform actions.
