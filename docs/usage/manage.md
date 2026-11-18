---
title: 安装插件与日常管理
description: 安装、更新、停用插件，看日志，导出诊断信息。
---

这些操作都可以在 WebUI 里点按钮完成。这一页介绍命令行的做法，适合没有浏览器的服务器或写脚本。

## 准备

管理命令要连接正在运行的 Core，需要管理 token：

```sh
export ALONABOT_ADMIN_TOKEN='你的管理 token'
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

# 更新后有问题，退回上一个版本（数据也一起退回）
alonabot rollback alonabot-plugin-todo

# 卸载，保留数据
alonabot uninstall alonabot-plugin-todo --yes

# 卸载并删除数据
alonabot uninstall alonabot-plugin-todo --purge --yes
```

需要确认的操作不加 `--yes` 时，命令只列出会受影响的内容然后退出，不会执行。

:::caution 只安装信任的插件
插件是普通程序，拥有和 Core 相同的系统权限，能读写这台机器上 Core 能访问的一切。
:::

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
