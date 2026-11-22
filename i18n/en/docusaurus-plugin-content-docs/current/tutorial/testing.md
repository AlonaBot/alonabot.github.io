---
title: Testing plugins
description: Use a real Core in go test and assert actual replies.
---

`plugintest` starts a real Core with a test adapter. Command parsing, permissions, configuration and managed storage follow the runtime path.

## Your first test

Create `plugin_local_test.go` beside `plugin.go`. Official repositories follow [Core's committed-test policy](https://github.com/AlonaBot/AlonaBot/blob/main/CONTRIBUTING.md#test-submission-rules).

```go title="plugin_local_test.go"
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

```fish
go test ./...
```

Each Start creates an isolated temporary directory and database, then cleans up at test end. Private creates a private chat; Group creates a group chat. Text injects a message and waits for completion or a continuation wait, without sleeps. RequireReply checks all handler outcomes and exactly one matching reply.

## Inspect results

```go
	result := h.Text(chat, alice, "/todo list")
	if len(result.Sends) != 1 {
		t.Fatalf("got %d messages, want 1", len(result.Sends))
	}
	sent := result.Sends[0]
	t.Log(sent.Text())
	t.Log(sent.Chain)
	t.Log(sent.To)
```

`Sends` preserves ordered messages and chains, `Outcomes` preserves handler errors, and `Waiting` reports an active wait. Inspect `Sent.To`, `Chain`, and `Result` for media or receipts.

## Configuration

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

Config and Plugin must receive the same plugin object. Omitted configuration uses schema defaults.

## Conversations

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

## Permissions

This independent example also imports `github.com/AlonaBot/AlonaBot/sdk`.

```go
func TestAdminOnly(t *testing.T) {
	p := sdk.NewPlugin()
	p.Command("purge").Permission(sdk.Admin).Handle(func(c *sdk.Context) error {
		return c.Reply("Purged.")
	})
	h := plugintest.Start(t, plugintest.Plugin(p), plugintest.Admin("root"))
	root := plugintest.User{ID: "root"}
	bob := plugintest.User{ID: "bob"}

	h.Text(plugintest.Private(root.ID), root, "/purge").RequireReply(t, "Purged.")

	denied := h.Text(plugintest.Private(bob.ID), bob, "/purge")
	if len(denied.Sends) != 0 {
		t.Fatalf("bob got a reply: %+v", denied.Sends)
	}
}
```

The test user is ordinary unless Admin grants Core administrator status. A denied route produces no reply.

## More scenarios

| Scenario | Method |
| --- | --- |
| Callback button | `h.Click(user, sent, "action")`; [buttons](../advanced/buttons.md#testing) |
| Static job | `h.Trigger(p, "job")`; [scheduling](../advanced/schedule.md#testing) |
| Model service | `plugintest.LLM(fn)`; [LLM testing](../advanced/llm.md#testing) |
| Mixed media | `h.Message(chat, user, chain)` |
| Collaborating plugins | Multiple Plugin options |
| Limited platform support | Capabilities replaces the supported capability list |

Use one Harness sequentially. Real platform rendering, permissions and transport still need a platform check. Next: [connect Telegram](telegram.md).
