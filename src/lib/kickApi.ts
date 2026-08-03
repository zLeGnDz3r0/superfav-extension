/**
 * Kick channel/stream fetch from the extension (browser TLS).
 * Kick blocks many datacenter IPs (Render returns 403 → empty SuperFavs).
 */

export type KickStream = {
  platform: 'kick';
  id: string;
  user_login: string;
  user_name: string;
  game_name: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string;
  /** Profile pic — stream.kick.com thumbs often 403; use as fallback. */
  avatar_url: string;
};

export type KickChannel = {
  platform: 'kick';
  user_login: string;
  user_name: string;
  title: string;
  game_name: string;
};

type KickThumbnail = {
  url?: string;
  src?: string;
  srcset?: string;
  responsive?: string;
};

type KickLivestream = {
  id?: number | string;
  session_title?: string;
  viewer_count?: number;
  is_live?: boolean;
  thumbnail?: KickThumbnail | string | null;
  categories?: Array<{ name?: string }>;
};

type KickChannelPayload = {
  slug?: string;
  livestream?: KickLivestream | null;
  recent_categories?: Array<{ name?: string }>;
  user?: { username?: string; profile_pic?: string };
  banner_image?: { url?: string } | null;
};

const KICK_LOGIN_RE = /^[a-z0-9_-]{1,25}$/;

function pickFromSrcset(srcset: string): string {
  const candidates = srcset
    .split(',')
    .map((part) => part.trim().split(/\s+/)[0])
    .filter((u) => /^https?:\/\//i.test(u) && !u.startsWith('data:'));
  if (candidates.length === 0) return '';
  const mid = candidates.find((u) => /_(550|658|787|940)_/.test(u));
  return mid ?? candidates[Math.min(candidates.length - 1, 3)] ?? candidates[0];
}

function thumbnailUrl(ls: KickLivestream | null | undefined): string {
  if (!ls?.thumbnail) return '';
  if (typeof ls.thumbnail === 'string') return ls.thumbnail;
  const t = ls.thumbnail;
  if (t.url) return t.url;
  if (t.src) return t.src;
  if (t.responsive) return pickFromSrcset(t.responsive);
  if (t.srcset) return pickFromSrcset(t.srcset);
  return '';
}

function categoryName(
  ls: KickLivestream | null | undefined,
  recent?: Array<{ name?: string }>,
): string {
  return ls?.categories?.[0]?.name ?? recent?.[0]?.name ?? '';
}

async function fetchKickChannel(login: string): Promise<KickChannelPayload | null> {
  try {
    const res = await fetch(
      `https://kick.com/api/v2/channels/${encodeURIComponent(login)}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as KickChannelPayload;
  } catch {
    return null;
  }
}

function avatarUrl(payload: KickChannelPayload): string {
  return payload.user?.profile_pic ?? payload.banner_image?.url ?? '';
}

/**
 * stream.kick.com thumbs return 403 (CDN hotlink protection) for extensions
 * and servers. Prefer files.kick.com profile/banner; keep other live hosts.
 */
function resolveThumb(ls: KickLivestream, payload: KickChannelPayload): string {
  const live = thumbnailUrl(ls);
  const avatar = avatarUrl(payload);
  if (live && !/stream\.kick\.com/i.test(live)) return live;
  return avatar || live;
}

function toStream(login: string, payload: KickChannelPayload): KickStream | null {
  const ls = payload.livestream;
  if (!ls || ls.is_live === false) return null;
  if (ls.is_live !== true && !ls.session_title && ls.viewer_count == null) {
    return null;
  }
  const slug = (payload.slug ?? login).toLowerCase();
  return {
    platform: 'kick',
    id: String(ls.id ?? `kick:${slug}`),
    user_login: slug,
    user_name: payload.user?.username ?? slug,
    game_name: categoryName(ls, payload.recent_categories),
    title: ls.session_title ?? '',
    viewer_count: Number(ls.viewer_count ?? 0),
    thumbnail_url: resolveThumb(ls, payload),
    avatar_url: avatarUrl(payload),
  };
}

function toChannel(login: string, payload: KickChannelPayload): KickChannel {
  const ls = payload.livestream;
  const slug = (payload.slug ?? login).toLowerCase();
  return {
    platform: 'kick',
    user_login: slug,
    user_name: payload.user?.username ?? slug,
    title: ls?.session_title ?? '',
    game_name: categoryName(ls, payload.recent_categories),
  };
}

function parseLogins(logins: string[]): string[] {
  return [
    ...new Set(
      logins
        .map((u) => u.trim().toLowerCase())
        .filter((u) => KICK_LOGIN_RE.test(u)),
    ),
  ].slice(0, 50);
}

/** Live Kick streams for the given logins (browser-side). */
export async function fetchKickStreams(logins: string[]): Promise<KickStream[]> {
  const users = parseLogins(logins);
  if (users.length === 0) return [];
  const results = await Promise.all(
    users.map(async (login) => {
      const payload = await fetchKickChannel(login);
      if (!payload) return null;
      return toStream(login, payload);
    }),
  );
  return results.filter((s): s is KickStream => s != null);
}

/** Channel info (titles) for Kick logins — includes offline. */
export async function fetchKickChannels(logins: string[]): Promise<KickChannel[]> {
  const users = parseLogins(logins);
  if (users.length === 0) return [];
  const results = await Promise.all(
    users.map(async (login) => {
      const payload = await fetchKickChannel(login);
      if (!payload) return null;
      return toChannel(login, payload);
    }),
  );
  return results.filter((c): c is KickChannel => c != null);
}

/**
 * Prefer direct Kick image URLs in the popup.
 * Render proxy gets 403 from stream.kick.com; browser + no-referrer works better.
 * Only proxy non-stream hosts if needed later.
 */
export function kickThumbSrc(url: string): string {
  return url || '';
}
