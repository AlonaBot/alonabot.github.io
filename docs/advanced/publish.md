---
title: 打包与发布
description: 构建平台归档，通过 GitHub 或本地文件安装组件。
---

## 检查工程

在 `plugin.yaml` 中填写组件 ID、版本和源码仓库：

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

`check` 检查声明、翻译与 Handler；`test` 执行离线准备检查。业务验证见[插件测试](../tutorial/testing.md)。

## 打包

```fish
alonabot pack . --target linux/amd64 --target linux/arm64 --target darwin/arm64 --target windows/amd64 --out ./bin
```

每个平台生成一个归档，包含程序、`plugin.yaml` 与组件资源。不指定 `--target` 时构建本机平台；另支持 `darwin/amd64`。`--out` 缺省为工程的 `bin/`，`--tags` 传入 Go 构建标签。只有静态资源的 WebUI 只生成一个通用的 `any` 归档。

### 随包分发资源

把字体等运行时资源放在插件工程根目录的 `assets/`。`alonabot pack` 会保留原目录结构。文件随归档安装，保持在可执行文件之外。

在 Handler 或生命周期回调中，用 `sdk.PackageDir(ctx)` 取得当前包目录。例如，读取 `assets/fonts/menu.ttf` 时用 `filepath.Join(dir, "assets", "fonts", "menu.ttf")`。本地 `alonabot run`、`alonabot test` 和 `plugintest` 使用工程目录。直接使用库模式时返回空串，此时请显式提供资源路径或使用自备资源。需要跨重启保存的文件放在 `sdk.PluginDataDir(ctx)`。

## 组件图标

在 `plugin.yaml` 里用 `icon` 指向工程内的 SVG、PNG 或 WebP 文件，WebUI 和商店会显示它。

## 更新说明

每个版本可以附上更新说明，安装后在 WebUI 里展示。两种写法选一种：

- 根目录的 `CHANGELOG.md`，每个版本一节，例如 `## [1.2.1] - 2026-11-17`，日期可以省略。
- 按版本和语言分文件，例如 `changelog/1.2.1/en-US.md`、`changelog/1.2.1/zh-CN.md`。目录名是不带 `v` 的版本号，不能高于 `plugin.yaml` 的 `version`；每个版本都要有 `en-US.md`。

`alonabot check` 检查格式，`pack` 原样打包。

## 发布到 GitHub

创建与组件版本对应的 Release（示例为 `v1.0.0`），上传 `bin/` 中的平台归档。

```fish
alonabot install --source yourname/alonabot-plugin-todo --yes
```

Core 选择本机平台的归档，读取包内声明并安装。之后这个组件只从同一个仓库更新；要用别的仓库的同类组件替换已安装的 Adapter、Agent 或 WebUI，加 `--replace`。

## 提交到商店

WebUI 商店的官方源是 [AlonaBot/plugin-store](https://github.com/AlonaBot/plugin-store)。发布 Release 后填写其中的提交表单（WebUI 商店也能帮你预填），维护者审核后收录。

## 本地安装

将对应平台的归档交给使用者，执行：

```fish
alonabot install ./alonabot-plugin-todo-1.0.0-linux-amd64.tar.gz --yes
```

WebUI 的上传安装同样选择一个归档文件。

发布规则见[插件规范](../develop/rules.md)。
