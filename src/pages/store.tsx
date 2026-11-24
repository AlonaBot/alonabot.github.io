import type { ReactNode } from "react";
import { translate } from "@docusaurus/Translate";
import Layout from "@theme/Layout";
import PluginStore from "../components/PluginStore";

export default function Store(): ReactNode {
  return <Layout title={translate({ id: "store.title", message: "插件商店" })} description={translate({ id: "store.metaDescription", message: "浏览 AlonaBot 官方源收录的插件与组件。" })}>
    <PluginStore />
  </Layout>;
}
