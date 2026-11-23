---
title: 网页与 HTTP 接口
description: 给插件加管理页面，或者接收外部服务的回调。
---

插件可以提供 HTTP 接口。常见用途有两个：在 WebUI 里显示一个管理页面，接收外部服务的回调（webhook）。

Handler 用 Go 标准库的 `net/http` 写，不需要自己监听端口。

## 插件页面

```go
package plugin

import (
	"net/http"

	"github.com/AlonaBot/AlonaBot/sdk"
)

const pageHTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="kit.css">
  <script src="kit.js"></script>
</head>
<body>
  <div class="ab-card">
    <div class="ab-card-header">To-do</div>
    <div class="ab-card-body">
      <p id="count">Loading...</p>
      <button class="ab-btn ab-btn-primary" id="refresh">Refresh</button>
    </div>
  </div>
  <script>
    async function load() {
      const res = await AlonaBot.request("GET", "/api/count");
      document.getElementById("count").textContent = res.data.count + " items";
    }
    document.getElementById("refresh").onclick = load;
    load();
  </script>
</body>
</html>`

func New() *sdk.Plugin {
	p := sdk.NewPlugin()

	p.Route(http.MethodGet, "/page").Page("To-do").
		HandleFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write([]byte(pageHTML))
		})

	p.Route(http.MethodGet, "/api/count").
		HandleFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"count": 3}`))
		})

	return p
}
```

`.Page("To-do")` 把这个地址注册为插件页面，它会出现在 WebUI 的插件详情里，标题是 `To-do`。

页面里引用的 `kit.css` 和 `kit.js` 是框架提供的页面套件，写了 `.Page` 就自动可用，不用自己提供这两个文件。

### 页面套件

`kit.css` 让页面的样子和 WebUI 一致，并且跟随明暗主题切换。常用的样式类：

| 元素 | 类名 |
| --- | --- |
| 卡片 | `ab-card`、`ab-card-header`、`ab-card-body` |
| 按钮 | `ab-btn`、`ab-btn-primary`、`ab-btn-danger` |
| 输入框、下拉框 | `ab-input`、`ab-select` |
| 表格 | `ab-table` |
| 标签 | `ab-badge` |

`kit.js` 提供 `window.AlonaBot`：

| 方法 | 作用 |
| --- | --- |
| `AlonaBot.request(method, path, body?)` | 请求本插件的接口。返回 `status`、`ok`、`data`（解析后的 JSON）等 |
| `AlonaBot.t(key, args?)` | 取当前语言的文字，见[多语言](i18n.md) |
| `AlonaBot.onTheme(fn)` | 主题变化时调用 |
| `AlonaBot.onLocale(fn)` | 语言变化时调用 |

页面里请求自己的接口要用 `AlonaBot.request`，不要用 `fetch`：页面运行在受限制的环境里，直接 `fetch` 带不上登录状态。

页面顶部的插件名和搜索框由 WebUI 提供，页面里不用再画。

### 标题翻译

```json title="i18n/zh-CN.json"
{ "pages": { "/page": "待办" } }
```

## 访问地址和登录

插件的接口都在 `/plugins/<插件ID>/` 下面。上面的页面在缺省设置下是：

```text
http://127.0.0.1:7650/plugins/alonabot-plugin-todo/page
```

**接口缺省只有登录了管理界面的人能访问。** 所以上面的 `/api/count` 不需要自己做登录检查。

## 接收外部回调

外部服务（比如 GitHub 的 webhook）没有管理界面的登录状态。给它用的接口要声明为公开，并且**自己验证请求的来源**：

```go
	p.Route(http.MethodPost, "/webhook").Public(sdk.AuthCallbackSignature).
		HandleFunc(func(w http.ResponseWriter, r *http.Request) {
			body, err := io.ReadAll(r.Body)
			if err != nil {
				http.Error(w, "bad request", http.StatusBadRequest)
				return
			}
			if !validSignature(r.Header.Get("X-Hub-Signature-256"), body, p.Config().String("webhook_secret")) {
				http.Error(w, "invalid signature", http.StatusUnauthorized)
				return
			}
			// 处理 body ...
			w.WriteHeader(http.StatusNoContent)
		})
```

```go
func validSignature(header string, body []byte, secret string) bool {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	want := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(header), []byte(want))
}
```

`Public` 的参数说明你用什么方式验证：

| 参数 | 验证方式 |
| --- | --- |
| `sdk.AuthCallbackSignature` | 对方用共享密钥对请求签名 |
| `sdk.AuthCallbackState` | 地址里带一个只有双方知道的随机值 |
| `sdk.AuthCallbackNonce` | 一次性的随机值 |

这个参数只是声明，框架不会替你验证。公开接口谁都能访问，不验证就等于把功能暴露给所有人。

## 在回调里发消息

HTTP Handler 里没有 `c`，发消息用包级函数，并指明发到哪个会话：

```go
err := sdk.SendText(r.Context(), session, "New push to main.")
```

## 安全

框架对插件的响应做了几项限制，写页面时要知道：

- 页面在浏览器的沙箱里运行，不能读取 WebUI 的登录信息。
- 插件设置的 Cookie 会被去掉。
- 把用户输入显示到页面上时要转义，用 `html/template` 生成 HTML。
