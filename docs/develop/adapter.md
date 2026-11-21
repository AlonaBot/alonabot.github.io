---
title: 编写 Adapter
description: 把一个新的聊天平台接入 AlonaBot。
---

Adapter 负责和一个聊天平台通信：把平台上的消息转成统一格式交给 Core，把 Core 要发的消息发到平台上。

这一页写一个最简单的 Adapter：它不连接任何平台，收到的每条消息来自一个定时器。结构和真实的 Adapter 相同，把定时器换成平台的接口就是真的了。

## 创建工程

```sh
alonabot init alonabot-adapter-demo --role adapter --adapter-id demo
cd alonabot-adapter-demo
```

工程 `alonabot-adapter-demo/` 包含：

| 路径 | 用途 |
| --- | --- |
| `adapter.go` | Adapter 代码 |
| `plugin.yaml` | 组件信息 |
| `adapter_config_schema.json` | 每个账号的设置项 |
| `go.mod` | Go module 与依赖 |

`--adapter-id demo` 是平台的标识。用户和会话的标识都以它开头，如 `demo:alice`。

## 两个接口

Adapter 要实现 `sdk/adapter` 包里的两个接口：

```go
// 一个平台
type Adapter interface {
	Descriptor() *Descriptor
	Start(ctx context.Context, req StartRequest, core Core) (Instance, error)
}

// 平台上的一个账号
type Instance interface {
	Account() Account
	Capabilities() []message.Capability
	Send(ctx context.Context, to string, chain message.Chain) (*message.SendResult, *errcode.Error)
	Stop(ctx context.Context) error
}
```

机器人主人每配置一个账号，Core 就调用一次 `Start`，你返回一个 `Instance`。

## 完整代码

```go title="adapter.go"
package component

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync/atomic"
	"time"

	"github.com/AlonaBot/AlonaBot/sdk/adapter"
	"github.com/AlonaBot/AlonaBot/sdk/errcode"
	"github.com/AlonaBot/AlonaBot/sdk/message"
)

const adapterID = "demo"

type demo struct{}

// New 是工程的入口。
func New() adapter.Adapter { return demo{} }

func (demo) Descriptor() *adapter.Descriptor {
	return &adapter.Descriptor{AdapterID: adapterID, Capabilities: capabilities}
}

var capabilities = []message.Capability{
	{Name: "message.created", Version: 1, Supported: true},
	{Name: "message.send", Version: 1, Supported: true},
}

func (demo) Start(ctx context.Context, req adapter.StartRequest, core adapter.Core) (adapter.Instance, error) {
	// 1. 读取这个账号的设置
	var config struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(req.ConfigJSON, &config); err != nil {
		return nil, err
	}

	// 2. 开始接收消息。真实的 Adapter 在这里连接平台。
	receive, cancel := context.WithCancel(context.Background())
	inst := &instance{id: req.InstanceID, name: config.Name, cancel: cancel, done: make(chan struct{})}
	go inst.receive(receive, core)
	return inst, nil
}

type instance struct {
	id, name string
	cancel   context.CancelFunc
	done     chan struct{}
	sequence atomic.Uint64
}

// receive 每 10 秒假装收到一条消息。
func (i *instance) receive(ctx context.Context, core adapter.Core) {
	defer close(i.done)
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		id := fmt.Sprint(i.sequence.Add(1))
		chain := message.Chain{message.Text("/hello")}
		_, err := core.Deliver(ctx, &message.Event{
			ID:                id,
			Type:              "message.created",
			Source:            message.SourceAdapter,
			OccurredAt:        time.Now(),
			AdapterID:         adapterID,
			AdapterInstanceID: i.id,
			AccountID:         i.id,
			Session:           message.SID(adapterID, "alice", ""),
			ChatType:          message.ChatPrivate,
			Actor:             &message.Actor{ExternalUserID: "alice", AdapterInstanceID: i.id},
			Message:           &message.PlatformMessage{PlatformMessageID: id, Chain: chain},
			Payload:           &message.CreatedPayload{PlatformMessageID: id, Chain: chain, ToMe: true},
		}, nil)
		if err != nil {
			slog.Error("deliver failed", "error", err)
		}
	}
}

func (i *instance) Account() adapter.Account {
	return adapter.Account{ID: i.id, DisplayName: i.name}
}

func (*instance) Capabilities() []message.Capability { return capabilities }

// Send 把消息发到平台。这里只写日志。
func (i *instance) Send(_ context.Context, to string, chain message.Chain) (*message.SendResult, *errcode.Error) {
	slog.Info("send", "to", to, "text", chain.Text())

	id := fmt.Sprint(i.sequence.Add(1))
	indexes := make([]uint32, len(chain))
	for n := range chain {
		indexes[n] = uint32(n)
	}
	return &message.SendResult{
		Status:                   message.SendAccepted,
		Session:                  to,
		AdapterInstanceID:        i.id,
		PrimaryPlatformMessageID: id,
		PlatformMessageIDs:       []string{id},
		PartResults: []message.PartResult{{
			PartIndex: 0, SegmentIndexes: indexes,
			Status: message.PartAccepted, PlatformMessageIDs: []string{id},
		}},
	}, nil
}

func (i *instance) Stop(context.Context) error {
	i.cancel()
	<-i.done
	return nil
}
```

