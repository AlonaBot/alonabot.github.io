---
title: Glossary
description: Terms used throughout the documentation.
---

| Term | Meaning |
| --- | --- |
| **Core** | Main bot program, the `alonabot` command. Routes messages, checks permissions, sends replies, and manages components |
| **Component** | Independently installable plugin, Adapter, Agent, or WebUI |
| **Plugin** | Component providing commands, tasks, pages, and other bot features |
| **Adapter** | Component connecting a chat platform, such as Telegram |
| **Agent** | Component providing AI conversations and shared model access |
| **WebUI** | Browser management interface |
| **Platform** | Chat service, such as Telegram or QQ |
| **Bot account** | One account on a platform; multiple accounts are supported. Also called an instance |
| **Chat session** | Private chat, group, or topic within a group |
| **Handler** | Function invoked for a command or event |
| **Argument binding** | Passing parsed command arguments into function parameters or struct fields |
| **Payload** | Event-specific data, such as a message chain or joined member |
| **Context** | First Handler parameter, `c`; represents the call and provides user, session, and reply APIs |
| **Command** | Message beginning with a prefix, `/` by default, such as `/help` |
| **Event** | Platform occurrence, such as a message, member join, or button click |
| **Chain** | Message content composed of segments |
| **Segment** | Part of a message: text, image, or mention |
| **Rule** | Function deciding whether a Handler should process a message |
| **Permission** | Controls who can invoke a command |
| **Bot administrator** | User listed in `admins`, with access to administrator commands |
| **Management token** | Credential for WebUI and management commands, separate from bot administrator identity |
| **Data directory** | Core settings and data, `data/` by default |
| **Configuration field** | Owner-adjustable value declared in `plugin_config_schema.json` |
| **Secret** | Field marked `secret`, such as an API key; its saved value is hidden in the interface |
| **Profile** | Configuration overrides assigned to a bot account or session |
| **Service** | Plugin functionality callable by other plugins |
| **Broadcast** | Subscribable notification with best-effort delivery |
| **Tool** | Service available to AI during conversations |
| **Hook** | Logic inserted into processing stages |
| **Subplugin** | Feature-based organization within a plugin |
| **Capability** | Platform feature, such as editing or buttons |
| **Terminal chat** | Development chat opened by `alonabot run` |
| **Package** | Component archive produced by `alonabot pack` |
| **Generation** | Component executable, configuration, and database state created by installation, update, or configuration change |
| **Protocol session** | Connection between a component process and Core, recreated at each startup |
