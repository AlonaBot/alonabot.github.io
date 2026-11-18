---
sidebar_position: 10
title: 用 plugintest 测试插件
description: 在 go test 中运行真实 Core，注入消息并断言回复、交互与模型调用。
---

给[插件入门](first-plugin.md)的 `/ping` 加一个测试：注入消息，确认只回复一次 `pong`。`plugintest` 装配真实 Core、SDK Session 和回环测试 Adapter，命令绑定、权限、配置与数据库经过实际运行路径。

## 第一个测试

在 `plugin.go` 同目录创建 `plugin_test.go`，与插件使用同一个包：

```go title="plugin_test.go"
package plugin

import (
    "testing"

    "github.com/AlonaBot/AlonaBot/plugintest"
)

func TestPing(t *testing.T) {
    h := plugintest.Start(t, plugintest.Plugin(New()))
    alice := plugintest.User{ID: "alice"}
    result := h.Text(plugintest.Private(alice.ID), alice, "/ping")
    requireReply(t, result, "pong")
}

func requireReply(t *testing.T, result plugintest.Result, want string) {
    t.Helper()
    for _, outcome := range result.Outcomes {
        if outcome.Err != nil {
            t.Fatalf("handler %s/%s: %v", outcome.PluginID, outcome.RouteID, outcome.Err)
        }
    }
    if len(result.Sends) != 1 || result.Sends[0].Text() != want {
        t.Fatalf("result = %+v, want one reply %q", result, want)
    }
}
```

在主仓库根目录运行：

```fish
go test -v ./alonabot-plugin-ping
```

独立 module 的插件在工程目录运行 `go test -v ./...`。使用项目 `go.mod` 要求的 Go 版本，保留 `plugin.yaml`、Schema 与 `i18n/`。套件通过 `go list` 定位 `sdk.NewPlugin()` 所在的入口包，用与 CLI 相同的扫描器取得资源，沿用测试二进制的 GOOS、GOARCH 与 build tags；同一入口包在进程中扫描一次。直接运行测试即可，无需预先构建组件二进制或生成文件。

每次 `Start` 创建独立的 `t.TempDir()`、配置与 `dev.sqlite`，组件在同一进程中运行，管理 Listener 绑定临时 loopback 端口；`t.Cleanup` 停止 Core 和组件。扫描或激活失败会让测试失败，保留完整诊断。每次测试调用 `New()` 创建自己的插件对象。

## 读懂结果

`Text` 是 `Message(chat, user, message.Text(text))` 的便捷入口。混合输入用 `Message` 和 `message.Chain`；`Private("alice")` 的 chat ID 是 `private:alice`，`Group("room")` 的是 `group:room`。缺省 Adapter ID 为 `plugintest`，实例 ID 为 `test`，机器人账号为 `bot`。私聊指向机器人；群聊中 `message.Mention(plugintest.AccountID)` 可触发 ToMe。

- `Result.Sends`：注入开始到 Core 完成或等待通知之间，测试 Adapter 接受的发送与编辑，按接受顺序排列。
- `Sent.Text()`：拼接链中的文本；用 `Chain` 检查按钮和媒体，`To` 检查会话，`Result` 检查发送回执。`Op` 为 `send` 或 `edit`，`Edited` 为被编辑消息的句柄。
- `Result.Outcomes`：各路由的 `PluginID`、`RouteID`、安全错误 `Err` 与 `Waiting` 标记。`Err` 保留错误码和 `safe_message`；成功时为 nil。完整排障同时查看测试日志。
- `Result.Waiting`：本次调用已进入多轮等待，下一条符合用户与会话的消息可以继续它。

同一 Harness 的 `Text/Message/Event/Click/Trigger/TriggerTask/Background` **按顺序调用**，并发注入会使测试失败。事件入口等 Core 的完成或等待通知，测试无需用 sleep 猜测回复时刻。权限在 Handler 前拒绝时通常没有 Outcome；拒绝发送时检查 Outcome 错误以及已产生的发送记录。

## 选择测试环境

把选项传给 `Start(t, ...)`，`Config` 和 `AllowedInstances` 使用与 `Plugin` 登记的同一个 `p`：

