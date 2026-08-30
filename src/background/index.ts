// src/background/index.ts
// Service worker: badge, notificaciones de directo y cambios de título (Twitch + Kick).

declare const __API_BASE__: string;

import {
  FAVS_KEY,
  channelUrl,
  favKey,
  favKeyOf,
  loginsForPlatform,
  needsFavMigration,
  normalizeFavs,
  parseFavKey,
  type FavEntry,
  type Platform,
} from '../lib/favorites';
import {
  CHANNEL_NOTIF_KEY,
  NOTIF_SETTINGS_KEY,
  getChannelPref,
  normalizeChannelPrefs,
  normalizeNotificationSettings,
  pruneChannelPrefs,
  type ChannelNotifMap,
  type NotificationSettings,
} from '../lib/notificationSettings';
import { LOCALE_KEY, loadStoredLocale, t, type LocaleId } from '../lib/i18n';
import { soundFileFor, type NotifSoundId } from '../lib/notifSounds';
import { fetchKickChannels, fetchKickStreams } from '../lib/kickApi';

let cachedLocale: LocaleId = 'es';

async function refreshLocale(): Promise<LocaleId> {
  cachedLocale = await loadStoredLocale();
  return cachedLocale;
}

const LIVE_KEY = 'live_keys';
const LEGACY_LIVE_KEY = 'live_logins';
const TITLES_KEY = 'channel_titles';
const NOTIF_MAP_KEY = 'notif_login_map';
const LIVE_INIT_KEY = 'live_logins_initialized';
const TITLES_INIT_KEY = 'channel_titles_initialized';
const LIVE_NOTIF_AT_KEY = 'live_notif_at';
const LEGACY_REFRESH_ALARM = 'refresh';
const LIVE_POLL_ALARM = 'live-poll';
const TITLE_POLL_ALARM = 'title-poll';
const CLOSE_ALARM_PREFIX = 'close:';
const LIVE_NOTIF_PREFIX = 'live:';
const TITLE_NOTIF_PREFIX = 'title:';
const CLOSE_AFTER_MS = 3 * 60 * 1000;
const LIVE_POLL_MINUTES = 1;
const FETCH_TIMEOUT_MS = 12_000;
const LIVE_NOTIF_COOLDOWN_MS = 45 * 60 * 1000;

interface LiveStream {
  platform: Platform;
  user_login: string;
  user_name: string;
  game_name: string;
  title: string;
}

interface ChannelInfo {
  platform: Platform;
  user_login: string;
  user_name: string;
  title: string;
  game_name: string;
}

type NotifLoginMap = Record<string, string>;
type TitleMap = Record<string, string>;

let pollInFlight = false;
let pollQueued = false;

function normalizeTitle(title: string): string {
  return title.trim();
}

function titlesDiffer(oldTitle: string | undefined, newTitle: string): boolean {
  if (oldTitle === undefined) return false;
  return normalizeTitle(oldTitle) !== normalizeTitle(newTitle);
}

function streamKey(stream: { platform: Platform; user_login: string }): string {
  return favKey(stream.platform, stream.user_login);
}

function liveNotifId(key: string): string {
  return `${LIVE_NOTIF_PREFIX}${key}`;
}

function titleNotifId(key: string): string {
  return `${TITLE_NOTIF_PREFIX}${key}`;
}

function closeAlarmName(notifId: string): string {
  return `${CLOSE_ALARM_PREFIX}${notifId}`;
}

function keyFromNotifId(id: string): string | null {
  if (id.startsWith(LIVE_NOTIF_PREFIX)) return id.slice(LIVE_NOTIF_PREFIX.length);
  if (id.startsWith(TITLE_NOTIF_PREFIX)) return id.slice(TITLE_NOTIF_PREFIX.length);
  return null;
}

function notifIdFromCloseAlarm(name: string): string | null {
  if (!name.startsWith(CLOSE_ALARM_PREFIX)) return null;
  return name.slice(CLOSE_ALARM_PREFIX.length);
}

async function getFavs(): Promise<FavEntry[]> {
  const result = await chrome.storage.sync.get([FAVS_KEY]);
  const raw = result[FAVS_KEY];
  const favs = normalizeFavs(raw);
  if (needsFavMigration(raw)) {
    await chrome.storage.sync.set({ [FAVS_KEY]: favs });
  }
  return favs;
}

async function getNotifMap(): Promise<NotifLoginMap> {
  const result = await chrome.storage.local.get([NOTIF_MAP_KEY]);
  return (result[NOTIF_MAP_KEY] as NotifLoginMap | undefined) ?? {};
}