账号的设置：

```json title="adapter_config_schema.json"
{
  "name": { "type": "string", "description": "Display name", "default": "Demo Bot" }
}
```

格式和插件的[配置项](../reference/config-schema.md)相同。

## 运行

Adapter 需要至少一个账号才会启动。在 `data/core_config.json` 里加上：

```json title="data/core_config.json"
{
  "adapters": {
    "demo": {
      "package": "alonabot-adapter-demo",
      "instances": { "one": {} }
    }
  }
}
```

和[快速上手](../quick-start.md)里的插件一起运行：

```sh
alonabot run . ../alonabot-plugin-hello
```

每 10 秒日志里出现一次：

```text
send to=demo:alice text=Hello!
```

这说明整条路走通了：你的 Adapter 交付了 `/hello`，Core 找到插件，插件回复，Core 调用了你的 `Send`。

## 从第三方源码调试

要修改第三方 Adapter 本身，先取得源码，使用带有 `plugin.yaml` 的工程目录。开发目录由 CLI 在本地编译、加载，支持第三方 Adapter，无需加入 Core 的官方仓库映射。账号字段按该项目的 `adapter_config_schema.json` 和说明填写。

例如，QQ Adapter 源码在 `./qq-adapter`，业务插件源码在 `./my-plugin`，两者一起热开发：

```sh
alonabot run ./qq-adapter ./my-plugin --data-dir ./qq-source-data --log-level debug
```

Core 启动后，在同一工作目录的另一终端添加账号。下面假定 `plugin.yaml` 中的 `id` 是 `alonabot-adapter-qq`，请替换成实际值：

```fish
set -gx ALONABOT_ADMIN_TOKEN '这次启动的管理 token'
alonabot adapter instance create alonabot-adapter-qq qq-main --config ./qq-account.json --data-dir ./qq-source-data
```

保存任一工程的代码后，CLI 自动重新编译并重启对应组件。这里使用独立数据目录：同一数据目录中，开发组件与已安装组件的 ID 或 Adapter 平台标识冲突时，Core 会拒绝启动。

## 逐个说明

### 交付消息：core.Deliver

收到平台的消息后，转成 `message.Event` 交给 Core。必须填对的字段：

| 字段 | 含义 |
| --- | --- |
| `ID` | 这个事件的标识，同一个账号内不重复 |
| `Type` | 事件类型，新消息是 `message.created` |
| `Session` | 会话标识，用 `message.SID(adapterID, 会话ID, 话题ID)` 生成 |
| `ChatType` | `message.ChatPrivate`、`message.ChatGroup` 或 `message.ChatChannel` |
| `Actor.ExternalUserID` | 发消息的用户在平台上的 ID |
| `Payload` | 事件内容。`ToMe` 表示这条消息是不是发给机器人的（私聊、被 @、回复机器人） |

身份信息必须来自平台，**不能用消息内容里自称的身份**。Core 根据这里的用户 ID 判断权限。

