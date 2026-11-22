---
title: Glossary
description: Names used throughout the documentation.
---

| Term | Meaning |
| --- | --- |
| Core | The alonabot host: routes events, checks permissions, sends replies and manages components |
| Component | An independently installable plugin, Adapter, Agent or WebUI |
| Plugin | Bot functionality: commands, tasks, pages and services |
| Adapter | Integration with a chat platform |
| Agent | AI conversations and model access for other plugins |
| WebUI | Browser management interface |
| Platform | Chat software such as Telegram or QQ |
| Account / instance | One configured bot account; a platform can have several |
| Chat session | A private chat, group or topic |
| Handler | Your callback invoked for a command, event or task |
| Context | The Handler argument c, containing caller identity, effective settings and reply methods |
| Command | A message starting with a configured prefix, normally / |
| Event | A message, membership change, button click or other occurrence |
| Chain | Ordered message segments |
| Segment | Text, image, mention or another part of a message |
| Rule | Predicate deciding whether a Handler applies |
| Permission | Authorization required to invoke a route |
| Bot administrator | An identity listed in Core's admins setting |
| Management token | Credential for WebUI login and local management |
| Data directory | Core configuration and storage, normally data/ |
| Setting | Option declared in config_schema.json |
| Secret | Setting marked secret, hidden when displaying saved configuration |
| Profile | Named overrides assigned to accounts or chat sessions |
| Service | A callable operation exposed to other plugins |
| Broadcast | A notification subscribers may receive; delivery is best effort |
| Tool | A service an AI model may invoke |
| Hook | Logic before event dispatch or around this plugin's sends |
| Sub-plugin | A way to split one plugin into feature modules |
| Capability | A declared platform feature and version |
| Console | Development chat in the terminal |
| Package | A component archive produced by alonabot pack |
| Generation | A committed combination of program, config and managed database |
| Session | One authenticated component-to-Core connection, renewed on each start |
