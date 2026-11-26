---
title: 设置
description: core_config.json 里的每一项。
---

Core 的设置都在数据目录下的 `core_config.json` 里。第一次启动时自动生成。大部分设置可以在 WebUI 里改，这一页说明直接编辑文件时每一项的含义。

```json title="core_config.json"
{
  "listen": "127.0.0.1:7650",
  "base_url": "http://127.0.0.1:7650",
  "admins": ["telegram:123456789"],
  "command_prefixes": ["/"],
  "default_locale": "zh-CN",
  "adapters": {
    "telegram": {
      "instances": {
        "main": { "token": "${TELEGRAM_BOT_TOKEN}" }
      }
    }
  }
}
```

手动修改后重启 Core 生效。

## 全部设置

| 键 | 缺省值 | 含义 |
| --- | --- | --- |
| `listen` | `127.0.0.1:7650` | 监听的地址和端口 |
| `base_url` | `http://127.0.0.1:7650` | 别人访问管理界面用的地址 |
| `trusted_proxies` | 空 | 反向代理的地址，见[通过域名访问](#通过域名访问) |
| `admins` | 空 | 机器人管理员，见下 |
| `command_prefixes` | `["/"]` | 命令的前缀 |
| `default_locale` | `en-US` | 机器人回复的缺省语言 |
| `proxy` | 空 | 访问外网用的代理 |
| `adapters` | 空 | 平台账号，见下 |
| `reply` | 见下 | 回复的方式 |
| `log.level` | `info` | 日志详细程度：`debug`、`info`、`warn`、`error`、`critical` |
| `log.file.enabled` | `true` | 是否写日志文件 |
| `log.file.max_age_days` | `30` | 日志文件保留天数 |
| `sleep.mode` | `always_on` | 是否让空闲的插件暂时退出以节省内存，见下 |

## 机器人管理员

```json
{ "admins": ["telegram:123456789", "onebot11:10001"] }
```

每一项是「平台:用户 ID」。不知道自己的 ID 时，给机器人发 `/whoami`，把它回复的内容填进来。

管理员能使用插件里限定管理员的命令。这和登录 WebUI 用的管理 token 是两回事。

## 命令前缀

```json
{ "command_prefixes": ["/", "!"] }
```

这样 `/help` 和 `!help` 都有效。想不带前缀直接说 `help`，写 `[""]`。

## 平台账号

```json
{
  "adapters": {
    "telegram": {
      "default_instance": "main",
      "instances": {
        "main":   { "token": "${TG_MAIN_TOKEN}" },
        "backup": { "token": "${TG_BACKUP_TOKEN}" }
      }
    }
  }
}
```

`adapters` 下面按平台分组，每个平台可以有多个账号。`main`、`backup` 是你起的名字，只能用字母、数字、`_`、`-`，所有平台里不能重名。

每个账号里填什么由平台决定，见 [Telegram](../platforms/telegram.md)、[OneBot 11](../platforms/onebot11.md)。

`default_instance` 是插件主动发消息又没指定账号时用的那个。只有一个账号时不用写。

## 用环境变量

任何字符串值都可以写成 `${变量名}`，启动时从环境变量读取。适合 token 这类不想写在文件里的内容：

```json
{ "token": "${TELEGRAM_BOT_TOKEN}" }
```

环境变量不存在时，这一项按没填处理。

## 回复方式

```json
{
  "reply": {
    "mention_sender": false,
    "quote": false,
    "prefix": "",
    "forward_threshold": 0
  }
}
```

| 键 | 含义 |
| --- | --- |
| `mention_sender` | 回复时 @ 发消息的人 |
| `quote` | 回复时引用原消息 |
| `prefix` | 每条回复前面加的文字 |
| `forward_threshold` | 回复超过多少字时改用合并转发，0 表示不用 |

## 代理

```json
{ "proxy": "http://127.0.0.1:7890" }
```

支持 `http`、`https`、`socks5`。设置后 Core 和所有插件访问外网都走这个代理。

## 通过域名访问

管理界面缺省只能从本机访问。要通过域名公开，前面放一个提供 HTTPS 的反向代理（Nginx、Caddy 等），然后：

```json
{
  "listen": "0.0.0.0:7650",
  "base_url": "https://bot.example.com",
  "trusted_proxies": ["127.0.0.1/32"]
}
```

- `base_url` 填用户在浏览器里输入的地址。
- `trusted_proxies` 填反向代理的地址。
- 监听非本机地址时，`base_url` 必须是 `https`，或者配置了 `trusted_proxies`，否则 Core 拒绝启动。这是为了防止管理 token 在网络上明文传输。

## 节省内存

```json
{ "sleep": { "mode": "component_idle", "idle_timeout": "15m" } }
```

设为 `component_idle` 后，一段时间没有被用到的插件会退出，下次有消息需要它时自动启动。第一条消息会慢一点。缺省是 `always_on`，所有插件一直运行。

不是所有插件都支持，有后台任务的插件会一直运行。想让某个插件永远不退出：

```json
{ "sleep": { "mode": "component_idle", "plugins": { "alonabot-plugin-todo": "never" } } }
```

运行中也可以用命令查看和调整单个插件，立即生效：

```sh
# 全局设置与每个插件的状态
alonabot sleep-policy

# 永不退出、自定义空闲时长、恢复自动
alonabot sleep-policy alonabot-plugin-todo never
alonabot sleep-policy alonabot-plugin-todo 30m
alonabot sleep-policy alonabot-plugin-todo auto
```

## 文件写错了

- 不是合法的 JSON：Core 拒绝启动，并指出出错的行列。
- 某一项的值不对（比如该填数字的地方填了文字）：那一项用缺省值，日志里有一条说明，其他设置不受影响。

## 下载设置

在 WebUI 的设置中配置组件和源码构建所需的下载地址：

| 键 | 用途 |
| --- | --- |
| `github_download_prefix` | GitHub 归档下载镜像前缀 |
| `github_api_base` | GitHub API 地址 |
| `go_download_base` | Go 工具链下载地址，默认 `https://go.dev/dl/` |
| `goproxy` | Go module 代理，默认 `https://proxy.golang.org,direct` |

从 GitHub 源码安装时选择分支、标签或提交，Core 下载工具链、构建并安装组件；在任务中查看步骤和完整构建日志。下载的工具链与缓存保存在数据目录。
