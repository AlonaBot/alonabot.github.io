# 参与贡献

[English](CONTRIBUTING.en.md)

## 本地运行

需要 Node.js 20 或更高版本。

```sh
npm ci
npm start
```

预览英文站：

```sh
npm start -- --locale en
```

## 修改文档

在 `docs/` 修改中文正文，并同步更新 `i18n/en/docusaurus-plugin-content-docs/current/` 中的对应英文文件。界面文字位于各语言的 JSON 文件，图示位于 `static/img/diagrams/`。

接口和示例应与当前 SDK、组件实现一致。写作与维护约定见 [AGENTS.md](AGENTS.md)，文件职责见 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 提交 Pull Request

提交前运行：

```sh
npm run typecheck
npm run build
git diff --check
```

构建检查两种语言的链接和锚点。预览受影响页面，检查代码示例、导航、明暗主题和手机布局。

PR 说明写清修改的内容与验证结果。涉及接口行为时，附上对应源码依据。
