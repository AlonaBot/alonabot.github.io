---
title: 定时任务
description: 按固定间隔或 cron 表达式运行，以及由用户创建的提醒。
---

定时任务分两种：写在代码里的固定任务，和运行时由用户创建的任务（比如提醒）。

## 固定任务

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

每小时执行一次。第一个参数是任务的名字，在插件里不能重复。

按时刻执行用 cron 表达式（分 时 日 月 周）：

```go
	p.Cron("morning", "0 9 * * *").Timezone("Asia/Shanghai").Handle(morning)
```

每天早上 9 点执行。不写 `Timezone` 时按 UTC 计算。

### 定时任务里发消息

定时任务不是由某条消息触发的，所以没有「当前会话」，`c.Reply` 用不了。要用 `c.SendTo` 指明发到哪里：

```go
func morning(c *sdk.Context) error {
	session := c.Config().String("notify_session")
	_, err := c.SendTo(session, message.Text("Good morning!"))
	return err
}
```

会话的标识可以用 `c.Session()` 在某次命令里取到并保存下来，或者做成配置项让机器人主人填。

### 规则

- 一次任务最多运行 15 分钟。
- 上一次还没跑完时，下一次会被跳过，不会同时跑两个。
- 机器人没在运行时错过的任务不会补跑。

## 用户创建的任务

提醒这类功能，时间和内容由用户决定。先声明任务的参数，再注册处理函数：

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

	// 到时间后执行
	task.On(p, remind).Handle(func(c *sdk.Context, r Reminder) error {
		_, err := c.SendTo(r.Session, message.Text("Reminder: "+r.Text), sdk.Via(r.Instance))
		return err
	})

	// 用户创建提醒
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

十分钟后：

```text
Reminder: take a break
```

`Reminder` 里保存了会话和机器人账号（`c.Instance()`），到时间后用它们把消息发回原处。`sdk.Via` 指定用哪个机器人账号发。任务保存在 Core 里，重启后仍然有效。

| 方法 | 作用 |
| --- | --- |
| `remind.At(c, 时刻, 参数)` | 在某个时刻执行一次 |
| `remind.Every(c, 间隔, 参数)` | 每隔一段时间执行 |
| `remind.Cron(c, 表达式, 参数)` | 按 cron 表达式执行 |
| `remind.List(c)` | 列出已创建的任务 |
| `remind.Cancel(c, key)` | 取消 |

三个创建方法都返回一个 `key`，是这个任务的标识，取消时要用。想自己指定标识，加 `task.Key("...")`；用同一个标识再创建一次会替换原来的任务：

```go
key := "daily:" + c.User()
_, err := remind.Cron(c, "0 9 * * *", r, task.Key(key), task.Timezone("Asia/Shanghai"))
```

让用户自己起名字时，把用户标识拼进去，避免不同用户互相覆盖。

## 暂停固定任务

```go
err := task.Pause(c, "cleanup")
err = task.Resume(c, "cleanup")
state, err := task.Status(c, "cleanup")  // state.Paused、state.NextAt
```

暂停状态在重启后保留。

暂停状态在重启后保留，重复暂停或恢复也会成功；暂停时 `state.NextAt` 为 nil，`state.LastAt` 是本次 Core 运行中最后一次执行的时间。没注册过的任务名返回 `NOT_FOUND`。

## 任务的规则

- 任务的 key 最长 128 字节，包括你拼进去的用户和会话标识。
- `task.Timezone` 只能和 `Cron` 一起用，用在 `At`、`Every` 上返回 `INVALID_ARGUMENT`。
- 用同一个 key 再创建会替换规则和参数，正在执行的那一轮继续执行完；`Cancel` 会删除任务，并通知正在执行的那一轮停止。
- 插件离线、未启动或暂停期间错过的触发直接作废，不补执行；过期的一次性任务会被删除。
- 任务函数在插件就绪后才能调用，在 `OnStart`、`OnReady` 里调用返回 `FAILED_PRECONDITION`。在 Handler 里传 `c`。
- 任务回调没有用户和默认会话，需要的会话、账号写进参数里。参数类型和服务一样，要用包级具名类型。

## 测试

测试里不用等时间到，直接触发：

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

用户创建的任务用 `h.TriggerTask(p, "remind", key)`，`key` 是创建时返回的标识。
