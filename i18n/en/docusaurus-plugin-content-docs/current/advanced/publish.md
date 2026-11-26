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

Each platform gets an archive containing the executable, `plugin.yaml`, and resources. Omitting `--target` builds for the host platform. `darwin/amd64` is also supported. `--out` defaults to the project `bin/` and `--tags` passes Go build tags. A static-only WebUI produces a single platform-independent `any` archive.

## Component icon

Point `icon` in `plugin.yaml` at an SVG, PNG or WebP file in the project; the WebUI and store display it.

## Release notes

Each version can ship release notes that the WebUI shows after installation. Use one of two layouts:

- A root `CHANGELOG.md` with one section per version, such as `## [1.2.1] - 2026-11-17`; the date is optional.
- One file per version and language, such as `changelog/1.2.1/en-US.md` and `changelog/1.2.1/zh-CN.md`. Directory names are versions without `v` and not newer than `version` in `plugin.yaml`; every version needs `en-US.md`.

`alonabot check` validates the format and `pack` includes it unchanged.

## Publish to GitHub

Create a Release matching the component version, such as `v1.0.0`, and upload the platform archives from `bin/`.

```fish
alonabot install --source yourname/alonabot-plugin-todo --yes
```

Core selects the host platform archive, reads its declarations, and installs it. Afterwards the component updates only from the same repository; add `--replace` to replace an installed Adapter, Agent or WebUI with one from another repository.

## Submit to the store

The official WebUI store source is [AlonaBot/plugin-store](https://github.com/AlonaBot/plugin-store). After publishing a Release, fill in its submission form (the WebUI store can prefill it); maintainers review and add the component.

## Install locally

Give users the archive for their platform and run:

```fish
alonabot install ./alonabot-plugin-todo-1.0.0-linux-amd64.tar.gz --yes
```

WebUI upload installation also accepts a single archive.

See [Plugin conventions](../develop/rules.md) for publishing rules.