`Deliver` 的最后一个参数是「游标」，见下面的[断线续传](#断线续传)。

### 发送消息：Send

`chain` 是要发的内容，可能有文字、图片、按钮等。把它转成平台的接口调用。

- 遇到平台发不了的内容，返回 `errcode.Unsupported.New("...")`，不要悄悄丢掉。
- 一条 `chain` 可能要拆成平台上的几条消息（比如先发图再发字）。`PartResults` 里每一项对应平台上的一条消息，`SegmentIndexes` 说明它包含 `chain` 里的哪几项。
- 发到一半失败时，同时返回已经成功的部分和错误，`Status` 设为 `message.SendPartial`。
- **不要自动重试**。发送超时不代表平台没收到，重试可能发出两条。

### 声明能力：Capabilities

列出这个平台支持什么。Core 根据它在发送前就拒绝做不到的事，插件会收到明确的 `UNSUPPORTED` 错误。

| 名称 | 含义 |
| --- | --- |
| `message.created`、`message.edited`、`message.deleted` | 能通知这类事件 |
| `member.joined`、`member.left` | 能通知进群、退群 |
| `message.send` | 能发消息 |
| `message.edit` | 能编辑已发出的消息（还要实现 `adapter.Editor` 接口） |
| `message.buttons`、`button.clicked` | 能发按钮、能通知点击 |
| `message.album` | 能把多张图片合成一条 |
| `message.reference` | 能引用回复 |
| `message.markdown` | 能显示格式化文字 |

**只声明真正实现了的。**

### 停止：Stop

停止接收消息并等接收的协程结束后再返回。`Stop` 返回后不能再调用 `core.Deliver`。

## 断线续传

很多平台按顺序给消息编号，Adapter 重启后可以从上次的位置继续收。这个位置就是游标：

```go
// 交付消息时带上「处理到哪了」
core.Deliver(ctx, event, []byte(strconv.FormatInt(update.ID, 10)))

// 下次启动时从 req.Cursor 取回
func (demo) Start(ctx context.Context, req adapter.StartRequest, core adapter.Core) (adapter.Instance, error) {
	offset, _ := strconv.ParseInt(string(req.Cursor), 10, 64)
	// 从 offset 之后开始接收
}
```

游标的内容由你决定，Core 只负责保存。不需要时传 `nil`。

## 启动时检查账号

`Start` 里应该先验证设置是否可用（比如用 token 请求一次平台的「我是谁」接口），失败就返回错误。这样机器人主人填错 token 时能立刻在界面上看到原因，而不是「启动成功但收不到消息」。

连接在运行中永久断开（比如 token 被吊销）时，调用 `core.ReportFailure` 告诉 Core 这个账号不能用了。

## 平台特有的权限

平台有「群主」「群管理员」这类身份时，在 `Descriptor` 里声明，并在交付消息时把用户拥有的权限填进 `Actor.Permissions`。权限的名字以平台标识开头，如 `demo.group_owner`。把名字定义成常量放在单独的 `perm` 包里，插件作者可以直接导入使用。

## 接收平台的回调

平台通过 webhook 推送消息时，在 `Descriptor` 里声明 HTTP 路由：

```go
return &adapter.Descriptor{
	AdapterID: adapterID,
	HTTP: []adapter.HTTPRoute{{
		Method:  http.MethodPost,
		Path:    "/webhook",
		Auth:    adapter.AuthPlatformToken,
		Handler: http.HandlerFunc(handleWebhook),
	}},
}
```

地址是 `<base_url>/plugins/<组件ID>/webhook`。`AuthPlatformToken` 表示这是公开地址，由你在 Handler 里验证平台的签名或 token。

## 测试

把平台的接口换成本地的模拟服务（用 `net/http/httptest`），在测试里启动它，让 Adapter 连过去。这样可以测试断线、超时、平台返回错误等真实环境里难以重现的情况。

配合 `plugintest` 测试「插件 + 你的 Adapter」时，用 `plugintest.Adapter("demo", ...)` 让测试平台使用你的平台标识和权限声明。

## 发布

和插件相同，见[打包与发布](../advanced/publish.md)。组件 ID 用 `alonabot-adapter-` 开头。