async function setNotifMap(map: NotifLoginMap): Promise<void> {
  await chrome.storage.local.set({ [NOTIF_MAP_KEY]: map });
}

async function getNotifSettings(): Promise<NotificationSettings> {
  const result = await chrome.storage.sync.get([NOTIF_SETTINGS_KEY]);
  return normalizeNotificationSettings(
    result[NOTIF_SETTINGS_KEY] as Partial<NotificationSettings> | undefined,
  );
}

async function getChannelNotifMap(): Promise<ChannelNotifMap> {
  const result = await chrome.storage.sync.get([CHANNEL_NOTIF_KEY]);
  return normalizeChannelPrefs(result[CHANNEL_NOTIF_KEY] as ChannelNotifMap | undefined);
}

async function pruneChannelNotifPrefs(favs: FavEntry[]): Promise<void> {
  const map = await getChannelNotifMap();
  const pruned = pruneChannelPrefs(map, favs);
  if (Object.keys(pruned).length === Object.keys(map).length) {
    const same = Object.keys(pruned).every(
      (k) => pruned[k]?.live === map[k]?.live && pruned[k]?.title === map[k]?.title,
    );
    if (same) return;
  }
  await chrome.storage.sync.set({ [CHANNEL_NOTIF_KEY]: pruned });
}

async function cleanupNotification(notifId: string): Promise<void> {
  await chrome.notifications.clear(notifId);
  await chrome.alarms.clear(closeAlarmName(notifId));
  const map = await getNotifMap();
  if (map[notifId]) {
    delete map[notifId];
    await setNotifMap(map);
  }
}

async function ensureOffscreenDocument(): Promise<void> {
  const offscreen = chrome.offscreen as typeof chrome.offscreen & {
    hasDocument?: () => Promise<boolean>;
  };

  if (typeof offscreen.hasDocument === 'function') {
    if (await offscreen.hasDocument()) return;
  } else {
    const contexts = (await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
    })) as chrome.runtime.ExtensionContext[];
    if (contexts.length > 0) return;
  }

  await offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK' as chrome.offscreen.Reason],
    justification: 'Reproduce el sonido personalizado del aviso de SuperFav',
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function playNotificationSound(soundId: NotifSoundId): Promise<void> {
  const file = soundFileFor(soundId);
  if (!file) return;

  try {
    await ensureOffscreenDocument();
    let lastError: unknown;
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        await chrome.runtime.sendMessage({ type: 'superfav-play-sound', file });
        return;
      } catch (err) {
        lastError = err;
        await delay(40 * (attempt + 1));
      }
    }
    void lastError;
  } catch {
    // Audio is best-effort.
  }
}

async function showNotification(
  notifId: string,
  key: string,
  title: string,
  message: string,
  soundId: NotifSoundId,
): Promise<void> {
  const soundPromise = playNotificationSound(soundId);

  await chrome.notifications.create(notifId, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 2,
    requireInteraction: true,
    silent: true,
  });

  await soundPromise;

  const map = await getNotifMap();
  map[notifId] = key;
  await setNotifMap(map);

  await chrome.alarms.create(closeAlarmName(notifId), {
    when: Date.now() + CLOSE_AFTER_MS,
  });
}

async function notifyLive(stream: LiveStream): Promise<void> {
  const settings = await getNotifSettings();
  if (!settings.desktopEnabled) return;

  const key = streamKey(stream);
  const channelPrefs = await getChannelNotifMap();
  if (!getChannelPref(channelPrefs, key).live) return;

  const locale = await refreshLocale();
  const game = stream.game_name || t(locale, 'noCategory');
  const message = stream.title ? `${game} · ${stream.title}` : game;

  await showNotification(
    liveNotifId(key),
    key,
    t(locale, 'notifLive', { name: stream.user_name }),
    message,
    settings.soundId,
  );
}

async function notifyTitleChange(channel: ChannelInfo): Promise<void> {
  const settings = await getNotifSettings();
  if (!settings.titleChangeEnabled) return;

  const key = streamKey(channel);
  const channelPrefs = await getChannelNotifMap();
  if (!getChannelPref(channelPrefs, key).title) return;

  const locale = await refreshLocale();
  const titleText = channel.title.trim() || t(locale, 'noTitle');
  const game = channel.game_name || t(locale, 'noCategory');
  const message = `${game} · ${titleText}`;

  await showNotification(
    titleNotifId(key),
    key,
    t(locale, 'notifTitleChange', { name: channel.user_name }),
    message,
    settings.soundId,
  );
}

