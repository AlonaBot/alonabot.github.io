---
title: Error codes
description: SDK error codes and common causes.
---

SDK errors carry a code. Inspect it with `errcode.Of`:

```go
import "github.com/AlonaBot/AlonaBot/sdk/errcode"

	_, err := c.Edit(ref, message.Text("Done."))
	if errcode.Of(err) == errcode.Unsupported {
		return c.Reply("Done.")
	}
	return err
```

`errcode.Of` returns `0` for errors originating outside the SDK.

Return a coded error from your own code, such as a [service](../advanced/services.md) Handler:

```go
return out, errcode.NotFound.New("city not found")
return out, errcode.InvalidArgument.Errorf("invalid city %q", in.City)
```

Write error messages in English and exclude secrets.

## Error reference

| Constant | Meaning | Common causes |
| --- | --- | --- |
| `InvalidArgument` | Invalid argument | Empty message; malformed session ID; button data over 1024 bytes |
| `Unauthenticated` | Authentication required | |
| `PermissionDenied` | Access denied | Proactive sending disallowed; model access denied; private service call |
| `NotFound` | Target absent | Unknown service or task |
| `AlreadyExists` | Duplicate resource | Another `Wait` for this user in this session |
| `FailedPrecondition` | Unmet precondition | Sending in `OnStart`; using `c` after the Handler returns; calling a message-specific API from a background goroutine |
| `Unsupported` | Unsupported by the platform | Editing or buttons unavailable |
| `ResourceExhausted` | Resource or quota exhausted | Excessive call rate or oversized content |
| `DeadlineExceeded` | Deadline expired | `Wait` timeout; Handler exceeded 30 seconds; slow service |
| `Cancelled` | Call cancelled | Plugin shutdown |
| `Unavailable` | Temporarily unavailable | Provider stopped; model unconfigured; platform disconnected |
| `Internal` | Internal failure | Handler panic |
| `CallCycle` | Circular call | Service A calls B which calls A; Handler calls its own plugin's service |
| `NoDefaultTarget` | No default destination | `c.Reply` in a task or broadcast Handler; use `c.SendTo` |
| `PluginNotReady` | Plugin not ready | |
| `ProtocolError` | Communication failure | Usually a framework issue; please report it |
| `NeedsManualMigration` | Manual data migration required | |

## After timeout or cancellation

`DeadlineExceeded` and `Cancelled` mean **the caller did not receive a result**. The operation may already have completed; a timed-out send may have delivered the message. Avoid automatic retries of operations with side effects.

## Handler errors

- Errors are recorded in logs and shown to owners in management.
- Send an explicit `c.Reply` to explain the problem to the user.
- Other plugins continue processing the message.
