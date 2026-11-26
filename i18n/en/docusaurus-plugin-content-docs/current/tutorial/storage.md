---
title: Storing data
description: Store simple state with key-value storage and business data with SQLite.
---

Each plugin has a separate SQLite database, created and managed by the framework. Add persistent storage to the todo plugin.

Choose a storage API:

| API | Suitable for |
| --- | --- |
| Key-value storage `sdk/kv` | Small pieces of state: a toggle or last-run timestamp |
| Database `sdk/sqlitedb` | Business data that needs queries and sorting |

## Key-value storage

```go
import "github.com/AlonaBot/AlonaBot/sdk/kv"

// Save
err := kv.Set(c, "last-user", []byte(c.User()))

// Read: ok is false when the key does not exist
value, ok, err := kv.Get(c, "last-user")

// Delete
err = kv.Delete(c, "last-user")
```

Pass the Handler context `c` as the first argument. Keys are UTF-8 strings of 1 to 512 bytes and cannot be exactly `.` or `..`; values are bytes, may be empty, and are at most 1 MiB. Invalid keys or values return `INVALID_ARGUMENT`.

List keys by prefix, one page at a time:

```go
page, err := kv.List(c, "subscription/", "", 20)
// page.Keys holds this page, in byte order.
// Pass page.Next as the next cursor; an empty Next means you have every key.
```

Prefixes match literally; an empty prefix lists every key.

## Database

Todos need queries by user. Start by creating a table:

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

`Migrations` registers database migrations, each with a unique `ID`. Startup applies pending migrations in order. To add a field, append a migration with `ID: 2`. Keep published migrations unchanged so existing and fresh databases have the same structure.

Then write two Handlers:

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

```text
> /todo add buy milk
Added: buy milk
> /todo add call mom
Added: call mom
> /todo list
1. buy milk
2. call mom
```

`sqlitedb.Open(c)` returns a standard `*sql.DB`, used through `database/sql`. The framework closes it when the plugin stops; leave it open.

Restart `alonabot run` to check persistence. During development the database is `data/plugins/alonabot-plugin-todo/dev.sqlite`.

:::tip Using GORM?
Replace `sdk/sqlitedb` with `sdk/gormdb`. `gormdb.Open(c)` returns `*gorm.DB` and also supports `Migrations`. Both access the same database; choose one per plugin. Use `sqlitedb` when you do not need GORM to reduce memory usage.
:::

## Data during a failed update

When updating an installed plugin, the framework copies the database and runs new migrations on the copy. Successful preparation switches to the new version; a failed migration keeps the original version and database active.

This protection covers framework-managed databases, including key-value storage. Files you write and external databases require their own update strategy.

## Save files

Store files in the plugin data directory:

```go
dir := sdk.PluginDataDir(c)
err := os.WriteFile(filepath.Join(dir, "export.txt"), data, 0o600)
```

The directory is `plugin_data/<plugin ID>/` under the data directory, accessible only to the OS user running the bot, and persists across restarts and updates.

- Files are outside the framework-managed database: when a failed update restores the old version, written files keep their new content. Store data that must roll back with the version in the database or key-value storage.
- The directory is not available while `OnStart` or `OnReady` runs; calling it there panics. Use it in Handlers or later.
- Disabling and plain uninstalling keep the files; only uninstalling with `--purge-data` deletes them.

Owners can browse and edit database tables, key-value entries and files on the Data tab of the WebUI plugin details, and export or clear them.

Next: [Conversations](conversation.md).
