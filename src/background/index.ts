// src/background/index.ts
// Service worker: badge, notificaciones de directo y cambios de título.

declare const __API_BASE__: string;

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
import { soundFileFor, type NotifSoundId } from '../lib/notifSounds';

const FAVS_KEY = 'superfavs';
const LIVE_KEY = 'live_logins';
const TITLES_KEY = 'channel_titles';
const NOTIF_MAP_KEY = 'notif_login_map';
const LIVE_INIT_KEY = 'live_logins_initialized';
const TITLES_INIT_KEY = 'channel_titles_initialized';
const LEGACY_REFRESH_ALARM = 'refresh';
const LIVE_POLL_ALARM = 'live-poll';
const TITLE_POLL_ALARM = 'title-poll';
const CLOSE_ALARM_PREFIX = 'close:';
const LIVE_NOTIF_PREFIX = 'live:';
const TITLE_NOTIF_PREFIX = 'title:';
const CLOSE_AFTER_MS = 3 * 60 * 1000;
const TITLE_POLL_MS = 30 * 1000;

interface LiveStream {
  user_login: string;
  user_name: string;
  game_name: string;
  title: string;
}

interface ChannelInfo {
  user_login: string;
  user_name: string;
  title: string;
  game_name: string;
}

type NotifLoginMap = Record<string, string>;
type TitleMap = Record<string, string>;

let pollInFlight = false;

function normalizeTitle(title: string): string {
  return title.trim();
}

function titlesDiffer(oldTitle: string | undefined, newTitle: string): boolean {
  if (oldTitle === undefined) return false;
  return normalizeTitle(oldTitle) !== normalizeTitle(newTitle);
}

function liveNotifId(login: string): string {
  return `${LIVE_NOTIF_PREFIX}${login}`;
}

function titleNotifId(login: string): string {
  return `${TITLE_NOTIF_PREFIX}${login}`;
}

function closeAlarmName(notifId: string): string {
  return `${CLOSE_ALARM_PREFIX}${notifId}`;
}

function loginFromNotifId(id: string): string | null {
  if (id.startsWith(LIVE_NOTIF_PREFIX)) return id.slice(LIVE_NOTIF_PREFIX.length);
  if (id.startsWith(TITLE_NOTIF_PREFIX)) return id.slice(TITLE_NOTIF_PREFIX.length);
  return null;
}

function notifIdFromCloseAlarm(name: string): string | null {
  if (!name.startsWith(CLOSE_ALARM_PREFIX)) return null;
  return name.slice(CLOSE_ALARM_PREFIX.length);
}

