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

每个平台生成一个归档，包含程序、`plugin.yaml` 与组件资源。不指定 `--target` 时构建本机平台；另支持 `darwin/amd64`。

## 发布到 GitHub

创建与组件版本对应的 Release（示例为 `v1.0.0`），上传 `bin/` 中的平台归档。

```fish
alonabot install --source yourname/alonabot-plugin-todo --yes
```

Core 选择本机平台的归档，读取包内声明并安装。

## 本地安装

将对应平台的归档交给使用者，执行：

```fish
alonabot install ./alonabot-plugin-todo-1.0.0-linux-amd64.tar.gz --yes
```

WebUI 的上传安装同样选择一个归档文件。

发布规则见[插件规范](../develop/rules.md)。
