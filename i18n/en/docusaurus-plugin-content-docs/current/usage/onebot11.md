---
title: OneBot11
description: Connect forward or reverse WebSocket and read recursive message nodes.
---

Connect a logged-in protocol implementation such as NapCat, Lagrange or SnowLuma. Choose forward or reverse WebSocket; account policies and platform-specific capabilities follow that implementation's documentation.

## Forward WebSocket {#forward-ws}

Enable a Universal forward WebSocket and array-format message reports in the protocol endpoint, then merge:

```json
{
  "adapters": {
    "onebot11": {
      "default_instance": "qq-main",
      "instances": {
        "qq-main": {
          "mode": "forward",
          "ws_url": "ws://127.0.0.1:3001",
          "access_token": "${ONEBOT_TOKEN}"
        }
      }
    }
  }
}
```

Set ONEBOT_TOKEN in Core's environment and restart Core. First use installs the official adapter; previously uninstalled adapters need [reinstallation](install.md#official-components). Startup and each reconnect verify get_login_info and report account changes as failures.

Install help and send /help to check receiving and sending:

```fish
alonabot install --source AlonaBot/alonabot-plugin-help --yes
alonabot enable alonabot-plugin-help-official --yes
```

## Reverse WebSocket {#reverse-ws}

Save a reverse instance:

```json
{
  "adapters": {
    "onebot11": {
      "instances": {
        "qq-reverse": {
          "mode": "reverse",
          "self_id": "10001",
          "access_token": "${ONEBOT_REVERSE_TOKEN}"
        }
      }
    }
  }
}
```

Configure the protocol endpoint's Universal reverse connection:

```text
ws://127.0.0.1:7650/plugins/alonabot-adapter-onebot11/ws/qq-reverse
```

For remote deployments use the wss address matching base_url and an HTTPS [reverse proxy](settings.md#domain-access). Send X-Self-ID matching self_id, X-Client-Role: Universal and a Bearer token; access_token query authentication is also accepted. An occupied instance returns 409, identity/role mismatch 403, and authentication failure 401.

The instance waits for the protocol endpoint and verifies get_login_info after connecting. Actions and sends report unavailable while disconnected; the protocol endpoint initiates reconnection.

## Multiple instances

Mix modes under adapters.onebot11.instances with globally unique names. Each connection is independent. Select an instance with sdk.Via or default_instance.

| Field | Default | Purpose |
| --- | --- | --- |
| mode | forward | forward or reverse |
| ws_url | empty | Required ws/wss URL for forward mode |
| access_token | empty | As required by forward endpoint; required in reverse mode |
| self_id | empty | Required positive account ID string in reverse mode |
| media_url_base | empty | Reachable temporary-media root; empty uses Core configuration |
| media_dir.local | empty | Writable shared directory seen by Adapter |
| media_dir.remote | empty | Same directory seen by endpoint; empty uses local |

Forward connections reconnect with backoff and verify identity again. Requests already written can have unknown results; preserve those errors before deciding further action.

## Messages and media

Supports text, images, video, voice, files, mentions, references, faces, mention-all and merged forwarding. Sessions look like `onebot11:private:10001` or `onebot11:group:123456`. Save c.Session and c.Event().Ref instead of assembling them manually.

HTTPS URLs are downloaded by the protocol endpoint; inline data uses base64. Managed references use Core temporary URLs by default. For separate hosts/containers, set a reachable media_url_base and check routing and expected Host.

A shared-directory alternative:

```json
{
  "media_dir": { "local": "/srv/alonabot/media", "remote": "/app/media" }
}
```

This is an instance configuration fragment. Create the directory first, mount the same files into both processes and grant read/write access. Adapter creates a temporary file, submits the endpoint's file:// path, then cleans up when the parent operation ends.

Incoming media can be opened through media.Open; file IDs are resolved with private/group file APIs. Unreadable sources preserve their marker and raw platform details. c.Delete calls delete_msg in input order and leaves later entries unattempted after a failure. Markdown, buttons, edits and platform albums currently return UNSUPPORTED. Streaming sends the buffered text once after normal completion.

## Typed events and actions

Standard events include new messages, recalls and member joins/leaves. Use the public event package:

```go
import obevent "github.com/AlonaBot/alonabot-adapter-onebot11/event"
p.On(obevent.Poke).Handle(func(c *sdk.Context, e *obevent.Target) error {
    return c.Reply("Poke received for " + e.TargetID)
})
```

It also exposes LuckyKing, Honor, GroupAdmin, GroupBan, GroupUpload, FriendAdd, FriendRequest, GroupRequest and InputStatus. Notice/Request preserve unknown reports as complete JSON strings.

Bind the typed client to the trusted current instance:

```go
import obclient "github.com/AlonaBot/alonabot-adapter-onebot11/client"

func group(c *sdk.Context) error {
    bound, err := obclient.From(c)
    if err != nil {
        return err
    }
    info, err := bound.GetGroupInfo(obclient.GetGroupInfoParams{})
    if err != nil {
        return err
    }
    return c.Reply(info.Value.GroupName)
}
```

Import sdk as well. Actions cover group/friend/account queries, moderation, approvals, file URLs, pokes and likes. Query results preserve both Value and full Raw JSON. See the [public client](https://github.com/AlonaBot/alonabot-adapter-onebot11/tree/v0.2.0/client) for declared methods and types.

## References and recursive forward nodes {#forward-nodes}

c.ReadNodes resolves a ForwardSegment. The bound client also offers ReadReply(reference), requiring the same chat and instance. Results are recursive `[]message.ForwardItem` with author, time, chain and media sources.

```go
func inspect(c *sdk.Context, forward message.ForwardSegment) error {
    nodes, err := c.ReadNodes(forward)
    if err != nil {
        return err
    }
    return c.Reply(fmt.Sprintf("Read %d top-level nodes", len(nodes)))
}
```

This helper imports fmt, sdk and sdk/message and is called by an inbound handler. Traverse nested ForwardSegment.Items; use media.Open on authorized node media. Queries support the standard message array and SnowLuma messages array, parse CQ text at the query boundary, and recursively expand child resources and references. Cycles or read failures return partial nodes together with a path-bearing error; handle the error before using partial content.

Send ForwardItems to build merged messages. Pure nested nodes use node arrays; mixed text and child forwards upload the child resource before the parent send. Receipts preserve partial success and errors.

:::warning SnowLuma v2.4.2
Real tests found empty m_resid values in nested forward XML, affecting some group reverse sends and complete reading of mixed text/child forwards. Adapter retains parsed nodes and returns the original path-bearing UNSUPPORTED error. Inspect the protocol response, use ordinary messages or flattened nodes where appropriate, and retain diagnostics for the endpoint maintainer.
:::

See the [platform matrix](platforms.md) and [implementation status](../internals/status.md).
