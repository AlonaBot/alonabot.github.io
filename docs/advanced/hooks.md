---
title: 生命周期与 Hook
description: 在插件启动和停止时做事，在消息处理前后插入逻辑。
---

## 生命周期回调

插件启动、停止时要做的事，登记在这三个回调里：

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
		// 这里可以使用 client
		return c.Reply("ok")
	})

	return p
}
```

| 回调 | 什么时候执行 | 用来做什么 |
| --- | --- | --- |
| `OnStart` | 配置和数据库准备好之后，开始接收消息之前 | 建立连接、加载数据、检查配置 |
| `OnReady` | 即将开始接收消息时 | 启动后台协程 |
| `OnStop` | 停止之前 | 关闭连接、结束后台协程 |

- `OnStart` 返回错误时插件启动失败，错误会显示在日志和管理界面里。配置不对时在这里报错，比运行到一半才出错好。
- 每种回调只能登记一次。
- `OnStart` 和 `OnReady` 里**不能发消息**，此时插件还没有准备好。启动后要发通知的话，用[定时任务](schedule.md)或在后台协程里发。
- 数据库由框架打开和关闭，不用在这里处理。

### 后台协程

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

后台协程必须在 `OnStop` 里结束。停止有时间限制，超时后插件进程会被强制结束。

后台协程里没有 `c`，发消息用包级函数：

```go
err := sdk.SendText(bg, session, "Something happened.")
```

## 消息 Hook

Hook 让插件在**所有**消息的处理流程里插一脚，包括其他插件的消息。适合做全局的事情：过滤、统计、统一改写。

### 处理之前：PreEvent

在任何 Handler 之前执行，可以修改消息内容，或者拦下来不让处理：

```go
	p.PreEvent(sdk.MessageCreated).
		Handle(func(c *sdk.Context, e *message.CreatedPayload) (*message.CreatedPayload, error) {
			if strings.Contains(e.Chain.Text(), "spam") {
				c.StopPropagation()
			}
			return nil, nil
		})
```

返回 `nil` 表示不修改。调用 `c.StopPropagation()` 后，这条消息不再交给任何 Handler。

### 发送之前：BeforeSend

在本插件每次发消息之前执行，可以改写要发的内容：

```go
	p.BeforeSend().
		Handle(func(c *sdk.Context, to string, m message.Chain) (message.Chain, error) {
			return append(m, message.Text("\n— sent by todo bot")), nil
		})
```

### 发送之后：AfterSend

```go
	p.AfterSend().
		Handle(func(c *sdk.Context, to string, res *message.SendResult, sendErr error) error {
			if sendErr != nil {
				c.Logger().Warn("send failed", "to", to, "error", sendErr)
			}
			return nil
		})
```

### 顺序

多个 Hook 按 `Priority` 从小到大执行，缺省是 0：

```go
p.PreEvent(sdk.MessageCreated).Priority(-100).Handle(filter)
```

Hook 会拖慢每一条消息的处理，里面不要做耗时的事。
