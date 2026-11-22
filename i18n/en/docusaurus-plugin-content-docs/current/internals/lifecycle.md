---
title: Startup and updates
description: Component activation, shutdown and recovery.
---

import UpdateFlow from "@site/static/img/diagrams/update-flow.en.svg";

## Startup order

Core completes preparation before delivering messages to a native component:

| Step | Action | Your code |
| --- | --- | --- |
| 1 | Launch process and establish the connection | New() |
| 2 | Load and correct configuration | OnConfigLoad |
| 3 | Apply outstanding managed migrations | Migrations |
| 4 | Initialize resources | OnStart |
| 5 | Register routes and check conflicts | — |
| 6 | Commit the usable generation | — |
| 7 | Prepare to receive calls | OnReady |
| 8 | Deliver calls | Handler |

Failure before commit discards the candidate; an update resumes the previous program and data. Failure after commit restarts the committed generation. Put fallible preparation, such as opening an external connection, in OnStart so it can fail before commit.

## Shutdown order

Core stops admission, allows in-flight Handlers to drain, invokes OnStop and ends the process. The default total shutdown budget is ten seconds; Core force-terminates an overrun process.

## Crashes

Core restarts a component after an unexpected exit. By default, three crashes within five minutes disable it and produce management/log diagnostics. Correct the cause and enable it again. Handler panics are recovered as call errors, allowing the component to continue.

## Update recovery

A generation combines a component's program, settings and managed database. Updates prepare against a database copy:

<div className="doc-diagram-scroll"><UpdateFlow className="doc-diagram" /></div>

Configuration reloads use the same preparation path. A pre-commit failure restores the previous active configuration.

Use alonabot rollback &lt;ID&gt; &lt;generationID&gt; after reviewing retained generations in WebUI. Core creates a new generation from the selected program, settings and a separate database copy. Changes made after that snapshot are lost.

Back up plugin-managed files and external databases separately. Development projects launched by alonabot run use a single database and have no installed-generation rollback.

## Configuration activation

p.Config() is stable for the component's run. Base-configuration edits become active after reload. [Session profile overrides](../advanced/profiles.md) take effect on the next call; default-profile changes are pending until reload.

## Idle sleep

With [component idle mode](../usage/settings.md#saving-memory), eligible installed plugins stop after inactivity. Messages, service calls, HTTP requests and naturally due jobs wake them. Wakeup reuses the generation and database, skipping migrations while rerunning OnStart and OnReady. Keep those callbacks repeatable. Components with continuously active workers remain resident.
