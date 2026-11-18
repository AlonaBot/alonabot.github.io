---
title: 架构
description: Core 和各组件怎么配合，数据放在哪里。
---

写插件不需要了解这一页。想知道框架为什么这样设计、出问题时该看哪里，可以读一读。

## 一个 Core，多个进程

```text
     Telegram、QQ 等平台
              │
          Adapter 进程
              │
   ┌───────── Core ─────────┐
   │ 找到该处理的插件          │
   │ 检查权限                 │
   │ 发送消息、管理媒体         │
   │ 定时任务                 │
   │ HTTP 入口                │
   │ 配置、安装与更新           │
   └──┬────────┬────────┬───┘
      │        │        │
   插件进程  插件进程  Agent 进程
```

- **Core 是唯一的中心。** 所有消息都经过它。
- **每个组件是一个独立的进程**，由 Core 启动。组件只和 Core 通信，组件之间不直接来往。
- **WebUI 是一组静态网页**，由 Core 提供，通过 Core 的管理接口工作。

## 为什么每个插件一个进程

- **互不影响。** 一个插件崩溃，其他插件和 Core 照常运行，Core 会自动重启它。
- **依赖各管各的。** 两个插件可以用同一个库的不同版本。
- **可以单独更新。** 更新一个插件时，其他插件不用停。
- **问题好定位。** 哪个进程占了多少内存、哪个在出错，一目了然。

代价是每个进程有固定的内存开销，以及进程之间通信比函数调用慢。对聊天机器人来说，这点延迟远小于网络延迟。

## 一条消息的经过

用户在 Telegram 里发了 `/todo add buy milk`：

1. Telegram Adapter 收到，转成统一的格式，交给 Core。
2. Core 让登记了 Hook 的插件先看一遍。
3. Core 发现这是命令 `todo add`，找到登记它的插件。
4. Core 检查这个用户有没有权限。
5. Core 把调用发给插件进程，插件的 Handler 执行。
6. Handler 调用 `c.Reply`，这个请求回到 Core。
7. Core 检查后交给 Telegram Adapter，Adapter 调用 Telegram 的接口发出去。

权限检查在 Core 里完成。插件告诉 Core「我是替这个用户发的」，Core 不会直接相信，它用的是自己记录的信息。

## 数据放在哪里

数据目录（缺省 `data/`）里：

| 路径 | 内容 | 谁管 |
| --- | --- | --- |
| `core_config.json` | Core 的设置 | 你和 Core |
| `state.sqlite` | 装了哪些组件、各自的版本、权限设置等 | Core |
| `core.lock` | 保证同一个数据目录只运行一个 Core | Core |
| `plugins/<ID>/` | 这个插件的配置、数据库、文件 | 插件（数据库由框架代管） |
| `logs/` | 日志文件 | Core |

插件的数据库虽然由框架创建和备份，但里面的内容只有这个插件自己读写。Core 和其他插件不碰。

## 安全边界

- **插件是受信任的代码。** 它是普通的程序，和 Core 用同一个系统用户运行，能做这个用户能做的任何事。进程隔离防的是 bug，不是恶意。所以只安装信任的插件。
- **插件的网页是不受信任的。** 插件页面在浏览器的沙箱里显示，拿不到管理界面的登录信息。
- **平台用户是不受信任的。** 谁是管理员由 Core 根据平台确认的身份判断。

## 同进程模式

除了上面的多进程方式，Core 和组件也可以放在同一个 Go 程序里运行。[`plugintest`](../tutorial/testing.md) 就是这样工作的，所以测试启动很快。终端对话用的那个 Adapter 也是这样装进 `alonabot` 里的。

你也可以在自己的 `main.go` 里这样做，把机器人嵌入别的程序：

```go
import (
	"github.com/AlonaBot/AlonaBot"
	todo "example.com/alonabot-plugin-todo"
)

func main() {
	if err := alonabot.Run(
		alonabot.DataDir("./data"),
		alonabot.Plugin(todo.New()),
	); err != nil {
		log.Fatal(err)
	}
}
```

这样的程序要用 `alonabot build` 编译，直接 `go build` 出来的缺少配置声明和语言文件，启动时会提示。

同进程模式下一个插件崩溃会带着整个程序退出，也没有自动重新加载，所以只适合测试、调试和嵌入。
