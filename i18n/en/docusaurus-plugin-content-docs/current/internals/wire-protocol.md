---
title: Wire protocol
description: Transport between Core and native components.
---

Use this reference when implementing a component in another language or diagnosing transport problems. Go SDK users can normally use its typed APIs directly. Field definitions live in the [Core Protobuf source](https://github.com/AlonaBot/AlonaBot/tree/v0.2.0/contracts/proto/alonabot/v1); session semantics are in the [development guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#protocol-and-session-behavior).

import WireFrame from "@site/static/img/diagrams/wire-frame.en.svg";

## Connection

Core launches the component and establishes either TCP to a random local listener (default) or stdin/stdout transport. Reserve stdout for protocol bytes and write logs to stderr. The SDK already routes its logger correctly.

Each process receives a random session credential. Core authenticates it before sending configuration.

## Frames

<div className="doc-diagram-scroll"><WireFrame className="doc-diagram" /></div>

A frame begins with a four-byte unsigned big-endian payload length, followed by a Protobuf envelope. The payload limit is 4 MiB. Zero length, oversized payloads and decoding failures close the connection.

## Frame types

| Type | Direction | Purpose |
| --- | --- | --- |
| HELLO / HELLO_ACK | Component → Core / reverse | Authenticate and negotiate protocol |
| REGISTER | Component → Core | Declare commands, events and services |
| PREPARED | Core → component | Accept preparation and registration |
| ACTIVATE / ACTIVATED | Core → component / reverse | Activate the component |
| REQUEST / RESPONSE | Both | Call and result |
| CANCEL | Both | Cancel an outstanding call |
| EVENT | Both | Notification requiring no response |
| STOPPING | Core → component | Request shutdown |
| HEARTBEAT | Both | Liveness |
| SESSION_ERROR | Both | Unrecoverable session error |

## Calls

Each REQUEST has an ID echoed by its RESPONSE; calls can overlap and complete out of order. Every request carries a deadline. Child calls inherit an equal or earlier cutoff. Concurrent-call and byte budgets reject excess calls immediately.

## Cancellation and timeouts

Cancellation asks the peer to stop, but an operation may already have completed. A timeout means no result arrived before the deadline. The protocol avoids automatic side-effect retries; callers receive the error and decide how to proceed.

## Versions

Transport protocol version is 1.0, independent of the framework release. Different majors reject the connection; different minors negotiate the lower minor. Components must also satisfy manifest, Admin API, capability and payload schema_version requirements. Features such as command menus require the corresponding Core and Adapter versions.
