---
title: Lifecycle and Hooks
description: Manage startup and shutdown, and intercept message handling and sending.
---

## Lifecycle callbacks

Use lifecycle callbacks to manage connections and background tasks:

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
		// Use client here
		return c.Reply("ok")
	})

	return p
}
```

| Callback | When | Purpose |
| --- | --- | --- |
| `OnStart` | After configuration and database preparation, before receiving messages | Establish connections, load data, validate configuration |
| `OnReady` | Just before receiving messages | Start background goroutines |
| `OnSleep` | During idle hibernation, before `OnStop` | Save state before sleeping |
| `OnStop` | Before stopping | Close connections and stop background goroutines |

- An error from `OnStart` fails startup and appears in logs and management. Validate configuration here to catch errors before handling messages.
- Register each callback once.
- Message sending becomes available after `OnStart` and `OnReady`. Send startup notifications through a [scheduled task](schedule.md) or a background goroutine after startup.
- The framework opens and closes the database.

### Background goroutines

```go
	var stop context.CancelFunc
	var done chan struct{}

	p.OnReady(func(ctx context.Context) error {
		var bg context.Context
		bg, stop = context.WithCancel(context.Background())
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

Stop background goroutines in `OnStop`. Shutdown has a deadline; the plugin process is terminated if it expires.

Background goroutines have no call context `c`. Use package-level functions to send:

```go
err := sdk.SendText(bg, session, "Something happened.")
```

## Message Hooks

Hooks run around message processing and sending, for filtering, metrics, and rewriting.

### Before processing: PreEvent

Runs before any Handler and can modify or stop a message:

```go
	p.PreEvent(sdk.MessageCreated).
		Handle(func(c *sdk.Context, e *message.CreatedPayload) (*message.CreatedPayload, error) {
			if strings.Contains(e.Chain.Text(), "spam") {
				c.StopPropagation()
			}
			return nil, nil
		})
```

Return `nil` to leave it unchanged. `c.StopPropagation()` prevents all Handlers from receiving the message.

### Before sending: BeforeSend

Runs before every message sent by this plugin and can rewrite its content:

```go
	p.BeforeSend().
		Handle(func(c *sdk.Context, to string, m message.Chain) (message.Chain, error) {
			return append(m, message.Text("\n— sent by todo bot")), nil
		})
```

### After sending: AfterSend

```go
	p.AfterSend().
		Handle(func(c *sdk.Context, to string, res *message.SendResult, sendErr error) error {
			if sendErr != nil {
				c.Logger().Warn("send failed", "to", to, "error", sendErr)
			}
			return nil
		})
```

### Ordering

Hooks run in ascending `Priority` order; the default is 0:

```go
p.PreEvent(sdk.MessageCreated).Priority(-100).Handle(filter)
```

Keep Hooks fast: they add work to every message.

## AI Hook

`sdk/agent/hook` provides Hooks for model and tool execution:

| Stage | Purpose |
| --- | --- |
| `BeforeRun`, `BeforeRequest` | Adjust runs and model input |
| `RewriteResponse`, `RewriteStream` | Rewrite complete responses or streaming deltas |
| `BeforeToolCall`, `AfterToolCall` | Adjust tool arguments and results |

Register on the plugin with a stable ID and use `Priority` for ordering within a stage. See [Calling models](llm.md) for generation entry points.
