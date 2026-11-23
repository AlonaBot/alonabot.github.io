---
title: Buttons
description: Add buttons to messages and handle clicks.
---

Buttons let users act without typing a command.

## Register buttons and click Handlers

```go
package plugin

import (
	"github.com/AlonaBot/AlonaBot/sdk"
	"github.com/AlonaBot/AlonaBot/sdk/button"
	"github.com/AlonaBot/AlonaBot/sdk/message"
)

// Data returned on click
type Vote struct {
	Choice string `json:"choice"`
}

var vote = button.Define[Vote]("vote")

func New() *sdk.Plugin {
	p := sdk.NewPlugin()

	// Send a message with buttons
	p.Command("poll").Handle(func(c *sdk.Context) error {
		return c.Reply("Tea or coffee?", message.Buttons([]message.Button{
			vote.Button("Tea", Vote{Choice: "tea"}),
			vote.Button("Coffee", Vote{Choice: "coffee"}),
		}))
	})

	// Handle a click
	button.On(p, vote).Handle(func(c *sdk.Context, v Vote) error {
		return c.Reply("You chose " + v.Choice + ".")
	})

	return p
}
```

Terminal chat displays numbered buttons. Enter `#number` to click:

```text
> /poll
Tea or coffee?
#1 Tea
#2 Coffee
> #2
You chose coffee.
```

Three steps:

1. **`button.Define[Vote]("vote")`** declares a button action. `Vote` is the data returned on click.
2. **`vote.Button("Tea", Vote{...})`** creates a button; the first argument is its label.
3. **`button.On(p, vote).Handle(...)`** handles clicks; its second parameter receives the button data.

## Layout

Each argument to `message.Buttons` represents a row:

```go
message.Buttons(
	[]message.Button{vote.Button("Tea", Vote{"tea"}), vote.Button("Coffee", Vote{"coffee"})},
	[]message.Button{vote.Button("Neither", Vote{"none"})},
)
```

## Link buttons

```go
message.URLButton("Open website", "https://example.com")
```

Clicking opens a web page without notifying the plugin.

## Click identity and permissions

In a click Handler, `c.User()` is **the person who clicked**, which may differ from the command sender. Anyone in a group can click. To restrict an action to its initiator, include the initiator in the data and compare:

```go
type Confirm struct {
	Owner string `json:"owner"`
}

var confirm = button.Define[Confirm]("confirm")

	button.On(p, confirm).Handle(func(c *sdk.Context, v Confirm) error {
		if c.User() != v.Owner {
			return nil
		}
		return c.Reply("Confirmed.")
	})
```

Apply permissions and rules as with commands:

```go
button.On(p, confirm).Permission(sdk.Admin).Handle(onConfirm)
```

## Update the original message

Edit the original message to show the result:

```go
	button.On(p, vote).Handle(func(c *sdk.Context, v Vote) error {
		_, err := c.Edit(c.Event().Ref(), message.Text("You chose "+v.Choice+"."))
		return err
	})
```

The account must support message editing. Query available operations in [Platform connections](../platforms/index.md#query-account-capabilities).

## Button data and platform support

- JSON-encoded button data must fit within 1024 bytes. Store identifiers in buttons and larger content in the database.
- Sending buttons on an unsupported platform returns `UNSUPPORTED`. Handle this by sending text instructions:

```go
	err := c.Reply("Tea or coffee?", buttons)
	if errcode.Of(err) == errcode.Unsupported {
		return c.Reply("Tea or coffee? Reply /vote tea or /vote coffee.")
	}
	return err
```

## Testing

```go
func TestPoll(t *testing.T) {
	h := plugintest.Start(t, plugintest.Plugin(New()))
	alice := plugintest.User{ID: "alice"}

	poll := h.Text(plugintest.Group("room"), alice, "/poll")
	bob := plugintest.User{ID: "bob"}
	h.Click(bob, poll.Sends[0], "vote").RequireReply(t, "You chose tea.")
}
```

`h.Click` clicks the first button in the message whose action name is `vote`.
