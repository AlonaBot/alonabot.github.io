import { useEffect, useRef, useState, type ReactNode } from "react";
import { translate } from "@docusaurus/Translate";
import { useHistory, useLocation } from "@docusaurus/router";
import useIsBrowser from "@docusaurus/useIsBrowser";
import { fetchCatalog, matchesSearch, selectEntries, pageSize, roles, type Catalog, type Role, type StoreEntry } from "./catalog";
import styles from "./styles.module.css";

const roleLabels = () => ({
  plugin: translate({ id: "store.role.plugin", message: "插件" }),
  adapter: translate({ id: "store.role.adapter", message: "适配器" }),
  agent: "Agent",
  webui: "WebUI",
});

function Icon({ name, className }: { name: "search" | "close" | "star" | "verified" | "package" | "chevron" | "grid" | "tag" | "descending" | "ascending" | "previous" | "next"; className?: string }): ReactNode {
  const paths = {
    chevron: <path d="m7 10 5 5 5-5" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    tag: <><path d="M3 3h8l10 10-8 8L3 11Z" /><circle cx="7.5" cy="7.5" r="1" /></>,
    descending: <path d="M3 5h10M3 10h7M3 15h4M18 3v18m-4-4 4 4 4-4" />,
    ascending: <path d="M3 5h4M3 10h7M3 15h10M18 21V3m-4 4 4-4 4 4" />,
    previous: <path d="m14 6-6 6 6 6" />,
    next: <path d="m10 6 6 6-6 6" />,
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
  return <article><a className={styles.card} href={repoURL} target="_blank" rel="noopener noreferrer" aria-label={entry.name}>
    <header className={styles.cardHeader}>
      <div className={styles.icon}>
        {entry.icon_url && entry.icon_url !== failedIconURL
          ? <img src={entry.icon_url} alt="" loading="lazy" onError={() => setFailedIconURL(entry.icon_url)} />
          : <Icon name="package" />}
      </div>
      <div className={styles.identity}>
        <div className={styles.nameLine}>
          <h2>{entry.name}</h2>
          {official && <span className={styles.verified} role="img" aria-label={verified} title={verified}><Icon name="verified" /></span>}
        </div>
        <span className={styles.repo}>{entry.repo}</span>
      </div>
      <span className={styles.role}>{roleLabels()[entry.role]}</span>
    </header>
    <p className={styles.description}>{entry.description || unknown}</p>
    {entry.tags.length > 0 && <ul className={styles.tags} aria-label={translate({ id: "store.tags", message: "标签" })}>
      {entry.tags.map((tag, index) => <li key={`${index}-${tag}`}>#{tag}</li>)}
    </ul>}
    {!official && <div className={styles.owner}>
      <img src={`https://github.com/${owner}.png?size=48`} width="24" height="24" alt="" loading="lazy" />
      <span>{owner}</span>
    </div>}
    <footer className={styles.cardFooter}>
      <span aria-label={translate({ id: "store.stars", message: "GitHub Stars：{count}" }, { count: entry.stars === undefined ? unknown : String(entry.stars) })}>
        <Icon name="star" /><span>{entry.stars === undefined ? "—" : entry.stars.toLocaleString()}</span>
      </span>
      <span>v{entry.version}</span>
    </footer>
  </a></article>;
}

function FilterMenu({ label, icon, children, iconOnly = false }: { label: string; icon: ReactNode; children: ReactNode; iconOnly?: boolean }): ReactNode {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) ref.current?.removeAttribute("open");
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  return <details ref={ref} className={styles.filterMenu} onKeyDown={event => {
    if (event.key === "Escape") {
      ref.current?.removeAttribute("open");
      ref.current?.querySelector("summary")?.focus();
    }
  }} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) ref.current?.removeAttribute("open");
  }}>
    <summary aria-label={label} title={label}>{icon}{!iconOnly && <span>{label}</span>}<Icon name="chevron" /></summary>
    <div className={styles.filterPanel}>{children}</div>
  </details>;
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
  const selectedTags = params.getAll("tag");
  const ascending = params.get("sort") === "stars-asc";
  const pageParam = Number(params.get("page") ?? 1);
  const requestedPage = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const [roleSearch, setRoleSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
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

  function changeFilters(changes: Record<string, string | string[]>, replace = false) {
    const next = new URLSearchParams(location.search);
    if (!("page" in changes)) next.delete("page");
    for (const [key, value] of Object.entries(changes)) {
      next.delete(key);
      for (const item of Array.isArray(value) ? value : [value]) if (item) next.append(key, item);
    }
    const target = { ...location, search: next.size ? "?" + next : "" };
    if (replace) history.replace(target); else history.push(target);
  }

  function clearFilters() {
    changeFilters({ q: "", role: "", tag: [] });
  }

  const catalog = state.status === "ready" ? state.catalog : undefined;
  const searched = catalog?.items.filter(entry => matchesSearch(entry, query)) ?? [];
  const items = selectEntries(catalog?.items ?? [], { query, role, tags: selectedTags, ascending });
  const pageCount = Math.ceil(items.length / pageSize);
  const page = Math.min(requestedPage, Math.max(1, pageCount));
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1)
    .filter(value => value === 1 || value === pageCount || Math.abs(value - page) <= 1);
  const visibleItems = items.slice((page - 1) * pageSize, page * pageSize);
  const tags = Array.from(new Set(catalog?.items.flatMap(entry => entry.tags) ?? [])).sort((a, b) => a.localeCompare(b));
  const hasFilters = Boolean(query || role || selectedTags.length);
  const tagLabel = translate({ id: "store.selectTags", message: "选择标签" });
  const sortLabel = ascending
    ? translate({ id: "store.sortAscending", message: "Star 最少优先" })
    : translate({ id: "store.sortDescending", message: "Star 最多优先" });
  const labels = roleLabels();
  const options = [{ value: "" as const, label: translate({ id: "store.role.all", message: "全部类别" }) }, ...roles.map(value => ({ value, label: labels[value] }))];
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
        <input type="search" value={query} onChange={event => changeFilters({ q: event.target.value }, true)}
          placeholder={translate({ id: "store.search", message: "搜索名称、组件 ID 或描述" })}
          aria-label={translate({ id: "store.search", message: "搜索名称、组件 ID 或描述" })} />
      </label>
      <div className={styles.filterRow}>
        {hasFilters && <button type="button" className={styles.clear} onClick={clearFilters}><Icon name="close" />{clear}</button>}
        <div className={styles.filters}>
          <FilterMenu label={role ? labels[role] : options[0].label} icon={<Icon name="grid" />}>
            <input className={styles.menuSearch} type="search" value={roleSearch} onChange={event => setRoleSearch(event.target.value)}
              aria-label={translate({ id: "store.searchRoles", message: "搜索类别" })} placeholder={translate({ id: "store.searchRoles", message: "搜索类别" })} />
            <div className={styles.optionList} role="group" aria-label={translate({ id: "store.roles", message: "组件角色" })}>
              {options.filter(option => option.label.toLowerCase().includes(roleSearch.toLowerCase())).map(option => <label key={option.value} className={styles.option}>
                <input type="radio" name="store-role" checked={role === option.value} onChange={event => {
                  changeFilters({ role: option.value });
                  event.currentTarget.closest("details")?.removeAttribute("open");
                }} />
                <span>{option.label}</span><span className={styles.count}>{option.value ? searched.filter(entry => entry.role === option.value).length : searched.length}</span>
              </label>)}
            </div>
          </FilterMenu>
          <FilterMenu label={selectedTags.length ? tagLabel + " (" + selectedTags.length + ")" : tagLabel} icon={<Icon name="tag" />}>
            <input className={styles.menuSearch} type="search" value={tagSearch} onChange={event => setTagSearch(event.target.value)}
              aria-label={translate({ id: "store.searchTags", message: "搜索标签" })} placeholder={translate({ id: "store.searchTags", message: "搜索标签" })} />
            <div className={styles.optionList}>
              {tags.filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase())).map(tag => <label key={tag} className={styles.option}>
                <input type="checkbox" checked={selectedTags.includes(tag)} onChange={event => changeFilters({ tag: event.target.checked ? [...selectedTags, tag] : selectedTags.filter(value => value !== tag) }, true)} />
                <span>#{tag}</span>
              </label>)}
              {!tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase())) && <p className={styles.menuEmpty}>{translate({ id: "store.noTags", message: "没有匹配的标签" })}</p>}
            </div>
          </FilterMenu>
          <FilterMenu label={sortLabel} icon={<><Icon name="star" /><Icon name={ascending ? "ascending" : "descending"} /></>} iconOnly>
            <div role="group" aria-label={translate({ id: "store.sort", message: "Star 排序" })}>
              {[false, true].map(value => <label key={String(value)} className={styles.option}>
                <input type="radio" name="store-sort" checked={ascending === value} onChange={event => {
                  changeFilters({ sort: value ? "stars-asc" : "" });
                  event.currentTarget.closest("details")?.removeAttribute("open");
                }} />
                <Icon name={value ? "ascending" : "descending"} />
                <span>{value ? translate({ id: "store.fewest", message: "最少优先" }) : translate({ id: "store.most", message: "最多优先" })}</span>
              </label>)}
            </div>
          </FilterMenu>
        </div>
      </div>
      {selectedTags.length > 0 && <div className={styles.selectedTags}>
        {selectedTags.map(tag => <button type="button" key={tag} onClick={() => changeFilters({ tag: selectedTags.filter(value => value !== tag) })}
          aria-label={translate({ id: "store.removeTag", message: "移除标签 {tag}" }, { tag })}>#{tag}<Icon name="close" /></button>)}
      </div>}
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
      {catalog && (items.length > 0 ? <div className={styles.grid}>{visibleItems.map(entry => <StoreCard entry={entry} key={entry.repo.toLowerCase()} />)}</div>
        : <div className={styles.empty} role="status">
          <p>{catalog.items.length === 0
            ? translate({ id: "store.empty", message: "官方目录暂无可展示的插件" })
            : translate({ id: "store.noResults", message: "没有找到匹配的插件" })}</p>
          {hasFilters && <button type="button" className="button button--secondary" onClick={clearFilters}>{clear}</button>}
        </div>)}
      {pageCount > 1 && <nav className={styles.pagination} aria-label={translate({ id: "store.pagination", message: "插件分页" })}>
        <span role="status">{translate({ id: "store.pageStatus", message: "第 {page} / {pages} 页，共 {count} 项" }, { page, pages: pageCount, count: items.length })}</span>
        <button type="button" disabled={page === 1} onClick={() => changeFilters({ page: String(page - 1) })} aria-label={translate({ id: "store.previous", message: "上一页" })}><Icon name="previous" /></button>
        {pageNumbers.map((value, index) => <span className={styles.pageNumber} key={value}>
          {index > 0 && value - pageNumbers[index - 1] > 1 && <span aria-hidden="true">…</span>}
          <button type="button" aria-current={page === value ? "page" : undefined} onClick={() => changeFilters({ page: String(value) })}>{value}</button>
        </span>)}
        <button type="button" disabled={page === pageCount} onClick={() => changeFilters({ page: String(page + 1) })} aria-label={translate({ id: "store.next", message: "下一页" })}><Icon name="next" /></button>
      </nav>}
    </section>
    {catalog && catalog.errors.length > 0 && <details className={styles.error}>
      <summary>{translate({ id: "store.entryErrors", message: "{count} 个条目的索引生成失败" }, { count: catalog.errors.length })}</summary>
      <ul>{catalog.errors.map((error, index) => <li key={index}><strong>{error.repo}</strong><pre>{error.error}</pre></li>)}</ul>
    </details>}
  </main>;
}
