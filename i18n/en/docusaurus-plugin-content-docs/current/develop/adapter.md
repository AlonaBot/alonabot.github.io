---
title: Build an Adapter
description: Connect a new chat platform to AlonaBot.
---

An Adapter converts inbound platform messages into the unified format and sends Core's outbound messages to the platform.

This example uses a timer to demonstrate event delivery and sending. Replace it with platform message reception for a real integration.

## Create a project

```sh
alonabot init alonabot-adapter-demo --role adapter --adapter-id demo
cd alonabot-adapter-demo
```

The `alonabot-adapter-demo/` project contains:

| Path | Purpose |
| --- | --- |
| `adapter.go` | Adapter code |
| `plugin.yaml` | Component metadata |
| `adapter_config_schema.json` | Account configuration fields |
| `go.mod` | Go module and dependencies |

`--adapter-id demo` sets the platform identifier. User and session identifiers use this prefix, such as `demo:alice`.

## Adapter and Instance interfaces

Implement two interfaces from `sdk/adapter`:

```go
// A platform
type Adapter interface {
	Descriptor() *Descriptor
	Start(ctx context.Context, req StartRequest, core Core) (Instance, error)
}

// One account on the platform
type Instance interface {
	Account() Account
	Capabilities() []message.Capability
	Send(ctx context.Context, to string, chain message.Chain) (*message.SendResult, *errcode.Error)
	Stop(ctx context.Context) error
}
```

Core calls `Start` for each configured account. Return an `Instance` for that account.

## Complete example

```go title="adapter.go"
package component

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync/atomic"
	"time"

	"github.com/AlonaBot/AlonaBot/sdk/adapter"
	"github.com/AlonaBot/AlonaBot/sdk/errcode"
	"github.com/AlonaBot/AlonaBot/sdk/message"
)

const adapterID = "demo"

type demo struct{}

// New is the project entry point.
func New() adapter.Adapter { return demo{} }

func (demo) Descriptor() *adapter.Descriptor {
	return &adapter.Descriptor{AdapterID: adapterID, Capabilities: capabilities}
}

var capabilities = []message.Capability{
	{Name: "message.created", Version: 1, Supported: true},
	{Name: "message.send", Version: 1, Supported: true},
}

func (demo) Start(ctx context.Context, req adapter.StartRequest, core adapter.Core) (adapter.Instance, error) {
	// 1. Read account configuration
	var config struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(req.ConfigJSON, &config); err != nil {
		return nil, err
	}

	// 2. Receive messages. A real Adapter connects to the platform here.
	receive, cancel := context.WithCancel(context.Background())
	inst := &instance{id: req.InstanceID, name: config.Name, cancel: cancel, done: make(chan struct{})}
	go inst.receive(receive, core)
	return inst, nil
}

type instance struct {
	id, name string
	cancel   context.CancelFunc
	done     chan struct{}
	sequence atomic.Uint64
}

// receive simulates an incoming message every 10 seconds.
func (i *instance) receive(ctx context.Context, core adapter.Core) {
	defer close(i.done)
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		id := fmt.Sprint(i.sequence.Add(1))
		chain := message.Chain{message.Text("/hello")}
		_, err := core.Deliver(ctx, &message.Event{
			ID:                id,
			Type:              "message.created",
			Source:            message.SourceAdapter,
			OccurredAt:        time.Now(),
			AdapterID:         adapterID,
			AdapterInstanceID: i.id,
			AccountID:         i.id,
			Session:           message.SID(adapterID, "alice", ""),
			ChatType:          message.ChatPrivate,
			Actor:             &message.Actor{ExternalUserID: "alice", AdapterInstanceID: i.id},
			Message:           &message.PlatformMessage{PlatformMessageID: id, Chain: chain},
			Payload:           &message.CreatedPayload{PlatformMessageID: id, Chain: chain, ToMe: true},
		}, nil)
		if err != nil {
			slog.Error("deliver failed", "error", err)
		}
	}
}

func (i *instance) Account() adapter.Account {
	return adapter.Account{ID: i.id, DisplayName: i.name}
}

func (*instance) Capabilities() []message.Capability { return capabilities }

// Send delivers messages to the platform. This example only logs.
func (i *instance) Send(_ context.Context, to string, chain message.Chain) (*message.SendResult, *errcode.Error) {
	slog.Info("send", "to", to, "text", chain.Text())

	id := fmt.Sprint(i.sequence.Add(1))
	indexes := make([]uint32, len(chain))
	for n := range chain {
		indexes[n] = uint32(n)
	}
	return &message.SendResult{
		Status:                   message.SendAccepted,
		Session:                  to,
		AdapterInstanceID:        i.id,
		PrimaryPlatformMessageID: id,
		PlatformMessageIDs:       []string{id},
		PartResults: []message.PartResult{{
			PartIndex: 0, SegmentIndexes: indexes,
			Status: message.PartAccepted, PlatformMessageIDs: []string{id},
		}},
	}, nil
}

func (i *instance) Stop(context.Context) error {
	i.cancel()
	<-i.done
	return nil
}
```

