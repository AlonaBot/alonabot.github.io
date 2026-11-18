---
sidebar_position: 9
title: HTTP and Plugin Pages
description: Mount private routes and page assets while reusing Core management authentication.
---

Write standard `net/http` handlers and mount them in `New()` with `p.Route(method, path)`. Core provides the public entry and the SDK owns the internal Listener.

## Register a management page

Call `registerHTTP(p)` in the [Plugin Basics](first-plugin.md) project. Import `sdk`, `sdk/page`, standard-library `context`, `crypto/rand`, `crypto/subtle`, `fmt`, `net/http` and `log/slog`:

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

The business page uses management authentication. The sandboxed document loads its CSS and JS without management Cookies, so this example grants access to the read-only kit assets using a random state created at startup. The page embeds that state in the asset URLs; the public callbacks check it before serving the kit.

Core lists the page under the component, with English source title `Notes`. Set `{"pages":{"/page":"笔记"}}` in `i18n/zh-CN.json` to translate it. From `/page`, relative `kit.css?state=…` resolves to `/kit.css?state=…` within the same plugin prefix. A trailing-slash `/page/` requires matching `/page/kit.css` and `/page/kit.js` mounts.

`page.Handler()` serves embedded CSS and the bridge client with Content-Type and SDK-version ETags. Keep business content in the page and let the host draw the plugin name and search header.

## Use the page bridge client

Inside the host iframe, call `window.AlonaBot` after `kit.js` loads:

- `request(method, path, body?)`: Ask the host to request a relative route in this plugin, such as `request("GET", "/page")`. The Promise returns `status`, `ok`, the original `body` and parsed `data`, so you can inspect both status and content.
- `t(key, args?)`: Ask the host for a plugin translation in the current language; the Promise returns a string. Declare text under `messages` in `i18n/en-US.json`, such as `"hello_message": "Hello, {name}!"`, and call `t("hello_message", {name: "Alona"})`. Other languages translate the same key. On language changes, await the translation again in `onLocale` and update the page.
- `onTheme(fn)` and `onLocale(fn)`: Receive the current value immediately, then theme or language changes. Theme callbacks receive the theme name and `--ab-*` tokens. Both methods return an unsubscribe function; CSS applies theme tokens automatically.

⌘K / Ctrl+K inside the page forwards to the host search. The client communicates with the host through `postMessage`. Plugin-page host integration in the official WebUI is upcoming; see [Implementation Status](../guide/status.md).

## Access and authentication

Routes live at `/plugins/<plugin_id>/<path>`. Admin and plugin entries share the `base_url` hostname. Business routes are private by default, reusing Core management Bearer tokens or session Cookies. The kit asset routes above explicitly use callback-state authentication. Cookie-authenticated writes also require Origin and CSRF checks. The SDK verifies Core's forwarding credential before invoking the handler.

For ID `alonabot-plugin-ping`, `/page` is `http://127.0.0.1:7650/plugins/alonabot-plugin-ping/page` under the default Base URL. Access it using your actual installation, management authentication and configuration. [Quick Start](../guide/quick-start.md) demonstrates Bearer authentication for a private loopback route.

Core adds sandbox CSP and `nosniff`, and removes plugin Set-Cookie headers. Validate page inputs, filenames and external requests at business trust boundaries; use `html/template` for automatic escaping of dynamic HTML.

## Platform callbacks

Declare a public callback with `.Public(sdk.AuthCallbackState)` or the matching mode before `Handle`, then verify actual source credentials in the handler. The component owns public-route business verification. The [lifecycle example](https://github.com/AlonaBot/AlonaBot/blob/main/examples/plugins/lifecycle/main.go) uses random state and constant-time comparison.

Adapters may use `sdk.AuthPlatformToken` to verify platform credentials. Plugins choose a mode they actually implement. See [CONTRACTS §7](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md#7-native-信任http-与来源边界).

Sources: [page kit](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/page/page.go), [SDK HTTP](https://github.com/AlonaBot/AlonaBot/blob/main/sdk/http.go).
