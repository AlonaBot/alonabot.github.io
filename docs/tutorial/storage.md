---
title: 存储数据
description: 用键值存储保存简单状态，用 SQLite 保存业务数据。
---

每个插件有独立的 SQLite 数据库，由框架创建和管理，无需单独配置。这一页为待办清单添加持久化存储。

存数据有两种方式：

| 方式 | 适合 |
| --- | --- |
| 键值存储 `sdk/kv` | 少量简单状态：一个开关、上次运行的时间 |
| 数据库 `sdk/sqlitedb` | 需要查询、排序的业务数据 |

## 键值存储

```go
import "github.com/AlonaBot/AlonaBot/sdk/kv"

// 保存
err := kv.Set(c, "last-user", []byte(c.User()))

// 读取：ok 为 false 表示这个键不存在
value, ok, err := kv.Get(c, "last-user")

// 删除
err = kv.Delete(c, "last-user")
```

第一个参数传 Handler 的 `c`。键是 1～512 字节的 UTF-8 字符串，不能恰好是 `.` 或 `..`；值是字节，可以为空，最大 1 MiB。键或值不合法时返回 `INVALID_ARGUMENT`。

按前缀分页列出键：

```go
page, err := kv.List(c, "subscription/", "", 20)
// page.Keys 是这一页的键，按字节序排列。
// 把 page.Next 作为下一次的 cursor 继续取；Next 为空表示已经取完。
```

前缀按字面匹配，空前缀列出全部键。

## 数据库

待办需要按用户查询，用数据库。先建表：

```go title="plugin.go"
package plugin

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/AlonaBot/AlonaBot/sdk"
	"github.com/AlonaBot/AlonaBot/sdk/sqlitedb"
)

func New() *sdk.Plugin {
	p := sdk.NewPlugin()

	sqlitedb.Migrations(p, []sqlitedb.Migration{{
		ID: 1,
		Up: func(ctx context.Context, tx *sql.Tx) error {
			_, err := tx.ExecContext(ctx, `CREATE TABLE todos (
				id    INTEGER PRIMARY KEY,
				owner TEXT NOT NULL,
				body  TEXT NOT NULL
			)`)
			return err
		},
	}})

	todo := p.Group("todo")
	todo.Command("add").Description("Add a to-do item").RawTail().Handle(add)
	todo.Command("list").Description("List to-do items").Handle(list)
	return p
}
```

`Migrations` 注册数据库迁移，每条迁移有唯一的 `ID`。插件启动时按顺序执行尚未应用的迁移。新增字段时，追加 `ID: 2` 的迁移；已发布的迁移保持不变，确保已有数据库与新安装的数据库结构一致。

然后写两个 Handler：

```go title="plugin.go（续）"
func add(c *sdk.Context, text string) error {
	db, err := sqlitedb.Open(c)
	if err != nil {
		return err
	}
	var count int64
	if err := db.QueryRowContext(c, "SELECT COUNT(*) FROM todos WHERE owner = ?", c.User()).Scan(&count); err != nil {
		return err
	}
	if count >= c.Config().Int("limit") {
		return c.Reply("Your list is full.")
	}
	if _, err := db.ExecContext(c, "INSERT INTO todos (owner, body) VALUES (?, ?)", c.User(), text); err != nil {
		return err
	}
	return c.Reply("Added: " + text)
}

func list(c *sdk.Context) error {
	db, err := sqlitedb.Open(c)
	if err != nil {
		return err
	}
	rows, err := db.QueryContext(c, "SELECT body FROM todos WHERE owner = ? ORDER BY id", c.User())
	if err != nil {
		return err
	}
	defer rows.Close()

	var lines []string
	for rows.Next() {
		var body string
		if err := rows.Scan(&body); err != nil {
			return err
		}
		lines = append(lines, fmt.Sprintf("%d. %s", len(lines)+1, body))
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if len(lines) == 0 {
		return c.Reply("Nothing to do.")
	}
	return c.Reply(strings.Join(lines, "\n"))
}
```

```text
> /todo add buy milk
Added: buy milk
> /todo add call mom
Added: call mom
> /todo list
1. buy milk
2. call mom
```

`sqlitedb.Open(c)` 返回标准库的 `*sql.DB`，之后就是普通的 `database/sql` 用法。不要自己关闭它，框架会在插件停止时关闭。

重启 `alonabot run`，数据还在：开发时数据库文件是 `data/plugins/alonabot-plugin-todo/dev.sqlite`。

:::tip 习惯用 GORM？
把 `sdk/sqlitedb` 换成 `sdk/gormdb`，`gormdb.Open(c)` 返回 `*gorm.DB`，同样有 `Migrations`。两者用的是同一个数据库，一个插件里选一种即可。不需要 GORM 时用 `sqlitedb`，占用的内存更少。
:::

## 更新出错时数据会怎样

更新已安装的插件时，框架复制数据库，在副本上执行新迁移。准备成功后切换到新版本；迁移失败时继续使用原版本和原数据库。

这个保护只覆盖框架管理的数据库（键值存储也在里面）。你自己写的文件、连接的外部数据库不在保护范围内。

## 保存文件

需要保存文件时，放到插件的数据目录里：

```go
dir := sdk.PluginDataDir(c)
err := os.WriteFile(filepath.Join(dir, "export.txt"), data, 0o600)
```

目录是数据目录下的 `plugin_data/<插件 ID>/`，只有运行机器人的系统用户能访问，在插件重启和更新后保留。

- 文件不在框架管理的数据库里：更新失败恢复旧版本时，已经写入的文件不会回到旧内容。需要跟着版本一起恢复的数据放数据库或键值存储。
- `OnStart`、`OnReady` 执行时还不能取这个目录，调用会 panic；在 Handler 里或之后使用。
- 停用插件和普通卸载都保留文件；卸载时加 `--purge-data` 才会删除。

机器人主人可以在 WebUI 插件详情的「数据」页浏览和编辑数据库表、键值与文件，也可以导出或清空。

下一页：[多轮对话](conversation.md)。
