---
title: Wire protocol
description: Communication between Core and component processes.
---

Use this reference when implementing components in another language or debugging communication. The Go SDK handles the protocol for Go components.

import WireFrame from "@site/static/img/diagrams/en/wire-frame.svg";

## Connection

Core establishes one connection after starting a component process:

| Transport | Behavior |
| --- | --- |
| TCP (default) | Core listens on a random localhost port; the component connects |
| Standard input/output | Component stdin and stdout carry protocol data |

**Keep stdout reserved for protocol data.** Write logs to stderr, as the SDK does.

Each process receives a random credential at startup and presents it immediately after connecting. Core verifies it before sending configuration or other data.

## Frames

The connection carries frames:

<div className="doc-diagram-scroll"><WireFrame className="doc-diagram" /></div>

The length is a big-endian unsigned integer excluding its own 4 bytes. Frames are limited to 4 MiB. Zero-length, oversized, or undecodable frames close the connection.

## Frame types

| Type | Direction | Purpose |
| --- | --- | --- |
| HELLO / HELLO_ACK | Component → Core / Core → component | Handshake and protocol version negotiation |
| REGISTER | Component → Core | Declare commands, events, and services |
| PREPARED | Core → component | Accept registration |
| ACTIVATE / ACTIVATED | Core → component / component → Core | Begin operation |
| REQUEST / RESPONSE | Both | Call and result |
| CANCEL | Both | Cancel an active call |
| EVENT | Both | Notification without a response |
| STOPPING | Core → component | Request shutdown |
| HEARTBEAT | Both | Check peer liveness |
| SESSION_ERROR | Both | Report an unrecoverable error |

## Calls

Handler calls and component requests to Core both use REQUEST and RESPONSE:

- Each REQUEST has an ID echoed by its RESPONSE. Concurrent calls can complete in any order.
- Each REQUEST carries a deadline. Child calls cannot outlive the parent deadline.
- In-flight call count and total size have limits. New calls fail immediately when a limit is reached.

## Cancellation and timeouts

Cancellation asks the peer to stop, though work may already be complete. A timeout means the caller did not receive a result in time.

Calls with side effects, such as sending messages, are never retried automatically. The SDK returns cancellation and timeout errors for the caller to handle.

## Versioning

The protocol version is independent of the framework version. It is currently 1.0.

Peers exchange versions during the handshake. Different major versions reject the connection; different minor versions negotiate the lower one. Plugins compiled with an older SDK can therefore run on a newer Core with the same protocol major version.
