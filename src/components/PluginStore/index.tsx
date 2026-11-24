import { useEffect, useState, type ReactNode } from "react";
import { translate } from "@docusaurus/Translate";
import { useHistory, useLocation } from "@docusaurus/router";
import useIsBrowser from "@docusaurus/useIsBrowser";
import { fetchCatalog, matchesSearch, roles, type Catalog, type Role, type StoreEntry } from "./catalog";
import styles from "./styles.module.css";

const roleLabels = () => ({
  plugin: translate({ id: "store.role.plugin", message: "插件" }),
  adapter: translate({ id: "store.role.adapter", message: "适配器" }),
  agent: "Agent",
  webui: "WebUI",
});

function Icon({ name, className }: { name: "search" | "close" | "star" | "verified" | "package"; className?: string }): ReactNode {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />,
    verified: <><path d="m12 2 3 2 3.6.4.9 3.5 2 3.1-2 3.1-.9 3.5-3.6.4-3 2-3-2-3.6-.4-.9-3.5-2-3.1 2-3.1.9-3.5L9 4Z" fill="currentColor" stroke="currentColor" /><path d="m8 11 2.5 2.5L16 8" className={styles.checkmark} /></>,
    package: <><path d="m12 3 9 5v9l-9 5-9-5V8Zm-9 5 9 5 9-5M12 13v9M7.5 5.5l9 5" /></>,
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name]}</svg>;
}

