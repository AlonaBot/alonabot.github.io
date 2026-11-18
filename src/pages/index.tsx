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
const features: { title: string; body: string; to: string }[] = [
  {
    title: translate({ id: "home.feature.platform.title", message: "一次编写，多平台复用" }),
    body: translate({ id: "home.feature.platform.body", message: "命令与消息使用同一套 SDK，平台差异交给 Adapter，并按实例能力选择功能。" }),
    to: "/docs/tutorial/commands",
  },
  {
    title: translate({ id: "home.feature.testing.title", message: "本机验证真实回复" }),
    body: translate({ id: "home.feature.testing.body", message: "用 plugintest 在 go test 中运行真实 Core，检查回复、权限、数据库和多轮交互。" }),
    to: "/docs/tutorial/testing",
  },
  {
    title: translate({ id: "home.feature.hotdeploy.title", message: "改插件，其他组件继续运行" }),
    body: translate({ id: "home.feature.hotdeploy.body", message: "run --reload 只重启变化的组件；编译失败时，继续使用旧版本。" }),
    to: "/docs/quick-start",
  },
  {
    title: translate({ id: "home.feature.isolation.title", message: "各插件自主选择依赖" }),
    body: translate({ id: "home.feature.isolation.body", message: "Native 插件分别构建、独立运行，依赖版本随各自构建确定，故障按组件定位。" }),
    to: "/docs/internals/architecture",
  },
  {
    title: translate({ id: "home.feature.rollback.title", message: "更新失败保留受管数据" }),
    body: translate({ id: "home.feature.rollback.body", message: "安装组件更新时使用 SQLite 候选副本，准备失败恢复旧代次与旧数据库。" }),
    to: "/docs/tutorial/storage",
  },
  {
    title: translate({ id: "home.feature.collab.title", message: "复用服务与模型" }),
    body: translate({ id: "home.feature.collab.body", message: "通过 Service 调用、Bus 广播和 Agent 模型接口，让多个插件共享已有能力。" }),
    to: "/docs/advanced/services",
  },
];

function CodeWindow(): ReactNode {
  return (
    <div className={styles.window}>
      <div className={styles.windowBar}>
        <span className={styles.fileName}>plugin.go</span>
      </div>
      <pre className={styles.code}>
        <code>
          <span className={styles.kw}>func</span> <span className={styles.fn}>New</span>
          {"() *sdk.Plugin {\n  p := sdk."}
          <span className={styles.fn}>NewPlugin</span>{"()\n  p."}
          <span className={styles.fn}>Command</span>(<span className={styles.str}>"ping"</span>).
          <span className={styles.fn}>Handle</span>{"(\n    "}
          <span className={styles.kw}>func</span>{"(*sdk.Context) (message.Content, error) {\n      "}
          <span className={styles.kw}>return</span>{" message."}<span className={styles.fn}>Text</span>(
          <span className={styles.str}>"pong"</span>), <span className={styles.kw}>nil</span>
          {"\n    })\n  "}<span className={styles.kw}>return</span>{" p\n}"}
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
            <Translate id="home.subtitle">用 Go 写业务，接入你选择的聊天平台。</Translate>
          </p>
          <p className={styles.support}>
            <Translate id="home.support">从 /ping 开始，逐步加入数据库、按钮和模型调用。</Translate>
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs/quick-start">
              <Translate id="home.cta.quickStart">快速开始</Translate>
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/tutorial/project">
              <Translate id="home.cta.plugin">编写第一个插件</Translate>
            </Link>
          </div>
          <p className={styles.status}>
            <Translate id="home.status">实施中</Translate> ·{" "}
            <Link to="/docs/internals/status">
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
          {features.map((f) => (
            <article key={f.title} className={styles.feature}>
              <h2><Link to={f.to}>{f.title}</Link></h2>
              <p>{f.body}</p>
            </article>
          ))}
        </section>
      </main>
    </Layout>
  );
}
