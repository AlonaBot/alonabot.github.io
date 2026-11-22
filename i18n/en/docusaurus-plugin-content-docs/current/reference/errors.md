---
title: Error codes
description: SDK error codes and common causes.
---

SDK errors carry a code. Inspect it with errcode.Of:

```go
import "github.com/AlonaBot/AlonaBot/sdk/errcode"

	_, err := c.Edit(ref, message.Text("Done."))
	if errcode.Of(err) == errcode.Unsupported {
		return c.Reply("Done.")
	}
	return err
```

Non-SDK errors yield zero. Return a coded error from your own [service](../advanced/services.md) when appropriate:

```go
return out, errcode.NotFound.New("city not found")
return out, errcode.InvalidArgument.Errorf("invalid city %q", in.City)
```

Use English error text and exclude secrets.

## Codes

| Constant | Meaning and common causes |
| --- | --- |
| InvalidArgument | Invalid input: empty message, malformed session ID or button data over 1024 bytes |
| Unauthenticated | Authentication failed |
| PermissionDenied | Missing explicit-send permission, LLM allow-list access or access to another plugin's private service |
| NotFound | Missing service or task |
| AlreadyExists | A Wait already exists for that user in the same session |
| FailedPrecondition | Sending in OnStart, using Context after its Handler, or a message-specific operation from background work |
| Unsupported | Platform lacks the requested feature, such as editing or buttons |
| ResourceExhausted | Admission or size limit exceeded |
| DeadlineExceeded | Wait expired, Handler exceeded 30 seconds or a service was too slow |
| Cancelled | Call cancelled, including during shutdown |
| Unavailable | Component absent, disabled or failed to wake; no model configured; platform disconnected |
| Internal | Internal failure or Handler panic |
| CallCycle | Service cycle, including a Handler calling its own plugin's service |
| NoDefaultTarget | Reply without a current chat, such as in a task or broadcast; use SendTo |
| PluginNotReady | Component has not reached readiness |
| ProtocolError | Session protocol failure; report it with full diagnostics |
| NeedsManualMigration | External data preparation needs operator confirmation |

## After timeout or cancellation

DeadlineExceeded and Cancelled mean the caller did not receive a result. The side effect may already have happened. Avoid automatic retries of sends or other side effects.

## Handler failures

Core records a returned error in logs and the management UI. Send a reply explicitly if the user needs to know. Other plugins may continue handling the event.
