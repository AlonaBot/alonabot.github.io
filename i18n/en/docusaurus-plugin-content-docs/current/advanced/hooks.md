---
title: Lifecycle and hooks
description: Manage resources and intercept events or sends.
---

## Lifecycle callbacks

Register callbacks in New:

```go
func New() *sdk.Plugin {
	p := sdk.NewPlugin()

	var client *http.Client

	p.OnStart(func(ctx context.Context) error {
		client = &http.Client{Timeout: 10 * time.Second}
		return nil
	})

	p.OnStop(func(ctx context.Context) error {
		client.CloseIdleConnections()
		return nil
	})

	p.Command("fetch").Handle(func(c *sdk.Context) error {
		return c.Reply("ok")
	})

	return p
}
```

This fragment needs `context`, `net/http`, `time` and `sdk`.

| Callback | When | Purpose |
| --- | --- | --- |
| OnStart | After config and DB preparation | Open resources and validate startup |
| OnReady | Immediately before readiness | Start background work |
| OnStop | During shutdown | Cancel workers and close resources |

Each callback can be registered once. OnStart failure aborts preparation. Sending and PluginDataDir require Session readiness, which follows OnReady. Managed databases have framework-owned lifetimes.

## Background work

```go
	var stop context.CancelFunc
	var done chan struct{}

	p.OnReady(func(ctx context.Context) error {
		var bg context.Context
		bg, stop = context.WithCancel(context.WithoutCancel(ctx))
		done = make(chan struct{})
		go func() {
			defer close(done)
			watch(bg)
		}()
		return nil
	})

	p.OnStop(func(ctx context.Context) error {
		stop()
		<-done
		return nil
	})
```

Derive the worker context from OnReady with WithoutCancel to retain Session identity. OnStop owns cancellation and waits for completion; the process has a finite stop budget. Supply your own `watch` function.

Send with an explicit target:

```go
err := sdk.SendText(bg, session, "Something happened.")
```

## PreEvent

This hook runs before ordinary handlers and can alter or stop delivery:

```go
	p.PreEvent(sdk.MessageCreated).
		Handle(func(c *sdk.Context, e *message.CreatedPayload) (*message.CreatedPayload, error) {
			if strings.Contains(e.Chain.Text(), "spam") {
				c.StopPropagation()
			}
			return nil, nil
		})
```

Import `strings` and `sdk/message`. Nil leaves the payload unchanged; StopPropagation stops later event handlers.

## BeforeSend

```go
	p.BeforeSend().
		Handle(func(c *sdk.Context, to string, m message.Chain) (message.Chain, error) {
			return append(m, message.Text("\n— sent by todo bot")), nil
		})
```

BeforeSend observes the current plugin's outgoing chain, including Core's reply decoration.

## AfterSend

```go
	p.AfterSend().
		Handle(func(c *sdk.Context, to string, res *message.SendResult, sendErr error) error {
			if sendErr != nil {
				c.Logger().Warn("send failed", "to", to, "error", sendErr)
			}
			return nil
		})
```

Preserve the send error when your own handler needs to report failure. An AfterSend callback can inspect the receipt and error for diagnostics.

## Ordering

```go
p.PreEvent(sdk.MessageCreated).Priority(-100).Handle(filter)
```

Lower Priority runs first; the default is zero. Keep hooks short because their work delays the event or send path.
