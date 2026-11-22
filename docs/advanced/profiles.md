---
title: 不同会话用不同配置
description: 让同一个配置项在不同的群里取不同的值。
---

同一个机器人可能在好几个群里工作，每个群想要的设置不一样：工作群的待办上限 50 条，闲聊群 10 条。「配置文件」解决这个问题。

**配置文件**是一组设置的名字。机器人主人可以建立多个配置文件，把不同的群指定到不同的配置文件上。没有指定的会话用名为 `default` 的那个。

## 插件要做的

只有一件事：在允许按会话变化的配置项上加 `"profile": true`。

```json title="config_schema.json"
{
  "limit": {
    "type": "int",
    "description": "Maximum items per user",
    "default": 20,
    "profile": true
  }
}
```

代码不用改。Handler 里的 `c.Config().Int("limit")` 会自动返回当前会话对应的值。

## 机器人主人要做的

在 WebUI 里操作，或者用命令行：

```sh
# 建立一个配置文件
alonabot profile create work

# 查看它的 ID
alonabot profile list

# 在这个配置文件里把 limit 设为 50
alonabot profile set <ID> alonabot-plugin-todo limit 50

# 让机器人账号 main 所在的某个群使用它
alonabot profile assign <ID> main 'telegram:-100123456'
```

之后那个群里每人最多 50 条，其他群仍然是 20 条。

决定一个会话用哪个配置文件的顺序：

1. 单独指定给这个会话的。
2. 指定给这个机器人账号的。
3. `default`。

## 哪些配置项适合标记

适合：每次处理消息时才读取的值。上限、开关、回复的风格、使用哪个模型。

不适合：

- **启动时读取的值**。数据库地址、后台任务的间隔。它们在 `OnStart` 里用 `p.Config()` 读取，那时还没有「当前会话」，读到的永远是基础值。
- **密钥**。`"secret": true` 的配置项不能标记。

## c.Config 和 p.Config 的区别

| 写法 | 在哪用 | 读到的值 |
| --- | --- | --- |
| `c.Config()` | Handler 里 | 当前会话的配置文件覆盖之后的值 |
| `p.Config()` | 启动回调、后台协程 | 基础值，不受配置文件影响 |

`default` 的字段修改先保存为 Pending，执行 `alonabot reload <插件ID> --yes` 后生效；其他 Profile 覆盖从下一次调用生效。一次调用里 `c.Config()` 的值不会变。机器人主人中途改了设置，从下一条消息开始生效。

## 在某个会话里停用插件

机器人主人还可以在配置文件里关掉某个插件。关掉后，使用这个配置文件的会话里：

- 插件的命令不可用，文本匹配和事件 Handler 不会被调用。
- 定时任务、被其他插件调用的服务照常工作。

这不需要插件做任何事。
