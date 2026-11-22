# Contributing

[简体中文](CONTRIBUTING.zh-CN.md)

Follow the shared [Core contribution process and coding standards](https://github.com/AlonaBot/AlonaBot/blob/main/CONTRIBUTING.md). This repository maintains the documentation site; changes to runtime behavior belong in the corresponding component repository.

Report documentation problems with the page URL, language, component version, failing step and actual error. Use the Issue forms for reproducible problems or improvements, [Discussions](https://github.com/AlonaBot/AlonaBot/discussions) for questions and the [private security channel](https://github.com/AlonaBot/AlonaBot/security/advisories/new) for vulnerabilities. Redact credentials and real user data.

## Site-specific workflow

1. Use Node.js 20 or later and install the locked dependencies with `npm ci`. Keep dependency changes separate and obtain maintainer approval before adding a dependency.
2. Read the [maintenance guide (简体中文)](maintenance/site.md). Current Core [guides](https://github.com/AlonaBot/AlonaBot/tree/main/docs), contribution rules and implementation define behavior. Check official component source for platform details and retain known issues.
3. Update Chinese Markdown under `docs/` and English at the identical relative path under `i18n/en/docusaurus-plugin-content-docs/current/`. Update navigation, UI translations and language-specific anchors together. Preserve public routes.
4. Run `npm run typecheck` and `env SITE_URL=https://alonabot.github.io BASE_URL=/docs/ npm run build`. The build checks both languages and fails on broken internal links or anchors. Preview the affected pages in each language.
5. Submit a focused PR to main with a title such as `docs/telegram: 更新命令菜单指南`. Complete the bilingual PR template with changes, verification, compatibility and risks. Metadata accepts Chinese or English sections and confirmations.

Use Simplified Chinese for new maintenance notes, comments and commit messages; user documentation is bilingual. Keep temporary evidence, runtime data and personal task records local. Maintainers review and squash-merge approved PRs, then verify main and coordinate releases.

The Build workflow checks PRs and deploys main to Pages. PR triage uses paths for labels; maintainers manage the label inventory. See [Core's MIT License](https://github.com/AlonaBot/AlonaBot/blob/main/LICENSE) for contribution licensing.
