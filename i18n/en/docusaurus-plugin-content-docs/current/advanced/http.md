---
title: Pages and HTTP routes
description: Serve a plugin page or accept an authenticated callback.
---

Use standard `net/http` handlers; Core owns the listening port.

## A plugin page

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

`.Page("To-do")` lists the route in WebUI and mounts `kit.css` and `kit.js`. The displayed count is fixed demo data; replace the count handler with your business query.

| Class | Element |
| --- | --- |
| `ab-card`, `ab-card-header`, `ab-card-body` | Cards |
| `ab-btn`, `ab-btn-primary`, `ab-btn-danger` | Buttons |
| `ab-input`, `ab-select` | Inputs |
| `ab-table`, `ab-badge` | Tables and labels |

Use `AlonaBot.request(method, path, body?)` for authenticated requests to this plugin. It returns status, ok, data and response content. `AlonaBot.t` resolves a Promise with localized text; onTheme/onLocale subscribe to UI changes. The page runs in a sandboxed iframe, so direct fetch does not carry management authentication. WebUI provides the surrounding header and search.

Translate the page title by path:

```json title="i18n/zh-CN.json"
{ "pages": { "/page": "待办" } }
```

## Address and authentication

```text
http://127.0.0.1:7650/plugins/alonabot-plugin-todo/page
```

Routes are under `/plugins/<componentID>/`. The default route requires a management session or Bearer token. Cookie-authenticated writes also require the controlled Origin and CSRF header. Custom page assets use `.Public(sdk.AuthStatic)` for GET/HEAD so the sandbox can load them; keep data APIs private.

## External callbacks

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
			w.WriteHeader(http.StatusNoContent)
		})
```

This fragment also imports `io`. Declare `webhook_secret` as a secret setting and verify the sender's signature:

```go
func validSignature(header string, body []byte, secret string) bool {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	want := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(header), []byte(want))
}
```

The verification function imports `crypto/hmac`, `crypto/sha256` and `encoding/hex`; this hash is required by the GitHub webhook protocol.

| Declaration | Verification owned by the plugin |
| --- | --- |
| AuthCallbackSignature | Shared-secret signature |
| AuthCallbackState | Random shared state |
| AuthCallbackNonce | One-use random value |

The declaration records the authentication scheme. Your handler performs the actual verification before any side effect.

## Sending from a route

```go
err := sdk.SendText(r.Context(), session, "New push to main.")
```

Use the request context and an explicit session. Core strips management credentials before forwarding to the plugin.

## Browser behavior

Core applies sandbox CSP and nosniff, strips plugin cookies and credentialed CORS headers, and supplies an octet-stream content type when absent. Render user-controlled HTML with `html/template` or equivalent escaping.
