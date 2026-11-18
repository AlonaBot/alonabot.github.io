---
sidebar_position: 6
title: 存储数据
description: 用 KV 保存简单状态，用受管 SQLite 保存业务数据，用插件目录保存文件。
---

少量键值状态首选 `sdk/kv`；需要表、查询或事务时用 `sdk/sqlitedb`。两者使用插件的受管 SQLite，跟随组件的数据生命周期。

## 保存键值

在 `New()` 中登记 `p.Command("save").Handle(saveValue)` 与 `p.Command("read").Handle(readValue)`，导入 `sdk`、`sdk/kv`、`sdk/errcode`：

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

`Get` 用 `exists` 区分缺失与空值；错误原样返回。`Delete` 删除键，`List(ctx, prefix, cursor, limit)` 按前缀分页，使用返回的 `Next` 继续。键值放在受管数据库的框架保留表中，随候选副本更新和回退。

键使用 1～512 字节的 UTF-8，值最多 1 MiB。按当前契约选择普通业务键，避开 `.` 与 `..`：管理 API 把键放进 URL 路径段，浏览器会折叠这两个点段。

## 建表与写入

在 `New()` 中调用 `registerDatabase(p)`，导入标准库 `context`、`database/sql`，以及 `sdk`、`sdk/sqlitedb`：

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

`Migrations` 按非零、严格递增的 ID 执行未完成步骤，每步在事务中写账本。ID 发布后保持原意。自行管理整个迁移时选 `sqlitedb.Migrate(p, fn)`；同一插件只选一种迁移方式。

同代次 `RESUME` 复用原数据库，跳过数据库迁移回调，保留原迁移模式与账本；首次激活、更新与回退仍按迁移规则执行。恢复流程见[组件生命周期](../concepts/lifecycle.md#同代次恢复)。

迁移 callback 使用传入的 `tx`，事务内的独立查询会等待同一个单连接池。`sqlitedb.Open(ctx)` 复用当前 Session 的 `*sql.DB`，由 SDK 关闭，调用者保持连接打开；准备到迁移阶段后可用，停机后返回错误。GORM 业务可选择 `sdk/gormdb` 的 `Open/Migrate/Migrations`，与 sqlitedb 共用连接与迁移账本。

## 保存文件

导入 `sdk`、标准库 `os`、`path/filepath`：

```go
func saveCache(c *sdk.Context, value string) error {
    path := filepath.Join(sdk.PluginDataDir(c.Context()), "cache.txt")
    return os.WriteFile(path, []byte(value), 0o600)
}
```

`PluginDataDir(ctx)` 返回 Core 已创建的绝对目录，Session 就绪后可用；在 `OnStart`、`OnReady` 或停止后调用会 panic。文件由插件管理，准备失败或回退会保留已经写入的文件。需要跟随代次回退的数据放 KV 或受管 SQLite。

## 选择数据边界

已安装组件更新使用受管 SQLite 候选副本，准备失败回到原数据库。开发 `run` 使用 `<data_dir>/plugins/<id>/dev.sqlite`，跨开发重启保留。外部数据库、插件文件的副作用由插件自己管理；准备阶段写外部资源须按 manifest 的 `prepare_effects: external` 声明并遵守维护流程。

会话历史可用 `sdk/conversation.Append/List/Clear` 保存原样 JSON 对象，按插件和 key 隔离，`Entry.Seq` 与分页游标维持顺序。需要按用户或会话隔离时，业务把可信的 `c.User()`、`c.Session()` 纳入 key。

完整例子：[configdb](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/configdb/main.go)。依据：[受管数据库契约](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#6-数据库更新事务与回退)、[SQLite 入口](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/sqlitedb/open.go)。