async function updateBadge(count: number): Promise<void> {
  if (count > 0) {
    await chrome.action.setBadgeText({ text: String(count) });
    await chrome.action.setBadgeBackgroundColor({ color: '#E81212' });
    await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}

async function syncLiveState(liveKeys: string[]): Promise<void> {
  const normalized = [
    ...new Set(
      liveKeys
        .map((k) => k.trim().toLowerCase())
        .filter((k) => parseFavKey(k) != null),
    ),
  ];
  await updateBadge(normalized.length);
  await chrome.storage.local.set({
    [LIVE_KEY]: normalized,
    [LEGACY_LIVE_KEY]: normalized.map((k) => parseFavKey(k)?.login ?? k),
    [LIVE_INIT_KEY]: true,
  });
}

type FetchResult<T> = { ok: true; data: T[] } | { ok: false };

function fetchTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { signal: ctrl.signal, cache: 'no-store' }).finally(() =>
    clearTimeout(timer),
  );
}

function platformOfKey(key: string): Platform | null {
  return parseFavKey(key)?.platform ?? null;
}

async function markLiveNotified(key: string): Promise<void> {
  const local = await chrome.storage.local.get(LIVE_NOTIF_AT_KEY);
  const map = { ...((local[LIVE_NOTIF_AT_KEY] as Record<string, number> | undefined) ?? {}) };
  map[key] = Date.now();
  await chrome.storage.local.set({ [LIVE_NOTIF_AT_KEY]: map });
}

async function pruneLiveNotifAt(offlineKeys: string[]): Promise<void> {
  if (offlineKeys.length === 0) return;
  const local = await chrome.storage.local.get(LIVE_NOTIF_AT_KEY);
  const map = { ...((local[LIVE_NOTIF_AT_KEY] as Record<string, number> | undefined) ?? {}) };
  let changed = false;
  for (const key of offlineKeys) {
    if (map[key] != null) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) await chrome.storage.local.set({ [LIVE_NOTIF_AT_KEY]: map });
}

async function liveNotifOnCooldown(key: string): Promise<boolean> {
  const local = await chrome.storage.local.get(LIVE_NOTIF_AT_KEY);
  const map = (local[LIVE_NOTIF_AT_KEY] as Record<string, number> | undefined) ?? {};
  const at = map[key] ?? 0;
  return at > 0 && Date.now() - at < LIVE_NOTIF_COOLDOWN_MS;
}

async function fetchPlatformStreams(
  platform: Platform,
  logins: string[],
): Promise<FetchResult<LiveStream>> {
  if (logins.length === 0) return { ok: true, data: [] };
  const favSet = new Set(logins);

  const mapRows = (rows: LiveStream[], forced?: Platform): LiveStream[] =>
    rows
      .map((s) => ({
        ...s,
        platform: forced ?? s.platform ?? platform,
        user_login: s.user_login.toLowerCase(),
      }))
      .filter((s) => favSet.has(s.user_login));

  if (platform === 'kick') {
    try {
      const res = await fetchTimeout(
        `${__API_BASE__}/api/kick/streams?users=${logins.join(',')}`,
      );
      if (res.ok) {
        const data = await res.json();
        const rows = mapRows((data.data ?? []) as LiveStream[], 'kick');
        if (rows.length > 0) return { ok: true, data: rows };
      }
    } catch {
      /* fall through to browser Kick fetch */
    }
    try {
      const rows = (await fetchKickStreams(logins)).filter((s) =>
        favSet.has(s.user_login.toLowerCase()),
      );
      return { ok: true, data: rows };
    } catch {
      return { ok: false };
    }
  }

  try {
    const res = await fetchTimeout(
      `${__API_BASE__}/api/streams?users=${logins.join(',')}`,
    );
    if (!res.ok) return { ok: false };
    const data = await res.json();
    if (!Array.isArray(data.data)) return { ok: false };
    return { ok: true, data: mapRows(data.data as LiveStream[]) };
  } catch {
    return { ok: false };
  }
}

async function fetchPlatformChannels(
  platform: Platform,
  logins: string[],
): Promise<FetchResult<ChannelInfo>> {
  if (logins.length === 0) return { ok: true, data: [] };

  if (platform === 'kick') {
    try {
      const res = await fetchTimeout(
        `${__API_BASE__}/api/kick/channels?users=${logins.join(',')}`,
      );
      if (res.ok) {
        const data = await res.json();
        const rows = ((data.data ?? []) as ChannelInfo[]).map((c) => ({
          ...c,
          platform: 'kick' as const,
          user_login: c.user_login.toLowerCase(),
        }));
        if (rows.length > 0) return { ok: true, data: rows };
      }
    } catch {
      /* fall through */
    }
    try {
      return { ok: true, data: await fetchKickChannels(logins) };
    } catch {
      return { ok: false };
    }
  }

  try {
    const res = await fetchTimeout(
      `${__API_BASE__}/api/channels?users=${logins.join(',')}`,
    );
    if (!res.ok) return { ok: false };
    const data = await res.json();
    if (!Array.isArray(data.data)) return { ok: false };
    return {
      ok: true,
      data: (data.data as ChannelInfo[]).map((c) => ({
        ...c,
        platform: c.platform ?? platform,
        user_login: c.user_login.toLowerCase(),
      })),
    };
  } catch {
    return { ok: false };
  }
}

