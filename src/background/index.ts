// src/background/index.ts
// Service worker: badge, notificaciones de directo y cambios de título.

declare const __API_BASE__: string;

import {
  NOTIF_SETTINGS_KEY,
  normalizeNotificationSettings,
  type NotificationSettings,
} from '../lib/notificationSettings';

const FAVS_KEY = 'superfavs';
const LIVE_KEY = 'live_logins';
const TITLES_KEY = 'channel_titles';
const NOTIF_MAP_KEY = 'notif_login_map';
const LIVE_INIT_KEY = 'live_logins_initialized';
const TITLES_INIT_KEY = 'channel_titles_initialized';
const REFRESH_ALARM = 'refresh';
const CLOSE_ALARM_PREFIX = 'close:';
const LIVE_NOTIF_PREFIX = 'live:';
const TITLE_NOTIF_PREFIX = 'title:';
const CLOSE_AFTER_MS = 3 * 60 * 1000;

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

async function cleanupNotification(notifId: string): Promise<void> {
  await chrome.notifications.clear(notifId);
  await chrome.alarms.clear(closeAlarmName(notifId));
  const map = await getNotifMap();
  if (map[notifId]) {
    delete map[notifId];
    await setNotifMap(map);
  }
}

async function showNotification(
  notifId: string,
  login: string,
  title: string,
  message: string,
): Promise<void> {
  await chrome.notifications.create(notifId, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 2,
    requireInteraction: true,
  });

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
  const game = stream.game_name || 'Sin categoría';
  const message = stream.title ? `${game} · ${stream.title}` : game;

  await showNotification(
    liveNotifId(login),
    login,
    `${stream.user_name} está en directo`,
    message,
  );
}

async function notifyTitleChange(channel: ChannelInfo): Promise<void> {
  const settings = await getNotifSettings();
  if (!settings.titleChangeEnabled) return;

  const login = channel.user_login.toLowerCase();
  const titleText = channel.title.trim() || '(sin título)';
  const game = channel.game_name || 'Sin categoría';
  const message = `${game} · ${titleText}`;

  await showNotification(
    titleNotifId(login),
    login,
    `${channel.user_name} cambió el título`,
    message,
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

  const local = await chrome.storage.local.get([LIVE_KEY, LIVE_INIT_KEY]);
  const previousLogins = new Set<string>(
    ((local[LIVE_KEY] as string[] | undefined) ?? []).map((l) => l.toLowerCase()),
  );
  const initialized = local[LIVE_INIT_KEY] === true;

  if (initialized) {
    for (const stream of streams) {
      const login = stream.user_login.toLowerCase();
      if (!previousLogins.has(login)) {
        await notifyLive(stream);
      }
    }
  }

  await updateBadge(streams.length);
  await chrome.storage.local.set({
    [LIVE_KEY]: [...currentLogins],
    [LIVE_INIT_KEY]: true,
  });
}

async function pollTitles(favs: string[]): Promise<void> {
  const res = await fetch(`${__API_BASE__}/api/channels?users=${favs.join(',')}`);
  if (!res.ok) return;

  const data = await res.json();
  const channels: ChannelInfo[] = data.data ?? [];

  const local = await chrome.storage.local.get([TITLES_KEY, TITLES_INIT_KEY]);
  const previousTitles = (local[TITLES_KEY] as TitleMap | undefined) ?? {};
  const initialized = local[TITLES_INIT_KEY] === true;
  const nextTitles: TitleMap = {};

  for (const channel of channels) {
    const login = channel.user_login.toLowerCase();
    const newTitle = channel.title ?? '';
    const oldTitle = previousTitles[login];

    if (initialized && oldTitle !== undefined && oldTitle !== newTitle) {
      await notifyTitleChange(channel);
    }

    nextTitles[login] = newTitle;
  }

  await chrome.storage.local.set({
    [TITLES_KEY]: nextTitles,
    [TITLES_INIT_KEY]: true,
  });
}

async function poll(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get([FAVS_KEY]);
    const favs: string[] = result[FAVS_KEY] ?? [];

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
  }
}

function scheduleRefreshAlarm(): void {
  void chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: 1 });
}

chrome.runtime.onInstalled.addListener(() => {
  scheduleRefreshAlarm();
  void poll();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleRefreshAlarm();
  void poll();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REFRESH_ALARM) {
    void poll();
    return;
  }
  const notifId = notifIdFromCloseAlarm(alarm.name);
  if (notifId) void cleanupNotification(notifId);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[FAVS_KEY]) void poll();
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
