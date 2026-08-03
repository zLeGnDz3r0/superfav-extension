export type Platform = 'twitch' | 'kick';

export type FavEntry = {
  platform: Platform;
  login: string;
};

export const FAVS_KEY = 'superfavs';

export function isPlatform(value: unknown): value is Platform {
  return value === 'twitch' || value === 'kick';
}

export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

export function favKey(platform: Platform, login: string): string {
  return `${platform}:${normalizeLogin(login)}`;
}

export function favKeyOf(fav: FavEntry): string {
  return favKey(fav.platform, fav.login);
}

export function parseFavKey(key: string): FavEntry | null {
  const idx = key.indexOf(':');
  if (idx <= 0) return null;
  const platform = key.slice(0, idx);
  const login = normalizeLogin(key.slice(idx + 1));
  if (!isPlatform(platform) || !login) return null;
  return { platform, login };
}

export function sameFav(a: FavEntry, b: FavEntry): boolean {
  return a.platform === b.platform && normalizeLogin(a.login) === normalizeLogin(b.login);
}

export function normalizeFavEntry(raw: unknown): FavEntry | null {
  if (typeof raw === 'string') {
    const login = normalizeLogin(raw);
    if (!login) return null;
    return { platform: 'twitch', login };
  }
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { platform?: unknown; login?: unknown };
  if (!isPlatform(obj.platform) || typeof obj.login !== 'string') return null;
  const login = normalizeLogin(obj.login);
  if (!login) return null;
  return { platform: obj.platform, login };
}

/** Normalize + migrate legacy `string[]` SuperFavs to `FavEntry[]`. */
export function normalizeFavs(raw: unknown): FavEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: FavEntry[] = [];
  for (const item of raw) {
    const fav = normalizeFavEntry(item);
    if (!fav) continue;
    const key = favKeyOf(fav);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(fav);
  }
  return out;
}

export function needsFavMigration(raw: unknown): boolean {
  if (!Array.isArray(raw) || raw.length === 0) return false;
  return raw.some((item) => typeof item === 'string');
}

export function channelUrl(platform: Platform, login: string): string {
  const slug = normalizeLogin(login);
  return platform === 'kick' ? `https://kick.com/${slug}` : `https://twitch.tv/${slug}`;
}

export function loginsForPlatform(favs: FavEntry[], platform: Platform): string[] {
  return favs.filter((f) => f.platform === platform).map((f) => f.login);
}

export function hasFav(favs: FavEntry[], platform: Platform, login: string): boolean {
  const target = normalizeLogin(login);
  return favs.some((f) => f.platform === platform && f.login === target);
}

export function toggleFav(
  favs: FavEntry[],
  platform: Platform,
  login: string,
): FavEntry[] {
  const target = normalizeLogin(login);
  if (hasFav(favs, platform, target)) {
    return favs.filter((f) => !(f.platform === platform && f.login === target));
  }
  return [...favs, { platform, login: target }];
}
