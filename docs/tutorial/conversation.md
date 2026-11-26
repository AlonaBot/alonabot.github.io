---
title: 多轮对话
description: 发出问题后等待用户的下一条消息。
---

有的命令需要来回说几句。这一页给待办清单加上 `/todo clear`：清空之前先问一句，用户回答 `yes` 才执行。

## 等待下一条消息

```go
	todo.Command("clear").Description("Remove all items").Continue().Handle(clear)
```

```go
func clear(c *sdk.Context) error {
	if err := c.Reply("Remove all items? Reply yes to confirm."); err != nil {
		return err
	}
	answer, err := c.Wait(time.Minute)
	if err != nil {
		return err
	}
	if answer.Text() != "yes" {
		return answer.Reply("Cancelled.")
	}
	db, err := sqlitedb.Open(c)
	if err != nil {
		return err
	}
	if _, err := db.ExecContext(c, "DELETE FROM todos WHERE owner = ?", c.User()); err != nil {
		return err
	}
	return answer.Reply("All items removed.")
}
```

```text
> /todo clear
Remove all items? Reply yes to confirm.
> yes
All items removed.
```

`.Continue()` 将 Handler 注册为延续调用，支持等待用户输入。普通 Handler 的执行期限为 30 秒。

`c.Wait(time.Minute)` 等待同一用户在同一会话中的下一条消息，最长一分钟。返回的新 `Context` 对应这条回答：`answer.Text()` 读取文本，`answer.Reply(...)` 回复该消息。

## 等待期间发生了什么

- 用户的回答被 `Wait` 取走，不会再被当成普通消息或命令处理。
- 其他用户、其他会话的消息不受影响，照常处理。
- 一分钟内没有回答，`Wait` 返回错误，Handler 结束。想告诉用户已超时，可以这样写：

```go
	answer, err := c.Wait(time.Minute)
	if errcode.Of(err) == errcode.DeadlineExceeded {
		return c.Reply("Timed out.")
	}
	if err != nil {
		return err
	}
```

`errcode` 是 `github.com/AlonaBot/AlonaBot/sdk/errcode` 包，各错误码的含义见[错误码](../reference/errors.md)。

## 连续问几个问题

`Wait` 可以调用多次，每次都在上一次的回答上继续等：

```go
func ask(c *sdk.Context) error {
	if err := c.Reply("What is the item?"); err != nil {
		return err
	}
	item, err := c.Wait(time.Minute)
	if err != nil {
		return err
	}
	if err := item.Reply("When is it due?"); err != nil {
		return err
	}
	due, err := item.Wait(time.Minute)
	if err != nil {
		return err
	}
	return due.Reply(fmt.Sprintf("Added: %s (due %s)", item.Text(), due.Text()))
}
```

```text
> /todo ask
What is the item?
> buy milk
When is it due?
> tomorrow
Added: buy milk (due tomorrow)
```

## 在 Handler 中途转入延续调用

普通 Handler 也可以在中途把后续工作交给延续调用：

```go
return c.Continue(func(c *sdk.Context) error {
	answer, err := c.Wait(time.Minute)
	if err != nil {
		return err
	}
	return answer.Reply("Got it.")
})
```

原 Handler 先照常返回；它成功结束后，fn 在新的调用里执行。原 Handler 返回错误时 fn 不执行。

- 延续调用里不能再调用 `Continue`。
- 等待和延续都不持久保存，插件停止或更新时结束。
- `Wait` 只能由真实的用户消息触发，后台任务里不能用。
