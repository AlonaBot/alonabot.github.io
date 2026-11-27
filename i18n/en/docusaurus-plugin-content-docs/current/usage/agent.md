---
title: AI conversations (Agent)
description: Chat with models and share model access across plugins.
---

Agent is the official AI conversation component. Docker Compose includes it; for archives or the installation script, follow [Install official components](install.md#install-official-components). It provides:

- Conversations with models, including calls to plugin tools.
- Shared [model access for plugins](../advanced/llm.md), with centrally configured credentials.

## Configure models

Open the Agent configuration in WebUI:

1. Add a model service under **Providers**, including its endpoint and API key.
2. Add the models you want under **Models**.
3. Select one as **Chat model**.

Supported APIs: OpenAI-compatible, OpenAI Responses, Anthropic Messages, Gemini, and Ollama. Most model services provide an OpenAI-compatible endpoint.

Save and enable Agent. Reload it if already running. Test with `/ask hello`.

### Example: Connect an OpenAI-compatible service

Suppose your provider gives you the endpoint `https://llm.example.com/v1` and the model ID `example-chat`. Substitute the values from your provider.

1. Under **Providers**, add an OpenAI template. Use `example-provider` as **Name**, select `openai-compatible` as **Protocol**, enter the endpoint as **Base URL**, and enter the provider-issued **API key**.
2. Under **Models**, add a model. Set **Name** to `example-chat-local`, **Provider** to `example-provider`, **Model ID** to `example-chat`, and **Model type** to `chat`.
3. Set **Chat model** to `example-chat-local`. Save and enable or reload Agent, then send `/ask Explain a to-do list in one sentence` in chat.

## Conversation triggers

| Trigger | Behavior |
| --- | --- |
| `/ask <prompt>` | Available at any time |
| Free conversation | Responds without a command. **Free conversation triggers** controls responses to private messages, mentions, and replies to the bot |
| Wake words | Responds when the message contains a word from **Wake words** |

For groups, enable mentions or wake words to avoid responding to every message.

## Chat commands

| Command | Users | Action |
| --- | --- | --- |
| `/ask <prompt>` | Everyone | Ask a question |
| `/reset` | Everyone | Clear the current conversation context |
| `/agent on`, `/agent off` | Administrators | Toggle free conversation |
| `/persona [name]` | Administrators | View or switch persona |
| `/provider [name]` | Administrators | View or switch model |
| `/profile [name]` | Administrators | View or switch the current session's profile |

## Common settings

| Setting | Purpose |
| --- | --- |
| Chat model | Model used for conversations |
| Fallback chat models | Models tried in order when the primary model fails |
| Personas, Default persona | Role instructions for the model |
| History entries | Number of historical messages included |
| Separate group conversations by member | Separate conversation per member or shared group conversation |
| Image caption model | Model used to understand user images |
| MCP servers | External MCP tool services |
| Skills directory | Directory containing skill files |
| Plugins allowed to generate text | Plugins allowed to call models; all are allowed by default |

Use [profiles](../advanced/profiles.md) to assign different models, personas, and triggers to different groups.

## Tool calls and confirmation

Models can call plugin tools, such as weather lookups or adding todos. Before running a tool that modifies data, the bot sends a confirmation button. **The user must confirm before execution.**

Use the WebUI permissions page to choose which tools run directly, require confirmation, or are disabled.

## Memory

Agent can remember information across conversations, such as user preferences. View and edit memories on the Agent page.

## Replace or disable Agent

Disable or uninstall Agent independently of other features. Plugin model calls then fail. You can also install a community Agent component.
