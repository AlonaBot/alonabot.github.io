---
sidebar_position: 3
title: Wire Protocol
description: Frame format, transports and call semantics between Core and components.
---

Core and every component process speak the same protocol. Product version v0.1 and transport protocol version **1.0** are numbered separately. Field-level definitions live in [WIRE-FORMAT.md](https://github.com/AlonaBot/AlonaBot/blob/main/spec/WIRE-FORMAT.md).

## Frames

Each frame is a **4-byte big-endian unsigned length + Protobuf Envelope**. The length excludes the prefix and must be 1 to 4,194,304 bytes (4 MiB). A zero, oversized, undecodable or out-of-state frame fails the session; there is no attempt to resynchronize.

Key Envelope fields:

| Field | Meaning |
| --- | --- |
| `protocol_major` / `protocol_minor` | 1.0 at launch; major mismatch rejects the handshake, minor takes the lower of both sides |
| `session_id` | A 16-byte random ID assigned by Core from HELLO_ACK on |
| `initiator_side` + `call_id` | With `session_id`, the call match key; allows concurrent, out-of-order responses |
| `kind` | HELLO, HELLO_ACK, REGISTER, PREPARED, ACTIVATE, ACTIVATED, REQUEST, RESPONSE, CANCEL, EVENT, STOPPING, HEARTBEAT, SESSION_ERROR |
| `deadline_unix_ms` | Required on REQUEST; a child request cannot extend its parent's deadline |
| `payload_encoding` / `schema_id` / `schema_version` | Payload as Protobuf or JSON, with contract ID and version |
| `error` | ErrorInfo on failure; `safe_message` never contains secrets, stack traces or absolute local paths |

## Transports

- **TCP** (default): Core holds a loopback listener on port 0.
- **stdio** (optional): stdout carries only protocol frames and logs go to stderr. So plugins must **never write to stdout**.

Both transports use identical encoding. Each process gets its own random credential and session; Core sends Bootstrap only after the full first frame authenticates.

## Call semantics

- Frame reading and response matching are independent of handlers; a single writer keeps frames from interleaving; control frames, responses and cancels are never blocked behind business traffic.
- In-flight calls have count and byte budgets. Over budget is rejected immediately; nested calls never wait on their own budget.
- **Calls with side effects are never retried automatically.** Cancellation is cooperative and a late response never completes a request; a timeout or cancel does not mean the other side did nothing.
- Core records the parent of each Service and Send call and never trusts an Actor or permissions submitted by a plugin.
