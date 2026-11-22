---
title: Scheduled tasks
description: Run periodic work and user-created reminders.
---

## Static jobs

```go
import "time"

	p.Every("cleanup", time.Hour).Handle(func(c *sdk.Context) error {
		db, err := sqlitedb.Open(c)
		if err != nil {
			return err
		}
		_, err = db.ExecContext(c, "DELETE FROM todos WHERE body = ''")
		return err
	})
```

This hourly task removes blank to-do entries from the tutorial table. Import sdk/sqlitedb. Job IDs are unique in the plugin.

For a five-field cron expression (minute, hour, day, month, weekday):

```go
	p.Cron("morning", "0 9 * * *").Timezone("Asia/Shanghai").Handle(morning)
```

The default timezone is UTC.

## Send to a chat

```go
func morning(c *sdk.Context) error {
	session := c.Config().String("notify_session")
	_, err := c.SendTo(session, message.Text("Good morning!"))
	return err
}
```

Declare notify_session as a string setting and import sdk/message. A job has no inbound chat; use an explicit target saved from a command or entered in configuration.

Jobs have a default 15-minute budget. A running static job skips its next overlapping tick. Missed periodic ticks during Core downtime follow scheduler skip rules. Installed sleep-capable plugins wake when jobs become due; cold start consumes the original deadline. Expired one-time tasks are removed with a warning.

## User-created reminders

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
	task.On(p, remind).Handle(func(c *sdk.Context, r Reminder) error {
		_, err := c.SendTo(r.Session, message.Text("Reminder: "+r.Text), sdk.Via(r.Instance))
		return err
	})
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

Also import `time`, `sdk`, and `sdk/message`.

```text
> /remind take a break
I'll remind you in 10 minutes.
```

Ten minutes later:

```text
Reminder: take a break
```

The payload stores the original session and instance. Core persists dynamic tasks across restarts.

| Method | Purpose |
| --- | --- |
| At | Run once at a time |
| Every | Repeat at an interval |
| Cron | Repeat with a cron expression |
| List | List instances |
| Cancel | Cancel by key |

Creation methods return a key. An explicit task.Key replaces an existing task with that key:

```go
key := "daily:" + c.User()
_, err := remind.Cron(c, "0 9 * * *", r, task.Key(key), task.Timezone("Asia/Shanghai"))
```

Include user/chat identity in user-chosen names to avoid collisions.

## Pause a static job

```go
err := task.Pause(c, "cleanup")
err = task.Resume(c, "cleanup")
state, err := task.Status(c, "cleanup")  // state.Paused、state.NextAt
```

Pause state survives restarts.

## Testing

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

Use `h.TriggerTask(p, "remind", key)` for an existing dynamic instance. The key is the one returned by creation. Handler errors remain in Outcomes.
