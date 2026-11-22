---
title: Platform capabilities
description: Compare v0.2.0 adapters and their concrete limits.
---

These entries describe released v0.2.0 adapters. Runtime capability reports, platform permissions and endpoint behavior determine each operation.

| Feature | Telegram | OneBot11 |
| --- | --- | --- |
| Private/group text send and receive | Yes | Yes |
| Images, video, voice, files | Yes; getFile up to 20 MiB | Yes; reachable URL or shared storage |
| Reference replies / reading referenced content | Replies; no generic historical-node reading | References and recursive node reading |
| Image/video albums | Consecutive groups up to 10 | Separate media sends |
| Buttons and callbacks | Yes | Unavailable |
| Editing | One text plus optional buttons | Unavailable |
| Streaming | Throttled edits, splitting at text limit | One send after normal completion |
| Message deletion | Yes, platform rules apply | delete_msg with per-item results |
| Incoming recall events | No mapping | Yes |
| Incoming edits | Yes | No mapping |
| Membership events | Yes | Yes |
| Reaction events | Yes | No mapping |
| Owner/admin permissions | Yes | Yes |
| Stickers/animation | Static inbound stickers as images; GIF animation sending | Protocol media/extensions |
| Merged forwards and recursive nodes | Unavailable | Yes; SnowLuma issue below |
| Scoped command menus | Automatic/manual, account/chat/language | Unavailable |
| Typed actions/events | action and event packages | client and event packages |

## Handle unavailable operations

```go
_, err := c.Edit(ref, message.Text("Done."))
if errcode.Of(err) == errcode.Unsupported {
    return c.Reply("Done.")
}
return err
```

Import sdk/message and sdk/errcode. Provide a specific alternative for Unsupported; return other errors unchanged. c.Stream already selects editing or end-of-stream sending. Node reads and media operations can retain partial output with an error.

## Details

- [Telegram](telegram.md): polling, proxies, media, actions and menus.
- [OneBot11](onebot11.md): WS modes, media and the SnowLuma v2.4.2 empty-m_resid issue.

## Terminal chat

The development console supports text, button numbers and edits; media appear as placeholders. Test real rendering and platform permissions after connecting an account.
