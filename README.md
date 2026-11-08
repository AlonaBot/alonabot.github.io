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
```

站点地址由环境变量覆盖：`SITE_URL`（缺省 `https://alonabot.github.io`）与 `BASE_URL`（缺省 `/`）。

## 目录

| 路径 | 内容 |
| --- | --- |
| `docs/` | 文档正文，按 `guide`、`concepts`、`plugins`、`adapters` 分组，侧边栏见 `sidebars.ts` |
| `src/pages/` | 首页：标题与入口，旁边是一段插件代码和它在聊天中的效果 |
| `src/css/custom.css` | 主题：纯白为底、墨色正文，浅蓝只用于链接、焦点与光环；暗色为中性近黑 |
| `static/img/` | 占位 logo（亮/暗两版）、favicon 与分享卡片；正式 logo 确定后替换 |

## 版本

当前文档对应框架 **0.1-beta**（`docusaurus.config.ts` 的 `currentVersion`）。框架发布版本时，用下面的命令把当前文档存成快照，再把 `currentVersion` 改成下一个开发版本：

```sh
npm run docusaurus docs:version 0.1
```

## 依赖

经维护者批准（2026-11-08）的依赖，版本精确锁定：

- `@docusaurus/core`、`@docusaurus/preset-classic`、`@docusaurus/faster` 3.10.2
- 开发依赖 `@docusaurus/module-type-aliases`、`@docusaurus/tsconfig`、`@docusaurus/types` 3.10.2
- `@mdx-js/react` 3.1.1、`clsx` 2.1.1、`prism-react-renderer` 2.4.1、`react` 与 `react-dom` 19.3.1
- 本地搜索 `@easyops-cn/docusaurus-search-local` 0.55.3

新增依赖前先征得维护者同意。

## 写作约定

正文用简体中文，标识符、命令与协议名保留原文。引用主仓库文件时使用 `https://github.com/AlonaBot/AlonaBot/blob/main/...` 的完整链接。不使用第三方游戏或作品的角色立绘、官方 logo、字体与截图。
