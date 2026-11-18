// 文档侧边栏：全站只有一个，按阅读顺序排列；新增页面时在对应分组里登记。
import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "index",
    "quick-start",
    {
      type: "category",
      label: "教程",
      collapsible: false,
      items: [
        "tutorial/project",
        "tutorial/commands",
        "tutorial/messages",
        "tutorial/config",
        "tutorial/storage",
        "tutorial/conversation",
        "tutorial/testing",
        "tutorial/telegram",
      ],
    },
    {
      type: "category",
      label: "进阶",
      items: [
        "advanced/permissions",
        "advanced/matching",
        "advanced/schedule",
        "advanced/buttons",
        "advanced/media",
        "advanced/hooks",
        "advanced/subplugins",
        "advanced/services",
        "advanced/llm",
        "advanced/http",
        "advanced/i18n",
        "advanced/profiles",
        "advanced/publish",
      ],
    },
    {
      type: "category",
      label: "使用与部署",
      items: [
        "usage/install",
        "usage/settings",
        "usage/telegram",
        "usage/onebot11",
        "usage/platforms",
        "usage/manage",
        "usage/webui",
        "usage/agent",
      ],
    },
    {
      type: "category",
      label: "开发组件",
      items: ["develop/adapter", "develop/rules"],
    },
    {
      type: "category",
      label: "参考",
      items: [
        "reference/cli",
        "reference/config-schema",
        "reference/events",
        "reference/errors",
        "reference/glossary",
      ],
    },
    {
      type: "category",
      label: "原理",
      items: [
        "internals/architecture",
        "internals/lifecycle",
        "internals/wire-protocol",
        "internals/status",
      ],
    },
  ],
};

export default sidebars;
