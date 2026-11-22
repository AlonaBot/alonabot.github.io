---
title: Packaging and publishing
description: Validate a component and publish its platform archives.
---

Use the v0.2.0 CLI to check the project and publish platform archives in a matching component Release.

## Before publishing

Update your own project's manifest:

```yaml title="plugin.yaml"
id: alonabot-plugin-todo
name: To-do List
version: 0.2.0
author: Your Name
source: github.com/yourname/alonabot-plugin-todo
role: plugin
```

```fish
alonabot check .
go test ./...
alonabot test .
```

`test` builds, registers, activates and stops the component in a temporary offline Session. Adapters start with zero platform instances. Use plugintest for business behavior and a real platform for integration.

## Package

```fish
alonabot pack . --target linux/amd64 --target linux/arm64 --target darwin/arm64 --target windows/amd64 --out bin
```

Each target produces `<id>-<version>-<os>-<arch>.tar.gz`. Supported targets are Linux/macOS amd64 and arm64, and Windows amd64. Omit target for the host platform; use tags to select source. A static WebUI produces one any archive, while a Go-backed WebUI uses platform archives.

Archives include manifest, executable or static assets, schemas, translations and optional changelogs. Process packages include parseable build-info. The CLI embeds resources through an overlay.

## Publish on GitHub

Create a `v0.2.0` Release matching the manifest and upload the platform archives. GitHub supplies source downloads. Users install and enable with:

```fish
alonabot install --source yourname/alonabot-plugin-todo --yes
alonabot enable alonabot-plugin-todo --yes
```

The installer selects assets through the Release API and validates archive source, identity, version, platform, build information, resources and dependencies. Later updates follow the bound source. Review the source and confirmation preview before installing.

## Other hosting

Record the actual repository in source. Online CLI installation uses GitHub owner/repo; other hosts can distribute the platform archive for local installation:

```fish
alonabot install ./alonabot-plugin-todo-0.2.0-linux-amd64.tar.gz --yes
```

Browser upload also takes a single archive. Source development works with other hosting providers; see [third-party source debugging](../develop/adapter.md#third-party-source).

## Changelogs

Authors can use a root CHANGELOG.md or `changelog/0.2.0/en-US.md` and `zh-CN.md`. Every multilingual version needs en-US.md. Directory versions omit v and cannot exceed the manifest version. The CLI validates and packages the files, and WebUI reads them after updating.

## Move to archive releases

Upgrade Core to v0.2.0 first, then WebUI and other components. After historical sidecars are removed, older Core installations must upgrade before online installation or updates. Existing data and source bindings remain. Coordinate bundled versions using the [Core release guide](https://github.com/AlonaBot/AlonaBot/blob/main/docs/releasing.md).

Append database migrations without changing released IDs. Review [storage recovery](../tutorial/storage.md) and the [plugin rules](../develop/rules.md) before release.
