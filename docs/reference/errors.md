---
title: 错误码
description: SDK 返回的错误码和常见原因。
---

SDK 的函数出错时，返回的 `error` 里带有一个错误码。用 `errcode.Of` 取出来判断：

```go
import "github.com/AlonaBot/AlonaBot/sdk/errcode"

	_, err := c.Edit(ref, message.Text("Done."))
	if errcode.Of(err) == errcode.Unsupported {
		return c.Reply("Done.")
	}
	return err
```

`errcode.Of` 对不是 SDK 产生的错误返回 `0`。

自己的代码里要返回带错误码的错误（比如在[服务](../advanced/services.md)的 Handler 里）：

```go
return out, errcode.NotFound.New("city not found")
return out, errcode.InvalidArgument.Errorf("invalid city %q", in.City)
```

错误信息用英文，不要包含密钥。

## 全部错误码

| 常量 | 含义 | 常见原因 |
| --- | --- | --- |
| `InvalidArgument` | 参数不合法 | 发送空消息；会话标识格式不对；按钮数据超过 1024 字节 |
| `Unauthenticated` | 没有通过身份验证 | |
| `PermissionDenied` | 没有权限 | 机器人主人没有允许插件往这个账号主动发消息；插件不在允许调用大模型的名单里；调用了别的插件的私有服务 |
| `NotFound` | 目标不存在 | 调用的服务不存在；要取消的任务不存在 |
| `AlreadyExists` | 已经存在 | 同一个用户在同一个会话里已经有一个 `Wait` 在等 |
| `FailedPrecondition` | 前置条件未满足 | 在 `OnStart` 里发消息；在 Handler 返回之后继续用 `c`；在后台协程里调用需要当前消息的函数 |
| `Unsupported` | 平台不支持 | 在不能编辑消息的平台上编辑；在没有按钮的平台上发按钮 |
| `ResourceExhausted` | 资源耗尽或超出配额 | 短时间内调用太多；内容太大 |
| `DeadlineExceeded` | 超时 | `Wait` 没等到回答；Handler 超过 30 秒；被调用的服务太慢 |
| `Cancelled` | 被取消 | 插件正在停止 |
| `Unavailable` | 暂时不可用 | 被调用的插件没在运行；没有配置大模型；平台连接断开 |
| `Internal` | 内部错误 | Handler 里发生了 panic |
| `CallCycle` | 循环调用 | 插件 A 的服务调用 B，B 又调用 A；Handler 里调用了自己插件的服务 |
| `NoDefaultTarget` | 缺少默认发送目标 | 在定时任务或广播的 Handler 里用了 `c.Reply`，这里没有「当前会话」，改用 `c.SendTo` |
| `PluginNotReady` | 插件还没准备好 | |
| `ProtocolError` | 通信错误 | 通常是框架的问题，请报告 |
| `NeedsManualMigration` | 需要人工处理数据 | |

## 超时和取消之后

`DeadlineExceeded` 和 `Cancelled` 只说明**你没有等到结果**，不代表对方没有执行。比如发消息超时，消息可能已经发出去了。所以不要在这两种错误后自动重试有副作用的操作。

## Handler 返回错误会怎样

- 错误记到日志里，机器人主人能在日志和管理界面看到。
- **不会**自动告诉用户。要让用户知道，自己 `c.Reply` 一句。
- 其他插件对这条消息的处理不受影响。
