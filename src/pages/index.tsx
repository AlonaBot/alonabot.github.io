// 首页：晴空背景的标题区与框架特性卡片。
import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import styles from "./index.module.css";

type Feature = {
  title: string;
  body: string;
};

const features: Feature[] = [
  {
    title: "每个插件一个进程",
    body: "插件是独立的 Native Go 子进程，只经 SDK 与 Core 通信。一个插件崩溃不会拖垮其他插件，Core 按有限重启策略恢复它。",
  },
  {
    title: "组件都能替换",
    body: "Adapter、Agent 与 WebUI 和插件一样是可安装的组件。官方提供 Telegram 与 OneBot 11 Adapter，社区组件可以直接替换它们。",
  },
  {
    title: "轻量的常驻内存",
    body: "只用 SDK 的插件进程实测约 7.5 MiB。SDK 按需拆包：不导入数据库包就不链接驱动，不导入 GORM 就不链接 GORM。",
  },
  {
    title: "统一的线协议",
    body: "Core 与组件之间使用长度前缀的 Protobuf Envelope，TCP loopback 与 stdio 两种传输编码相同，单帧上限 4 MiB。",
  },
  {
    title: "受管的数据与配置",
    body: "业务数据放在 Core 托管的 SQLite 中，更新与重载使用独立候选副本，失败回到旧数据；配置由 config_schema.json 声明并校验。",
  },
  {
    title: "五个目标平台",
    body: "首发面向 linux/amd64、linux/arm64、windows/amd64、darwin/amd64 与 darwin/arm64，Core 以 CGO_ENABLED=0 纯 Go 构建。目前只在 darwin/arm64 上做过运行验证。",
  },
];

function Hero(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className={styles.cloudA} aria-hidden="true" />
      <div className={styles.cloudB} aria-hidden="true" />
      <div className="container">
        <img className={styles.logo} src={useBaseUrl("/img/logo.svg")} alt="" width={112} height={112} />
        <h1 className={styles.title}>{siteConfig.title}</h1>
        <p className={styles.tagline}>{siteConfig.tagline}</p>
        <div className={styles.actions}>
          <Link className="button button--primary button--lg" to="/docs/guide/quick-start">
            快速开始
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/plugins/first-plugin">
            编写插件
          </Link>
        </div>
        <p className={styles.status}>当前文档版本 0.1-beta · 框架仍在实施初期</p>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="首页" description={siteConfig.tagline}>
      <Hero />
      <main className="container">
        <section className={styles.features}>
          {features.map((f) => (
            <article key={f.title} className={styles.card}>
              <h2>{f.title}</h2>
              <p>{f.body}</p>
            </article>
          ))}
        </section>
      </main>
    </Layout>
  );
}
