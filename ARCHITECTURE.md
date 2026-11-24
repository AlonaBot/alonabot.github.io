# 仓库架构

本站使用 Docusaurus 生成静态页面，中文为默认语言，英文使用独立正文和界面翻译。

## 目录

| 路径 | 职责 |
| --- | --- |
| `docs/` | 中文正文：教程、平台接入、进阶、部署、组件开发、参考与内部原理 |
| `i18n/en/docusaurus-plugin-content-docs/current/` | 与中文路径对应的英文正文 |
| `i18n/` | 导航、页脚、搜索与文档分类等界面翻译 |
| `src/pages/` | 首页及其布局样式 |
| `src/css/custom.css` | 全站阅读样式、颜色和明暗主题 |
| `static/img/` | 标志、透明角色插画和文档图示 |
| `sidebars.ts` | 文档分组与阅读顺序 |
| `docusaurus.config.ts` | 站点、语言、插件、导航与构建配置 |
| `.github/workflows/build.yml` | PR 构建检查和 GitHub Pages 部署 |

## 页面与语言

正文以 Markdown 编写，代码块由构建过程高亮。首页使用 React，通过 Docusaurus 翻译接口选择文字。英文正文与中文保持相同的相对路径；内部文档链接由 Docusaurus 解析为对应语言的页面地址。

图示以 SVG 保存，需要英文标签时使用英文副本。静态资源经站点 base URL 解析，支持根路径和子路径部署。

## 构建与发布

`npm run build` 构建两种语言，输出至 `build/`；链接与锚点错误会使构建失败。本地搜索索引随页面生成。

`SITE_URL` 设置站点域名，`BASE_URL` 设置部署子路径。组织站仓库为 `AlonaBot/alonabot.github.io`，Pages 使用 `BASE_URL=/` 发布到 `https://alonabot.github.io/`；中文正文位于 `/docs`，英文首页与正文分别位于 `/en/` 和 `/en/docs`。

GitHub Actions 在 PR 中检查构建，合并到 `main` 后构建并部署 Pages。手动工作流也可选择部署。
