---
title: Management interface
description: Use the browser to manage components and accounts.
---

Compose enables WebUI on first start. Archive/script users [install and enable it](install.md#official-components).

## Sign in

Open `http://127.0.0.1:7650` or the configured base_url. Core saves admin_token and prints its location. The first local page shows the pending credential for saving and confirmation; login retains the file. For a remote browser read it with admin-token show on the server. If the file is lost, stop Core and reset it; existing credentials and sessions are revoked.

## Pages

| Page | Purpose |
| --- | --- |
| Overview | Runtime and message statistics |
| Plugins | Install, enable, disable, update and configure; open plugin pages |
| Store | Browse configured sources and install platform archives or upload one archive |
| Accounts | Add and control platform instances |
| Profiles | Assign effective settings by chat or account |
| Permissions | Route permissions, names and policy |
| Logs | Live viewing and filtering |
| Data | Managed tables, KV and plugin files; retained generations are read-only |
| Settings | Core settings |

The interface supports English/Chinese and light/dark themes. [CLI management](manage.md) is available on headless servers.

## Configuration

Save the component form, then reload when prompted. Secret fields show configured state rather than the existing plaintext; enter a new value to replace one.

## Another WebUI

The official package contains a Go backend and static frontend in one platform archive. Replace it with another component:

```fish
alonabot install ./alternative-webui.tar.gz --replace --yes
```

Review the confirmation and retain your Core data directory for recovery.