Account configuration:

```json title="adapter_config_schema.json"
{
  "name": { "type": "string", "description": "Display name", "default": "Demo Bot" }
}
```

The format matches plugin [configuration schemas](../reference/config-schema.md).

## Run

Configure at least one account in `data/core_config.json` to start the Adapter:

```json title="data/core_config.json"
{
  "adapters": {
    "demo": {
      "package": "alonabot-adapter-demo",
      "instances": { "one": {} }
    }
  }
}
```

Run alongside the [quick-start](../quick-start.md) plugin:

```sh
alonabot run . ../alonabot-plugin-hello
```

Every 10 seconds the log shows:

```text
send to=demo:alice text=Hello!
```

Call flow: Adapter delivers `/hello` → Core routes it to the plugin → plugin replies → Core calls the Adapter's `Send`.

## Debug third-party source

Obtain the source and use the project directory containing `plugin.yaml`. The CLI compiles and loads third-party development directories directly. Fill account fields according to that project's `adapter_config_schema.json` and documentation.

For example, develop a QQ Adapter in `./qq-adapter` alongside a plugin in `./my-plugin`:

```sh
alonabot run ./qq-adapter ./my-plugin --data-dir ./qq-source-data --log-level debug
```

After Core starts, add an account from another terminal in the same working directory. Replace the assumed `alonabot-adapter-qq` ID with the actual `id` from `plugin.yaml`:

```fish
set -gx ALONABOT_ADMIN_TOKEN 'token-from-this-core'
alonabot adapter instance create alonabot-adapter-qq qq-main --config ./qq-account.json --data-dir ./qq-source-data
```

Saving either project recompiles and restarts that component. Use a separate data directory: duplicate component IDs or Adapter platform IDs between development and installed components cause startup to fail.

## Adapter methods

### Deliver messages: core.Deliver

Convert inbound messages to `message.Event` with these fields:

| Field | Meaning |
| --- | --- |
| `ID` | Event identifier, unique within the account |
| `Type` | Event type; `message.created` for a new message |
| `Session` | Construct with `message.SID(adapterID, sessionID, topicID)` |
| `ChatType` | `message.ChatPrivate`, `message.ChatGroup`, or `message.ChatChannel` |
| `Actor.ExternalUserID` | Sender's platform user ID |
| `Payload` | Event data; `ToMe` indicates a private message, mention, or reply to the bot |

Use platform-verified identity information. Core checks permissions against this user ID.

