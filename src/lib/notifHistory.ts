import type { Platform } from './favorites';

export const NOTIF_HISTORY_KEY = 'notif_history';
export const NOTIF_HISTORY_MAX = 80;

export type NotifHistoryKind = 'live' | 'title';

export interface NotifHistoryEntry {
  id: string;
  kind: NotifHistoryKind;
  at: number;
  platform: Platform;
  login: string;
  displayName: string;
  streamTitle: string;
  gameName: string;
}

export type NotifHistoryInput = Omit<NotifHistoryEntry, 'id' | 'at'> & {
  at?: number;
  id?: string;
};

function isPlatform(raw: unknown): raw is Platform {
  return raw === 'twitch' || raw === 'kick';
}

function isKind(raw: unknown): raw is NotifHistoryKind {
  return raw === 'live' || raw === 'title';
}

export function normalizeNotifHistory(raw: unknown): NotifHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: NotifHistoryEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== 'string' || !row.id) continue;
    if (!isKind(row.kind)) continue;
    if (typeof row.at !== 'number' || !Number.isFinite(row.at)) continue;
    if (!isPlatform(row.platform)) continue;
    if (typeof row.login !== 'string' || !row.login) continue;
    if (typeof row.displayName !== 'string') continue;
    out.push({
      id: row.id,
      kind: row.kind,
      at: row.at,
      platform: row.platform,
      login: row.login.toLowerCase(),
      displayName: row.displayName,
      streamTitle: typeof row.streamTitle === 'string' ? row.streamTitle : '',
      gameName: typeof row.gameName === 'string' ? row.gameName : '',
    });
  }
  return out.sort((a, b) => b.at - a.at).slice(0, NOTIF_HISTORY_MAX);
}

export async function loadNotifHistory(): Promise<NotifHistoryEntry[]> {
  const result = await chrome.storage.session.get([NOTIF_HISTORY_KEY]);
  return normalizeNotifHistory(result[NOTIF_HISTORY_KEY]);
}

export async function appendNotifHistory(input: NotifHistoryInput): Promise<void> {
  const prev = await loadNotifHistory();
  const entry: NotifHistoryEntry = {
    id: input.id ?? `${input.kind}:${input.platform}:${input.login}:${Date.now()}`,
    kind: input.kind,
    at: input.at ?? Date.now(),
    platform: input.platform,
    login: input.login.toLowerCase(),
    displayName: input.displayName,
    streamTitle: input.streamTitle,
    gameName: input.gameName,
  };
  const next = [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, NOTIF_HISTORY_MAX);
  await chrome.storage.session.set({ [NOTIF_HISTORY_KEY]: next });
}

export async function clearNotifHistory(): Promise<void> {
  await chrome.storage.session.set({ [NOTIF_HISTORY_KEY]: [] });
}

export function formatNotifHistoryTime(at: number, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(at));
  } catch {
    return new Date(at).toLocaleString();
  }
}
