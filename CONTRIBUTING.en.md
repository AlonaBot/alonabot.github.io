# Contributing

[简体中文](CONTRIBUTING.md)

## Run locally

Requires Node.js 20 or later.

```sh
npm ci
npm start
```

Preview the English site:

```sh
npm start -- --locale en
```

## Edit documentation

Edit Chinese pages in `docs/` and update matching English files under `i18n/en/docusaurus-plugin-content-docs/current/`. Interface translations live in locale JSON files; diagrams live in `static/img/diagrams/`.

Keep interfaces and examples aligned with the current SDK and component implementations. See [AGENTS.md](AGENTS.md) for maintenance conventions and [ARCHITECTURE.md](ARCHITECTURE.md) for file responsibilities.

## Open a pull request

Run before submitting:

```sh
npm run typecheck
npm run build
git diff --check
```

The build checks links and anchors in both languages. Preview affected pages and check examples, navigation, light and dark themes, and mobile layouts.

Describe the change and validation results in the PR. For interface behavior, include the relevant source reference.
