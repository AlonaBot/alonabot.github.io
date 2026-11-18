---
sidebar_position: 9
title: HTTP 与插件页面
description: 用 SDK 挂载私有路由和页面套件，复用 Core 管理认证。
---

用标准库 `net/http` 写 Handler，在 `New()` 中通过 `p.Route(method, path)` 挂载。Core 提供公开入口，SDK 托管内部 Listener；插件专注业务 HTTP。

## 注册管理页面

在[插件入门](first-plugin.md)的工程中调用 `registerHTTP(p)`。导入 `sdk`、`sdk/page`，以及标准库 `context`、`crypto/rand`、`crypto/subtle`、`fmt`、`net/http`、`log/slog`：

```go
const pageHTML = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="kit.css?state=%s">
<script src="kit.js?state=%s" defer></script></head>
<body><main><p>The plugin page is ready.</p></main></body></html>`

func registerHTTP(p *sdk.Plugin) {
    var assetState string
    p.OnStart(func(context.Context) error {
        assetState = rand.Text()
        return nil
    })
    assets := page.Handler()
    serveAssets := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if subtle.ConstantTimeCompare([]byte(r.URL.Query().Get("state")), []byte(assetState)) != 1 {
            http.Error(w, "invalid asset state", http.StatusForbidden)
            return
        }
        assets.ServeHTTP(w, r)
    })
    p.Route(http.MethodGet, "/kit.css").Public(sdk.AuthCallbackState).Handle(serveAssets)
    p.Route(http.MethodGet, "/kit.js").Public(sdk.AuthCallbackState).Handle(serveAssets)
    p.Route(http.MethodGet, "/page").Page("Notes").
        HandleFunc(func(w http.ResponseWriter, _ *http.Request) {
            w.Header().Set("Content-Type", "text/html; charset=utf-8")
            if _, err := fmt.Fprintf(w, pageHTML, assetState, assetState); err != nil {
                slog.Error("write plugin page", "err", err)
            }
        })
}
```

业务页面使用管理认证。沙箱文档加载 CSS、JS 时不发送管理 Cookie，因此这里用启动时生成的随机 state 授予只读套件资源的访问。页面把 state 放进资源 URL，公开回调先校验它，再提供套件内容。

页面列在 Core 返回的组件页面目录中，英文源标题为 `Notes`；`i18n/zh-CN.json` 可写 `{"pages":{"/page":"笔记"}}`。以 `/page` 打开时，相对地址 `kit.css?state=…` 解析到同一插件前缀内的 `/kit.css?state=…`；使用尾斜杠 `/page/` 时须相应挂载 `/page/kit.css` 与 `/page/kit.js`。

`page.Handler()` 提供内嵌 CSS 与桥客户端，响应带 Content-Type 和 SDK 版本 ETag。页面内保留业务内容，顶部插件名与搜索交给宿主。

## 使用页面桥客户端

在宿主 iframe 中，加载 `kit.js` 后通过 `window.AlonaBot` 调用：

- `request(method, path, body?)`：让宿主请求本插件的相对路由，例如 `request("GET", "/page")`。Promise 返回 `status`、`ok`、原文 `body` 与解析后的 `data`，可同时检查状态与内容。
- `t(key, args?)`：向宿主请求当前语言的插件译文，Promise 返回字符串。文案在 `i18n/en-US.json` 的 `messages` 中声明，例如 `"hello_message": "Hello, {name}!"`，调用 `t("hello_message", {name: "Alona"})`；其他语言提供同键翻译。语言变化时在 `onLocale` 回调中重新等待译文并更新页面。
- `onTheme(fn)`、`onLocale(fn)`：登记后立即回调当前值，后续接收主题或语言变化；主题回调收到主题名与 `--ab-*` 令牌，两个方法都返回取消订阅函数。CSS 自动应用主题令牌。

页面中的 ⌘K / Ctrl+K 会转发到宿主搜索。客户端使用 `postMessage` 与宿主通信；官方 WebUI 的插件页面宿主接入仍有后继工作，见[实现状态](../guide/status.md)。

## 访问与认证

插件路由挂在 `/plugins/<plugin_id>/<path>`，管理入口与插件入口共用 `base_url` 主机名。业务路由默认私有，复用 Core 管理 Bearer token 或会话 Cookie；上面的套件资源路由显式使用回调 state 认证。Cookie 认证的写请求还要满足 Origin 与 CSRF 校验。SDK 验证 Core 转发凭证后才调用 Handler。

例如 ID `alonabot-plugin-ping` 的 `/page` 在缺省 Base URL 下是 `http://127.0.0.1:7650/plugins/alonabot-plugin-ping/page`。使用安装包、管理认证和实际配置访问；[快速开始](../guide/quick-start.md)展示私有回环路由的 Bearer 用法。

Core 给页面响应添加 sandbox CSP 与 `nosniff`，移除插件的 Set-Cookie。页面的输入、文件名与外部请求仍按业务信任边界检查；动态 HTML 使用 `html/template` 自动转义。

## 平台回调

公开回调在 `Handle` 前声明 `.Public(sdk.AuthCallbackState)` 等对应模式，并在 Handler 中验证真正的来源凭证。默认管理认证只用于私有路由；公开路由的业务验证由组件完成。标准示例 [lifecycle](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/lifecycle/main.go)使用随机 state 与恒定时间比较。

Adapter 可使用 `sdk.AuthPlatformToken` 校验平台凭证，普通插件选择其实际支持的模式。完整认证规则见 [CONTRACTS §7](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#7-native-信任http-与来源边界)。

依据：[页面套件](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/page/page.go)、[SDK HTTP](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/http.go)。
