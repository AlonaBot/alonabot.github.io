---
title: 按钮
description: 在消息下面放按钮，处理用户的点击。
---

按钮让用户点一下就能操作，不用打字。

## 注册按钮与点击处理函数

```go
package plugin

import (
	"github.com/AlonaBot/AlonaBot/sdk"
	"github.com/AlonaBot/AlonaBot/sdk/button"
	"github.com/AlonaBot/AlonaBot/sdk/message"
)

// 点击时带回来的数据
type Vote struct {
	Choice string `json:"choice"`
}

var vote = button.Define[Vote]("vote")

func New() *sdk.Plugin {
	p := sdk.NewPlugin()

	// 发出带按钮的消息
	p.Command("poll").Handle(func(c *sdk.Context) error {
		return c.Reply("Tea or coffee?", message.Buttons([]message.Button{
			vote.Button("Tea", Vote{Choice: "tea"}),
			vote.Button("Coffee", Vote{Choice: "coffee"}),
		}))
	})

	// 处理点击
	button.On(p, vote).Handle(func(c *sdk.Context, v Vote) error {
		return c.Reply("You chose " + v.Choice + ".")
	})

	return p
}
```

终端对话里按钮显示成编号，输入 `#编号` 表示点击：

```text
> /poll
Tea or coffee?
#1 Tea
#2 Coffee
> #2
You chose coffee.
```

三个步骤：

1. **`button.Define[Vote]("vote")`** 声明一种按钮动作，`Vote` 是点击时带回来的数据。
2. **`vote.Button("Tea", Vote{...})`** 创建一个按钮，第一个参数是按钮上的字。
3. **`button.On(p, vote).Handle(...)`** 处理点击，第二个参数就是创建按钮时放进去的数据。

## 按钮布局

`message.Buttons` 的每个参数是一行：

```go
message.Buttons(
	[]message.Button{vote.Button("Tea", Vote{"tea"}), vote.Button("Coffee", Vote{"coffee"})},
	[]message.Button{vote.Button("Neither", Vote{"none"})},
)
```

## 打开链接的按钮

```go
message.URLButton("Open website", "https://example.com")
```

点击后打开网页，插件不会收到通知。

## 点击者身份与权限

处理点击的 Handler 里，`c.User()` 是**点按钮的人**，不一定是当初发命令的人。群里任何人都能点。只想让发起人操作时，把发起人放进数据里比较：

```go
type Confirm struct {
	Owner string `json:"owner"`
}

var confirm = button.Define[Confirm]("confirm")

	button.On(p, confirm).Handle(func(c *sdk.Context, v Confirm) error {
		if c.User() != v.Owner {
			return nil
		}
		return c.Reply("Confirmed.")
	})
```

也可以像命令一样加权限和规则：

```go
button.On(p, confirm).Permission(sdk.Admin).Handle(onConfirm)
```

## 点击后更新原消息

把原来那条消息改掉，比再发一条更清楚：

```go
	button.On(p, vote).Handle(func(c *sdk.Context, v Vote) error {
		_, err := c.Edit(c.Event().Ref(), message.Text("You chose "+v.Choice+"."))
		return err
	})
```

编辑原消息需要账号支持消息编辑，账号操作可在[平台接入](../platforms/index.md#查询账号能力)中查询。

## 按钮数据与平台支持

- 带回来的数据转成 JSON 后不能超过 1024 字节。放标识就够了，大的内容存数据库。
- 平台不支持按钮时，发送会返回 `UNSUPPORTED` 错误。要兼容这类平台，出错时改发文字说明：

```go
	err := c.Reply("Tea or coffee?", buttons)
	if errcode.Of(err) == errcode.Unsupported {
		return c.Reply("Tea or coffee? Reply /vote tea or /vote coffee.")
	}
	return err
```

## 测试

```go
func TestPoll(t *testing.T) {
	h := plugintest.Start(t, plugintest.Plugin(New()))
	alice := plugintest.User{ID: "alice"}

	poll := h.Text(plugintest.Group("room"), alice, "/poll")
	bob := plugintest.User{ID: "bob"}
	h.Click(bob, poll.Sends[0], "vote").RequireReply(t, "You chose tea.")
}
```

`h.Click` 点击那条消息里第一个动作名为 `vote` 的按钮。
