---
title: Multi-turn conversations
description: Ask a question and wait for the same user to answer.
---

Add `/todo clear`, requiring `yes` before deleting the user's items.

## Wait for the next message

Register this inside New:

```go
	todo.Command("clear").Description("Remove all items").Continue().Handle(clear)
```

Add the handler, importing `time` and `sdk/sqlitedb`:

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

`.Continue()` runs the handler in a continuation with a longer deadline. `c.Wait(time.Minute)` waits for the same user in the same chat, including its topic, and returns a new Context for that answer.

## While waiting

The matching answer is consumed by Wait. Other users and chats continue normally. If the minute expires, Wait returns an error:

```go
	answer, err := c.Wait(time.Minute)
	if errcode.Of(err) == errcode.DeadlineExceeded {
		return c.Reply("Timed out.")
	}
	if err != nil {
		return err
	}
```

Import `sdk/errcode` to classify errors. [Error codes](../reference/errors.md) lists the possible results.

## Ask several questions

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

## Lifetime

Wait state lives in memory and ends when the plugin stops or is replaced. It needs a real inbound Actor and default target, so scheduled jobs use explicit sends instead. The continuation's default total budget is 15 minutes. A continuation cannot create another continuation.

For clickable choices see [buttons](../advanced/buttons.md). Next: [testing](testing.md).
