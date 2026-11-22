# 贡献指南

[English](CONTRIBUTING.md)

公共流程与编码约定遵循 [Core 贡献指南](https://github.com/AlonaBot/AlonaBot/blob/main/CONTRIBUTING.zh-CN.md)。本仓库维护文档站；运行行为改动提交到对应组件仓库。

报告文档问题时提供页面 URL、语言、组件版本、出错步骤及完整错误。可复现问题与改进使用 Issue 表单，使用求助前往[讨论区](https://github.com/AlonaBot/AlonaBot/discussions)，安全问题通过[私密入口](https://github.com/AlonaBot/AlonaBot/security/advisories/new)报告。分享前移除凭据与真实用户数据。

## 本仓库流程

1. 使用 Node.js 20 或更新版本，通过 `npm ci` 安装锁定依赖。依赖升级单独说明，新增依赖先取得维护者批准。
2. 阅读[站点维护](maintenance/site.md)。以 Core 现行[文档](https://github.com/AlonaBot/AlonaBot/tree/main/docs)、贡献约定与实现为依据；平台细节核对官方组件源码，保留已知问题。
3. 中文正文位于 `docs/`；英文位于 `i18n/en/docusaurus-plugin-content-docs/current/`，相对路径逐页对应。同时维护导航、界面翻译和两种语言的锚点，保留公开路由。
4. 运行 `npm run typecheck` 与 `env SITE_URL=https://alonabot.github.io BASE_URL=/docs/ npm run build`。构建覆盖两种语言，内部链接或锚点失效时失败；预览受影响的双语页面。
5. 向 main 提交聚焦的 PR，标题例如 `docs/telegram: 更新命令菜单指南`。按双语模板填写变更、验证、兼容性与风险；metadata 接受中文或英文段落及确认项。

新维护说明、注释和 commit message 使用简体中文，用户文档提供中英内容。临时证据、运行数据与个人任务记录留在本机。维护者审阅并 squash-merge 已批准的 PR，再检查 main 并协调发布。

Build 工作流检查 PR、部署 main；PR triage 按实际路径标记区域，标签清单由维护者统一维护。贡献许可见 [Core MIT License](https://github.com/AlonaBot/AlonaBot/blob/main/LICENSE)。
