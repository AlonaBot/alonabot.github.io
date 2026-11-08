// AlonaBot 文档站配置。站点地址由环境变量覆盖，部署方式确定前缺省按根路径构建。
import { themes as prismThemes } from "prism-react-renderer";

import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const repoUrl = "https://github.com/AlonaBot/AlonaBot";
const docsRepoUrl = "https://github.com/AlonaBot/docs";

// 当前文档对应的框架版本；发布正式版时用 `npm run docusaurus docs:version <版本>` 存档。
const currentVersion = "0.1-beta";

const config: Config = {
  title: "AlonaBot",
  tagline: "轻量级、跨平台的 Go 聊天机器人框架",
  favicon: "img/favicon.svg",

  url: process.env.SITE_URL ?? "https://alonabot.github.io",
  baseUrl: process.env.BASE_URL ?? "/",
  trailingSlash: false,

  organizationName: "AlonaBot",
  projectName: "docs",

  onBrokenLinks: "throw",
  onBrokenAnchors: "throw",

  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans"],
  },

  future: {
    // 级联层 polyfill 会让 Infima 默认变量的优先级高于 custom.css，暂不启用。
    v4: { useCssCascadeLayers: false, removeLegacyPostBuildHeadAttribute: true },
    faster: true,
  },

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "throw",
    },
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: `${docsRepoUrl}/edit/main/`,
          versions: {
            current: { label: currentVersion, badge: true },
          },
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        language: ["zh", "en"],
        indexBlog: false,
        docsRouteBasePath: "/docs",
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    image: "img/social-card.svg",
    colorMode: {
      defaultMode: "light",
      respectPrefersColorScheme: true,
    },
    announcementBar: {
      id: "early-development",
      content:
        "AlonaBot 还在早期开发中，接口和命令可能会变。每一页都写了目前做到哪一步。",
      isCloseable: true,
    },
    navbar: {
      title: "AlonaBot",
      logo: {
        alt: "AlonaBot",
        src: "img/logo.svg",
        srcDark: "img/logo-dark.svg",
        width: 32,
        height: 32,
      },
      items: [
        { type: "docSidebar", sidebarId: "guide", position: "left", label: "指南" },
        { type: "docSidebar", sidebarId: "concepts", position: "left", label: "概念" },
        { type: "docSidebar", sidebarId: "plugins", position: "left", label: "插件开发" },
        { type: "docSidebar", sidebarId: "adapters", position: "left", label: "适配器" },
        { type: "docsVersionDropdown", position: "right" },
        { href: repoUrl, label: "GitHub", position: "right" },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "文档",
          items: [
            { label: "介绍", to: "/docs/" },
            { label: "快速开始", to: "/docs/guide/quick-start" },
            { label: "插件开发", to: "/docs/plugins/first-plugin" },
          ],
        },
        {
          title: "规格",
          items: [
            { label: "实施规格", href: `${repoUrl}/blob/main/spec/README.md` },
            { label: "架构地图", href: `${repoUrl}/blob/main/ARCHITECTURE.md` },
            { label: "决策记录", href: `${repoUrl}/blob/main/spec/adr/README.md` },
          ],
        },
        {
          title: "参与",
          items: [
            { label: "GitHub", href: repoUrl },
            { label: "贡献流程", href: `${repoUrl}/blob/main/CONTRIBUTING.md` },
            { label: "文档源码", href: docsRepoUrl },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AlonaBot`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ["bash", "go", "json", "yaml", "protobuf"],
    },
    docs: {
      sidebar: {
        hideable: true,
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
