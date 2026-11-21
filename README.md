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

## GitHub Pages

发布地址为 `https://alonabot.github.io/docs/`，英文入口为 `https://alonabot.github.io/docs/en/`。工作流构建时设置 `SITE_URL=https://alonabot.github.io`、`BASE_URL=/docs/`；本地开发仍缺省使用根路径。

`.github/workflows/build.yml` 在 GitHub 托管 runner 上执行完整中英构建。PR 运行构建检查；推送到 `main` 后自动部署。仓库 Pages 的 Source 选择 **GitHub Actions**。

首次发布可在审查通过的分支上手动运行现有 Build 工作流，并启用 `deploy`。这会发布该分支的构建，同时保持 PR 开放：

```sh
gh workflow run build.yml --repo AlonaBot/docs --ref codex/docs-v010-pages -f deploy=true
```

Pages 的 `github-pages` 环境需允许该首次发布分支；后续合并由维护者决定，合并后继续由 `main` 自动发布。

## 目录

| 路径 | 内容 |
| --- | --- |
| `docs/` | 文档正文，按 `tutorial`、`advanced`、`usage`、`develop`、`reference`、`internals` 分组；全站一个侧边栏，顺序在 `sidebars.ts` 中登记 |
| `src/pages/` | 首页：标题与入口，旁边是一段插件代码和它在聊天中的效果 |
| `src/css/custom.css` | 主题：与官方 WebUI 共用蓝灰底色与青蓝强调色，提供亮暗阅读主题 |
| `static/img/` | 复用官方 WebUI A 形标识的亮暗 Logo、自适应 favicon 与分享卡（SVG 源 / PNG 发布资源） |

## 多语言

缺省语言是简体中文（`zh-Hans`），英文（`en`）发布在 `/en/` 下，导航栏右侧切换。

- 文档正文：中文在 `docs/`。英文正文在中文定稿后翻译，放在 `i18n/en/docusaurus-plugin-content-docs/current/` 的同名路径下；没有翻译的页面在英文站显示中文。
- 首页、导航、页脚与组件文案：源码里用 `<Translate>` 或 `translate()` 写中文；中文与英文的翻译文件分别在 `i18n/zh-Hans/` 和 `i18n/en/` 下，两边的 JSON 结构一致。新增文案后运行 `npm run write-translations -- --locale zh-Hans` 和 `npm run write-translations -- --locale en`，再补英文。
- `i18n/zh-Hans/` 只放界面文案，不放文档正文：缺省语言的正文以 `docs/` 为准，在 `i18n/zh-Hans/docusaurus-plugin-content-docs/current/` 下另放一份会覆盖 `docs/`。
- 标语与公告栏不在翻译文件中，在 `docusaurus.config.ts` 里按语言取值。

## 版本

当前文档对应 **0.1.0**，于 2026-11-21 发布，Core tag `v0.1.0` 对应提交 `95155cc81c961810d74c724b3892d0d8148c1550`。发行归档的内容以该版本的 Release 说明为准；2026-11-21 更新后的公开归档仅含 Core。版本标签统一在 `docusaurus.config.ts` 的 `currentVersion` 中设置。

开始维护下一版前，先把当前文档存成快照，再更新 `currentVersion`：

```sh
npm run docusaurus docs:version 0.1.0
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

读者是插件作者和机器人主人，不是框架的维护者。

- 每页开头说明读完能做什么，一页只讲一件事。
- 代码块是能直接粘贴的完整文件，或者写明所在文件的完整函数，带导入；后面跟「发什么、回什么」的终端对话。
- 术语在第一次出现时用一句话解释，并收进 `docs/reference/glossary.md`。
- 正文不出现工单号、PR 号、规格章节号，不链接主仓库的规格、实施计划与验收记录。
- 没有实现的能力不写成已实现，统一用提示框标出，并登记在 `docs/internals/status.md` 与 `docs/usage/platforms.md`。
- 标识符、命令与协议名保留原文。不使用第三方游戏或作品的角色立绘、官方 logo、字体与截图。
