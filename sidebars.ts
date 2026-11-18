// 文档侧边栏：全站只有一个，按阅读顺序排列；新增页面时在对应分组里登记。
import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "index",
    "guide/quick-start",
    {
      type: "category",
      label: "教程",
      collapsible: false,
      items: [
        "plugins/first-plugin",
        "plugins/commands",
        "plugins/messages",
        "plugins/config",
        "plugins/storage",
        "plugins/testing",
      ],
    },
    {
      type: "category",
      label: "进阶",
      items: ["plugins/background", "plugins/services", "plugins/http", "plugins/rules"],
    },
    {
      type: "category",
      label: "接入平台",
      items: ["adapters/index", "adapters/telegram", "adapters/onebot11"],
    },
    {
      type: "category",
      label: "原理",
      items: [
        "concepts/architecture",
        "concepts/lifecycle",
        "concepts/messages",
        "concepts/wire-protocol",
        "guide/status",
      ],
    },
  ],
};

export default sidebars;
