# AlonaBot 文档站

[AlonaBot](https://github.com/AlonaBot/AlonaBot) 的用户与插件开发者文档，基于 Docusaurus 3 与官方 classic 主题，配色与组件为本仓库自定。

行为的权威是主仓库的 [spec](https://github.com/AlonaBot/AlonaBot/blob/main/spec/README.md)。本站只做面向读者的说明；两者不一致时以 spec 为准，并在这里修正。每页写明已实现的范围，不把计划中的能力写成已实现。

## 命令

需要 Node 20 或更高版本。

```sh
npm ci          # 按 package-lock.json 安装依赖
npm start       # 本地开发服务器，默认 http://localhost:3000
npm run build   # 构建到 build/，链接或锚点失效时构建失败
npm run serve   # 预览 build/ 的结果
npm run start:en  # 以英文启动开发服务器（开发服务器一次只加载一种语言）
```

站点地址由环境变量覆盖：`SITE_URL`（缺省 `https://alonabot.github.io`）与 `BASE_URL`（缺省 `/`）。

开发服务器与生产构建同时运行时，使用独立的生成目录并关闭持久缓存，避免构建其他语言时覆盖开发路由：

```sh
env DOCUSAURUS_NO_PERSISTENT_CACHE=1 DOCUSAURUS_GENERATED_FILES_DIR_NAME=.docusaurus-dev npm start
env DOCUSAURUS_NO_PERSISTENT_CACHE=1 DOCUSAURUS_GENERATED_FILES_DIR_NAME=.docusaurus-build npm run build
```

## 目录

| 路径 | 内容 |
| --- | --- |
| `docs/` | 文档正文，按 `guide`、`concepts`、`plugins`、`adapters` 分组，侧边栏见 `sidebars.ts` |
| `src/pages/` | 首页：标题与入口，旁边是一段插件代码和它在聊天中的效果 |
| `src/css/custom.css` | 主题：与官方 WebUI 共用蓝灰底色与青蓝强调色，提供亮暗阅读主题 |
| `static/img/` | 复用官方 WebUI A 形标识的亮暗 Logo、自适应 favicon 与分享卡（SVG 源 / PNG 发布资源） |

## 多语言

缺省语言是简体中文（`zh-Hans`），英文（`en`）发布在 `/en/` 下，导航栏右侧切换。

- 文档正文：中文在 `docs/`，英文在 `i18n/en/docusaurus-plugin-content-docs/current/`，两边目录与文件名一一对应。改一边时同步另一边。
- 首页、导航、页脚与组件文案：源码里用 `<Translate>` 或 `translate()` 写中文；中文与英文的翻译文件分别在 `i18n/zh-Hans/` 和 `i18n/en/` 下，两边的 JSON 结构一致。新增文案后运行 `npm run write-translations -- --locale zh-Hans` 和 `npm run write-translations -- --locale en`，再补英文。
- `i18n/zh-Hans/` 只放界面文案，不放文档正文：缺省语言的正文以 `docs/` 为准，在 `i18n/zh-Hans/docusaurus-plugin-content-docs/current/` 下另放一份会覆盖 `docs/`。
- 标语与公告栏不在翻译文件中，在 `docusaurus.config.ts` 里按语言取值。

## 版本

当前文档对照主仓库 main 的 `e0a38d7c1de9061abc51ba1c82423bfdbbd4805c`（2026-11-18），对应框架 **0.1-beta**（`docusaurus.config.ts` 的 `currentVersion`）。框架发布版本时，用下面的命令把当前文档存成快照，再把 `currentVersion` 改成下一个开发版本：

```sh
npm run docusaurus docs:version 0.1
```

## 依赖

构建只需要 Node.js 与 npm，不需要 Go 或其他编译工具链。

经维护者批准（2026-11-08）的依赖，版本精确锁定：

- `@docusaurus/core`、`@docusaurus/preset-classic` 3.10.2
- 开发依赖 `@docusaurus/module-type-aliases`、`@docusaurus/tsconfig`、`@docusaurus/types` 3.10.2
- `@mdx-js/react` 3.1.1、`clsx` 2.1.1、`prism-react-renderer` 2.4.1、`react` 与 `react-dom` 19.3.1
- 本地搜索 `@easyops-cn/docusaurus-search-local` 0.55.3（中文分词依赖 `@node-rs/jieba` 的预编译包，安装时不需要编译工具链；2026-11-09 维护者确认保留）

新增依赖前先征得维护者同意。

## 写作约定

中文与英文都写得简短直接，标识符、命令与协议名保留原文。引用主仓库文件时使用 `https://github.com/AlonaBot/AlonaBot/blob/main/...` 的完整链接。不使用第三方游戏或作品的角色立绘、官方 logo、字体与截图。
