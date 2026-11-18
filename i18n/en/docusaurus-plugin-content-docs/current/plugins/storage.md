---
sidebar_position: 6
title: Data Storage
description: Use KV for small state, managed SQLite for business data and plugin directories for files.
---

Choose `sdk/kv` for small key-value state and `sdk/sqlitedb` for tables, queries or transactions. Both use the plugin's managed SQLite and follow its data lifecycle.

## Key-value state

Register `p.Command("save").Handle(saveValue)` and `p.Command("read").Handle(readValue)` in `New()`. Import `sdk`, `sdk/kv` and `sdk/errcode`:

```go
func saveValue(c *sdk.Context, key, value string) error {
    return kv.Set(c.Context(), key, []byte(value))
}

func readValue(c *sdk.Context, key string) error {
    value, exists, err := kv.Get(c.Context(), key)
    if err != nil {
        return err
    }
    if !exists {
        return errcode.NotFound.New("KV key does not exist")
    }
    return c.Reply(string(value))
}
```

`Get` distinguishes missing and empty values through `exists` and returns original errors. `Delete` removes keys. `List(ctx, prefix, cursor, limit)` pages by prefix; continue with its `Next`. Data lives in a reserved table in the managed database and follows candidate updates and rollbacks.

Keys use 1–512 bytes of UTF-8; values are at most 1 MiB. Follow the current contract and choose ordinary business keys, avoiding `.` and `..`: the management API puts keys in URL path segments, where browsers collapse these two dot segments.

## Tables and writes

Call `registerDatabase(p)` in `New()`. Import standard-library `context` and `database/sql`, plus `sdk` and `sdk/sqlitedb`:

```go
func registerDatabase(p *sdk.Plugin) {
    sqlitedb.Migrations(p, []sqlitedb.Migration{{
        ID: 1,
        Up: func(ctx context.Context, tx *sql.Tx) error {
            _, err := tx.ExecContext(ctx, "CREATE TABLE notes (body TEXT NOT NULL)")
            return err
        },
    }})
    p.Command("note").Args("text").RawTail().Handle(func(c *sdk.Context, text string) error {
        db, err := sqlitedb.Open(c.Context())
        if err != nil {
            return err
        }
        _, err = db.ExecContext(c.Context(), "INSERT INTO notes (body) VALUES (?)", text)
        return err
    })
}
```

`Migrations` runs unapplied steps in nonzero, strictly increasing ID order, recording each step transactionally. Preserve an ID's meaning after publication. Choose `sqlitedb.Migrate(p, fn)` to manage the whole migration yourself; use one migration style per plugin.

Same-generation `RESUME` reuses the database and skips migration callbacks, preserving the migration mode and ledger. Initial activation, updates and rollbacks still follow the migration rules. See [Component Lifecycle](../concepts/lifecycle.md#resume-the-same-generation).

Use the callback's `tx`: independent queries inside the transaction wait for the same single-connection pool. `sqlitedb.Open(ctx)` reuses the Session's `*sql.DB`, which the SDK closes; leave it open. It is available from the migration phase and returns an error after stopping. GORM projects can use `sdk/gormdb`'s `Open/Migrate/Migrations`, sharing the connection and migration ledger.

## Files

Import `sdk`, standard-library `os` and `path/filepath`:

```go
func saveCache(c *sdk.Context, value string) error {
    path := filepath.Join(sdk.PluginDataDir(c.Context()), "cache.txt")
    return os.WriteFile(path, []byte(value), 0o600)
}
```

`PluginDataDir(ctx)` returns the absolute directory created by Core, available after Session readiness. Calling it in `OnStart`, `OnReady` or after stopping panics. The plugin manages files; preparation failure and rollback retain written files. Use KV or managed SQLite for data that must roll back with a generation.

## Data boundaries

Installed-component updates use managed SQLite candidate copies; failed preparation preserves the previous database. Development `run` uses `<data_dir>/plugins/<id>/dev.sqlite`, retained across development restarts. The plugin manages side effects in external databases and files. Declare `prepare_effects: external` for preparation that writes external resources and follow the maintenance workflow.

`sdk/conversation.Append/List/Clear` stores original JSON-object history, isolated by plugin and key. `Entry.Seq` and pagination preserve order. Include trusted `c.User()` and `c.Session()` in business keys when user or chat isolation is required.

Full example: [configdb](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/configdb/main.go). Sources: [database contract](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#6-数据库更新事务与回退), [SQLite API](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/sqlitedb/open.go).
