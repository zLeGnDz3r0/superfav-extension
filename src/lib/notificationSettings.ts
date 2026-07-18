export const NOTIF_SETTINGS_KEY = 'superfav_notif_settings';
export const CHANNEL_NOTIF_KEY = 'superfav_channel_notif';

export type NotificationSettings = {
  desktopEnabled: boolean;
  titleChangeEnabled: boolean;
};

export type ChannelNotifPref = {
  live: boolean;
  title: boolean;
};

export type ChannelNotifMap = Record<string, ChannelNotifPref>;

export const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  desktopEnabled: true,
  titleChangeEnabled: true,
};

export const DEFAULT_CHANNEL_PREF: ChannelNotifPref = {
  live: true,
  title: true,
};

type RawNotificationSettings = Partial<NotificationSettings> & {
  /** @deprecated */
  enabled?: boolean;
  /** @deprecated */
  opacity?: number;
  /** @deprecated */
  sensitivity?: number;
};

export function normalizeNotificationSettings(
  raw: RawNotificationSettings | undefined,
): NotificationSettings {
  return {
    desktopEnabled: raw?.desktopEnabled ?? DEFAULT_NOTIF_SETTINGS.desktopEnabled,
    titleChangeEnabled: raw?.titleChangeEnabled ?? DEFAULT_NOTIF_SETTINGS.titleChangeEnabled,
  };
}

export function normalizeChannelPref(
  raw: Partial<ChannelNotifPref> | undefined,
): ChannelNotifPref {
  return {
    live: raw?.live ?? DEFAULT_CHANNEL_PREF.live,
    title: raw?.title ?? DEFAULT_CHANNEL_PREF.title,
  };
}

export function normalizeChannelPrefs(
  raw: ChannelNotifMap | undefined,
): ChannelNotifMap {
  if (!raw || typeof raw !== 'object') return {};
  const next: ChannelNotifMap = {};
  for (const [login, pref] of Object.entries(raw)) {
    const key = login.toLowerCase();
    if (!key) continue;
    next[key] = normalizeChannelPref(pref);
  }
  return next;
}

export function getChannelPref(
  map: ChannelNotifMap,
  login: string,
): ChannelNotifPref {
  return normalizeChannelPref(map[login.toLowerCase()]);
}

export function setChannelPrefInMap(
  map: ChannelNotifMap,
  login: string,
  pref: ChannelNotifPref,
): ChannelNotifMap {
  return {
    ...map,
    [login.toLowerCase()]: normalizeChannelPref(pref),
  };
}

/** Keep only prefs for logins that are still SuperFavs. */
export function pruneChannelPrefs(
  map: ChannelNotifMap,
  favs: string[],
): ChannelNotifMap {
  const favSet = new Set(favs.map((f) => f.toLowerCase()));
  const next: ChannelNotifMap = {};
  for (const [login, pref] of Object.entries(map)) {
    if (favSet.has(login)) next[login] = normalizeChannelPref(pref);
  }
  return next;
}