async function pollStreams(favs: FavEntry[]): Promise<Set<string>> {
  const justWentLive = new Set<string>();
  const twitchLogins = loginsForPlatform(favs, 'twitch');
  const kickLogins = loginsForPlatform(favs, 'kick');
  const [twitchRes, kickRes] = await Promise.all([
    fetchPlatformStreams('twitch', twitchLogins),
    fetchPlatformStreams('kick', kickLogins),
  ]);

  const twitchNeeded = twitchLogins.length > 0;
  const kickNeeded = kickLogins.length > 0;
  if ((twitchNeeded && !twitchRes.ok) && (kickNeeded && !kickRes.ok)) return justWentLive;
  if (twitchNeeded && !twitchRes.ok && !kickNeeded) return justWentLive;
  if (kickNeeded && !kickRes.ok && !twitchNeeded) return justWentLive;

  const twitchStreams = twitchRes.ok ? twitchRes.data : [];
  const kickStreams = kickRes.ok ? kickRes.data : [];
  const fetchedStreams = [...twitchStreams, ...kickStreams];
  const favKeySet = new Set(favs.map(favKeyOf));

  const local = await chrome.storage.local.get([
    LIVE_KEY,
    LEGACY_LIVE_KEY,
    LIVE_INIT_KEY,
    TITLES_KEY,
  ]);
  const previousRaw =
    (local[LIVE_KEY] as string[] | undefined) ??
    ((local[LEGACY_LIVE_KEY] as string[] | undefined) ?? []).map((l) => `twitch:${l}`);
  const previousKeys = new Set(previousRaw.map((k) => k.toLowerCase()));
  const previousTitles = (local[TITLES_KEY] as TitleMap | undefined) ?? {};
  const initialized = local[LIVE_INIT_KEY] === true;
  const titleUpdates: TitleMap = { ...previousTitles };

  const nextKeys = new Set<string>();
  for (const key of previousKeys) {
    const plat = platformOfKey(key);
    if (plat === 'twitch' && !twitchRes.ok) nextKeys.add(key);
    if (plat === 'kick' && !kickRes.ok) nextKeys.add(key);
  }
  for (const stream of fetchedStreams) nextKeys.add(streamKey(stream));

  if (initialized) {
    for (const stream of fetchedStreams) {
      const key = streamKey(stream);
      if (previousKeys.has(key)) {
        titleUpdates[key] = stream.title ?? '';
        continue;
      }
      if (await liveNotifOnCooldown(key)) {
        titleUpdates[key] = stream.title ?? '';
        continue;
      }
      await notifyLive(stream);
      await markLiveNotified(key);
      justWentLive.add(key);
      titleUpdates[key] = stream.title ?? '';
    }
  } else {
    for (const stream of fetchedStreams) {
      titleUpdates[streamKey(stream)] = stream.title ?? '';
    }
  }

  const confirmedOffline: string[] = [];
  for (const key of previousKeys) {
    if (nextKeys.has(key)) continue;
    const plat = platformOfKey(key);
    if (plat === 'twitch' && twitchRes.ok) confirmedOffline.push(key);
    if (plat === 'kick' && kickRes.ok) confirmedOffline.push(key);
  }
  await pruneLiveNotifAt(confirmedOffline);

  for (const key of Object.keys(titleUpdates)) {
    if (!favKeySet.has(key)) delete titleUpdates[key];
  }

  await syncLiveState([...nextKeys]);
  await chrome.storage.local.set({
    [TITLES_KEY]: titleUpdates,
  });
  return justWentLive;
}

