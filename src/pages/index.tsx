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
    title: translate({ id: "home.feature.isolation.title", message: "依赖隔离" }),
    body: translate({ id: "home.feature.isolation.body", message: "独立进程 · 独立 go.mod · ~7.5 MiB PSS" }),
  },
  {
    title: translate({ id: "home.feature.hotdeploy.title", message: "热部署" }),
    body: translate({ id: "home.feature.hotdeploy.body", message: "run --reload · 仅重启变更组件 · 编译失败保留旧版" }),
  },
  {
    title: translate({ id: "home.feature.rollback.title", message: "事务化更新" }),
    body: translate({ id: "home.feature.rollback.body", message: "代次原子提交 · SQLite 候选副本 · 失败回滚" }),
  },
  {
    title: translate({ id: "home.feature.agent.title", message: "内置 Agent" }),
    body: translate({ id: "home.feature.agent.body", message: "工具调用确认 · MCP · 记忆 · llm.generate" }),
  },
  {
    title: translate({ id: "home.feature.collab.title", message: "插件协作" }),
    body: translate({ id: "home.feature.collab.body", message: "Service Broker · Event Bus · JSON Schema 校验" }),
  },
  {
    title: translate({ id: "home.feature.permission.title", message: "可信权限" }),
    body: translate({ id: "home.feature.permission.body", message: "Core 计算 Actor 权限 · 实例发信许可 · Secret 引用" }),
  },
  {
    title: translate({ id: "home.feature.distribution.title", message: "签名分发" }),
    body: translate({ id: "home.feature.distribution.body", message: "Ed25519 · 来源锁定更新 · 组件 --replace" }),
  },
  {
    title: translate({ id: "home.feature.sdk.title", message: "类型化 SDK" }),
    body: translate({ id: "home.feature.sdk.body", message: "编译期 Hook 校验 · 构建期代码生成 · Service Schema" }),
  },
  {
    title: translate({ id: "home.feature.testing.title", message: "真实 Core 测试" }),
    body: translate({ id: "home.feature.testing.body", message: "plugintest · go test · 库模式" }),
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
              <Translate id="home.cta.plugin">插件 SDK</Translate>
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
              <p>
                {f.body.split(" · ").map((term, j) => (
                  <span key={term} className={styles.term}>
                    {j > 0 && <span className={styles.sep}> · </span>}
                    {term}
                  </span>
                ))}
              </p>
            </article>
          ))}
        </section>
      </main>
    </Layout>
  );
}
