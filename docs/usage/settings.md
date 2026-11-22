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
| `log.file.max_size` | `104857600`（100 MiB） | 单个日志文件字节上限 |
| `log.file.max_total` | `1073741824`（1 GiB） | 日志文件总字节上限 |
| `log.sources` | 空 | 按组件设置日志级别 |
| `log.file.max_age_days` | `30` | 日志文件保留天数 |
| `log.format` | `text` | 屏幕日志格式：`text` 或 `json` |
| `sleep.idle_timeout` | `15m` | 全局空闲时长 |
| `sleep.plugins` | 空 | 插件的 `never` 或正时长覆盖 |
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

每个账号里填什么由平台决定，见 [Telegram](telegram.md)、[OneBot 11](onebot11.md)。

`default_instance` 是插件主动发消息又没指定账号时用的那个。只有一个账号时不用写。

## 用环境变量

任何字符串值都可以写成 `${变量名}`，启动时从环境变量读取。适合 token 这类不想写在文件里的内容：

```json
{ "token": "${TELEGRAM_BOT_TOKEN}" }
```

只有整个字符串为 `${NAME}` 时展开，缺失变量记为校正并按 schema 处理；required 凭据仍为空时该实例启动失败。配置写回保留 `${...}` 原文。

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
| `mention_sender` | 入站消息首条原目标群回复 @ 发消息的人 |
| `quote` | 回复时引用原消息 |
| `prefix` | 入站消息首条原目标回复前加的普通文字 |
| `forward_threshold` | 回复超过多少字时改用合并转发，0 表示不用 |

首条回复的提及和前缀由 Core 统一处理，编辑保留已发送修饰；`forward_threshold` 在实例声明 `message.forward` 时启用。按会话改变前缀或回复方式，通过 Profile 的平台设置覆盖，`command_prefixes_by_instance` 作为未知键保留并忽略。

## 代理

```json
{ "proxy": "http://127.0.0.1:7890" }
```

支持 `http`、`https`、`socks5`。设置后 Core 和子进程收到 `HTTP_PROXY`/`HTTPS_PROXY`；为空时保留进程原有代理环境。Telegram 实例通过 `proxy_mode` 决定是否使用它。

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

设为 `component_idle` 后，一段时间没有被用到的插件会退出，下次有消息、Service、HTTP 请求或任务自然到期时自动启动。第一条消息会慢一点。缺省是 `always_on`，所有插件一直运行。

不是所有插件都支持，有后台任务的插件会一直运行。想让某个插件永远不退出：

```json
{ "sleep": { "mode": "component_idle", "plugins": { "alonabot-plugin-todo": "never" } } }
```

## 文件写错了

- JSON 语法、重复键或根节点错误：Core 拒绝启动，指出键路径与行列。
- 某一项的值不对（比如该填数字的地方填了文字）：那一项用缺省值，日志里有一条说明，其他设置不受影响。
