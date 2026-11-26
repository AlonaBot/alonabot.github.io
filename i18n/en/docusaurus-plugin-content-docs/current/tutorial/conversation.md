---
title: Conversations
description: Ask a question and wait for the user's next message.
---

Some commands need several exchanges. Add `/todo clear`, which asks for confirmation and clears todos only when the user answers `yes`.

## Wait for the next message

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

`.Continue()` registers the Handler as a continuation, allowing it to wait for input. A regular Handler has a 30-second execution deadline.

`c.Wait(time.Minute)` waits up to one minute for the same user's next message in the same session. The returned `Context` represents that reply: `answer.Text()` reads its text, and `answer.Reply(...)` replies to it.

## While waiting

- `Wait` consumes the reply, so it is not processed again as a regular message or command.
- Messages from other users or sessions continue to be processed normally.
- If no reply arrives within one minute, `Wait` returns an error and the Handler ends. To tell the user about the timeout:

```go
	answer, err := c.Wait(time.Minute)
	if errcode.Of(err) == errcode.DeadlineExceeded {
		return c.Reply("Timed out.")
	}
	if err != nil {
		return err
	}
```

`errcode` is the `github.com/AlonaBot/AlonaBot/sdk/errcode` package. See [Error codes](../reference/errors.md).

## Ask several questions

Call `Wait` multiple times, continuing from each answer's context:

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

## Continue from inside a Handler

An ordinary Handler can also hand the rest of its work to a continuation:

```go
return c.Continue(func(c *sdk.Context) error {
	answer, err := c.Wait(time.Minute)
	if err != nil {
		return err
	}
	return answer.Reply("Got it.")
})
```

The original Handler returns as usual; after it finishes successfully, fn runs in a new call. If the original Handler returns an error, fn does not run.

- A continuation cannot call `Continue` again.
- Waits and continuations are not persisted; they end when the plugin stops or updates.
- `Wait` only works when a real user message started the call, not in background tasks.
