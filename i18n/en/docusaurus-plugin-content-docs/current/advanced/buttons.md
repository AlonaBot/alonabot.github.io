---
title: Buttons
description: Send callback and URL buttons, and handle clicks.
---

Buttons let users choose an action with a click.

## Complete example

```go
package plugin

import (
	"github.com/AlonaBot/AlonaBot/sdk"
	"github.com/AlonaBot/AlonaBot/sdk/button"
	"github.com/AlonaBot/AlonaBot/sdk/message"
)
type Vote struct {
	Choice string `json:"choice"`
}

var vote = button.Define[Vote]("vote")

func New() *sdk.Plugin {
	p := sdk.NewPlugin()
	p.Command("poll").Handle(func(c *sdk.Context) error {
		return c.Reply("Tea or coffee?", message.Buttons([]message.Button{
			vote.Button("Tea", Vote{Choice: "tea"}),
			vote.Button("Coffee", Vote{Choice: "coffee"}),
		}))
	})
	button.On(p, vote).Handle(func(c *sdk.Context, v Vote) error {
		return c.Reply("You chose " + v.Choice + ".")
	})

	return p
}
```

```text
> /poll
Tea or coffee?
#1 Tea
#2 Coffee
> #2
You chose coffee.
```

`button.Define[Vote]("vote")` declares the typed action; Button attaches a value; On registers its handler. Terminal chat renders callback buttons as numbers.

## Layout and links

Each argument to Buttons is a row:

```go
message.Buttons(
	[]message.Button{vote.Button("Tea", Vote{"tea"}), vote.Button("Coffee", Vote{"coffee"})},
	[]message.Button{vote.Button("Neither", Vote{"none"})},
)
```

URL buttons open a website without an event:

```go
message.URLButton("Open website", "https://example.com")
```

## Who clicked?

The callback's `c.User()` identifies the person clicking. To restrict a confirmation to its creator, put the creator's identity in the value and compare it:

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

Permissions and rules can also restrict clicks:

```go
button.On(p, confirm).Permission(sdk.Admin).Handle(onConfirm)
```

## Update the original message

```go
	button.On(p, vote).Handle(func(c *sdk.Context, v Vote) error {
		_, err := c.Edit(c.Event().Ref(), message.Text("You chose "+v.Choice+"."))
		return err
	})
```

Editing needs platform support; see the [platform matrix](../usage/platforms.md).

## Limits and unsupported platforms

The JSON-encoded business value is limited to 1024 bytes. Store large data separately and send its key. For a platform without buttons, use a defined text alternative:

```go
	err := c.Reply("Tea or coffee?", buttons)
	if errcode.Of(err) == errcode.Unsupported {
		return c.Reply("Tea or coffee? Reply /vote tea or /vote coffee.")
	}
	return err
```

Import `sdk/errcode`. Other errors retain their original result. Callback tokens are tied to generation and permissions; old buttons may become invalid after replacement, expiry or access changes. Telegram supports callbacks; OneBot11 currently lacks buttons.

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

`h.Click` selects the first button with the supplied action name. Import `testing` and `plugintest` for this local test.
