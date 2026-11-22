---
title: Write an Adapter
description: Connect a new chat platform to AlonaBot.
---

An Adapter translates platform events into AlonaBot messages and turns outgoing message chains into platform API calls. This tutorial uses a timer as the message source; replace it with your platform client when the complete path works.

## Create a project

```fish
alonabot init alonabot-adapter-demo --role adapter --adapter-id demo
cd alonabot-adapter-demo
```

The generated project contains `adapter.go`, `plugin.yaml`, `adapter_config_schema.json` and `go.mod`. `--adapter-id demo` selects the platform namespace, producing user and session IDs such as `demo:alice`.

## Implement the interfaces

```go
type Adapter interface {
	Descriptor() *Descriptor
	Start(ctx context.Context, req StartRequest, core Core) (Instance, error)
}
type Instance interface {
	Account() Account
	Capabilities() []message.Capability
	Send(ctx context.Context, to string, chain message.Chain) (*message.SendResult, *errcode.Error)
	Stop(ctx context.Context) error
}
```

Core calls `Start` once for each configured account. Return an independent `Instance` for that account.

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
func New() adapter.Adapter { return demo{} }

func (demo) Descriptor() *adapter.Descriptor {
	return &adapter.Descriptor{AdapterID: adapterID, Capabilities: capabilities}
}

var capabilities = []message.Capability{
	{Name: "message.created", Version: 1, Supported: true},
	{Name: "message.send", Version: 1, Supported: true},
}

func (demo) Start(ctx context.Context, req adapter.StartRequest, core adapter.Core) (adapter.Instance, error) {
	var config struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(req.ConfigJSON, &config); err != nil {
		return nil, err
	}
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

Declare the account settings:

```json title="adapter_config_schema.json"
{
  "name": { "type": "string", "description": "Display name", "default": "Demo Bot" }
}
```

The schema uses the same format as [plugin settings](../reference/config-schema.md).

## Run it

An Adapter needs a configured account. Add this section to `data/core_config.json`:

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

Run it alongside the plugin from [Quick start](../quick-start.md):

```fish
alonabot run . ../alonabot-plugin-hello
```

Every ten seconds the log should contain:

```text
send to=demo:alice text="Hello AlonaBot"
```

The timer delivered `/hello`, Core dispatched it to the plugin, and the reply reached your Adapter's `Send` method.

## Third-party source

To debug an existing third-party Adapter, obtain its source directory containing `plugin.yaml`. The CLI builds and loads that directory locally. Use the project's own account schema and instructions.

For example, run an Adapter in `./qq-adapter` with your plugin:

```fish
alonabot run ./qq-adapter ./my-plugin --data-dir ./qq-source-data --log-level debug
```

In another terminal, create an account using the same data directory. Replace `alonabot-adapter-qq` with the ID in its manifest:

```fish
alonabot adapter instance create alonabot-adapter-qq qq-main --config ./qq-account.json --data-dir ./qq-source-data
```

Saving either project's code rebuilds and restarts that component. Keep development in a separate data directory: duplicate component IDs or platform IDs among installed and development components cause startup to fail.

## Deliver incoming messages

Call `core.Deliver` with a `message.Event` containing:

| Field | Meaning |
| --- | --- |
| `ID` | Event ID, unique within the account |
| `Type` | `message.created` for a new message |
| `Session` | Build with `message.SID(adapterID, chatID, topicID)` |
| `ChatType` | `message.ChatPrivate`, `message.ChatGroup` or `message.ChatChannel` |
| `Actor.ExternalUserID` | User ID authenticated by the platform |
| `Payload` | Typed event payload; `ToMe` marks private messages, mentions and replies to the bot |

Derive identity from platform metadata. Core uses this identity to authorize commands. The final `Deliver` argument is an optional [cursor](#resume-after-reconnecting).

## Send messages

Translate every segment in `chain` to the platform API.

- Return `errcode.Unsupported.New("...")` for unsupported content.
- If a chain becomes several platform messages, record each part in `PartResults` with its original `SegmentIndexes`.
- If only some parts succeed, return those results together with the error and set `Status` to `message.SendPartial`.
- Leave side-effect retries to the caller: a timed-out send may already have reached the platform.

## Declare capabilities

Core checks capabilities before sending and returns `UNSUPPORTED` when the account lacks a required feature.

| Capability | Meaning |
| --- | --- |
| `message.created`, `message.edited`, `message.deleted` | Emits the corresponding events |
| `member.joined`, `member.left` | Emits membership events |
| `message.send` | Sends messages |
| `message.edit` | Edits messages; also implement `adapter.Editor` |
| `message.buttons`, `button.clicked` | Sends buttons and emits clicks |
| `message.album` | Groups images into albums |
| `message.reference` | Sends quoted replies |
| `message.markdown` | Renders formatted text |

Declare each capability only after implementing it.

## Stop an account

Cancel message reception and wait for its goroutines before returning from `Stop`. Delivery must end before `Stop` returns.

## Resume after reconnecting

For platforms with sequential update IDs, pass the last processed position as a cursor and recover it from `req.Cursor` on startup. Add `strconv` to your imports. Call `readOffset(req.Cursor)` from `Start`, handle the error, and resume after that offset. Delivery records the processed update ID:

```go
func deliverUpdate(ctx context.Context, core adapter.Core, event *message.Event, updateID int64) error {
	_, err := core.Deliver(ctx, event, []byte(strconv.FormatInt(updateID, 10)))
	return err
}

func readOffset(cursor []byte) (int64, error) {
	if len(cursor) == 0 {
		return 0, nil
	}
	offset, err := strconv.ParseInt(string(cursor), 10, 64)
	if err != nil {
		return 0, fmt.Errorf("parse cursor: %w", err)
	}
	return offset, nil
}
```

Core persists the opaque bytes. Pass `nil` if the platform has no cursor.

## Validate accounts on startup

Validate account settings in `Start`, for example by calling the platform's identity endpoint. Return the original failure so the owner can correct a bad token immediately. If an account permanently fails later, call `core.ReportFailure`.

## Platform permissions

Declare platform permissions in `Descriptor` and attach the platform-verified permissions to `Actor.Permissions`. Prefix names with the platform ID, such as `demo.group_owner`. Export constants from a separate `perm` package for plugin authors.

## Receive webhooks

Declare a platform callback route in `Descriptor`:

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

Its URL is `<base_url>/plugins/<componentID>/webhook`. `AuthPlatformToken` makes the route publicly reachable; the Handler verifies the platform signature or token.

## Test and publish

Use a local `net/http/httptest` service to reproduce disconnects, timeouts and platform errors. When testing a plugin together with your Adapter, `plugintest.Adapter("demo", ...)` supplies the platform namespace and permission declarations.

Follow [Packaging and publishing](../advanced/publish.md). Public Adapter IDs start with `alonabot-adapter-`.
