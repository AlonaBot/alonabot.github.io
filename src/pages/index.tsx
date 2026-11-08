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
    body: translate({ id: "home.feature.isolation.body", message: "每个插件一个进程，崩了不连累别人。" }),
  },
  {
    title: translate({ id: "home.feature.replace.title", message: "组件可替换" }),
    body: translate({ id: "home.feature.replace.body", message: "适配器、Agent、WebUI 都能换成社区版。" }),
  },
  {
    title: translate({ id: "home.feature.memory.title", message: "省内存" }),
    body: translate({ id: "home.feature.memory.body", message: "单个插件约 7.5 MiB，用不到的库不编进去。" }),
  },
  {
    title: translate({ id: "home.feature.platform.title", message: "一份代码，多个平台" }),
    body: translate({ id: "home.feature.platform.body", message: "统一的事件与消息格式，换平台不改插件。" }),
  },
  {
    title: translate({ id: "home.feature.rollback.title", message: "失败可回退" }),
    body: translate({ id: "home.feature.rollback.body", message: "更新先在副本上试，失败就回到旧数据。" }),
  },
  {
    title: translate({ id: "home.feature.purego.title", message: "纯 Go" }),
    body: translate({ id: "home.feature.purego.body", message: "Linux、Windows、macOS，无需 CGO。" }),
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
          <p className={styles.eyebrow}>
            <Translate id="home.eyebrow">Go 聊天机器人框架</Translate> · 0.1-beta
          </p>
          <h1 className={styles.title}>
            <Translate id="home.title.line1">写一次插件，</Translate>
            <br />
            <Translate id="home.title.line2">在每个平台上回复。</Translate>
          </h1>
          <p className={styles.lead}>
            <Translate id="home.lead">用 Go 写插件，平台差异交给 Core 和适配器。</Translate>
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
            <Translate id="home.status">早期开发中</Translate> ·{" "}
            <Link to="/docs/guide/status">
              <Translate id="home.status.link">查看进度</Translate>
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
