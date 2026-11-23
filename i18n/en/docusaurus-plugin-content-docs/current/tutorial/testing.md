---
title: Testing
description: Send messages to a plugin in go test and assert replies.
---

`plugintest` starts Core and loads your plugin within `go test`. Send messages and assert replies using the same command parsing, permissions, configuration, and database implementation as production.

## Test command replies

Create `plugin_test.go` next to `plugin.go`:

```go title="plugin_test.go"
package plugin

import (
	"testing"

	"github.com/AlonaBot/AlonaBot/plugintest"
)

func TestAddAndList(t *testing.T) {
	h := plugintest.Start(t, plugintest.Plugin(New()))
	alice := plugintest.User{ID: "alice"}
	chat := plugintest.Private(alice.ID)

	h.Text(chat, alice, "/todo add buy milk").RequireReply(t, "Added: buy milk")
	h.Text(chat, alice, "/todo list").RequireReply(t, "1. buy milk")
}
```

```sh
go test ./...
```

Test API:

- `plugintest.Start` starts Core and loads the plugin. Each test gets a temporary directory and empty database, cleaned up afterwards.
- `plugintest.User{ID: "alice"}` creates a test user. `plugintest.Private(...)` represents a private chat; use `plugintest.Group("room")` for a group.
- `h.Text(chat, user, text)` sends a message as that user, waits for processing, and returns the result. No `sleep` is needed.
- `RequireReply(t, want)` asserts exactly one reply with content `want` and no Handler error.

## Inspect messages and outcomes

The result from `h.Text` includes all output from processing:

```go
	result := h.Text(chat, alice, "/todo list")
	if len(result.Sends) != 1 {
		t.Fatalf("got %d messages, want 1", len(result.Sends))
	}
	sent := result.Sends[0]
	t.Log(sent.Text())  // Message text
	t.Log(sent.Chain)   // Full content, including images and buttons
	t.Log(sent.To)      // Destination session
```

| Field | Content |
| --- | --- |
| `result.Sends` | Sent messages, in order |
| `result.Outcomes` | Outcome of each invoked Handler; a non-nil `Err` indicates failure |
| `result.Waiting` | Whether the plugin is waiting for the user's next message |

## Test configuration

```go
func TestLimit(t *testing.T) {
	p := New()
	h := plugintest.Start(t,
		plugintest.Plugin(p),
		plugintest.Config(p, `{"limit": 1}`),
	)
	alice := plugintest.User{ID: "alice"}
	chat := plugintest.Private(alice.ID)

	h.Text(chat, alice, "/todo add buy milk").RequireReply(t, "Added: buy milk")
	h.Text(chat, alice, "/todo add call mom").RequireReply(t, "Your list is full.")
}
```

Pass the same `p` to `Config` and `Plugin`. Omitting `Config` uses field defaults.

## Test conversations

```go
func TestClear(t *testing.T) {
	h := plugintest.Start(t, plugintest.Plugin(New()))
	alice := plugintest.User{ID: "alice"}
	chat := plugintest.Private(alice.ID)

	h.Text(chat, alice, "/todo add buy milk")

	question := h.Text(chat, alice, "/todo clear")
	question.RequireReply(t, "Remove all items? Reply yes to confirm.")
	if !question.Waiting {
		t.Fatal("plugin should be waiting for an answer")
	}

	h.Text(chat, alice, "yes").RequireReply(t, "All items removed.")
	h.Text(chat, alice, "/todo list").RequireReply(t, "Nothing to do.")
}
```

## Test permissions

Test users are regular users by default. Use `plugintest.Admin` for a bot administrator:

```go
func TestAdminOnly(t *testing.T) {
	h := plugintest.Start(t, plugintest.Plugin(New()), plugintest.Admin("root"))
	root := plugintest.User{ID: "root"}
	bob := plugintest.User{ID: "bob"}

	h.Text(plugintest.Private(root.ID), root, "/todo purge").RequireReply(t, "Purged.")

	denied := h.Text(plugintest.Private(bob.ID), bob, "/todo purge")
	if len(denied.Sends) != 0 {
		t.Fatalf("bob got a reply: %+v", denied.Sends)
	}
}
```

Without permission, the Handler is skipped and no reply is sent.

## Other scenarios

| Scenario | API |
| --- | --- |
| Click a button | `h.Click(user, sent, "action")`; see [Buttons](../advanced/buttons.md#testing) |
| Trigger a scheduled task | `h.Trigger(p, "task")`; see [Scheduled tasks](../advanced/schedule.md#testing) |
| Replace the model | `plugintest.LLM(fn)`; see [Calling models](../advanced/llm.md#testing) |
| Send images or other non-text content | `h.Message(chat, user, message.Chain{...})` |
| Call between two plugins | Add multiple `plugintest.Plugin(...)` entries |
| Simulate a platform without a feature | `plugintest.Capabilities("message.send")` retains only the listed capabilities |

Call `h.Text` and related methods sequentially within a test.

## Test on a real platform

`plugintest` uses a simulated Adapter. Verify message splitting and platform formatting through [platform development](../platforms/development.md).
