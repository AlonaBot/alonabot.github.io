---
title: 命令与参数
description: 登记命令，接收参数，设置别名、分组和谁能用。
---

这一页给待办清单加上 `/todo add` 和 `/todo list` 两个命令。数据先不保存，[存储](storage.md)一页再接上数据库。

## 带参数的命令

```go title="plugin.go"
package plugin

import "github.com/AlonaBot/AlonaBot/sdk"

func New() *sdk.Plugin {
	p := sdk.NewPlugin()

	todo := p.Group("todo")
	todo.Command("add").Description("Add a to-do item").RawTail().
		Handle(func(c *sdk.Context, text string) error {
			return c.Reply("Added: " + text)
		})
	todo.Command("list").Description("List to-do items").
		Handle(func(c *sdk.Context) error {
			return c.Reply("Nothing to do.")
		})

	return p
}
```

```text
> /todo add buy milk
Added: buy milk
> /todo list
Nothing to do.
```

这里用到了三样东西：

- **`p.Group("todo")`** 建立一个命令组，组里的 `add` 就是 `/todo add`。
- **Handler 的参数就是命令的参数。** 第一个参数固定是 `*sdk.Context`，后面写什么类型，用户就要输入什么。`text string` 表示接收一段文字。
- **`RawTail()`** 表示最后一个参数接收剩下的全部原文。不加的话，`/todo add buy milk` 里的 `buy` 和 `milk` 会被当成两个参数。

用户少写了参数时，Core 会自动回复这个命令的用法，Handler 不会被调用。

## 参数类型

| Handler 里写 | 用户输入 |
| --- | --- |
| `string` | 一段文字 |
| `int`、`int64`、`float64`、`bool` | 数字或 true/false，类型不对时回复用法 |
| `sdk.UserID` | 提及某个用户（@某人） |
| `*message.ImageSegment` | 一张图片 |
| `message.Chain` | 任意内容，包括图片和文字混排 |

多个参数按顺序写：

```go
	todo.Command("done").Description("Mark an item as done").
		Handle(func(c *sdk.Context, number int) error {
			return c.Reply(fmt.Sprintf("Item %d done.", number))
		})
```

```text
> /todo done 2
Item 2 done.
```

## 可选参数和默认值

参数有默认值，或者有的可以不填时，把参数写成一个结构体：

```go
type ListArgs struct {
	Page int `arg:"page" default:"1"`
}

func list(c *sdk.Context, args ListArgs) error {
	return c.Reply(fmt.Sprintf("Page %d", args.Page))
}
```

在 `New` 里登记 `todo.Command("list").Handle(list)`：

```text
> /todo list
Page 1
> /todo list 3
Page 3
```

结构体的规则：

- 字段按顺序对应参数，`arg` 标签是参数的名字，显示在用法里。
- `default` 是不填时的值。
- 指针类型的字段（如 `*int`）表示可选，不填时是 `nil`。
- 最后一个字段要接收剩余原文时写 `arg:"text,raw"`。

## 别名

```go
	todo.Command("add").Alias("remember").RawTail().Handle(add)
```

别名写完整的命令，上面这样 `/remember buy milk` 和 `/todo add buy milk` 效果相同。

## 谁能用

命令缺省所有用户都能用。用 `Permission` 限制：

```go
	todo.Command("clear").Permission(sdk.Admin).Handle(clear)
```

| 写法 | 谁能用 |
| --- | --- |
| `sdk.User` | 所有用户（缺省） |
| `sdk.Admin` | 机器人管理员 |
| `sdk.ChatAdmin` | 当前群的管理员 |
| `sdk.Admin.Or(sdk.ChatAdmin)` | 两者之一 |

没有权限的用户发这个命令，Handler 不会被调用。在终端对话里你是机器人管理员。更多写法见[权限与规则](../advanced/permissions.md)。

## 命令说明

`Description` 里的文字会出现在 `/help` 的命令列表里，用英文写。要显示中文，在 `i18n/zh-CN.json` 里按命令写翻译：

```json title="i18n/zh-CN.json"
{
  "commands": {
    "todo add": { "description": "添加一条待办" },
    "todo list": { "description": "列出待办" }
  }
}
```

## 显示在平台菜单

根命令使用 `.Menu()` 显式加入自动菜单，例如 `p.Command("todo").Menu().Description("Manage to-do items").Handle(help)`；子命令继续通过文本或 help 调用。Telegram 按账号、聊天和语言筛选，见[分域菜单](../usage/telegram.md#command-menus)。

下一页：[回复消息](messages.md)。
