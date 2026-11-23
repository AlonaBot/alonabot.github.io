---
title: 工程结构
description: 插件工程里每个文件的作用，以及 New 函数怎么写。
---

教程会做一个待办清单插件：`/todo add 买牛奶` 记一条，`/todo list` 列出来。这一页先创建工程，认识里面的文件。

## 创建工程

```sh
alonabot init alonabot-plugin-todo
cd alonabot-plugin-todo
```

工程 `alonabot-plugin-todo/` 包含：

| 路径 | 用途 |
| --- | --- |
| `plugin.go` | 插件代码 |
| `plugin.yaml` | 插件的名字、版本等信息 |
| `plugin_config_schema.json` | 配置项声明 |
| `i18n/en-US.json` | 给用户看的文字 |
| `go.mod` | Go module 与依赖 |
| `.gitignore` | 忽略 `data/` 和 `bin/` |

运行时产生的数据放在 `data/`，构建产物放在 `bin/`，两者都不用提交。

## plugin.yaml

```yaml title="plugin.yaml"
id: alonabot-plugin-todo
name: alonabot-plugin-todo
version: 0.3.0
source: github.com/CHANGE-ME/CHANGE-ME
role: plugin
```

| 字段 | 含义 |
| --- | --- |
| `id` | 插件的唯一标识，缺省取目录名。准备公开发布的插件用 `alonabot-plugin-` 开头 |
| `name` | 显示在管理界面里的名字，可以改成「待办清单」 |
| `version` | 版本号 |
| `source` | 插件的代码仓库，发布前改成你自己的 |
| `role` | 组件类型，插件是 `plugin` |

## New 函数

把 `plugin.go` 改成下面这样：

```go title="plugin.go"
package plugin

import "github.com/AlonaBot/AlonaBot/sdk"

func New() *sdk.Plugin {
	p := sdk.NewPlugin()
	p.Command("todo").Description("Show how to use the to-do list").Handle(func(c *sdk.Context) error {
		return c.Reply("Try /todo add <text> or /todo list")
	})
	return p
}
```

插件只需要导出一个 `New` 函数：创建插件对象 `p`，在上面注册命令，然后返回。CLI 生成运行入口。

注册约定：

- **所有注册都写在 `New` 里。** 插件启动之后不能再增加命令。
- **每次调用 `New` 都返回一个新对象。** 不要把状态放在包级变量里，否则测试之间会互相影响。

## 运行

```sh
alonabot run
```

```text
> /todo
Try /todo add <text> or /todo list
```

`alonabot run` 在工程目录里不带参数时，会编译并运行当前目录的插件，并且打开终端对话。修改代码后自动重新加载，后面的章节都在这个终端里试。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `alonabot run` | 运行并打开终端对话 |
| `alonabot check` | 只检查，不运行：配置、翻译、Handler 的写法有没有问题 |
| `alonabot build` | 编译到 `bin/` |
| `go test ./...` | 运行测试，见[测试](testing.md) |

完整参数见 [CLI 参考](../reference/cli.md)。下一页：[命令与参数](commands.md)。
