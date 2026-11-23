---
title: Packaging and publishing
description: Build platform archives and install components from GitHub or local files.
---

## Check the project

Fill in the component ID, version, and source repository in `plugin.yaml`:

```yaml title="plugin.yaml"
id: alonabot-plugin-todo
name: To-do List
version: 1.0.0
source: github.com/yourname/alonabot-plugin-todo
role: plugin
```

```fish
alonabot check
go test ./...
alonabot test
```

`check` validates declarations, translations, and Handlers. `test` runs offline preparation checks. See [Plugin testing](../tutorial/testing.md) for behavior tests.

## Package

```fish
alonabot pack . --target linux/amd64 --target linux/arm64 --target darwin/arm64 --target windows/amd64 --out ./bin
```

Each platform gets an archive containing the executable, `plugin.yaml`, and resources. Omitting `--target` builds for the host platform. `darwin/amd64` is also supported.

## Publish to GitHub

Create a Release matching the component version, such as `v1.0.0`, and upload the platform archives from `bin/`.

```fish
alonabot install --source yourname/alonabot-plugin-todo --yes
```

Core selects the host platform archive, reads its declarations, and installs it.

## Install locally

Give users the archive for their platform and run:

```fish
alonabot install ./alonabot-plugin-todo-1.0.0-linux-amd64.tar.gz --yes
```

WebUI upload installation also accepts a single archive.

See [Plugin conventions](../develop/rules.md) for publishing rules.
