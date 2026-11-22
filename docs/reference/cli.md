---
title: CLI 参考
description: alonabot 命令的全部子命令和参数。
---

所有命令都可以加 `--help` 查看说明。

## 开发

### alonabot init

```sh
alonabot init [目录]
```

在空目录里创建组件工程。不写目录时用当前目录。

| 参数 | 缺省值 | 含义 |
| --- | --- | --- |
| `--role` | `plugin` | 组件类型：`plugin`、`adapter`、`agent`、`webui` |
| `--id` | 目录名 | 组件 ID |
| `--adapter-id` | 组件 ID | 平台标识，只用于 Adapter |
| `--module` | 目录名 | Go module 路径。在已有的 Go module 里创建时不新建 |

### alonabot run

```sh
alonabot run [目录...]
```

启动 Core。给出组件工程的目录时，同时编译并运行它们；不给目录而当前目录是组件工程时，运行当前目录。只打 `alonabot` 不带子命令效果相同。

| 参数 | 缺省值 | 含义 |
| --- | --- | --- |
| `--data-dir` | `data` | 数据目录。同一个目录同时只能运行一个 Core |
| `--console` | 自动 | 终端对话。在终端里运行且没有配置任何平台账号时自动打开；`--console` 强制打开，`--console=false` 关闭 |
| `--reload` | 有开发目录时开启 | 代码变化后自动重新编译并重启对应的组件。`--reload=false` 关闭 |
| `--listen` | 设置文件里的值 | 这一次运行使用的监听地址 |
| `--log-level` | `info` | 屏幕上显示的日志级别。终端对话打开时缺省只显示 `warn` 及以上 |
| `--log-format` | `text` | `text` 或 `json` |
| `--stdio` | 关闭 | 开发组件和 Core 之间改用标准输入输出通信，一般不需要 |

终端对话里：

| 输入 | 效果 |
| --- | --- |
| 任意文字 | 作为私聊消息发给机器人，你的身份是 `console:local`，是机器人管理员 |
| `#编号` | 点击最近一条消息下面对应编号的按钮 |

### alonabot check

```sh
alonabot check [目录]
```

检查工程：`plugin.yaml`、配置项声明、语言文件、Handler 的写法。只读扫描工程与资源。支持 `--goos`、`--goarch` 与 `--tags`，选择扫描目标；使用工程 go.mod 声明的 Go 工具链。

### alonabot build

```sh
alonabot build [目录]
```

编译组件，输出到工程的 `bin/`。

| 参数 | 含义 |
| --- | --- |
| `--out` | 输出目录 |
| `--goos`、`--goarch` | 目标系统和架构，缺省是当前机器 |
| `--tags` | Go build tags，逗号分隔 |

### alonabot test

```sh
alonabot test [目录]
```

编译组件，在临时环境里完整地启动再停止一次，报告登记的命令及清理结果；Adapter 保持零平台实例，WebUI 检查静态资源。用来确认组件能正常装载。业务逻辑的测试用 `go test`，见[测试](../tutorial/testing.md)。

### alonabot pack

```sh
alonabot pack [目录]
```

为各目标生成平台归档，见[打包与发布](../advanced/publish.md)。

| 参数 | 含义 |
| --- | --- |
| `--target` | 目标平台，如 `linux/amd64`，可以写多次。缺省是当前机器 |
| `--out` | 输出目录 |
| `--tags` | Go build tags |

## 管理

管理命令在 Core 所在机器运行，使用同一个 `--data-dir` 自动读取持久的 `admin_token`。缺省直连设置中的本机 listen，请求 Host 沿用 `base_url`；`--admin-url` 可覆盖本机连接 URL。远程部署先 SSH 登录服务器，容器使用 `docker compose exec`。

### 组件

| 命令 | 作用 |
| --- | --- |
| `alonabot list` | 列出已安装的组件 |
| `alonabot install [文件或组件ID]` | 安装本地归档，或可执行文件旁 `packages/` 中的组件 |
| `alonabot install --source <owner/repo>` | 从 GitHub Release 安装 |
| `alonabot enable <ID>`、`disable <ID>` | 启用、停用 |
| `alonabot restart <ID>` | 重启 |
| `alonabot reload <ID>` | 让修改过的配置生效 |
| `alonabot update <ID>` | 更新到最新版本 |
| `alonabot rollback <ID> <代次ID>` | 恢复指定代次的程序、配置和数据库 |
| `alonabot pin <ID> [version]` | 设置版本约束；省略 version 清除约束 |
| `alonabot uninstall <ID>` | 卸载 |

