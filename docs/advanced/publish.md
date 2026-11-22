---
title: 打包与发布
description: 检查组件，生成平台归档并发布到 GitHub。
---

先使用 v0.2.0 CLI 检查工程，再将平台归档上传到组件仓库的同版本 Release。

## 发布前检查

更新你自己工程的 `plugin.yaml`，使 ID、版本、来源与实际仓库一致：

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

`test` 在临时离线 Session 中构建、登记、激活和停止组件；Adapter 保持零平台实例。它检查装载与停止，业务验证使用 `plugintest`，真实平台另行联调。

## 打包

```fish
alonabot pack . --target linux/amd64 --target linux/arm64 --target darwin/arm64 --target windows/amd64 --out bin
```

每个目标生成一个 `alonabot-plugin-todo-0.2.0-<系统>-<架构>.tar.gz`，省略 `--target` 时使用本机平台。支持 Linux、macOS 的 amd64/arm64 与 Windows amd64。纯静态 WebUI 生成单个 `any` 包；带 Go 后台的 WebUI 按平台构建。`--tags` 选择构建标签。

归档包含 manifest、程序或静态资源、配置 schema、翻译和可选更新日志。进程包带可解析的 `build-info`。资源由 CLI 的 overlay 嵌入，工程无需维护生成入口文件。

## 发布到 GitHub

创建 `v0.2.0` Release，只上传对应的平台归档；GitHub 自动提供源码压缩包。发布版本应与包内 manifest 一致。

用户在运行中的 Core 上执行：

```fish
alonabot install --source yourname/alonabot-plugin-todo --yes
alonabot enable alonabot-plugin-todo --yes
```

安装器从 GitHub Release API 选择本机平台资产并检查包内来源、身份、版本、平台、构建信息、资源与依赖。后续 `alonabot update alonabot-plugin-todo --yes` 从已绑定的来源更新。安装前审阅来源和确认预览。

## 不放在 GitHub 上

`source` 可记录其他托管平台的仓库。CLI 在线安装使用 GitHub `owner/repo`；其他来源将平台归档直接提供给用户下载：

```fish
alonabot install ./alonabot-plugin-todo-0.2.0-linux-amd64.tar.gz --yes
```

浏览器上传同样只选择这一份归档。开发源码可来自任意托管平台，见[第三方源码调试](../develop/adapter.md#从第三方源码调试)。

## 更新日志

插件作者可以选择根目录 `CHANGELOG.md`，或 `changelog/0.2.0/en-US.md` 与 `zh-CN.md`。多语言目录每个版本须有 `en-US.md`；版本不带 `v`，且不高于 manifest 版本。CLI 检查格式并原样打包，WebUI 更新后读取包内日志。

## 升级到归档发布

先升级 Core 至 v0.2.0，再更新 WebUI 与其他组件。历史旁车清理后，旧 Core 的在线安装和更新需要先升级。已有组件数据及来源绑定继续保留。组件 v0.2.0 使用平台归档发布；维护者可参考 [Core 发行维护](https://github.com/AlonaBot/AlonaBot/blob/main/docs/releasing.md)协调整合版本。

数据库改动追加新的迁移 ID，保留已发布迁移。更新失败时恢复范围见[存储](../tutorial/storage.md)。发布前再对照[插件规范](../develop/rules.md)。