function StoreCard({ entry }: { entry: StoreEntry }): ReactNode {
  const [failedIconURL, setFailedIconURL] = useState<string>();
  const owner = entry.repo.split("/")[0];
  const official = owner.toLowerCase() === "alonabot";
  const repoURL = `https://github.com/${entry.repo}`;
  const verified = translate({ id: "store.verified", message: "官方认证" });
  const unknown = translate({ id: "store.unprovided", message: "未提供" });
  return <article className={styles.card} aria-label={entry.name}>
    <header className={styles.cardHeader}>
      <div className={styles.icon}>
        {entry.icon_url && entry.icon_url !== failedIconURL
          ? <img src={entry.icon_url} alt="" loading="lazy" onError={() => setFailedIconURL(entry.icon_url)} />
          : <Icon name="package" />}
      </div>
      <div className={styles.identity}>
        <div className={styles.nameLine}>
          <h2><a href={repoURL}>{entry.name}</a></h2>
          {official && <span className={styles.verified} role="img" aria-label={verified} title={verified}><Icon name="verified" /></span>}
        </div>
        <a href={repoURL} className={styles.repo}>{entry.repo}</a>
      </div>
      <span className={styles.role}>{roleLabels()[entry.role]}</span>
    </header>
    <p className={styles.description}>{entry.description || unknown}</p>
    {entry.tags.length > 0 && <ul className={styles.tags} aria-label={translate({ id: "store.tags", message: "标签" })}>
      {entry.tags.map((tag, index) => <li key={`${index}-${tag}`}>#{tag}</li>)}
    </ul>}
    {!official && <a className={styles.owner} href={`https://github.com/${owner}`}>
      <img src={`https://github.com/${owner}.png?size=48`} width="24" height="24" alt="" loading="lazy" />
      <span>{owner}</span>
    </a>}
    <footer className={styles.cardFooter}>
      <a href={`${repoURL}/stargazers`} aria-label={translate({ id: "store.stars", message: "GitHub Stars：{count}" }, { count: entry.stars === undefined ? unknown : String(entry.stars) })}>
        <Icon name="star" /><span>{entry.stars === undefined ? "—" : entry.stars.toLocaleString()}</span>
      </a>
      <a href={entry.release_url}>v{entry.version}</a>
    </footer>
  </article>;
}

type LoadState = { status: "loading" } | { status: "error"; error: string } | { status: "ready"; catalog: Catalog };

export default function PluginStore(): ReactNode {
  const location = useLocation();
  const history = useHistory();
  const isBrowser = useIsBrowser();
  const params = new URLSearchParams(isBrowser ? location.search : "");
  const query = params.get("q") ?? "";
  const roleParam = params.get("role");
  const role = roles.includes(roleParam as Role) ? roleParam as Role : "";
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    fetchCatalog(controller.signal).then(catalog => setState({ status: "ready", catalog })).catch(error => {
      if (!controller.signal.aborted) setState({ status: "error", error: error instanceof Error ? error.message : String(error) });
    });
    return () => controller.abort();
  }, [attempt]);

  function changeFilters(nextQuery: string, nextRole: Role | "", replace = false) {
    const next = new URLSearchParams(location.search);
    if (nextQuery) next.set("q", nextQuery); else next.delete("q");
    if (nextRole) next.set("role", nextRole); else next.delete("role");
    const target = { ...location, search: next.size ? `?${next}` : "" };
    if (replace) history.replace(target); else history.push(target);
  }

  const catalog = state.status === "ready" ? state.catalog : undefined;
  const searched = catalog?.items.filter(entry => matchesSearch(entry, query)) ?? [];
  const items = searched.filter(entry => !role || entry.role === role);
  const labels = roleLabels();
  const options = [{ value: "" as const, label: translate({ id: "store.role.all", message: "全部" }) }, ...roles.map(value => ({ value, label: labels[value] }))];
  const clear = translate({ id: "store.clear", message: "清除筛选" });
  const loading = translate({ id: "store.loading", message: "正在加载插件…" });

  return <main className={styles.store}>
    <header className={styles.heading}>
      <h1>{translate({ id: "store.title", message: "插件商店" })}</h1>
      <p role="status">{catalog ? translate({ id: "store.total", message: "共 {count} 个插件" }, { count: catalog.items.length }) : state.status === "loading" ? <>
        <span className={`${styles.skeleton} ${styles.skeletonTotal}`} aria-hidden="true" />
        <span className={styles.srOnly}>{loading}</span>
      </> : null}</p>
    </header>
    <div className={styles.controls}>
      <label className={styles.search}>
        <Icon name="search" />
        <input type="search" value={query} onChange={event => changeFilters(event.target.value, role, true)}
          placeholder={translate({ id: "store.search", message: "搜索名称、组件 ID 或描述" })}
          aria-label={translate({ id: "store.search", message: "搜索名称、组件 ID 或描述" })} />
      </label>
      <div className={styles.filterRow}>
        <div className={styles.filters} role="group" aria-label={translate({ id: "store.roles", message: "组件角色" })}>
          {options.map(option => <button type="button" key={option.value} aria-pressed={role === option.value} onClick={() => changeFilters(query, option.value)}>
            {option.label}{catalog && <span>{option.value ? searched.filter(entry => entry.role === option.value).length : searched.length}</span>}
          </button>)}
        </div>
        {(query || role) && <button type="button" className={styles.clear} onClick={() => changeFilters("", "")}><Icon name="close" />{clear}</button>}
      </div>
    </div>
    <section aria-label={translate({ id: "store.results", message: "插件列表" })} aria-busy={state.status === "loading"}>
      {state.status === "loading" && <div className={styles.grid} aria-hidden="true">
        {[0, 1, 2].map(index => <div className={styles.card} key={index}>
          <div className={styles.cardHeader}>
            <span className={`${styles.icon} ${styles.skeleton}`} />
            <div className={styles.identity}>
              <span className={`${styles.skeleton} ${styles.skeletonTitle}`} />
              <span className={`${styles.skeleton} ${styles.skeletonRepo}`} />
            </div>
          </div>
          <div className={styles.skeletonDescription}>
            <span className={styles.skeleton} />
            <span className={styles.skeleton} />
          </div>
          <span className={`${styles.skeleton} ${styles.skeletonTag}`} />
          <div className={styles.cardFooter}>
            <span className={`${styles.skeleton} ${styles.skeletonMeta}`} />
            <span className={`${styles.skeleton} ${styles.skeletonMeta}`} />
          </div>
        </div>)}
      </div>}
      {state.status === "error" && <div className={styles.error} role="alert">
        <h2>{translate({ id: "store.failed", message: "插件目录读取失败" })}</h2>
        <pre>{state.error}</pre>
        <button type="button" className="button button--secondary" onClick={() => setAttempt(value => value + 1)}>{translate({ id: "store.retry", message: "重试" })}</button>
      </div>}
      {catalog && (items.length > 0 ? <div className={styles.grid}>{items.map(entry => <StoreCard entry={entry} key={entry.repo.toLowerCase()} />)}</div>
        : <div className={styles.empty} role="status">
          <p>{catalog.items.length === 0
            ? translate({ id: "store.empty", message: "官方目录暂无可展示的插件" })
            : translate({ id: "store.noResults", message: "没有找到匹配的插件" })}</p>
          {(query || role) && <button type="button" className="button button--secondary" onClick={() => changeFilters("", "")}>{clear}</button>}
        </div>)}
    </section>
    {catalog && catalog.errors.length > 0 && <details className={styles.error}>
      <summary>{translate({ id: "store.entryErrors", message: "{count} 个条目的索引生成失败" }, { count: catalog.errors.length })}</summary>
      <ul>{catalog.errors.map((error, index) => <li key={index}><strong>{error.repo}</strong><pre>{error.error}</pre></li>)}</ul>
    </details>}
  </main>;
}