The last argument to `Deliver` is a cursor; see [Resume reception](#resume-reception).

### Send messages: Send

Convert `chain`, which may contain text, images, and buttons, into platform API calls.

- Return `errcode.Unsupported.New("...")` for unsupported content instead of dropping it.
- A chain may require several platform messages. Each `PartResults` item represents one platform message; `SegmentIndexes` identifies its source segments.
- On partial failure, return successful parts together with the error and set `Status` to `message.SendPartial`.
- **Avoid automatic retries.** A timed-out send may already have succeeded.

### Declare capabilities: Capabilities

Declare implemented features. Core checks them before sending and returns `UNSUPPORTED` for unavailable operations.

| Name | Meaning |
| --- | --- |
| `message.created`, `message.edited`, `message.deleted` | Reports these events |
| `member.joined`, `member.left` | Reports membership changes |
| `message.send` | Sends messages |
| `message.edit` | Edits messages; also implement `adapter.Editor` |
| `message.buttons`, `button.clicked` | Sends buttons and reports clicks |
| `message.album` | Groups images into an album |
| `message.reference` | Supports quoted replies |
| `message.markdown` | Supports formatted text |

Keep declarations aligned with implementation.

### Stop: Stop

Stop reception and wait for receiving goroutines before returning. All `core.Deliver` calls must finish before `Stop` returns.

## Resume reception

Platforms often number messages sequentially. Persist the last position as a cursor to resume after restarting:

```go
// Include the current reception position
core.Deliver(ctx, event, []byte(strconv.FormatInt(update.ID, 10)))

// Retrieve it from req.Cursor on the next startup
func (demo) Start(ctx context.Context, req adapter.StartRequest, core adapter.Core) (adapter.Instance, error) {
	offset, _ := strconv.ParseInt(string(req.Cursor), 10, 64)
	// Receive updates after offset
}
```

Choose the cursor format yourself; Core stores it. Pass `nil` when unnecessary.

## Validate accounts at startup

Validate account settings in `Start`, for example by calling the platform identity endpoint with the token. Return errors immediately so owners see invalid credentials in management.

For a permanent runtime disconnection, such as a revoked token, call `core.ReportFailure`.

## Platform permissions

Declare platform roles in `Descriptor` and include verified permissions in `Actor.Permissions`. Prefix names with the platform ID, such as `demo.group_owner`. Export constants from a `perm` package for plugin authors.

## Platform-specific events and segments

In the Adapter's public packages, declare extension events with `adapter.Event[T](name, version)` and extension message segments with `adapter.Extension[T](name, version)`, where `T` is a struct. The framework derives the Schema from the type: fields without `omitempty` are required and extra fields are rejected. If derivation fails, `sdk.RunAdapter` errors at startup. Plugins subscribe with `sdk.AdapterEvent[T]` (see [Matching](../advanced/matching.md#platform-specific-events)) and send extension segments with `message.Extension(...)`.

## Platform command menus

If the platform has command menus, declare the `commands.sync` capability and implement `adapter.CommandMenuController`:

- `CommandMenuConfig()` returns the account's `AutoSyncCommands` and `ClearCommandsOnDisable` settings.
- `SetCommandMenu`, `GetCommandMenu` and `DeleteCommandMenu` each handle the whole menu for one location (scope plus language).

The framework handles per-language splitting, ownership and automatic or manual mode; the Adapter only writes whole menus to the platform and returns platform errors in full. For plugin usage see [Platform command menus](../tutorial/commands.md#platform-command-menus).

## Platform callbacks

For webhook delivery, declare an HTTP route in `Descriptor`:

```go
return &adapter.Descriptor{
	AdapterID: adapterID,
	HTTP: []adapter.HTTPRoute{{
		Method:  http.MethodPost,
		Path:    "/webhook",
		Auth:    adapter.AuthPlatformToken,
		Handler: http.HandlerFunc(handleWebhook),
	}},
}
```

The URL is `<base_url>/plugins/<component-ID>/webhook`. `AuthPlatformToken` declares a public endpoint whose Handler verifies the platform signature or token.

`Auth` can also be `adapter.AuthStatic`, which serves GET and HEAD static assets publicly without login or platform credentials. Omitting `Auth` requires the owner to be logged in to the WebUI.

## Testing

Use `net/http/httptest` to simulate platform APIs. Connect the Adapter to it to test disconnections, timeouts, and error responses.

Use `plugintest.Adapter("demo", ...)` to test a plugin with your platform identifier and permission declarations.

## Publish

Follow [Packaging and publishing](../advanced/publish.md). Prefix the component ID with `alonabot-adapter-`.

## Account configuration pages

Provide QR sign-in, authorization, or token validation through an Adapter account page. WebUI opens it when adding or editing an account:

```go
HTTP: []adapter.HTTPRoute{{
    Method: http.MethodGet,
    Path: "/account/",
    Handler: http.HandlerFunc(serveAccountPage),
    Page: &adapter.PageDescriptor{Title: "Connect account", Purpose: adapter.PageInstanceConfig},
}},
```

Load `kit.js`. `AlonaBot.getConfigContext()` returns creation or editing mode, account ID, and current configuration. Submit a patch with `AlonaBot.completeConfig({patch})`. Load `qrcode.js` when needed.

- Each Adapter has at most one account configuration page; `Title` is required and `Auth` stays zero (login required).
- `getConfigContext()` returns `mode` (`create` or `edit`), `instance_id`, the current form configuration (secrets masked) and the instance configuration Schema. In `create` mode `instance_id` is only a draft name, so never persist data under it; login tasks use a random ID the Adapter generates.
- `completeConfig({patch})` merges into the form per RFC 7396 and the user still saves the dialog: omitted fields keep their values and `null` deletes a field. Write plaintext for new or replaced secrets; omit a secret to keep it.
- Outside the account configuration dialog, both calls reject with `FAILED_PRECONDITION`.
- Credentials that need refreshing at run time are stored by the Adapter in its own storage keyed by account ID; the configuration holds only the account identity. Poll login status about every two seconds.

For QR login, load `qrcode.js` from the same directory after `kit.js`, then call with the platform's login text:

```js
AlonaBot.renderQRCode(document.getElementById("login-code"), loginURL, { size: 256 });
```

It replaces the container content with a themed QR code SVG.

## Live debugging

```fish
alonabot adapter instance list
alonabot adapter actions main
```

Query account operations and input schemas, then invoke `alonabot adapter call main <operation> --params '{}'`. Go tools can access the same management API through `sdk/debug`.
