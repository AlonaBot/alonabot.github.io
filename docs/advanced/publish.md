---
title: 打包与发布
description: 把插件打成安装包，签名，让别人安装。
---

## 发布前检查

1. 改好 `plugin.yaml`：

```yaml title="plugin.yaml"
id: alonabot-plugin-todo
name: To-do List
version: 0.1.0
author: Your Name
source: github.com/yourname/alonabot-plugin-todo
role: plugin
```

`source` 改成插件的 GitHub 仓库。用户用仓库地址安装和更新时靠它定位。

2. 运行检查和测试：

```sh
alonabot check
go test ./...
alonabot test
```

`alonabot test` 把插件编译出来，在一个临时环境里完整地启动再停止一遍，确认它能正常装载。

## 打包

```sh
alonabot pack --target linux/amd64 --target linux/arm64 --target darwin/arm64 --target windows/amd64
```

`bin/` 下会生成：

```text
bin/
├── alonabot-plugin-todo-0.1.0-linux-amd64.tar.gz
├── alonabot-plugin-todo-0.1.0-linux-arm64.tar.gz
├── alonabot-plugin-todo-0.1.0-darwin-arm64.tar.gz
├── alonabot-plugin-todo-0.1.0-windows-amd64.tar.gz
└── release.json
```

每个平台一个安装包，`release.json` 是它们的清单。不写 `--target` 时只打当前系统的包。

支持的平台：`linux/amd64`、`linux/arm64`、`darwin/amd64`、`darwin/arm64`、`windows/amd64`。

## 发布到 GitHub

在仓库里建一个 Release，标签是 `v` 加版本号（如 `v0.1.0`），把 `bin/` 下的全部文件传上去。

用户这样安装：

```sh
alonabot install --source yourname/alonabot-plugin-todo --yes
```

以后发新版本：改 `plugin.yaml` 的 `version`，重新打包，建新的 Release。用户用 `alonabot update alonabot-plugin-todo` 更新。

## 签名

签名让用户确认安装包确实是你发布的、没有被改过。

生成私钥（只做一次）。把下面的程序存成 `keygen.go`，运行 `go run keygen.go > release.key`：

```go title="keygen.go"
package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"fmt"
)

func main() {
	_, private, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		panic(err)
	}
	fmt.Println(base64.StdEncoding.EncodeToString(private))
}
```

打包时带上：

```sh
alonabot pack --target linux/amd64 --key ./release.key
```

会多生成 `release.json.sig`（签名）和 `release.pub`（公钥），和其他文件一起上传。

**私钥不要提交到仓库，也不要出现在 CI 日志里。** 用 CI 发布时把它存成加密的 secret。

没有签名的包也能安装，安装时用户会看到「未签名」的提示。

## 不放在 GitHub 上

安装包放在别处时，用 `--asset-base` 指明下载地址的前缀：

```sh
alonabot pack --target linux/amd64 --asset-base https://example.com/releases/v0.1.0
```

用户也可以直接用下载下来的文件安装：

```sh
alonabot install ./alonabot-plugin-todo-0.1.0-linux-amd64.tar.gz --yes
```

## 更新日志

在工程根目录放一个 `CHANGELOG.md`，用户更新后能在 WebUI 里看到这个版本改了什么。

## 版本号怎么升

- 修了问题：`0.1.0` → `0.1.1`。
- 加了功能：`0.1.0` → `0.2.0`。
- 改了数据库结构：加一个新的建表步骤（见[存储数据](../tutorial/storage.md)），不要改旧的。用户更新时框架会自动执行新步骤，失败则保留旧版本。

发布前对照一遍[插件规范](../develop/rules.md)。
