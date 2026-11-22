---
title: 拆分大插件
description: 用子插件把代码按功能分到多个包里。
---

命令多了以后，全写在一个 `New` 里不好维护。子插件让你按功能把代码分到不同的包，每个包管自己的命令和配置。

## 写法

在 `alonabot-plugin-todo/` 中按功能分包：

| 路径 | 用途 |
| --- | --- |
| `plugin.go` | 创建插件，登记子插件 |
| `items/items.go` | 待办的增删查 |
| `remind/remind.go` | 提醒 |

每个子包导出一个 `Register` 函数：

```go title="items/items.go"
package items

import "github.com/AlonaBot/AlonaBot/sdk"

func Register(s *sdk.SubPlugin) {
	todo := s.Group("todo")
	todo.Command("add").RawTail().Handle(add)
	todo.Command("list").Handle(list)
}

func add(c *sdk.Context, text string) error { return c.Reply("Added: " + text) }
func list(c *sdk.Context) error             { return c.Reply("Nothing to do.") }
```

在 `New` 里把它们接上：

```go title="plugin.go"
package plugin

import (
	"example.com/alonabot-plugin-todo/items"
	"example.com/alonabot-plugin-todo/remind"

	"github.com/AlonaBot/AlonaBot/sdk"
)

func New() *sdk.Plugin {
	p := sdk.NewPlugin()
	items.Register(p.Sub("items"))
	remind.Register(p.Sub("remind"))
	return p
}
```

`p.Sub("items")` 返回一个子插件，上面能用的登记方法和 `p` 一样：`Command`、`Group`、`On`、`Every` 等。

## 子插件的配置

子插件读取 `config_schema.json` 里和它同名的那一组配置：

```json title="config_schema.json"
{
  "items": {
    "type": "object",
    "items": {
      "limit": { "type": "int", "default": 20 }
    }
  },
  "remind": {
    "type": "object",
    "items": {
      "max_minutes": { "type": "int", "default": 1440 }
    }
  }
}
```

```go title="items/items.go"
func Register(s *sdk.SubPlugin) {
	s.Command("limit").Handle(func(c *sdk.Context) error {
		return c.Reply(fmt.Sprint(s.Config().Int("limit")))
	})
}
```

`s.Config()` 是 `items` 下的基础配置视图。需要会话 Profile 覆盖时，在 Handler 中使用 `c.Config().Object("items").Int("limit")`。

## 给整个子插件设权限

```go
admin := p.Sub("admin").Permission(sdk.Admin)
```

## 限制

子插件只是整理代码的方式，对用户和机器人主人来说仍然是一个插件：

- 子插件不能单独启用、停用或更新。
- 子插件下面不能再有子插件。
- 启动、停止的回调和数据库的建表步骤只能登记在 `p` 上。
- 所有子插件共用一个数据库。

需要能单独安装和停用的功能，应该做成另一个插件，两个插件之间用[服务](services.md)互相调用。