async function pollTitles(favs: FavEntry[], skipKeys: Set<string>): Promise<void> {
  const twitchLogins = loginsForPlatform(favs, 'twitch');
  const kickLogins = loginsForPlatform(favs, 'kick');
  const [twitchRes, kickRes] = await Promise.all([
    fetchPlatformChannels('twitch', twitchLogins),
    fetchPlatformChannels('kick', kickLogins),
  ]);

  const twitchNeeded = twitchLogins.length > 0;
  const kickNeeded = kickLogins.length > 0;
  if ((twitchNeeded && !twitchRes.ok) && (kickNeeded && !kickRes.ok)) return;
  if (twitchNeeded && !twitchRes.ok && !kickNeeded) return;
  if (kickNeeded && !kickRes.ok && !twitchNeeded) return;

  const channels = [
    ...(twitchRes.ok ? twitchRes.data : []),
    ...(kickRes.ok ? kickRes.data : []),
  ];
  const favKeySet = new Set(favs.map(favKeyOf));

  const local = await chrome.storage.local.get([TITLES_KEY, TITLES_INIT_KEY]);
  const previousTitles = (local[TITLES_KEY] as TitleMap | undefined) ?? {};
  const initialized = local[TITLES_INIT_KEY] === true;
  const nextTitles: TitleMap = { ...previousTitles };

  for (const key of Object.keys(nextTitles)) {
    if (!favKeySet.has(key)) delete nextTitles[key];
  }

  for (const channel of channels) {
    const key = streamKey(channel);
    const newTitle = channel.title ?? '';
    const oldTitle = previousTitles[key] ?? previousTitles[channel.user_login];

    if (
      initialized &&
      !skipKeys.has(key) &&
      titlesDiffer(oldTitle, newTitle)
    ) {
      await notifyTitleChange(channel);
    }

    nextTitles[key] = newTitle;
    if (previousTitles[channel.user_login] !== undefined) {
      delete nextTitles[channel.user_login];
    }
  }

  await chrome.storage.local.set({
    [TITLES_KEY]: nextTitles,
    [TITLES_INIT_KEY]: true,
  });
}

async function poll(): Promise<void> {
  if (pollInFlight) {
    pollQueued = true;
    return;
  }
  pollInFlight = true;
  try {
    const favs = await getFavs();

    if (favs.length === 0) {
      await syncLiveState([]);
      await chrome.storage.local.set({
        [TITLES_KEY]: {},
        [TITLES_INIT_KEY]: true,
      });
      return;
    }

    const justWentLive = await pollStreams(favs);
    await pollTitles(favs, justWentLive);
  } catch {
    // Sin red: conservar estado previo.
  } finally {
    pollInFlight = false;
    if (pollQueued) {
      pollQueued = false;
      void poll();
    }
  }
}

async function schedulePollAlarms(): Promise<void> {
  await chrome.alarms.clear(LEGACY_REFRESH_ALARM);
  await chrome.alarms.clear(TITLE_POLL_ALARM);
  await chrome.alarms.clear(LIVE_POLL_ALARM);
  await chrome.alarms.create(LIVE_POLL_ALARM, { periodInMinutes: LIVE_POLL_MINUTES });
}

chrome.runtime.onInstalled.addListener(() => {
  void refreshLocale();
  void schedulePollAlarms();
  void poll();
});

chrome.runtime.onStartup.addListener(() => {
  void refreshLocale();
  void schedulePollAlarms();
  void poll();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === LIVE_POLL_ALARM || alarm.name === TITLE_POLL_ALARM) {
    void poll();
    return;
  }
  const notifId = notifIdFromCloseAlarm(alarm.name);
  if (notifId) void cleanupNotification(notifId);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;
  if ((message as { type?: string }).type !== 'superfav-sync-live') return false;

  const raw = (message as { keys?: unknown; logins?: unknown }).keys
    ?? (message as { logins?: unknown }).logins;
  const keys = Array.isArray(raw)
    ? raw.filter((l): l is string => typeof l === 'string')
    : [];

  void syncLiveState(keys).then(() => sendResponse({ ok: true }));
  return true;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes[LOCALE_KEY]) {
    void refreshLocale();
  }
  if (!changes[FAVS_KEY]) return;
  const nextFavs = normalizeFavs(changes[FAVS_KEY].newValue);
  void pruneChannelNotifPrefs(nextFavs);
  void poll();
});

chrome.notifications.onClicked.addListener((notificationId) => {
  void (async () => {
    const map = await getNotifMap();
    const key = map[notificationId] ?? keyFromNotifId(notificationId);
    if (!key) return;
    const fav = parseFavKey(key) ?? { platform: 'twitch' as const, login: key };
    await chrome.tabs.create({ url: channelUrl(fav.platform, fav.login) });
    await cleanupNotification(notificationId);
  })();
});

chrome.notifications.onClosed.addListener((notificationId) => {
  void (async () => {
    const map = await getNotifMap();
    if (map[notificationId] ?? keyFromNotifId(notificationId)) {
      await cleanupNotification(notificationId);
    }
  })();
});
