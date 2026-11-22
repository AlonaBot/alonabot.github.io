---
title: Storage
description: Save simple state with KV and query business data with SQLite.
---

Plugins importing `sdk/kv`, `sdk/sqlitedb` or `sdk/gormdb` can use framework-managed SQLite. Import only the package you need; administrators do not configure a database connection.

## Key-value storage

```go
import "github.com/AlonaBot/AlonaBot/sdk/kv"
err := kv.Set(c, "last-user", []byte(c.User()))
value, ok, err := kv.Get(c, "last-user")
err = kv.Delete(c, "last-user")
```

Pass the handler Context. Keys are strings, values are bytes up to 1 MiB. `Get` returns `ok == false` for an absent key; deletion is idempotent.

## Business tables

The following `plugin.go` registers a migration and to-do commands:

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

Migration IDs run once in order. Append a new ID for later schema changes and preserve the meaning of released IDs. Add these handlers to the same file:

```go title="plugin.go (continued)"
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

This uses the `limit` field from the previous [configuration](config.md) page.

```text
> /todo add buy milk
Added: buy milk
> /todo add call mom
Added: call mom
> /todo list
1. buy milk
2. call mom
```

`sqlitedb.Open(c)` returns `*sql.DB`. Core owns its lifetime. Development data persists in `data/plugins/alonabot-plugin-todo/dev.sqlite`.

:::tip GORM
Use `sdk/gormdb` when you need GORM: `gormdb.Open(c)` returns `*gorm.DB` on the same managed database and also offers Migrations. Plain SQL avoids GORM's linking and initialization costs.
:::

## Failed updates

Installed updates prepare migrations against a candidate database copy. Success activates the candidate; preparation failure preserves the old generation and database. KV shares this protection. External databases and plugin-managed files need their own recovery procedure.

## Files

```go
dir := sdk.PluginDataDir(c)
err := os.WriteFile(filepath.Join(dir, "export.txt"), data, 0o600)
```

Import `os` and `path/filepath`. `PluginDataDir(c)` resolves `<data_dir>/plugin_data/<pluginID>/`. Files survive restarts and updates, and retain their current contents during a generation rollback. Call it after Session readiness in a handler or its derived context. Purging component data deletes this directory.

Next: [multi-turn conversations](conversation.md).
