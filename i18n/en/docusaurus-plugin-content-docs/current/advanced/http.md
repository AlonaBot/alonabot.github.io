---
title: Pages and HTTP endpoints
description: Add plugin management pages and receive external callbacks.
---

Plugins can provide HTTP endpoints for management pages in WebUI and external callbacks such as webhooks.

Write Handlers with Go's standard `net/http` package. The framework listens on the port.

## Plugin pages

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

`.Page("To-do")` registers the route as a plugin page, shown in WebUI plugin details with the title `To-do`.

The framework supplies `kit.css` and `kit.js` automatically for routes with `.Page`.

### Page kit

`kit.css` matches WebUI styles and follows light and dark themes. Common classes:

| Element | Classes |
| --- | --- |
| Card | `ab-card`, `ab-card-header`, `ab-card-body` |
| Button | `ab-btn`, `ab-btn-primary`, `ab-btn-danger` |
| Input, select | `ab-input`, `ab-select` |
| Table | `ab-table` |
| Badge | `ab-badge` |

`kit.js` exposes `window.AlonaBot`:

| Method | Purpose |
| --- | --- |
| `AlonaBot.request(method, path, body?)` | Call this plugin's endpoints; returns `status`, `ok`, and parsed JSON in `data` |
| `AlonaBot.t(key, args?)` | Read localized text; see [Internationalization](i18n.md) |
| `AlonaBot.onTheme(fn)` | Subscribe to theme changes |
| `AlonaBot.onLocale(fn)` | Subscribe to language changes |

Use `AlonaBot.request` for plugin requests. Pages run in a restricted environment, and direct `fetch` requests lack the required authentication.

WebUI supplies the plugin name and search field above the page.

### Translate page titles

```json title="i18n/zh-CN.json"
{ "pages": { "/page": "待办" } }
```

## URLs and authentication

Plugin endpoints live under `/plugins/<plugin-ID>/`. With default settings, the page above is:

```text
http://127.0.0.1:7650/plugins/alonabot-plugin-todo/page
```

**Endpoints require an authenticated management session by default.** The `/api/count` example inherits this authentication.

## External callbacks

External services such as GitHub webhooks have no management session. Declare their endpoints public and **verify the request origin yourself**:

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
			// Process body ...
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

The `Public` argument declares your verification method:

| Argument | Verification |
| --- | --- |
| `sdk.AuthCallbackSignature` | Request signed with a shared secret |
| `sdk.AuthCallbackState` | Shared random value in the URL |
| `sdk.AuthCallbackNonce` | One-time random value |

The framework records this declaration; your Handler performs verification. Public endpoints are accessible to anyone.

## Send from a callback

HTTP Handlers have no call context `c`. Use package-level functions and specify the destination session:

```go
err := sdk.SendText(r.Context(), session, "New push to main.")
```

## Page security

When writing pages, account for these response rules:

- Pages run in a browser sandbox that isolates WebUI login credentials.
- Plugin-set cookies are stripped.
- Escape user input with `html/template` when generating HTML.