async function getFavs(): Promise<string[]> {
  const result = await chrome.storage.sync.get([FAVS_KEY]);
  return result[FAVS_KEY] ?? [];
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

async function pruneChannelNotifPrefs(favs: string[]): Promise<void> {
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

/** Play the chosen toast sound for any desktop notification (live or title). */
async function playNotificationSound(soundId: NotifSoundId): Promise<void> {
  const file = soundFileFor(soundId);
  if (!file) return;

  try {
    await ensureOffscreenDocument();

    // Offscreen may need a moment after createDocument before listeners exist.
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
    // Audio is best-effort; never block the toast.
  }
}

async function showNotification(
  notifId: string,
  login: string,
  title: string,
  message: string,
  soundId: NotifSoundId,
): Promise<void> {
  // Start sound for every toast (directo + título); await so playback begins reliably.
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
  map[notifId] = login;
  await setNotifMap(map);

  await chrome.alarms.create(closeAlarmName(notifId), {
    when: Date.now() + CLOSE_AFTER_MS,
  });
}

async function notifyLive(stream: LiveStream): Promise<void> {
  const settings = await getNotifSettings();
  if (!settings.desktopEnabled) return;

  const login = stream.user_login.toLowerCase();
  const channelPrefs = await getChannelNotifMap();
  if (!getChannelPref(channelPrefs, login).live) return;

  const game = stream.game_name || 'Sin categoría';
  const message = stream.title ? `${game} · ${stream.title}` : game;

  await showNotification(
    liveNotifId(login),
    login,
    `${stream.user_name} está en directo`,
    message,
    settings.soundId,
  );
}

async function notifyTitleChange(channel: ChannelInfo): Promise<void> {
  const settings = await getNotifSettings();
  if (!settings.titleChangeEnabled) return;

  const login = channel.user_login.toLowerCase();
  const channelPrefs = await getChannelNotifMap();
  if (!getChannelPref(channelPrefs, login).title) return;

  const titleText = channel.title.trim() || '(sin título)';
  const game = channel.game_name || 'Sin categoría';
  const message = `${game} · ${titleText}`;

  await showNotification(
    titleNotifId(login),
    login,
    `${channel.user_name} cambió el título`,
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

async function pollStreams(favs: string[]): Promise<void> {
  const res = await fetch(`${__API_BASE__}/api/streams?users=${favs.join(',')}`);
  if (!res.ok) return;

  const data = await res.json();
  const streams: LiveStream[] = data.data ?? [];
  const currentLogins = new Set(streams.map((s) => s.user_login.toLowerCase()));
  const favSet = new Set(favs.map((f) => f.toLowerCase()));

  const local = await chrome.storage.local.get([LIVE_KEY, LIVE_INIT_KEY, TITLES_KEY]);
  const previousLogins = new Set<string>(
    ((local[LIVE_KEY] as string[] | undefined) ?? []).map((l) => l.toLowerCase()),
  );
  const previousTitles = (local[TITLES_KEY] as TitleMap | undefined) ?? {};
  const initialized = local[LIVE_INIT_KEY] === true;
  const titleUpdates: TitleMap = { ...previousTitles };

  if (initialized) {
    for (const stream of streams) {
      const login = stream.user_login.toLowerCase();
      if (!previousLogins.has(login)) {
        await notifyLive(stream);

        if (titlesDiffer(previousTitles[login], stream.title ?? '')) {
          await notifyTitleChange({
            user_login: login,
            user_name: stream.user_name,
            title: stream.title ?? '',
            game_name: stream.game_name,
          });
        }

        titleUpdates[login] = stream.title ?? '';
      }
    }
  } else {
    for (const stream of streams) {
      titleUpdates[stream.user_login.toLowerCase()] = stream.title ?? '';
    }
  }

  for (const login of Object.keys(titleUpdates)) {
    if (!favSet.has(login)) delete titleUpdates[login];
  }

  await updateBadge(streams.length);
  await chrome.storage.local.set({
    [LIVE_KEY]: [...currentLogins],
    [LIVE_INIT_KEY]: true,
    [TITLES_KEY]: titleUpdates,
  });
}

async function pollTitles(favs: string[]): Promise<void> {
  const res = await fetch(`${__API_BASE__}/api/channels?users=${favs.join(',')}`);
  if (!res.ok) return;

  const data = await res.json();
  const channels: ChannelInfo[] = data.data ?? [];
  const favSet = new Set(favs.map((f) => f.toLowerCase()));

  const local = await chrome.storage.local.get([TITLES_KEY, TITLES_INIT_KEY]);
  const previousTitles = (local[TITLES_KEY] as TitleMap | undefined) ?? {};
  const initialized = local[TITLES_INIT_KEY] === true;
  const nextTitles: TitleMap = { ...previousTitles };

  for (const login of Object.keys(nextTitles)) {
    if (!favSet.has(login)) delete nextTitles[login];
  }

  for (const channel of channels) {
    const login = channel.user_login.toLowerCase();
    const newTitle = channel.title ?? '';
    const oldTitle = previousTitles[login];

    if (initialized && titlesDiffer(oldTitle, newTitle)) {
      await notifyTitleChange(channel);
    }

    nextTitles[login] = newTitle;
  }

  await chrome.storage.local.set({
    [TITLES_KEY]: nextTitles,
    [TITLES_INIT_KEY]: true,
  });
}

async function pollLiveOnly(): Promise<void> {
  if (pollInFlight) return;
  pollInFlight = true;
  try {
    const favs = await getFavs();
    if (favs.length === 0) {
      await updateBadge(0);
      await chrome.storage.local.set({
        [LIVE_KEY]: [],
        [LIVE_INIT_KEY]: true,
      });
      return;
    }
    await pollStreams(favs);
  } catch {
    // Sin red: conservar estado previo.
  } finally {
    pollInFlight = false;
  }
}

async function pollTitlesOnly(): Promise<void> {
  if (pollInFlight) return;
  pollInFlight = true;
  try {
    const favs = await getFavs();
    if (favs.length === 0) {
      await chrome.storage.local.set({
        [TITLES_KEY]: {},
        [TITLES_INIT_KEY]: true,
      });
      return;
    }
    await pollTitles(favs);
  } catch {
    // Sin red: conservar estado previo.
  } finally {
    pollInFlight = false;
  }
}

async function poll(): Promise<void> {
  if (pollInFlight) return;
  pollInFlight = true;
  try {
    const favs = await getFavs();

    if (favs.length === 0) {
      await updateBadge(0);
      await chrome.storage.local.set({
        [LIVE_KEY]: [],
        [LIVE_INIT_KEY]: true,
        [TITLES_KEY]: {},
        [TITLES_INIT_KEY]: true,
      });
      return;
    }

    await pollStreams(favs);
    await pollTitles(favs);
  } catch {
    // Sin red: conservar estado previo.
  } finally {
    pollInFlight = false;
  }
}

function scheduleTitlePoll(): void {
  void chrome.alarms.create(TITLE_POLL_ALARM, {
    when: Date.now() + TITLE_POLL_MS,
  });
}

async function schedulePollAlarms(): Promise<void> {
  await chrome.alarms.clear(LEGACY_REFRESH_ALARM);
  await chrome.alarms.clear(LIVE_POLL_ALARM);
  await chrome.alarms.clear(TITLE_POLL_ALARM);
  await chrome.alarms.create(LIVE_POLL_ALARM, { periodInMinutes: 3 });
  scheduleTitlePoll();
}

chrome.runtime.onInstalled.addListener(() => {
  void schedulePollAlarms();
  void poll();
});

chrome.runtime.onStartup.addListener(() => {
  void schedulePollAlarms();
  void poll();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === LIVE_POLL_ALARM) {
    void pollLiveOnly();
    return;
  }
  if (alarm.name === TITLE_POLL_ALARM) {
    void pollTitlesOnly();
    scheduleTitlePoll();
    return;
  }
  const notifId = notifIdFromCloseAlarm(alarm.name);
  if (notifId) void cleanupNotification(notifId);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync' || !changes[FAVS_KEY]) return;
  const nextFavs = (changes[FAVS_KEY].newValue as string[] | undefined) ?? [];
  void pruneChannelNotifPrefs(nextFavs);
  void poll();
});

chrome.notifications.onClicked.addListener((notificationId) => {
  void (async () => {
    const map = await getNotifMap();
    const login = map[notificationId] ?? loginFromNotifId(notificationId);
    if (login) {
      await chrome.tabs.create({ url: `https://twitch.tv/${login}` });
      await cleanupNotification(notificationId);
    }
  })();
});

chrome.notifications.onClosed.addListener((notificationId) => {
  void (async () => {
    const map = await getNotifMap();
    if (map[notificationId] ?? loginFromNotifId(notificationId)) {
      await cleanupNotification(notificationId);
    }
  })();
});