- `Plugin(p)`：登记一个被测插件；可重复使用，测试跨插件 Service 时使用不同组件 ID
- `Config(p, json)`：按插件 Schema 提供基础配置；省略时采用配置准备流程的默认值
- `Admin("root")`：将用户登记为当前测试 Adapter 的 Core Admin
- `AllowedInstances(p, ids...)`：收紧发信许可；缺省允许全部，空列表拒绝全部实例的主动发送
- `Capabilities(names...)`：完整替换测试实例能力，选择要验证的能力组合
- `Adapter(id, declarations...)`：替换 Adapter ID，登记权限、扩展事件、片段或动作声明
- `LLM(handler)`：登记提供 `llm.generate` 的测试 Agent，将模型生成交给替身函数

实例缺省支持 `message.send`、`message.markdown`、`message.album`、`message.reference`、`message.buttons`、`message.forward` 与 `message.edit`。能力预检通过的发送与编辑返回 Accepted 和消息 ID；缺少能力时返回 `UNSUPPORTED`。用 `Capabilities("message.send")` 测试按钮或相册的错误处理。`AllowedInstances(p)` 可验证任务的 `PERMISSION_DENIED`；可信入站消息原目标的回复沿用原有豁免。

例如，把[配置页](config.md)的 `registerConfig` 和 Schema 加入插件，仍在 `New()` 返回前登记，再加入这个测试：

```go
func TestGreeting(t *testing.T) {
    p := New()
    h := plugintest.Start(t, plugintest.Plugin(p),
        plugintest.Config(p, `{"greeting":"Welcome","enabled":true}`))
    alice := plugintest.User{ID: "alice"}
    requireReply(t, h.Text(plugintest.Private(alice.ID), alice, "/greet"), "Welcome")
}
```

## 等待下一条消息

