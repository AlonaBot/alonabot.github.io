export const catalogURL = "https://raw.githubusercontent.com/AlonaBot/plugin-store/index/store.json";
export const roles = ["plugin", "adapter", "agent", "webui"] as const;
export type Role = (typeof roles)[number];

export type StoreEntry = {
  repo: string;
  role: Role;
  id: string;
  name: string;
  description?: string;
  author?: string;
  tags: string[];
  version: string;
  stars?: number;
  icon_url?: string;
  release_url: string;
};

export type Catalog = {
  version: 1;
  generated_at: string;
  items: StoreEntry[];
  errors: { repo: string; error: string }[];
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 在官方快照的输入边界检查页面实际使用的字段；保留原始错误和元数据。 */
export function parseCatalog(value: unknown): Catalog {
  if (!record(value) || value.version !== 1 || typeof value.generated_at !== "string" || !Array.isArray(value.items) || !Array.isArray(value.errors)) {
    throw new Error("store.json: expected version 1, generated_at, items and errors");
  }
  const repositories = new Set<string>();
  for (const [index, entry] of value.items.entries()) {
    const path = `store.json.items[${index}]`;
    if (!record(entry)) throw new Error(`${path}: expected an object`);
    for (const key of ["repo", "role", "id", "name", "version", "release_url"]) {
      if (typeof entry[key] !== "string" || entry[key] === "") throw new Error(`${path}.${key}: expected a non-empty string`);
    }
    const repo = entry.repo as string;
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || repo.split("/").some(part => part === "." || part === "..")) {
      throw new Error(`${path}.repo: invalid GitHub repository ${repo}`);
    }
    if (!roles.includes(entry.role as Role)) throw new Error(`${path}.role: unsupported role ${entry.role}`);
    if (!Array.isArray(entry.tags) || !entry.tags.every(tag => typeof tag === "string")) throw new Error(`${path}.tags: expected strings`);
    for (const key of ["description", "author", "icon_url"]) {
      if (entry[key] !== undefined && typeof entry[key] !== "string") throw new Error(`${path}.${key}: expected a string`);
    }
    if (entry.stars !== undefined && (typeof entry.stars !== "number" || !Number.isInteger(entry.stars) || entry.stars < 0)) {
      throw new Error(`${path}.stars: expected a non-negative integer`);
    }
    if (!(entry.release_url as string).toLowerCase().startsWith(`https://github.com/${repo.toLowerCase()}/releases/tag/`)) {
      throw new Error(`${path}.release_url: release does not belong to ${repo}`);
    }
    if (entry.icon_url && !/^(https:\/\/|data:image\/(?:png|webp|svg\+xml);base64,)/.test(entry.icon_url as string)) {
      throw new Error(`${path}.icon_url: expected an HTTPS image or an inline image`);
    }
    if (repositories.has(repo.toLowerCase())) throw new Error(`${path}.repo: duplicate repository ${repo}`);
    repositories.add(repo.toLowerCase());
  }
  for (const [index, error] of value.errors.entries()) {
    if (!record(error) || typeof error.repo !== "string" || typeof error.error !== "string") {
      throw new Error(`store.json.errors[${index}]: expected repo and error strings`);
    }
  }
  return value as Catalog;
}

export async function fetchCatalog(signal: AbortSignal): Promise<Catalog> {
  const response = await fetch(catalogURL, { signal });
  if (!response.ok) throw new Error(`GET ${catalogURL}: HTTP ${response.status}\n${await response.text()}`);
  return parseCatalog(await response.json());
}

export function matchesSearch(entry: StoreEntry, query: string): boolean {
  const text = [entry.name, entry.id, entry.description, entry.repo, entry.author, ...entry.tags].join(" ");
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

export const pageSize = 12;

/** 同类标签采用并集，关键词与类别筛选叠加；缺失 Star 的条目始终排在已知数值之后。 */
export function selectEntries(entries: StoreEntry[], filters: { query: string; role: Role | ""; tags: string[]; ascending: boolean }): StoreEntry[] {
  return entries.filter(entry => matchesSearch(entry, filters.query)
    && (!filters.role || entry.role === filters.role)
    && (!filters.tags.length || filters.tags.some(tag => entry.tags.includes(tag))))
    .sort((a, b) => {
      if (a.stars === undefined) return b.stars === undefined ? 0 : 1;
      if (b.stars === undefined) return -1;
      return filters.ascending ? a.stars - b.stars : b.stars - a.stars;
    });
}
