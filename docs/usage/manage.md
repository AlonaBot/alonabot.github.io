---
title: 安装插件与日常管理
description: 使用持久本机凭据安装、更新、管理账号和导出诊断。
---

管理命令在 Core 所在机器执行，从同一个 `--data-dir` 读取 `core_config.json` 与持久的 `admin_token`。保持 Core 运行，在另一个终端操作。

## 准备

以下示例使用 `./data`。安装脚本、Docker 用户按[安装页](install.md#安装官方组件)选择实际数据目录、程序和运行用户。本机 CLI 自动读取凭据并直连本机 listen，请求 Host 沿用 `base_url`：

```fish
alonabot list --data-dir ./data
```

修改本机连接地址可传 `--admin-url http://127.0.0.1:7650`。远程机器使用 SSH 登录后运行；容器内使用 `docker compose exec`。

## 插件

```fish
alonabot install --source yourname/alonabot-plugin-todo --data-dir ./data
alonabot install --source yourname/alonabot-plugin-todo --data-dir ./data --yes
alonabot install ./alonabot-plugin-todo-0.2.0-linux-amd64.tar.gz --data-dir ./data --yes
alonabot list --data-dir ./data
alonabot enable alonabot-plugin-todo --data-dir ./data --yes
alonabot disable alonabot-plugin-todo --data-dir ./data --yes
alonabot update alonabot-plugin-todo --data-dir ./data --yes
```

不带 `--yes` 查看确认预览，确认来源和受影响对象后执行。无位置参数的 `install --yes` 在当前目录（组件工程为 `bin/`）发现唯一的本机归档，也检查直接包子目录；多个候选时列出候选并报错。

```fish
alonabot rollback alonabot-plugin-todo GENERATION_ID --data-dir ./data --yes
alonabot uninstall alonabot-plugin-todo --data-dir ./data --yes
```

在 WebUI 组件详情查看保留的代次。回退从目标代次建立新的程序、配置和数据库副本，会舍弃目标之后的数据。卸载缺省保留数据；`--purge-data` 删除受管数据，`--purge` 同时清理配置和安装绑定。操作前查看预览。

声明 `prepare_effects: external` 的已有组件，更新前先停用、备份外部数据，再按确认预览显式使用 `--manual-migration-approved`。

:::caution 只安装信任的插件
组件程序以 Core 的系统用户运行。安装前审阅仓库来源及其需要访问的数据。
:::

## 用第三方 Adapter 联调插件

终端一运行插件：

```fish
alonabot run ./my-plugin --data-dir ./qq-dev-data --log-level debug
```

终端二使用同一个数据目录，仓库和 ID 替换成实际项目：

```fish
alonabot install --source author/alonabot-adapter-qq --data-dir ./qq-dev-data --yes
alonabot adapter instance create alonabot-adapter-qq qq-main --config ./qq-account.json --data-dir ./qq-dev-data
```

账号 JSON 遵循该 Adapter 的 schema。已安装 Adapter 保持其发布版本，插件保存后自动重载。修改 Adapter 源码见[第三方源码调试](../develop/adapter.md#从第三方源码调试)。

## 机器人管理员

```fish
alonabot admin list
alonabot admin add telegram:123456789
alonabot admin remove telegram:123456789
```

上述简写使用默认 `./data`。`/whoami` 来自官方 help 插件，可用来查询用户标识。

## 平台账号

```fish
alonabot adapter instance create alonabot-adapter-telegram main --config tg.json
alonabot adapter instance stop main
alonabot adapter instance start main
alonabot adapter instance delete main
```

`tg.json` 只放实例配置，如 `{"token":"${TELEGRAM_BOT_TOKEN}"}`；环境变量需在 Core 进程中可用。创建账号会绑定组件并启动实例。

## 日志与休眠

```fish
alonabot logs --follow
alonabot logs --source alonabot-plugin-todo --level error
alonabot logs --date 2026-11-22
alonabot log-level alonabot-plugin-todo debug
alonabot sleep-policy
alonabot sleep-policy alonabot-plugin-todo never
alonabot sleep-policy alonabot-plugin-todo auto
```

`log-level` 保存来源阈值；日志文件位于 `data/logs/`。休眠覆盖接受 `never`、正时长和恢复自动策略的 `auto`，设置后立即生效。

## 遇到问题时

```fish
alonabot diagnose --data-dir ./data -o diagnose.zip
```

缺省收集近 24 小时日志、设置和组件信息，并按规则遮盖凭据。日志仍可能含聊天内容，分享前检查。连接被拒绝时尝试停机只读导出，要求原数据目录未被其他 Core 占用。完整参数见 [CLI 参考](../reference/cli.md)。
