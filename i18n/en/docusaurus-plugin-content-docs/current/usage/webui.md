---
title: WebUI
description: Manage the bot in your browser.
---

WebUI provides browser-based management. Docker Compose enables it on first startup. For archives or the installation script, [install and enable the component](install.md#install-official-components).

## Sign in

Open `http://127.0.0.1:7650` or your configured `base_url` and enter the management token.

On first local access, copy the displayed token and confirm you have saved it. You can also read it with `alonabot admin-token show --data-dir <data-directory>`. Credentials are stored in `admin_token`.

## Pages

| Page | Purpose |
| --- | --- |
| Overview | Runtime status and message statistics |
| Plugins | Install, enable, disable, update, edit configuration, and open plugin pages |
| Store | Browse components, upload platform archives, or build from GitHub source |
| Bot accounts | Add, start, and stop accounts; scan codes or authorize through Adapter pages |
| Profiles | Assign different settings to groups; see [Profiles](../advanced/profiles.md) |
| Permissions | Set command access and rename commands |
| Logs | View and search live logs |
| Data | View and edit plugin data |
| Settings | Core settings |

The interface supports Chinese and English, with light and dark themes.

Use the [CLI](manage.md) to install and manage components without a browser.

## Edit plugin configuration

Edit the form in plugin details and save. Reload the plugin to apply changes; the interface prompts you.

Saved secrets display as set without revealing the value. Enter a new value to replace one.

## Replace the interface

WebUI is itself a component. You can replace it with a community interface:

```sh
alonabot install <webui-component> --replace --yes
```
