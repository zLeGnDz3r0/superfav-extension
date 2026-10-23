import { favKey, parseFavKey, type Platform } from './favorites';

export const LIVE_SNAPSHOTS_KEY = 'live_snapshots';

export type LiveSnapshot = {
  platform: Platform;
  id: string;
  user_login: string;
  user_name: string;
  game_name: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string;
  avatar_url?: string;
};

function isPlatform(raw: unknown): raw is Platform {
  return raw === 'twitch' || raw === 'kick';
}

export function normalizeLiveSnapshots(raw: unknown): LiveSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const out: LiveSnapshot[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (!isPlatform(row.platform)) continue;
    if (typeof row.user_login !== 'string' || !row.user_login) continue;
    const login = row.user_login.toLowerCase();
    const key = favKey(row.platform, login);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      platform: row.platform,
      id: typeof row.id === 'string' && row.id ? row.id : key,
      user_login: login,
      user_name: typeof row.user_name === 'string' && row.user_name ? row.user_name : login,
      game_name: typeof row.game_name === 'string' ? row.game_name : '',
      title: typeof row.title === 'string' ? row.title : '',
      viewer_count: typeof row.viewer_count === 'number' && Number.isFinite(row.viewer_count)
        ? row.viewer_count
        : 0,
      thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : '',
      avatar_url: typeof row.avatar_url === 'string' ? row.avatar_url : undefined,
    });
  }
  return out;
}

export async function loadLiveSnapshots(): Promise<LiveSnapshot[]> {
  const result = await chrome.storage.local.get([LIVE_SNAPSHOTS_KEY]);
  return normalizeLiveSnapshots(result[LIVE_SNAPSHOTS_KEY]);
}

export async function saveLiveSnapshots(rows: LiveSnapshot[]): Promise<void> {
  await chrome.storage.local.set({
    [LIVE_SNAPSHOTS_KEY]: normalizeLiveSnapshots(rows),
  });
}

/** Keep a failed platform's last cards. A successful fetch replaces that platform. */
export function mergeLiveSnapshots(
  previous: LiveSnapshot[],
  fetched: LiveSnapshot[],
  ok: { twitch: boolean; kick: boolean },
  favKeys: Set<string>,
): LiveSnapshot[] {
  const next = new Map<string, LiveSnapshot>();
  for (const row of previous) {
    const key = favKey(row.platform, row.user_login);
    if (!favKeys.has(key)) continue;
    if (row.platform === 'twitch' && ok.twitch) continue;
    if (row.platform === 'kick' && ok.kick) continue;
    next.set(key, row);
  }
  for (const row of fetched) {
    const key = favKey(row.platform, row.user_login);
    if (!favKeys.has(key)) continue;
    if (row.platform === 'twitch' && !ok.twitch) continue;
    if (row.platform === 'kick' && !ok.kick) continue;
    next.set(key, row);
  }
  return [...next.values()];
}

export function snapshotKey(row: { platform: Platform; user_login: string }): string | null {
  return parseFavKey(favKey(row.platform, row.user_login)) ? favKey(row.platform, row.user_login) : null;
}