| 参数 | 用于 | 含义 |
| --- | --- | --- |
| `--yes` | 组件安装与生命周期命令 | 确认执行。不加时只列出会受影响的内容 |
| `--replace` | `install` | 替换同类 Adapter、唯一 Agent 或 WebUI |
| `--archive` | `install`、`update` | 显式选择本地归档，与 `--source` 互斥 |
| `--manual-migration-approved` | `reload`、`update`、`rollback` | 停用并备份外部数据后确认外部迁移 |
| `--purge-data` | `uninstall` | 同时删除数据 |
| `--purge` | `uninstall` | 同时删除数据和配置 |

无位置参数的 `install` 按当前目录发现唯一的本机归档，组件工程搜索 `bin/`，并检查直接包子目录；多个候选会列出并报错。位置参数、`--archive`、`--source` 互斥。

### 机器人管理员

| 命令 | 作用 |
| --- | --- |
| `alonabot admin list` | 列出 |
| `alonabot admin add <平台:用户ID>` | 添加 |
| `alonabot admin remove <平台:用户ID>` | 移除 |

### 平台账号

| 命令 | 作用 |
| --- | --- |
| `alonabot adapter instance create <组件ID> <账号名> [--config 文件]` | 添加账号 |
| `alonabot adapter instance start <账号名>`、`stop <账号名>` | 启动、停止 |
| `alonabot adapter instance delete <账号名>` | 删除 |

### 配置文件

见[不同会话用不同配置](../advanced/profiles.md)。

| 命令 | 作用 |
| --- | --- |
| `alonabot profile list` | 列出 |
| `alonabot profile create <名字> [--from ID]` | 新建，`--from` 复制已有的 |
| `alonabot profile rename <ID> <名字>` | 改名 |
| `alonabot profile delete <ID>` | 删除 |
| `alonabot profile assign <ID> <账号名> [会话]` | 让一个账号或一个会话使用它 |
| `alonabot profile unassign <账号名> [会话]` | 取消 |
| `alonabot profile set <ID> <插件ID> <配置项> <JSON值>` | 设置这个配置文件里的值 |
| `alonabot profile unset <ID> <插件ID> <配置项>` | 恢复为基础值 |

### 日志

| 命令 | 作用 |
| --- | --- |
| `alonabot logs` | 显示最近的日志 |
| `alonabot log-level` | 列出各组件的日志级别 |
| `alonabot log-level <ID> <级别>` | 设置。ID 写 `global` 表示全局 |

`logs` 的参数：

| 参数 | 含义 |
| --- | --- |
| `--follow` | 持续显示新日志 |
| `--source` | 只看某个组件 |
| `--level` | 只看这个级别及以上 |
| `--date` | 看某一天的，格式 `2026-11-18` |
| `--trace` | 只看某一次调用的 |

### 休眠策略

```fish
alonabot sleep-policy
alonabot sleep-policy alonabot-plugin-todo
alonabot sleep-policy alonabot-plugin-todo never
alonabot sleep-policy alonabot-plugin-todo 15m
alonabot sleep-policy alonabot-plugin-todo auto
```

读取保持当前休眠状态；写入立即保存并生效，`auto` 删除插件覆盖。全局模式在 WebUI 设置中调整。

## 维护

### alonabot admin-token

| 命令 | 作用 |
| --- | --- |
| `alonabot admin-token show` | 显式读取持久管理 token，运行中也可执行 |
| `alonabot admin-token init [--if-missing]` | 停机初始化凭据，只输出文件位置 |
| `alonabot admin-token reset` | 重新生成，旧的失效。需要先停止 Core |

都使用 `--data-dir` 指定实际目录。首次启动、init/reset 以受限权限保存凭据；登录及确认保留文件。本机 CLI 直接读取，文件遗失时先停机 reset。

### alonabot diagnose

```sh
alonabot diagnose --data-dir <数据目录> -o diagnose.zip
```

导出诊断包。

| 参数 | 缺省值 | 含义 |
| --- | --- | --- |
| `--since` | `24h` | 包含多久以内的日志 |
| `--no-logs`、`--no-settings`、`--no-components` | | 不包含对应的内容 |
| `--no-redact` | | 不遮盖密钥。导出的文件会包含明文密钥 |

### alonabot tune list

列出内部的调优参数（各种超时和上限）及当前的值。一般不需要改。要改时用 `--args`：

```sh
alonabot run --args REQUEST_TIMEOUT=60s
```
