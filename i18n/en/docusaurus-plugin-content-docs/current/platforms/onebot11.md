---
title: OneBot 11
description: Connect QQ and other platforms through OneBot 11.
---

OneBot 11 is a general bot protocol. AlonaBot communicates with QQ through an implementation such as NapCat or Lagrange.

## Connect

After configuring an account, Core installs and enables the official OneBot 11 Adapter at startup. First use requires internet access. [Reinstall manually](../usage/install.md#install-official-components) if you previously uninstalled it.

1. Install and sign in to a OneBot 11 implementation. Enable **forward WebSocket** and note the address, such as `ws://127.0.0.1:3001`, and access token.

2. Add this to `core_config.json`:

```json title="core_config.json"
{
  "adapters": {
    "onebot11": {
      "instances": {
        "qq": {
          "ws_url": "ws://127.0.0.1:3001",
          "access_token": "${ONEBOT_TOKEN}"
        }
      }
    }
  }
}
```

3. Restart Core.

## Account settings

| Key | Default | Meaning |
| --- | --- | --- |
| `ws_url` | Required | Forward WebSocket address of the OneBot implementation |
| `access_token` | Empty | Access token, if required by the implementation |

## Message format and reconnection

- Configure the implementation to report messages in **array format** rather than CQ-code strings.
- The Adapter reconnects automatically after disconnection.

## Query account operations

See [Query account capabilities](index.md#query-account-capabilities).
