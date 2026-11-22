---
title: AI conversations
description: Configure models, tools, memory and referenced media.
---

The official Agent runs AI conversations and exposes model generation to other plugins. Compose includes it; other installations [install the component](install.md#official-components) first.

## Configure a model

In Agent configuration, add a Provider with base URL and API key, add a model referring to that Provider, then select Chat model. Supported protocols are openai, openai-compatible, openai-responses, anthropic-messages, gemini-generate-content and ollama-chat.

Save configuration, reload an active component or enable alonabot-agent-official, then send `/ask Hello`.

## Triggers and commands

| Trigger | Behavior |
| --- | --- |
| /ask text | Explicit request |
| private | Free conversation in private chats |
| mention | Group mentions or replies to the bot |
| wake_word | Configured wake words |

triggers defaults to empty. In groups, choose mentions or wake words to avoid replying to every message.

| Command | Access | Purpose |
| --- | --- | --- |
| /ask | User | Ask a question |
| /reset | User | Clear current conversation |
| /agent on / off | Administrator | Toggle triggers in the current Profile |
| /persona [name] | Administrator | List/select persona |
| /provider [name] | Administrator | List/select configured chat model |
| /profile [name] | Administrator | Show/select Profile |

## Common fields

| Field | Purpose |
| --- | --- |
| chat_model / fallback_chat_models | Main model and configured alternatives |
| default_persona | Default persona, edited in the persona page |
| history_entries | History supplied to the model |
| member_sessions | Separate group conversations by member |
| image_caption_model | Describe images for text-only models |
| mcp_servers | stdio or streamable-http tool services |
| skills_dir | Empty disables skills; reload skills after file edits |
| llm_service_allowed_plugins | Plugins permitted to call generation, default `["*"]` |

Models, personas and triggers can use [Profiles](../advanced/profiles.md).

## Tools and confirmation

Effective tool policy comes from the current Profile, global policy and declaration. allow runs directly, confirm asks through buttons, and deny rejects. ReadOnly/Write/Destructive describe effects for display; policy decides confirmation. Confirmations need a trusted user and buttons, so operations requiring confirmation return UNSUPPORTED on the current OneBot11 adapter.

## References, forwards and images

Both /ask and ordinary triggers preserve the whole chain. Agent recursively reads references and forward nodes, retaining author, timestamp, text and image source paths. Image-capable models receive image data; text models can use captions. History preserves image attribution and unavailable-cache markers. Node/media failure produces a concrete user error and stops this model request. See the [SnowLuma issue](onebot11.md#forward-nodes).

## Memory and replacement

The Agent pages manage personas, MCP, skills, memory and user tasks. Memory includes cross-conversation notes and profiles. Disabling/uninstalling Agent leaves the rest of the bot operational; dependent plugins receive the model service's actual error. Another Agent can provide the same SDK interface.
