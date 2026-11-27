// AlonaBot 文档站配置。站点地址由环境变量覆盖，本地与 Pages 工作流均按根路径构建。
import { themes as prismThemes } from "prism-react-renderer";

import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const repoUrl = "https://github.com/AlonaBot/AlonaBot";
const docsRepoUrl = "https://github.com/AlonaBot/alonabot.github.io";

// 当前文档对应的框架版本。
const currentVersion = "0.4.0";

// 构建时按语言选择站点标语。
const isEnglish = process.env.DOCUSAURUS_CURRENT_LOCALE === "en";

const config: Config = {
  title: "AlonaBot",
  customFields: { currentVersion },
  tagline: isEnglish
    ? "Build your bot in Go. Bring it to the chat platforms you choose."
    : "用 Go 写业务，接入你选择的聊天平台。",
  favicon: "img/favicon.svg",

  url: process.env.SITE_URL ?? "https://alonabot.github.io",
  baseUrl: process.env.BASE_URL ?? "/",
  trailingSlash: false,

  organizationName: "AlonaBot",
  projectName: "alonabot.github.io",

  onBrokenLinks: "throw",
  onBrokenAnchors: "throw",

  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans", "en"],
    localeConfigs: {
      "zh-Hans": { label: "简体中文", htmlLang: "zh-Hans" },
      en: { label: "English", htmlLang: "en" },
    },
  },

  future: {
    // 级联层 polyfill 会让 Infima 默认变量的优先级高于 custom.css，暂不启用。
    v4: { useCssCascadeLayers: false, removeLegacyPostBuildHeadAttribute: true },
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
          editLocalizedFiles: true,
          versions: {
            current: { label: currentVersion, badge: true },
          },
          showLastUpdateTime: false,
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
    image: "img/social-card.png",
    colorMode: {
      defaultMode: "light",
      respectPrefersColorScheme: true,
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
        { type: "docSidebar", sidebarId: "docs", position: "left", label: "文档" },
        { to: "/store", position: "left", label: "插件商店" },
        { type: "localeDropdown", position: "right" },
        { href: repoUrl, label: "GitHub", position: "right" },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "文档",
          items: [
            { label: "概述", href: "/docs/", prependBaseUrlToHref: true },
            { label: "快速开始", href: "/docs/quick-start", prependBaseUrlToHref: true },
            { label: "教程", href: "/docs/tutorial/project", prependBaseUrlToHref: true },
          ],
        },
        {
          title: "社区",
          items: [
            { label: "GitHub", href: repoUrl },
            { label: "文档仓库", href: docsRepoUrl },
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
