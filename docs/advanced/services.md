---
title: 插件之间协作
description: 一个插件调用另一个插件的功能，或者广播通知。
---

每个插件是独立的程序，不能直接调用对方的函数。协作有两种方式：

| 方式 | 适合 | 特点 |
| --- | --- | --- |
| 服务 | 需要对方返回结果 | 一问一答，对方没在运行时调用失败 |
| 广播 | 只是通知「发生了某事」 | 发出去就不管了，没人收到也不报错 |

## 服务

以「天气插件提供查询，待办插件调用它」为例。

### 声明

服务的声明放在一个单独的包里，提供方和调用方都导入它：

```go title="alonabot-plugin-weather/api/api.go"
package api

import "github.com/AlonaBot/AlonaBot/sdk/service"

type QueryIn struct {
	City string `json:"city"`
}

type QueryOut struct {
	Summary string `json:"summary"`
}

var Query = service.JSON[QueryIn, QueryOut]("alonabot-plugin-weather/query")
```

服务的名字是「提供方的插件 ID/服务名」。

### 提供

```go title="alonabot-plugin-weather/plugin.go"
package plugin

import (
	"example.com/alonabot-plugin-weather/api"

	"github.com/AlonaBot/AlonaBot/sdk"
	"github.com/AlonaBot/AlonaBot/sdk/service"
)

func New() *sdk.Plugin {
	p := sdk.NewPlugin()
	service.Serve(p, api.Query).Access(service.AccessPublic).
		Handle(func(c *sdk.Context, in api.QueryIn) (api.QueryOut, error) {
			return api.QueryOut{Summary: "Sunny in " + in.City}, nil
		})
	return p
}
```

### 调用

```go title="alonabot-plugin-todo/plugin.go"
import "example.com/alonabot-plugin-weather/api"

	p.Command("weather").Handle(func(c *sdk.Context, city string) error {
		out, err := api.Query.Call(c, api.QueryIn{City: city})
		if err != nil {
			return err
		}
		return c.Reply(out.Summary)
	})
```

```text
> /weather Tokyo
Sunny in Tokyo
```

### 谁能调用

| `Access(...)` | 谁能调用 |
| --- | --- |
| `service.AccessPrivate` | 只有本插件（缺省） |
| `service.AccessAllowlist, "插件ID", ...` | 列出的插件 |
| `service.AccessPublic` | 所有插件 |

提供方的 Handler 里，`c.User()` 仍然是最初发消息的那个用户，所以可以照常用 `.Permission(...)` 限制。`c.Caller()` 是调用方的插件 ID。

### 对方不在时

天气插件没安装或没启用时，`Call` 返回错误。待办插件应该能在没有它的情况下工作：

```go
	out, err := api.Query.Call(c, api.QueryIn{City: city})
	if errcode.Of(err) == errcode.Unavailable || errcode.Of(err) == errcode.NotFound {
		return c.Reply("Weather is not available.")
	}
```

## 广播

### 声明和发布

```go title="alonabot-plugin-todo/api/api.go"
package api

import "github.com/AlonaBot/AlonaBot/sdk/bus"

type ItemDone struct {
	User string `json:"user"`
	Text string `json:"text"`
}

var Done = bus.Define[ItemDone]("alonabot-plugin-todo/done")
```

```go title="alonabot-plugin-todo/plugin.go"
	_, err := api.Done.Publish(c, api.ItemDone{User: c.User(), Text: text})
```

插件只能发布以自己的 ID 开头的事件。

### 订阅

另一个插件里：

```go
import (
	"example.com/alonabot-plugin-todo/api"

	"github.com/AlonaBot/AlonaBot/sdk/bus"
)

	bus.Subscribe(p, api.Done).Handle(func(c *sdk.Context, e api.ItemDone) error {
		c.Logger().Info("item done", "user", e.User)
		return nil
	})
```

### 广播不保证送达

订阅方没在运行，或者一时处理不过来，这次广播就丢了，发布方不会知道。**不能丢的事情用服务。**

订阅的 Handler 不是由用户消息触发的，没有当前会话，`c.Reply` 用不了，要发消息用 `c.SendTo`。

## 让 AI 调用你的服务

给服务加上说明，[Agent](../usage/agent.md) 就可以在对话中调用它：

```go
import "github.com/AlonaBot/AlonaBot/sdk/tool"

	service.Serve(p, api.Query).Access(service.AccessPublic).
		Tool("Query the weather of a city", tool.DefaultAllow).Effect(tool.ReadOnly).
		Handle(query)
```

| 参数 | 含义 |
| --- | --- |
| 说明文字 | 告诉 AI 这个工具做什么，用英文写 |
| `tool.DefaultAllow` | AI 可以直接调用 |
| `tool.DefaultConfirm` | 调用前先问用户，用户点确认后才执行 |
| `.Effect(tool.ReadOnly)` | 只读数据。还有 `tool.Write`（会修改数据）和 `tool.Destructive`（会删除数据） |

会修改或删除数据的工具应该用 `DefaultConfirm`。这些是缺省值，机器人主人可以在管理界面里调整。

## 测试

把两个插件都装进同一个测试：

```go
h := plugintest.Start(t,
	plugintest.Plugin(weather.New()),
	plugintest.Plugin(todo.New()),
)
```
