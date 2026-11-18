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

两处新东西：

- **登记时加 `.Continue()`**。普通 Handler 必须在 30 秒内返回，加上它之后这个 Handler 可以运行更久，才能停下来等用户。
- **`c.Wait(time.Minute)`** 停在这里，直到同一个用户在同一个会话里发来下一条消息，最多等一分钟。它返回一个新的 `Context`，代表用户的那条回答：`answer.Text()` 是回答的文字，`answer.Reply(...)` 回复那条消息。

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

## 限制

- 等待的状态只在内存里。插件重启或更新后，正在进行的对话会结束，用户需要重新发命令。
- 只有由用户消息触发的 Handler 能等待。定时任务没有「发消息的用户」，不能用 `Wait`。
- 整个对话有总时长上限，缺省 15 分钟。

需要用户点按钮而不是打字时，见[按钮](../advanced/buttons.md)。下一页：[测试](testing.md)。
