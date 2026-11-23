---
title: Scheduled tasks
description: Run interval and cron tasks, and create user reminders.
---

Scheduled tasks can be fixed in code or created at runtime by users, such as reminders.

## Fixed tasks

```go
import "time"

	p.Every("cleanup", time.Hour).Handle(func(c *sdk.Context) error {
		db, err := sqlitedb.Open(c)
		if err != nil {
			return err
		}
		_, err = db.ExecContext(c, "DELETE FROM todos WHERE done = 1")
		return err
	})
```

This runs hourly. The first argument is a task name, unique within the plugin.

Use cron for calendar times, with minute, hour, day, month, and weekday fields:

```go
	p.Cron("morning", "0 9 * * *").Timezone("Asia/Shanghai").Handle(morning)
```

This runs at 9 AM daily. The timezone defaults to UTC.

### Send from a scheduled task

Scheduled tasks have no current message session. Use `c.SendTo` to specify the destination:

```go
func morning(c *sdk.Context) error {
	session := c.Config().String("notify_session")
	_, err := c.SendTo(session, message.Text("Good morning!"))
	return err
}
```

Save a session identifier from `c.Session()` during a command, or let owners provide one in configuration.

### Execution behavior

- Each task can run for up to 15 minutes.
- A run is skipped if the previous run is still active.
- Runs missed while the bot was stopped are not replayed.

## User-created tasks

For reminders, users choose the time and content. Declare task arguments and register a Handler:

```go
import "github.com/AlonaBot/AlonaBot/sdk/task"

type Reminder struct {
	Session  string `json:"session"`
	Instance string `json:"instance"`
	Text     string `json:"text"`
}

var remind = task.Define[Reminder]("remind")

func New() *sdk.Plugin {
	p := sdk.NewPlugin()

	// Run when due
	task.On(p, remind).Handle(func(c *sdk.Context, r Reminder) error {
		_, err := c.SendTo(r.Session, message.Text("Reminder: "+r.Text), sdk.Via(r.Instance))
		return err
	})

	// Let the user create a reminder
	p.Command("remind").RawTail().Handle(func(c *sdk.Context, text string) error {
		_, err := remind.At(c, time.Now().Add(10*time.Minute), Reminder{
			Session:  c.Session(),
			Instance: c.Instance(),
			Text:     text,
		})
		if err != nil {
			return err
		}
		return c.Reply("I'll remind you in 10 minutes.")
	})

	return p
}
```

```text
> /remind take a break
I'll remind you in 10 minutes.
```

Ten minutes later:

```text
Reminder: take a break
```

`Reminder` stores the session and bot account (`c.Instance()`) to send back to the original destination. `sdk.Via` selects the account. Core persists tasks across restarts.

| Method | Action |
| --- | --- |
| `remind.At(c, time, args)` | Run once at a specific time |
| `remind.Every(c, interval, args)` | Repeat at an interval |
| `remind.Cron(c, expression, args)` | Run on a cron schedule |
| `remind.List(c)` | List created tasks |
| `remind.Cancel(c, key)` | Cancel a task |

All three creation methods return a task `key` for cancellation. Supply `task.Key("...")` to choose one. Creating a task with the same key replaces it:

```go
key := "daily:" + c.User()
_, err := remind.Cron(c, "0 9 * * *", r, task.Key(key), task.Timezone("Asia/Shanghai"))
```

Include the user identifier in user-selected names to avoid overwriting another user's task.

## Pause fixed tasks

```go
err := task.Pause(c, "cleanup")
err = task.Resume(c, "cleanup")
state, err := task.Status(c, "cleanup")  // state.Paused、state.NextAt
```

The paused state persists across restarts.

## Testing

Trigger tasks directly in tests without waiting:

```go
func TestCleanup(t *testing.T) {
	p := New()
	h := plugintest.Start(t, plugintest.Plugin(p))
	result := h.Trigger(p, "cleanup")
	for _, o := range result.Outcomes {
		if o.Err != nil {
			t.Fatal(o.Err)
		}
	}
}
```

For user-created tasks, use `h.TriggerTask(p, "remind", key)` with the key returned at creation.
