---
title: 命令与参数
description: 注册命令，绑定参数，设置别名、分组和权限。
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

`p.Group("todo")` 创建命令组，组内的 `add` 和 `list` 对应 `/todo add`、`/todo list`。

## 参数绑定

SDK 根据 Handler 的函数签名生成参数声明。Core 按声明解析命令消息，SDK 再将解析结果传入 Handler。参数可以逐个写在函数签名中，也可以集中声明在结构体中。

### 按函数参数绑定

第一个参数 `*sdk.Context` 由 SDK 提供，包含当前调用的用户、会话和回复方法。后续参数按顺序绑定命令输入，类型决定解析方式：

| Go 类型 | 绑定内容 |
| --- | --- |
| `string` | 一个文本参数 |
| `int`、`int64`、`float64`、`bool` | 对应类型的数值或布尔值 |
| `sdk.UserID` | 用户提及（@某人） |
| `*message.ImageSegment` | 图片消息段 |
| `message.Chain` | 剩余消息链，可包含图片和文字 |

例如，`number int` 将命令后的数字绑定到 `number`：

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

前面的 `add` 使用 `.RawTail()`，将命令后的 `buy milk` 作为完整字符串绑定到 `text`。普通文本参数按空白分隔；`.RawTail()` 让最后一个参数接收剩余原文。

缺少必填参数或类型解析失败时，Core 回复命令用法，跳过 Handler。

### 绑定到结构体

结构体将参数声明集中在字段上，适合参数较多或需要通过标签描述名称、默认值和原文绑定的命令。SDK 按字段顺序填入解析结果，Handler 接收整个结构体：

```go
type ListArgs struct {
	Page int `arg:"page" default:"1"`
}

func list(c *sdk.Context, args ListArgs) error {
	return c.Reply(fmt.Sprintf("Page %d", args.Page))
}
```

在 `New` 里注册 `todo.Command("list").Handle(list)`。`Page` 的类型是 `int`，`arg:"page"` 指定用法中的参数名，`default:"1"` 指定省略时的值：

```text
> /todo list
Page 1
> /todo list 3
Page 3
```

| 字段声明 | 绑定方式 |
| --- | --- |
| `Page int` | 必填整数；参数名默认从字段名推导为 `page` |
| `Page int` 带 `arg:"page" default:"1"` | 省略时使用 `1` |
| `Page *int` 带 `arg:"page"` | 可选整数；省略时为 `nil` |
| `Text string` 带 `arg:"text,raw"` | 末位字段接收剩余原文 |

字段需导出，并按输入顺序声明；指针字段与 `default` 标签分别表达可选值和默认值，选择一种即可。使用结构体时，Handler 在 `*sdk.Context` 之后只接收这一个结构体，名称、默认值和 raw 行为统一由字段声明。

## 别名

```go
	todo.Command("add").Alias("remember").RawTail().Handle(add)
```

别名写完整的命令，上面这样 `/remember buy milk` 和 `/todo add buy milk` 效果相同。

## 命令权限

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

## 平台命令菜单

给需要出现在聊天平台菜单中的根命令添加 `.Menu()`：

```go
p.Command("ping").Description("Check the bot").Menu().Handle(func(c *sdk.Context) error {
    return c.Reply("pong")
})
```

Core 根据账号配置同步菜单，菜单说明跟随语言文件翻译。

菜单只收录标了 `.Menu()` 的单个词的根命令，并按每个聊天的配置文件、插件开关、权限和 `/` 前缀筛选。命令名要符合 `^[a-z0-9_]{1,32}$`，说明 1～256 个字符。

### 自己管理菜单

想给不同聊天不同的菜单时，机器人主人把账号的 `auto_sync_commands` 设为 `false`，插件在收到 `sdk.CommandMenuReady` 后用 `sdk/command` 写入整份菜单：

```go
p.On(sdk.CommandMenuReady).Handle(func(c *sdk.Context, ready *message.CommandMenuReadyPayload) error {
	if ready.ChatID == "" {
		return nil
	}
	return command.Set(c, ready.AdapterInstanceID, command.Menu{
		Scope:    command.Scope{Type: "chat", ChatID: ready.ChatID},
		Commands: []command.Item{{Name: "hello", Description: "Say hello"}},
	})
})
```

`ChatID` 为空表示账号整体就绪，有值表示这个聊天可以设置。范围除了 `chat`，还有 `chat_administrators` 和带 `UserID` 的 `chat_member`。每份菜单最多 100 条；不同语言按 `LanguageCode` 分别设置，空串是缺省语言。

| 函数 | 作用 |
| --- | --- |
| `command.Set` | 写入一个位置的整份菜单 |
| `command.Get` | 读取平台上的当前菜单 |
| `command.Delete` | 删除一个位置的菜单 |
| `command.Status` | 查看模式、是否就绪和最近一次错误 |
| `command.Sync` | 重新同步；平台菜单被外部改乱或切换失败后用它修复 |

`clear_commands_on_disable`（缺省 `true`）决定从自动切到手动时是否先清空框架写入的菜单。

### 列出可用的命令

写帮助类插件时，用 `command.List(c)` 取当前会话里生效的命令：`entry.Path`、`entry.Aliases` 是命令名，`entry.Description` 是当前语言的说明。完整例子见[官方 help 插件](https://github.com/AlonaBot/alonabot-plugin-help/blob/main/help.go)。

下一页：[回复消息](messages.md)。
