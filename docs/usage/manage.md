---
title: 安装插件与日常管理
description: 安装、更新、停用插件，看日志，导出诊断信息。
---

这些操作都可以在 WebUI 里点按钮完成。这一页介绍命令行的做法，适合没有浏览器的服务器或写脚本。

## 准备

以下 `alonabot` 命令假定你在启动 Core 的工作目录操作，Core 使用默认的 `./data`。使用安装脚本、手动指定其他目录或 Docker 时，先按[安装页](install.md#安装官方组件)定义 `ab`，并将本页管理命令开头的 `alonabot` 换成 `ab`；它会传入对应的程序路径、运行用户和 `--data-dir`。

管理命令要连接正在运行的 Core，需要管理 token：

```fish
set -gx ALONABOT_ADMIN_TOKEN '你的管理 token'
```

或者把 token 存在文件里，每次加 `--token-file <文件>`。

## 插件

```sh
# 从 GitHub 安装
alonabot install --source yourname/alonabot-plugin-todo --yes

# 从下载好的文件安装
alonabot install ./alonabot-plugin-todo-0.1.0-linux-amd64.tar.gz --yes

# 看装了什么
alonabot list

# 停用、启用
alonabot disable alonabot-plugin-todo
alonabot enable alonabot-plugin-todo

# 更新到最新版本
alonabot update alonabot-plugin-todo

# 更新后有问题，指定要恢复的代次（数据也一起恢复）
alonabot rollback alonabot-plugin-todo <代次ID>

# 卸载，保留数据
alonabot uninstall alonabot-plugin-todo --yes

# 卸载并删除数据
alonabot uninstall alonabot-plugin-todo --purge --yes
```

回退前在 WebUI 的组件详情中查看保留的代次 ID。先运行不带 `--yes` 的命令查看受影响内容，确认后再加 `--yes` 执行；回退会舍弃目标代次之后的数据。

:::caution 只安装信任的插件
插件是普通程序，拥有和 Core 相同的系统权限，能读写这台机器上 Core 能访问的一切。
:::

## 用第三方 Adapter 联调插件

第三方开发的 QQ 官方机器人接口 Adapter 可以通过仓库地址安装。首次安装时，Core 会列出待确认的来源、发布者公钥标识；未签名包还会列出未签名提示。检查后加 `--yes` 确认，Core 会保存来源和发布者绑定。

假设你要热开发的插件在 `./my-plugin`，先在终端一启动开发用 Core：

```sh
alonabot run ./my-plugin --data-dir ./qq-dev-data --log-level debug
```

在同一工作目录打开终端二，设置这次启动生成的管理 token，然后安装 Adapter、添加账号。下面的仓库地址和组件 ID 是示例，请替换成实际项目的值；`qq-account.json` 按该 Adapter 的账号配置说明填写。

```fish
set -gx ALONABOT_ADMIN_TOKEN '这次启动的管理 token'

# 先查看首次信任提示，再确认安装
alonabot install --source author/alonabot-adapter-qq --data-dir ./qq-dev-data
alonabot install --source author/alonabot-adapter-qq --data-dir ./qq-dev-data --yes

# 创建账号时会绑定组件，并启用 Adapter、启动账号
alonabot adapter instance create alonabot-adapter-qq qq-main --config ./qq-account.json --data-dir ./qq-dev-data
```

随后通过 QQ 给机器人发消息即可联调。保存 `./my-plugin` 中的代码会触发自动编译和重启；已安装的 Adapter 沿用安装版本。要热开发 Adapter 本身，见[从第三方源码调试](../develop/adapter.md#从第三方源码调试)。

## 机器人管理员

```sh
alonabot admin list
alonabot admin add telegram:123456789
alonabot admin remove telegram:123456789
```

## 平台账号

```sh
# 添加：平台的组件 ID、账号名、配置文件
alonabot adapter instance create alonabot-adapter-telegram main --config tg.json

alonabot adapter instance stop main
alonabot adapter instance start main
alonabot adapter instance delete main
```

`tg.json` 的内容就是这个账号的设置，例如 `{"token": "..."}`。

## 看日志

```sh
# 最近的日志
alonabot logs

# 持续显示新日志
alonabot logs --follow

# 只看某个插件的错误
alonabot logs --source alonabot-plugin-todo --level error

# 某一天的
alonabot logs --date 2026-11-18
```

日志文件在数据目录的 `logs/` 下，按天一个文件。

临时调高某个插件的日志详细程度：

```sh
alonabot log-level alonabot-plugin-todo debug
```

## 遇到问题时

导出诊断包，里面有最近的日志、设置和组件信息：

```sh
alonabot diagnose --data-dir <数据目录> -o diagnose.zip
```

密钥和 token 会被自动遮盖。但日志里可能有聊天内容，发给别人之前请自己检查一遍。

Core 没在运行时这个命令也能用。

完整的命令和参数见 [CLI 参考](../reference/cli.md)。
