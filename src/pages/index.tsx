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
    title: "每个插件一个进程",
    body: "插件是独立的 Native Go 子进程，只经 SDK 与 Core 通信。一个插件崩溃不影响其他插件，Core 按有限重启策略恢复它。",
  },
  {
    title: "组件都能替换",
    body: "Adapter、Agent 与 WebUI 和插件一样可安装。官方提供 Telegram 与 OneBot 11 Adapter，社区组件可以直接替换它们。",
  },
  {
    title: "常驻内存很小",
    body: "只用 SDK 的插件进程实测约 7.5 MiB。SDK 按需拆包，不导入数据库包就不链接驱动。",
  },
  {
    title: "一种线协议",
    body: "长度前缀的 Protobuf Envelope，TCP loopback 与 stdio 编码相同，单帧上限 4 MiB。",
  },
  {
    title: "数据有退路",
    body: "业务数据放在 Core 托管的 SQLite 中，更新与重载使用候选副本，准备失败回到旧数据。",
  },
  {
    title: "五个目标平台",
    body: "Linux、Windows 与 macOS 的 amd64/arm64。Core 以 CGO_ENABLED=0 纯 Go 构建；目前只在 darwin/arm64 上做过运行验证。",
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
            AlonaBot 由一个轻量的 Core 和可替换的组件组成。插件是普通的 Go 程序，跑在自己的进程里。
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
            框架仍在实施初期，已实现的范围见 <Link to="/docs/guide/status">当前进度</Link>。
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
