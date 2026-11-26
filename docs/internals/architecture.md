---
title: 架构
description: Core 和各组件怎么配合，数据放在哪里。
---

这一页说明 Core 与各组件如何配合，以及排查问题时该看哪些数据。

import ArchitectureDiagram from "@site/static/img/diagrams/architecture.svg";
import MessageJourney from "@site/src/components/MessageJourney";

## 一个 Core，多个组件

<div className="doc-diagram-scroll"><ArchitectureDiagram className="doc-diagram" /></div>

- **Core 负责消息路由。** 所有消息都经过它。
- **Native 组件缺省以独立进程运行**，由 Core 启动；组件之间的调用经过 Core。同进程用法见下文。
- **WebUI 提供管理页面与可选的后台进程**，由 Core 提供，通过 Core 的管理接口工作。

## 为什么每个插件一个进程

- **互不影响。** 一个插件崩溃，其他插件和 Core 照常运行，Core 会自动重启它。
- **依赖隔离。** 两个插件可以用同一个库的不同版本。
- **可以单独更新。** 更新一个插件时，其他插件不用停。
- **按进程排查故障。** 分别查看各插件的内存占用和错误。

## 一条消息的经过

用户在 Telegram 里发了 `/todo add buy milk`：

<MessageJourney />

点击步骤可跳到对应阶段，进度条可以拖动。每一步下方标出负责的主仓库包。

## 数据放在哪里

数据目录（缺省 `data/`）里：

| 路径 | 内容 | 谁管 |
| --- | --- | --- |
| `core_config.json` | Core 的设置 | 你和 Core |
| `state.sqlite` | 装了哪些组件、各自的版本、权限设置等 | Core |
| `core.lock` | 保证同一个数据目录只运行一个 Core | Core |
| `plugins/<ID>/` | 插件配置与受管数据库 | 插件（数据库由框架代管） |
| `plugin_data/<ID>/` | 插件自管文件 | 插件 |
| `logs/` | 日志文件 | Core |

插件的数据库虽然由框架创建和备份，但里面的内容只有这个插件自己读写。Core 和其他插件不碰。

## 安全边界

- **插件是受信任的代码。** 它是普通的程序，和 Core 用同一个系统用户运行，能做这个用户能做的任何事。进程隔离用于减少故障影响。请只安装信任的插件。
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
