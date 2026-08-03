import {
  DEFAULT_SOUND_ID,
  normalizeSoundId,
  type NotifSoundId,
} from './notifSounds';
import {
  favKeyOf,
  normalizeLogin,
  parseFavKey,
  type FavEntry,
} from './favorites';

export const NOTIF_SETTINGS_KEY = 'superfav_notif_settings';
export const CHANNEL_NOTIF_KEY = 'superfav_channel_notif';

export type NotificationSettings = {
  desktopEnabled: boolean;
  titleChangeEnabled: boolean;
  soundId: NotifSoundId;
};

export type ChannelNotifPref = {
  live: boolean;
  title: boolean;
};

export type ChannelNotifMap = Record<string, ChannelNotifPref>;

export const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  desktopEnabled: true,
  titleChangeEnabled: true,
  soundId: DEFAULT_SOUND_ID,
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
    soundId: normalizeSoundId(raw?.soundId),
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

/**
 * Normalize channel prefs. Legacy keys were bare Twitch logins;
 * migrate them to `twitch:login`.
 */
export function normalizeChannelPrefs(
  raw: ChannelNotifMap | undefined,
): ChannelNotifMap {
  if (!raw || typeof raw !== 'object') return {};
  const next: ChannelNotifMap = {};
  for (const [key, pref] of Object.entries(raw)) {
    const parsed = parseFavKey(key);
    const normalizedKey = parsed
      ? favKeyOf(parsed)
      : `twitch:${normalizeLogin(key)}`;
    if (!normalizedKey.endsWith(':') && normalizedKey.includes(':')) {
      next[normalizedKey] = normalizeChannelPref(pref);
    }
  }
  return next;
}

export function getChannelPref(
  map: ChannelNotifMap,
  keyOrLogin: string,
  platform?: FavEntry['platform'],
): ChannelNotifPref {
  const key =
    platform != null
      ? `${platform}:${normalizeLogin(keyOrLogin)}`
      : parseFavKey(keyOrLogin)
        ? keyOrLogin.toLowerCase()
        : `twitch:${normalizeLogin(keyOrLogin)}`;
  return normalizeChannelPref(map[key]);
}

export function setChannelPrefInMap(
  map: ChannelNotifMap,
  key: string,
  pref: ChannelNotifPref,
): ChannelNotifMap {
  const parsed = parseFavKey(key);
  const normalized = parsed ? favKeyOf(parsed) : `twitch:${normalizeLogin(key)}`;
  return {
    ...map,
    [normalized]: normalizeChannelPref(pref),
  };
}

/** Keep only prefs for SuperFavs that still exist. */
export function pruneChannelPrefs(
  map: ChannelNotifMap,
  favs: FavEntry[],
): ChannelNotifMap {
  const favSet = new Set(favs.map(favKeyOf));
  const next: ChannelNotifMap = {};
  for (const [key, pref] of Object.entries(map)) {
    if (favSet.has(key)) next[key] = normalizeChannelPref(pref);
  }
  return next;
}