先在 `New()` 中登记[后台任务页](background.md#等待下一条回复)的 `/ask`。本页后续测试都复用 `requireReply`：

```go
func TestWait(t *testing.T) {
    h := plugintest.Start(t, plugintest.Plugin(New()))
    alice := plugintest.User{ID: "alice"}
    chat := plugintest.Private(alice.ID)
    question := h.Text(chat, alice, "/ask")
    requireReply(t, question, "Your answer?")
    if !question.Waiting {
        t.Fatalf("question = %+v, want waiting", question)
    }
    answer := h.Text(chat, alice, "Blue")
    requireReply(t, answer, "Blue")
    if answer.Waiting {
        t.Fatalf("answer = %+v, want completed", answer)
    }
}
```

问题的发送归入第一次结果；后续回复和最终错误归入取走消息的那次注入，直到延续结束或再次等待。其他用户、其他会话继续正常分发。

## 点击已发送按钮

在 `New()` 中登记[类型化按钮](background.md#类型化按钮)的 `registerButtons`，再测试：

```go
func TestClick(t *testing.T) {
    h := plugintest.Start(t, plugintest.Plugin(New()))
    alice := plugintest.User{ID: "alice"}
    menu := h.Text(plugintest.Group("room"), alice, "/choose")
    requireReply(t, menu, "Choose a value")
    clicked := h.Click(plugintest.User{ID: "bob"}, menu.Sends[0], "choose")
    requireReply(t, clicked, "yes")
}
```

`Click` 使用发送链里动作名为 `choose` 的按钮和 Core 签发的 token；本次 Actor 为 bob。权限按点击者重新检查。缺失动作、URL 按钮或缺少回执会使测试失败；权限拒绝、失效 token 与代次会跳过 Handler，返回空发送和空 Outcome。

## 立即触发提醒

在 `New()` 中登记[提醒示例](background.md#按用户请求创建提醒)的 `registerTasks`：

```go
func TestReminder(t *testing.T) {
    p := New()
    h := plugintest.Start(t, plugintest.Plugin(p))
    alice := plugintest.User{ID: "alice"}
    created := h.Text(plugintest.Private(alice.ID), alice, "/remind take a break")
    for _, outcome := range created.Outcomes {
        if outcome.Err != nil {
            t.Fatal(outcome.Err)
        }
    }
    if len(created.Sends) != 1 {
        t.Fatalf("create reminder = %+v", created)
    }
    key := created.Sends[0].Text()
    requireReply(t, h.TriggerTask(p, "remind", key), "take a break")
}
```

`TriggerTask` 使用 Core 保存的参数和真实 Scheduler 调用，立即派发已创建的实例，测试无需等一分钟。静态任务用 `h.Trigger(p, "tick")`，`tick` 对应 `p.Every/Cron` 的 job ID。使用登记到此 Harness 的同一 `p`；定位或准入失败会使测试失败，已派发 Handler 的错误在 Outcome 中。一次性实例在派发时消费。

## 检查模型请求

在 `New()` 中登记[模型示例](services.md#调用模型)的 `/draft`。测试文件补充标准库 `context`、`reflect` 与 `sdk/llm` 的导入：

```go
func TestDraft(t *testing.T) {
    requests := make(chan llm.Request, 1)
    h := plugintest.Start(t, plugintest.Plugin(New()),
        plugintest.LLM(func(_ context.Context, req llm.Request) (llm.Response, error) {
            requests <- req
            return llm.Response{Text: "Test draft", Model: "synthetic"}, nil
        }))
    alice := plugintest.User{ID: "alice"}
    result := h.Text(plugintest.Private(alice.ID), alice, "/draft Write a note")
    requireReply(t, result, "Test draft")
    req := <-requests
    want := []llm.Message{{Role: "user", Text: "Write a note"}}
    if !reflect.DeepEqual(req.Messages, want) {
        t.Fatalf("messages = %+v, want %+v", req.Messages, want)
    }
}
```

请求仍经过 `@agent` 定位、Service 调用和 Schema 校验，生成函数使用测试替身，运行无需模型密钥或 Provider 网络。错误场景让替身返回 `errcode.Unavailable.New("synthetic generation failure")`，检查 `errcode.Of(outcome.Err)` 与 `outcome.Err.Message`；省略 LLM 选项时，模型目标未激活，调用返回 `UNAVAILABLE`。替身在组件的 goroutine 中运行，断言放在收到结果后的测试线程中。

## 平台事件与后台发送

平台权限放在 `User.Permissions` 中，通过 `Adapter` 的 `adapter.PermissionDeclaration` 登记其名称与 `Implies`。用 `Admin` 检查 Core Admin 路由；普通用户被拒绝时同时检查发送和 Outcome 为空。

扩展事件与 Adapter 共用载荷类型。例如，插件包定义 `Notice`，在 `New()` 中调用 `registerNotice(p)`；以下还需导入 `sdk` 和 `sdk/adapter`：

```go
type Notice struct { Text string `json:"text"` }
var notice = sdk.AdapterEvent[Notice]("demo.notice", 1)

func registerNotice(p *sdk.Plugin) {
    p.On("notice", notice).Handle(func(c *sdk.Context, in *Notice) error {
        return c.Reply(in.Text)
    })
}
```

测试时选择平台并注入事件：

```go
func TestNotice(t *testing.T) {
    h := plugintest.Start(t, plugintest.Plugin(New()),
        plugintest.Adapter("demo", adapter.Event[Notice]("demo.notice", 1)))
    alice := plugintest.User{ID: "alice"}
    result := h.Event(plugintest.Group("room"), alice, notice, Notice{Text: "Joined"})
    requireReply(t, result, "Joined")
}
```

`Event` 经 Core 按 Adapter 声明的 Schema 校验载荷。切换 Adapter ID 后，构造用户或会话标识时也使用新的平台前缀。

`h.Background()` 按接受顺序返回并清空注入区间外的发送和编辑，每条记录消费一次；它读取已有记录。测试通过自己的 channel 控制后台工作，等 Send 返回后再读取。普通 Handler 的 Context 返回后失效；后台资源在 `OnStop` 中结束。完整生命周期与同步写法见[开发指南的后台发送示例](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#插件测试)。

## 验证真实平台

这套测试适合日常改命令、配置、数据库、交互与服务：回复可重复断言，数据和端口独立。平台 API 的物理拆分、联网收发和组件子进程重载，继续用[快速开始](../guide/quick-start.md)与相应 [Adapter](../adapters/index.md) 的实机步骤验证。

完整用例：[plugintest 测试](https://github.com/AlonaBot/AlonaBot/blob/main/plugintest/plugintest_test.go)、[LLM 测试](https://github.com/AlonaBot/AlonaBot/blob/main/plugintest/llm_test.go)。依据：[CONTRACTS §17](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#17-插件测试套件)。
