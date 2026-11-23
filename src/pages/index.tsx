import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import Translate, { translate } from "@docusaurus/Translate";
import { useBaseUrlUtils } from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

export default function Home(): ReactNode {
  const { siteConfig, i18n } = useDocusaurusContext();
  const { withBaseUrl } = useBaseUrlUtils();
  const url = (p: string) => withBaseUrl(p, { forcePrependBaseUrl: true });
  const features = [
    ["isolation", "进程隔离", "插件独立运行，组件崩溃由 Core 接管重启。", "/docs/internals/architecture"],
    ["modular", "按需组合", "平台、AI 和管理界面各自安装，随时替换。", "/docs/usage/install"],
    ["sleep", "空闲即休眠", "释放空闲插件的内存，消息到来时自动唤醒。", `/docs/usage/settings#${i18n.currentLocale === "en" ? "save-memory" : "节省内存"}`],
    ["develop", "专注 Go 开发", "命令、事件、SQLite 与配置表单，SDK 直接提供。", "/docs/tutorial/project"],
    ["reload", "保存即可运行", "源码自动编译、热重载，在终端验证回复。", "/docs/quick-start"],
    ["manage", "统一管理", "账号、模型、权限与日志，在 WebUI 集中操作。", "/docs/usage/webui"],
  ];
  return <Layout title={translate({id:"home.pageTitle",message:"首页"})} description={siteConfig.tagline}>
    <main className={styles.home}>
      <section className={styles.hero}>
        <div className={styles.intro}>
          <span className={styles.version}>{siteConfig.customFields?.currentVersion as string}</span>
          <h1>AlonaBot</h1>
          <p className={styles.lead}><Translate id="home.headline">用 Go，构建你的聊天机器人。</Translate></p>
          <p className={styles.summary}><Translate id="home.summary">接入聊天平台，组合插件与 AI，在一个界面管理。</Translate></p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to={url("/docs/usage/install")}><Translate id="home.install">部署机器人</Translate></Link>
            <Link className="button button--secondary button--lg" to={url("/docs/quick-start")}><Translate id="home.develop">开发插件</Translate></Link>
          </div>
        </div>
        <div className={styles.identity} aria-hidden="true"><img src={url("/img/mascot-hero.png")} width="1254" height="1254" alt="" fetchPriority="high" /></div>
      </section>
      <section className={styles.features} aria-label={translate({id:"home.features",message:"核心能力"})}>
        {features.map(([id,title,body,to])=><article className={styles.feature} key={id}>
          <h2><Link to={url(to)}>{translate({id: "home.capability."+id+".title",message:title})}</Link></h2>
          <p>{translate({id:"home.capability."+id+".body",message:body})}</p>
        </article>)}
      </section>
      <section className={styles.paths}>
        <h2><Translate id="home.read">从这里继续</Translate></h2>
        <div><Link to={url("/docs/platforms/telegram")}>Telegram</Link><Link to={url("/docs/usage/agent")}><Translate id="home.agent">AI 对话</Translate></Link><Link to={url("/docs/tutorial/commands")}><Translate id="home.commands">命令与参数</Translate></Link><Link to={url("/docs/advanced/services")}><Translate id="home.services">插件协作</Translate></Link><Link to={url("/docs/reference/cli")}>CLI</Link></div>
      </section>
    </main>
  </Layout>;
}
