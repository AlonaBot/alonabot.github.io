# 文档站维护约定

- 公共流程与编码约定：[Core CONTRIBUTING](https://github.com/AlonaBot/AlonaBot/blob/main/CONTRIBUTING.zh-CN.md)；本仓差异：[贡献指南](CONTRIBUTING.zh-CN.md)。
- 正文与站点维护：[maintenance/site.md](maintenance/site.md)。行为核对 Core 现行 docs 与源码，以及官方组件实现；保留已知问题。
- 中文 `docs/` 与英文 `i18n/en/docusaurus-plugin-content-docs/current/` 同路径同步，保留公开路由与有效锚点；维护页留在 `maintenance/`。
- 维护说明、注释、commit message 使用简体中文；英文用户文档用自然英文。先读当前文件与 diff，保留并行改动；Git 写操作在独立 worktree 中执行，提交及远端写入遵循明确授权。
- 新增依赖先取得批准，保留锁文件；临时证据和个人配置留在本机。
- 检查：`npm ci`、`npm run typecheck`、`env SITE_URL=https://alonabot.github.io BASE_URL=/docs/ npm run build`；预览受影响的双语页面。
