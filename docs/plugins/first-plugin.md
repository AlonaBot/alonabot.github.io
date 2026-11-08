---
sidebar_position: 1
title: 插件入门
description: 用 sdk.Base 写一个能响应命令和事件的 Native Go 插件。
---

插件是一个普通的 Go `main` 包：定义一个嵌入 `sdk.Base` 的根类型，在注册方法里链式注册 Handler，最后调用 `sdk.Run`。

## 最小插件：回复命令

```go title="main.go"
package main

import (
	"log/slog"
	"os"

	"github.com/AlonaBot/AlonaBot/sdk"
	"github.com/AlonaBot/AlonaBot/sdk/message"
)

// Ping 是根插件，嵌入 sdk.Base 获得全部 Hook 的默认实现。
type Ping struct{ sdk.Base }

// Commands 注册 /ping 命令，返回的 Chain 由 Core 自动回复。
func (*Ping) Commands(r *sdk.CommandRegistry) {
	r.Command("ping").Handle(func(*sdk.Context) (message.Chain, error) {
		return message.Chain{message.Text("pong")}, nil
	})
}

func main() {
	if err := sdk.Run(&Ping{}); err != nil {
		slog.Error("plugin stopped with an error", "err", err)
		os.Exit(1)
	}
}
```

构建并用开发入口运行它：

```sh
go build -o bin/ping .
bin/alonabot run --data-dir ./data --plugin-id ping --entry bin/ping
```

## 两种 Handler

- **自动回复型**：返回 `(message.Chain, error)`。非空的 Chain 由 Core 在 Handler 返回后发送一次，排在这次调用的所有显式发送之后。
- **手动型**：只返回 `error`，在 Handler 里自己调用 `c.Send`。

两种都可以调用 `c.Send`。

## 命令分组与参数

```go
func (p *Demo) Commands(r *sdk.CommandRegistry) {
	g := r.Group("demo")
	g.Command("hello").Handle(p.Hello) // /demo hello
	g.Command("echo").Handle(p.Echo)   // /demo echo <text> <times>
}

// Echo 的参数按位置从命令文本绑定：/demo echo hi 3
func (p *Demo) Echo(c *sdk.Context, text string, times int64) error {
	for i := int64(0); i < times; i++ {
		if _, err := c.Send(message.Chain{message.Text(text)}); err != nil {
			return err
		}
	}
	return nil
}
```

Handler 参数还可以是 `sdk.UserID`、`*pb.ImageSegment` 与 `*pb.MessageChain`。命令派发按最长的完整路径或别名优先。

## 响应事件

不经命令、直接处理事件时，在 `Events` 中显式注册：

```go
func (*Echo) Events(r *sdk.EventRegistry) {
	r.On("echo", "message.created").Handle(func(c *sdk.Context) error {
		var chain message.Chain
		for _, s := range c.Event().GetEventPayload().GetMessageCreated().GetChain().GetSegments() {
			if t := s.GetText(); t != nil {
				chain = append(chain, message.Text(t.GetText()))
			}
		}
		if len(chain) == 0 {
			return nil
		}
		_, err := c.Send(chain)
		return err
	})
}
```

## 注册规则

- 命令、文本匹配、事件、Service 与 Event Bus 订阅**只在根插件的注册方法中链式注册**，以 `Handle` 结束。漏写 `Handle`、重复调用或在它之后继续调用，都会让 `Collect` 报错。
- 权限写成 `sdk.Permission`：`sdk.Anyone`、`sdk.User`、`sdk.Admin`、`sdk.ChatAdmin`、`sdk.PermissionName`，用 `Or` 取并集，例如 `Permission(sdk.Admin.Or(sdk.ChatAdmin))`。命令与文本匹配取最近一层的显式设置，都没有时要求 `user`。Handler 内用 `c.Has` 判断当前 Actor 的权限。
- 插件 ID 只来自 `plugin.yaml`。

## 生成注册代码

正式构建时，插件的注册代码由构建期生成器生成，不在运行时扫描磁盘。在插件入口目录执行：

```sh
alonabot plugin generate --dir ./myplugin   # 内容不变时不改文件
alonabot plugin check --dir ./myplugin      # 生成内容过期时以退出码 1 结束
```

两者按 `--goos`、`--goarch`、`--tags` 筛选源码，缺省取当前环境。源码问题逐行输出为 `文件:行:列: 说明`。

## 完整示例

仓库的 `examples/plugins/` 下有三个示例：

- [lifecycle](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/lifecycle/main.go)：可以真实运行的最小插件，每个 Hook 记一条日志。
- [echo](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/echo/main.go)：真实 Session 中的手动事件回复。
- [showcase](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/showcase/main.go)：SDK 全部公共签名的组合方式，包括配置回调、HTTP 与定时任务。SDK 尚不支持定时任务，直接运行它会返回 UNSUPPORTED。
