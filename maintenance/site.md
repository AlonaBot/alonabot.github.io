# 维护双语文档站

本站基于 Docusaurus 3，当前正文对应 Core **0.2.0**。保留现有主题与路由。行为依据为 Core 现行 docs、CONTRIBUTING 和源码，平台能力另核对五个官方组件；正文保留实际限制与验证缺口。

## 编辑与检查

Node.js 20 或更新版本：

```fish
npm ci
npm start
npm run start:en
npm run typecheck
env SITE_URL=https://alonabot.github.io BASE_URL=/docs/ npm run build
npm run serve
```

开发服务器一次加载一种语言，生产构建生成全部语言，并检查内部链接和锚点。生产预览入口为 `/docs/` 与 `/docs/en/`；文档内容沿现有 `/docs/docs/...`、`/docs/en/docs/...` 路由。

同时开发和构建时分离生成目录，避免多语言构建覆盖开发路由：

```fish
env DOCUSAURUS_NO_PERSISTENT_CACHE=1 DOCUSAURUS_GENERATED_FILES_DIR_NAME=.docusaurus-dev npm start
env DOCUSAURUS_NO_PERSISTENT_CACHE=1 DOCUSAURUS_GENERATED_FILES_DIR_NAME=.docusaurus-build npm run build
```

临时输出留在本机，不提交生成目录与构建产物。依赖的精确版本以 package.json 和 package-lock.json 为准；新增依赖须先获批准。

## 内容与翻译

| 路径 | 用途 |
| --- | --- |
| docs/ | 中文正文，按 tutorial、advanced、usage、develop、reference、internals 分组 |
| i18n/en/docusaurus-plugin-content-docs/current/ | 同路径英文正文，逐页维护 |
| sidebars.ts | 导航顺序 |
| src/pages/、src/components/ | 首页与演示 |
| src/css/custom.css | 既有主题 |
| static/img/ | 标识与图示，英文图示使用 .en.svg |
| maintenance/ | 仓库维护说明，独立于站点 sidebar |

英文正文逐页存在，切换语言保持页面对应关系。新增页同步两种语言、导航与引用。中文默认正文以 docs/ 为准，i18n/zh-Hans/ 只维护界面文案。

首页和组件使用 Translate/translate，翻译位于 i18n/zh-Hans/ 与 i18n/en/。新增文案后运行 `npm run write-translations -- --locale zh-Hans` 和 `npm run write-translations -- --locale en`，补齐英文。标语与公告由 docusaurus.config.ts 按语言选择。当前版本统一使用已有 currentVersion/customFields；版本标题同步两种语言的 current.json。

每页先给读者可操作步骤；代码片段注明放置位置、必需导入及省略部分。术语统一到 reference/glossary.md。现状与限制同步 usage/platforms.md 和 internals/status.md。链接使用现行文档与源码，内部维护记录留在本机。更新下一版时由维护者决定是否使用 `npm run docusaurus docs:version <版本>` 保存快照。

## Pages 与仓库自动化

SITE_URL 默认为 https://alonabot.github.io，BASE_URL 本地默认 `/`，Pages 使用 `/docs/`。仓库 Pages Source 选择 GitHub Actions。

.github/workflows/build.yml 在 PR 执行安装、类型检查和双语构建；main 推送上传并部署 Pages。手动 workflow_dispatch 仅在明确启用 deploy 时部署；维护者按发布授权操作。

PR metadata 按 Core 规则检查中英标题段落和确认项。pull_request_target 工作流只处理 metadata，不 checkout 或运行 PR 代码。路径标签使用本站实际目录；GitHub 标签由维护者统一管理。
