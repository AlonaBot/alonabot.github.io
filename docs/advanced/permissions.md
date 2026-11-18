---
title: 权限与规则
description: 限制谁能用命令，以及在什么情况下才处理。
---

「谁能用」用权限控制，「什么情况下处理」用规则控制。

## 权限

```go
todo.Command("purge").Permission(sdk.Admin).Handle(purge)
```

| 权限 | 谁有 |
| --- | --- |
| `sdk.Anyone` | 任何人，包括平台无法确认身份的来源 |
| `sdk.User` | 所有用户。命令和文本匹配不写权限时是这个 |
| `sdk.Admin` | 机器人管理员，写在 Core 设置的 `admins` 里 |
| `sdk.ChatAdmin` | 当前群的管理员或群主，由平台判断 |

用 `Or` 表示满足其一即可：

```go
.Permission(sdk.Admin.Or(sdk.ChatAdmin))
```

没有权限时 Handler 不会被调用，用户也不会收到提示。

### 给一组命令设权限

权限可以设在命令组上，组里的命令都继承它；命令自己再设的话以自己的为准：

```go
	admin := p.Group("todo-admin").Permission(sdk.Admin)
	admin.Command("purge").Handle(purge)                          // 管理员
	admin.Command("stats").Permission(sdk.User).Handle(stats)     // 所有用户
```

### 平台特有的权限

各平台有自己的身份，比如 QQ 群的群主。用 `sdk.PermissionName` 加上平台提供的常量：

```go
import tgperm "github.com/AlonaBot/AlonaBot/adapters/telegram/perm"

.Permission(sdk.PermissionName(tgperm.ChatOwner))
```

| 平台 | 常量 | 含义 |
| --- | --- | --- |
| Telegram | `perm.ChatOwner`、`perm.ChatAdmin` | 群主、群管理员 |
| OneBot 11 | `perm.GroupOwner`、`perm.GroupAdmin` | 群主、群管理员 |
| OneBot 11 | `perm.PrivateFriend` | 私聊好友 |

### 在 Handler 里判断

同一个命令对不同身份做不同的事时，用 `c.Has`：

```go
func list(c *sdk.Context) error {
	if c.Has(sdk.Admin) {
		return c.Reply("All users' items: ...")
	}
	return c.Reply("Your items: ...")
}
```

### 机器人主人可以调整

机器人主人能在 WebUI 里改掉某个命令的权限，或者停用它，不需要你改代码。你在代码里写的是缺省值。

## 规则

规则是一个返回「处理 / 不处理」的函数，在 Handler 之前执行：

```go
	p.On(sdk.MessageCreated).Rule(sdk.ToMe()).
		Handle(func(c *sdk.Context) error {
			return c.Reply("You called?")
		})
```

| 内置规则 | 含义 |
| --- | --- |
| `sdk.ToMe()` | 消息是发给机器人的：私聊、@机器人，或者回复机器人的消息 |
| `sdk.NotCommand()` | 这条消息没有被当成命令处理过 |
| `sdk.Any(a, b)` | a、b 满足其一 |

写了多条规则时，全部满足才处理：

```go
.Rule(sdk.ToMe(), sdk.NotCommand())
```

### 自己写规则

规则的类型是 `func(*sdk.Context) (bool, error)`：

```go
func onlyGroups(c *sdk.Context) (bool, error) {
	return c.IsGroup(), nil
}

	p.Command("rollcall").Rule(onlyGroups).Handle(rollcall)
```

规则返回 `false` 时这个 Handler 被跳过，其他插件照常处理这条消息。

## 处理顺序

一条消息可能同时符合多个 Handler。数字越小越先执行，缺省是 0：

```go
	p.On(sdk.MessageCreated).Priority(-10).Handle(first)
```

先执行的 Handler 可以让后面的不再执行：

```go
func first(c *sdk.Context) error {
	c.StopPropagation()
	return nil
}
```
