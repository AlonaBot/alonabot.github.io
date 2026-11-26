---
title: 测试进阶
description: 模拟平台返回、检查 Adapter 调用、多账号并行、可推进时钟与连接运行中的 Core。
---

[插件测试](../tutorial/testing.md)覆盖了常见场景。本页说明 `plugintest` 里需要精确控制平台和时间的用法。

## 模拟平台的返回

`plugintest.Operations` 设置测试 Adapter 怎样响应发送、编辑、平台动作、撤回、读取合并转发和命令菜单：

```go
behavior := plugintest.Behavior{
	Send: func(ctx context.Context, call plugintest.Call) (*message.SendResult, *errcode.Error) {
		return call.SendResult, errcode.Unavailable.New("platform accepted the message with a warning")
	},
}
h := plugintest.Start(t, plugintest.Plugin(New()), plugintest.Operations(behavior))
```

`call.SendResult` 是缺省的成功回执，可以改成部分成功、失败或结果未知后返回。多个账号时，各自写在 `InstanceConfig.Behavior` 里。已经声明但没有设置回调的平台动作返回 `UNSUPPORTED`。

## 检查 Adapter 收到的调用

`h.Calls()` 返回全部已经完成的 Adapter 操作，`h.WaitCalls(ctx, n)` 等到有 n 条。每条记录包含操作名、账号、目标、参数、实际结果和错误。一次注入产生的调用也在 `result.Calls` 里。

## 调用 Handler 之前就失败的情况

参数解析失败、权限不足这类问题发生在调用 Handler 之前，结果记在 `result.Diagnostics`，而不是 `result.Outcomes`：

```go
result := h.Text(chat, alice, "/echo")
result.RequireReply(t, "Usage: /echo <text>")
d := result.Diagnostics[0]
if d.Phase != plugintest.PhaseArguments || errcode.Of(d.Err) != errcode.InvalidArgument {
	t.Fatalf("diagnostic = %+v", d)
}
```

`Phase` 为 `plugintest.PhaseArguments`（参数）或 `plugintest.PhaseAdmission`（权限、生命周期等准入）。`Outcomes` 只记录真正执行了的 Handler。

## 图片和文件

用 `h.Fixture` 准备一个平台文件，再注入引用它的消息；`result.Sends[i].Media` 保存 Adapter 实际取到的字节，可以直接比较：

```go
source := h.Fixture(plugintest.InstanceID, "pixel", plugintest.Media{Data: pngBytes, MIME: "image/png"})
result := h.Message(plugintest.Private(alice.ID), alice,
	message.Chain{message.Text("copy"), message.File(source, "input.png")})
sent := result.Sends[0]
// sent.Media 按消息链顺序保存 Adapter 实际取到的内容：Data、MIME、Filename
```

## 多个账号与并行注入

```go
h := plugintest.Start(t, plugintest.Plugin(p),
	plugintest.Instance(plugintest.InstanceConfig{AdapterID: "first", InstanceID: "one", AccountID: "bot1"}),
	plugintest.Instance(plugintest.InstanceConfig{AdapterID: "first", InstanceID: "two", AccountID: "bot2"}),
	plugintest.DefaultInstance("first", "one"),
	plugintest.AllowedInstances(p, "one"))
first := h.Submit(plugintest.Private("alice").OnInstance("one"), alice, message.Text("/ping"))
second := h.Submit(plugintest.Private("bob").OnInstance("two"), bob, message.Text("/ping"))
for _, pending := range []*plugintest.Pending{first, second} {
	result, err := pending.Wait(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	result.RequireReply(t, "pong")
}
```

- `plugintest.Instance` 列出的账号替换缺省的测试账号；`OnInstance` 选择消息来自哪个账号，`DefaultInstance` 选择主动发送时用哪个账号。
- `AllowedInstances(p, ...)` 限制插件能用哪些账号主动发送，`AdminOn(平台, 用户)` 指定平台管理员。
- `h.Text`、`h.Message` 会等到这次处理结束，需要并行注入时用 `h.Submit`，再分别 `Wait`。

## 后台发送

不属于某次注入的发送（后台协程、定时任务）用 `h.Background()` 读取，`h.WaitBackground(ctx, n)` 等到有 n 条。每条记录只返回一次。

## 可推进的时钟

```go
clock := plugintest.NewClock(time.Date(2040, 1, 1, 0, 0, 0, 0, time.UTC))
t.Cleanup(clock.Close)
h := plugintest.Start(t, plugintest.Plugin(p), plugintest.WithClock(clock))
clock.Advance(time.Minute)
records, err := h.WaitBackground(t.Context(), 1)
```

定时任务、`task.At/Every`、延续调用的期限和 `c.Wait` 都使用这个时钟。创建绝对时间的任务时用 `clock.Now()`。

## 测试运行中的 Core

`plugintest.Connect` 连接一个正在运行的 Core，把消息注入到真实的 Adapter 账号上，结果的格式和本地测试相同：

```go
token, err := os.ReadFile("../data/admin_token")
if err != nil {
	t.Fatal(err)
}
client := &debug.Client{URL: "http://127.0.0.1:7650", Token: strings.TrimSpace(string(token))}
conn, err := plugintest.Connect(context.Background(), client,
	plugintest.InstanceConfig{AdapterID: "telegram", InstanceID: "main", AccountID: "123456"})
if err != nil {
	t.Fatal(err)
}
defer conn.Close()
result, err := conn.Text(t.Context(), plugintest.Private("987654"), plugintest.User{ID: "987654"}, "/ping")
```

注入的消息照常经过命令匹配和权限检查，回复会真的发到平台上。`conn.Client` 还可以列出和调用这个 Adapter 的平台动作。
