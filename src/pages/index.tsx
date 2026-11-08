// 首页：左侧是标题与入口，右侧上下排列一段插件代码和它在聊天里的效果。
import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import ChatDemo from "../components/ChatDemo";

import styles from "./index.module.css";

const features: { title: string; body: string }[] = [
  {
    title: "插件各跑各的",
    body: "每个插件都是一个单独的 Go 程序。哪个插件出了问题，只影响它自己，Core 会把它重新拉起来。",
  },
  {
    title: "官方组件也能换",
    body: "Telegram 和 OneBot 11 适配器、Agent、管理界面都只是官方给的一种选择。社区有更合适的，直接换上就行。",
  },
  {
    title: "占的内存很少",
    body: "一个只用 SDK 的插件大约 7.5 MiB。用不到的库不会被编进去，没用数据库就不带数据库驱动。",
  },
  {
    title: "换平台不用改代码",
    body: "插件拿到的是统一格式的事件和消息，平台之间的差别交给适配器去处理。",
  },
  {
    title: "改坏了能退回去",
    body: "插件的数据放在 Core 管理的 SQLite 里。更新插件或改配置时先在副本上试，失败了数据还是原来的样子。",
  },
  {
    title: "三大系统都能跑",
    body: "Linux、Windows、macOS 的 amd64 和 arm64，纯 Go 构建，不需要 C 编译器。目前只在 Apple Silicon 的 Mac 上实际跑过。",
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
    <Layout title="首页" description={siteConfig.tagline}>
      <header className={clsx("container", styles.hero)}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Go 聊天机器人框架 · 0.1-beta</p>
          <h1 className={styles.title}>
            写一次插件，
            <br />
            在每个平台上回复。
          </h1>
          <p className={styles.lead}>
            用 Go 写聊天机器人。插件就是普通的 Go 程序，消息来自 Telegram 还是 QQ，交给 Core 和适配器去操心。
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs/guide/quick-start">
              快速开始
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/plugins/first-plugin">
              编写插件
            </Link>
          </div>
          <p className={styles.status}>
            还在早期开发中，做到哪一步可以看 <Link to="/docs/guide/status">当前进度</Link>。
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
