---
title: 快速上手
description: 安装 CLI，创建插件，在终端里和它对话。
---

这一页用 0.4.0 创建一个能回复 `/hello` 的插件，在终端里直接和它对话，无需注册平台账号。

## 1. 安装

需要先装好 [Go](https://go.dev/dl/) 1.27.1 或更高版本，然后安装 `alonabot` 命令：

```sh
go install github.com/AlonaBot/AlonaBot/cmd/alonabot@v0.4.0
```

确认装好了：

```sh
alonabot --help
```

提示找不到命令时，把 `go env GOPATH` 输出的目录下的 `bin` 加进 `PATH`。

接入平台与管理界面，见[安装](usage/install.md)。

## 2. 创建插件

```sh
alonabot init alonabot-plugin-hello
cd alonabot-plugin-hello
```

目录名就是插件的 ID。生成的工程里已经有一个 `/hello` 命令：

```go title="plugin.go"
package plugin

import "github.com/AlonaBot/AlonaBot/sdk"

func New() *sdk.Plugin {
	p := sdk.NewPlugin()
	p.Command("hello").Description("Show a greeting").Menu().Handle(func(c *sdk.Context) error {
		return c.Reply("Hello AlonaBot")
	})
	return p
}
```

## 3. 热开发运行

```sh
alonabot run --reload
```

开发时推荐使用 `--reload`：保存代码后，CLI 会自动重新编译并重启插件。

Core 启动后出现 `> ` 提示符，直接输入消息：

```text
> /hello
Hello AlonaBot
```

这就是你的插件在回复。保持进程运行，继续修改代码；结束开发时按 Ctrl-C 退出。

## 4. 改一改

保持 `alonabot run --reload` 运行，把 `plugin.go` 里的 Handler 改成：

```go
	p.Command("hello").Description("Show a greeting").Handle(func(c *sdk.Context) error {
		return c.Reply("Hello from my first plugin!")
	})
```

保存后插件自动重新编译并重启，再输入一次：

```text
> /hello
Hello from my first plugin!
```

代码写错时，终端会显示编译器的报错，旧版本的插件继续运行，改对之后自动换上新版本。

## 接下来

- [教程](tutorial/project.md)从这个工程出发，做一个待办清单插件，依次讲命令参数、回复、配置、存数据、多轮对话和测试。
- 想马上接到真实平台，看[接入 Telegram](platforms/development.md)。
