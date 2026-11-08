// 首页：左侧是标题与入口，右侧上下排列一段插件代码和它在聊天里的效果。
import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import Translate, { translate } from "@docusaurus/Translate";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import ChatDemo from "../components/ChatDemo";

import styles from "./index.module.css";

// 首页特性：标题与一句说明，文案经 i18n 翻译。
const features: { title: string; body: string }[] = [
  {
    title: translate({ id: "home.feature.isolation.title", message: "进程隔离" }),
    body: translate({ id: "home.feature.isolation.body", message: "Native Go 子进程 · 崩溃隔离 · 有限重启" }),
  },
  {
    title: translate({ id: "home.feature.replace.title", message: "可替换组件" }),
    body: translate({ id: "home.feature.replace.body", message: "Adapter · Agent · WebUI" }),
  },
  {
    title: translate({ id: "home.feature.memory.title", message: "低内存占用" }),
    body: translate({ id: "home.feature.memory.body", message: "单插件约 7.5 MiB PSS · 按需链接" }),
  },
  {
    title: translate({ id: "home.feature.platform.title", message: "统一事件模型" }),
    body: translate({ id: "home.feature.platform.body", message: "Event · Actor · Target · Chain" }),
  },
  {
    title: translate({ id: "home.feature.rollback.title", message: "事务化更新" }),
    body: translate({ id: "home.feature.rollback.body", message: "受管 SQLite · 候选副本 · 代次原子提交" }),
  },
  {
    title: translate({ id: "home.feature.purego.title", message: "纯 Go 构建" }),
    body: translate({ id: "home.feature.purego.body", message: "CGO_ENABLED=0 · linux / windows / darwin · amd64 / arm64" }),
  },
];

function CodeWindow(): ReactNode {
  return (
    <div className={styles.window}>
      <div className={styles.windowBar}>
        <span className={styles.lights} aria-hidden="true">
          <i className={styles.red} />
          <i className={styles.yellow} />
          <i className={styles.green} />
        </span>
        <span className={styles.fileName}>main.go</span>
      </div>
      <pre className={styles.code}>
        <code>
          <span className={styles.kw}>type</span> Ping <span className={styles.kw}>struct</span>
          {" { sdk.Base }\n\n"}
          <span className={styles.kw}>func</span> (*Ping) <span className={styles.fn}>Commands</span>
          {"(r *sdk.CommandRegistry) {\n  r."}
          <span className={styles.fn}>Command</span>(<span className={styles.str}>"ping"</span>).
          <span className={styles.fn}>Handle</span>
          {"(\n    "}
          <span className={styles.kw}>func</span>
          {"(*sdk.Context) (message.Chain, error) {\n      "}
          <span className={styles.kw}>return</span> message.Chain{"{"}message.<span className={styles.fn}>Text</span>(
          <span className={styles.str}>"pong"</span>){"}"}, <span className={styles.kw}>nil</span>
          {"\n    })\n}"}
        </code>
      </pre>
    </div>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={translate({ id: "home.pageTitle", message: "首页" })} description={siteConfig.tagline}>
      <header className={clsx("container", styles.hero)}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>0.1-beta</p>
          <h1 className={styles.title}>AlonaBot</h1>
          <p className={styles.lead}>
            <Translate id="home.subtitle">跨平台 · 多进程 · Go 聊天机器人框架</Translate>
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs/guide/quick-start">
              <Translate id="home.cta.quickStart">快速开始</Translate>
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/plugins/first-plugin">
              <Translate id="home.cta.plugin">编写插件</Translate>
            </Link>
          </div>
          <p className={styles.status}>
            <Translate id="home.status">实施中</Translate> ·{" "}
            <Link to="/docs/guide/status">
              <Translate id="home.status.link">实现状态</Translate>
            </Link>
          </p>
        </div>
        <div className={styles.demo}>
          <CodeWindow />
          <ChatDemo />
        </div>
      </header>
      <main className="container">
        <section className={styles.features}>
          {features.map((f, i) => (
            <article key={f.title} className={styles.feature}>
              <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
              <h2>{f.title}</h2>
              <p>{f.body}</p>
            </article>
          ))}
        </section>
      </main>
    </Layout>
  );
}
