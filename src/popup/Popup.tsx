// src/popup/Popup.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LOCALE_KEY,
  LOCALE_OPTIONS,
  loadStoredLocale,
  saveLocale,
  soundLabelKey,
  t,
  type LocaleId,
} from '../lib/i18n';
import {
  CHANNEL_NOTIF_KEY,
  DEFAULT_NOTIF_SETTINGS,
  NOTIF_SETTINGS_KEY,
  getChannelPref,
  normalizeChannelPrefs,
  normalizeNotificationSettings,
  pruneChannelPrefs,
  setChannelPrefInMap,
  type ChannelNotifMap,
  type ChannelNotifPref,
  type NotificationSettings,
} from '../lib/notificationSettings';
import {
  SOUND_OPTIONS,
  soundFileFor,
  type NotifSoundId,
} from '../lib/notifSounds';

declare const __API_BASE__: string;
const API_BASE = __API_BASE__;

interface Stream {
  id: string;
  user_login: string;
  user_name: string;
  game_name: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string;
}

type Status = 'loading' | 'ready' | 'error';

const formatViewers = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);

function Diamond({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12l4 6-10 13L2 9Z" />
      <path d="M11 3 8 9l4 13 4-13-3-6" />
      <path d="M2 9h20" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function MiniToggle({
  checked,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? 'bg-sf-accent' : 'bg-white/15'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
  ariaLabel,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="cursor-pointer text-[11px] font-medium text-sf-text">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={onChange}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-sf-accent' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function Popup() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [hasFavs, setHasFavs] = useState(false);
  const [favs, setFavs] = useState<string[]>([]);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIF_SETTINGS);
  const [channelPrefs, setChannelPrefs] = useState<ChannelNotifMap>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefHint, setPrefHint] = useState<string | null>(null);
  const [locale, setLocale] = useState<LocaleId>('es');

  useEffect(() => {
    void loadStoredLocale().then(setLocale);
  }, []);

  useEffect(() => {
    const onStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'sync' || !changes[LOCALE_KEY]) return;
      const next = changes[LOCALE_KEY].newValue;
      if (typeof next === 'string') setLocale(next as LocaleId);
    };
    chrome.storage.onChanged.addListener(onStorageChange);
    return () => chrome.storage.onChanged.removeListener(onStorageChange);
  }, []);

  const handleLocaleChange = useCallback((next: LocaleId) => {
    setLocale(next);
    void saveLocale(next);
    setPrefHint(null);
  }, []);

  const load = useCallback(() => {
    setStatus('loading');
    chrome.storage.sync.get(['superfavs'], async (result) => {
      const nextFavs: string[] = result.superfavs ?? [];
      setFavs(nextFavs);
      setHasFavs(nextFavs.length > 0);
      if (nextFavs.length === 0) {
        setStreams([]);
        setStatus('ready');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/streams?users=${nextFavs.join(',')}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const live: Stream[] = (data.data ?? []).sort(
          (a: Stream, b: Stream) => b.viewer_count - a.viewer_count,
        );
        setStreams(live);
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    chrome.storage.sync.get([NOTIF_SETTINGS_KEY, CHANNEL_NOTIF_KEY, 'superfavs'], (res) => {
      setNotifSettings(
        normalizeNotificationSettings(res[NOTIF_SETTINGS_KEY] as Partial<NotificationSettings> | undefined),
      );
      const prefs = normalizeChannelPrefs(res[CHANNEL_NOTIF_KEY] as ChannelNotifMap | undefined);
      const storedFavs: string[] = res.superfavs ?? [];
      setFavs(storedFavs);
      setChannelPrefs(pruneChannelPrefs(prefs, storedFavs));
    });
  }, []);

  const persistNotifSettings = useCallback((next: NotificationSettings) => {
    setNotifSettings(next);
    void chrome.storage.sync.set({ [NOTIF_SETTINGS_KEY]: next });
    setPrefHint(null);
  }, []);

  const persistChannelPrefs = useCallback((next: ChannelNotifMap) => {
    setChannelPrefs(next);
    void chrome.storage.sync.set({ [CHANNEL_NOTIF_KEY]: next });
  }, []);

  const sortedFavs = useMemo(
    () => [...favs].map((f) => f.toLowerCase()).sort((a, b) => a.localeCompare(b)),
    [favs],
  );

  const toggleChannelPref = useCallback(
    (login: string, key: keyof ChannelNotifPref) => {
      const current = getChannelPref(channelPrefs, login);
      const turningOn = !current[key];

      if (turningOn) {
        const globalLiveOff = !notifSettings.desktopEnabled;
        const globalTitleOff = !notifSettings.titleChangeEnabled;

        if (key === 'live' && globalLiveOff) {
          if (globalLiveOff && globalTitleOff) {
            setPrefHint(t(locale, 'hintLiveGlobalOff'));
          } else {
            setPrefHint(t(locale, 'hintLiveNeedGlobal'));
          }
          return;
        }

        if (key === 'title' && globalTitleOff) {
          if (globalLiveOff && globalTitleOff) {
            setPrefHint(t(locale, 'hintTitleGlobalOff'));
          } else {
            setPrefHint(t(locale, 'hintTitleNeedGlobal'));
          }
          return;
        }
      }

      setPrefHint(null);
      const nextPref: ChannelNotifPref = { ...current, [key]: !current[key] };
      persistChannelPrefs(setChannelPrefInMap(channelPrefs, login, nextPref));
    },
    [channelPrefs, locale, notifSettings, persistChannelPrefs],
  );

  const openStream = (login: string) => {
    const url = `https://twitch.tv/${login}`;
    if (chrome.tabs?.create) chrome.tabs.create({ url });
    else window.open(url, '_blank');
  };

  return (
    <div className="sf-popup-shell w-[360px]">
      <div className="sf-popup-inner select-none font-sans text-sf-text">
        <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sf-accent/15 text-sf-accent">
              <Diamond className="h-4 w-4" />
            </span>
            <h1 className="text-sm font-semibold tracking-tight">
              SuperFav <span className="font-normal text-white/40">for Twitch</span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSettingsOpen((open) => !open);
                setPrefHint(null);
              }}
              aria-label={settingsOpen ? t(locale, 'gearBack') : t(locale, 'gearManage')}
              aria-expanded={settingsOpen}
              title={t(locale, 'gearTitle')}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                settingsOpen
                  ? 'bg-sf-accent/20 text-sf-accent'
                  : 'text-sf-muted hover:bg-white/[0.06] hover:text-sf-text'
              }`}
            >
              <GearIcon className="h-4 w-4" />
            </button>
            {!settingsOpen && (
              <button
                type="button"
                onClick={load}
                disabled={status === 'loading'}
                aria-label={t(locale, 'refresh')}
                title={t(locale, 'refreshTitle')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-sf-muted transition-colors hover:bg-white/[0.06] hover:text-sf-text disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshIcon
                  className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`}
                />
              </button>
            )}
            {!settingsOpen && status === 'ready' && streams.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2 py-1 text-xs font-medium text-sf-muted">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                {t(locale, 'liveCount', { n: streams.length })}
              </span>
            )}
          </div>
        </header>

        <section className="space-y-1.5 border-b border-white/[0.06] px-3 py-2">
          <ToggleRow
            id="desktop-notif-toggle"
            label={t(locale, 'desktopToggle')}
            checked={notifSettings.desktopEnabled}
            ariaLabel={t(locale, 'desktopToggleAria')}
            onChange={() =>
              persistNotifSettings({
                ...notifSettings,
                desktopEnabled: !notifSettings.desktopEnabled,
              })
            }
          />
          <ToggleRow
            id="title-change-toggle"
            label={t(locale, 'titleToggle')}
            checked={notifSettings.titleChangeEnabled}
            ariaLabel={t(locale, 'titleToggleAria')}
            onChange={() =>
              persistNotifSettings({
                ...notifSettings,
                titleChangeEnabled: !notifSettings.titleChangeEnabled,
              })
            }
          />
        </section>

        <main className="sf-scroll max-h-[460px] min-h-[260px] overflow-y-auto p-3">
          {settingsOpen ? (
            <ChannelSettingsView
              locale={locale}
              favs={sortedFavs}
              channelPrefs={channelPrefs}
              soundId={notifSettings.soundId}
              hint={prefHint}
              onToggle={toggleChannelPref}
              onLocaleChange={handleLocaleChange}
              onSoundChange={(soundId) =>
                persistNotifSettings({ ...notifSettings, soundId })
              }
            />
          ) : (
            <>
              {status === 'loading' && <Preloader locale={locale} />}
              {status === 'error' && <ErrorState locale={locale} onRetry={load} />}
              {status === 'ready' && streams.length === 0 && (
                <EmptyState locale={locale} hasFavs={hasFavs} />
              )}
              {status === 'ready' && streams.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {streams.map((s, i) => (
                    <li key={s.id}>
                      <button
                        onClick={() => openStream(s.user_login)}
                        style={{ animationDelay: `${i * 45}ms` }}
                        className="sf-card flex w-full items-center gap-3 rounded-xl bg-sf-surface p-2.5 text-left transition-colors hover:bg-sf-surface2"
                      >
                        <div className="relative aspect-video w-[76px] shrink-0 overflow-hidden rounded-lg bg-black/40">
                          <img
                            src={s.thumbnail_url
                              .replace('{width}', '320')
                              .replace('{height}', '180')}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute left-1 top-1 rounded bg-red-600 px-1 py-px text-[9px] font-bold uppercase leading-none tracking-wide text-white">
                            Live
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold">{s.user_name}</h3>
                          <p className="truncate text-xs text-sf-accent">
                            {s.game_name || t(locale, 'noCategory')}
                          </p>
                          <p className="truncate text-xs text-sf-muted">{s.title}</p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 self-start pt-0.5 text-xs font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          {formatViewers(s.viewer_count)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ChannelSettingsView({
  locale,
  favs,
  channelPrefs,
  soundId,
  hint,
  onToggle,
  onLocaleChange,
  onSoundChange,
}: {
  locale: LocaleId;
  favs: string[];
  channelPrefs: ChannelNotifMap;
  soundId: NotifSoundId;
  hint: string | null;
  onToggle: (login: string, key: keyof ChannelNotifPref) => void;
  onLocaleChange: (locale: LocaleId) => void;
  onSoundChange: (id: NotifSoundId) => void;
}) {
  const [soundOpen, setSoundOpen] = useState(true);
  const [favsOpen, setFavsOpen] = useState(true);

  const previewSound = useCallback((id: NotifSoundId) => {
    const file = soundFileFor(id);
    if (!file) return;
    const audio = new Audio(chrome.runtime.getURL(file));
    void audio.play().catch(() => {});
  }, []);

  const selectedLabel = t(locale, soundLabelKey(soundId));

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-sf-surface px-3 py-2">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-sf-muted">
          {t(locale, 'language')}
        </label>
        <select
          value={locale}
          onChange={(e) => onLocaleChange(e.target.value as LocaleId)}
          className="w-full rounded-lg border border-white/[0.08] bg-sf-bg px-2.5 py-1.5 text-xs text-sf-text outline-none focus:border-sf-accent"
        >
          {LOCALE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl bg-sf-surface px-3 py-2">
        <button
          type="button"
          onClick={() => setSoundOpen((o) => !o)}
          aria-expanded={soundOpen}
          className="flex w-full items-center gap-2 py-0.5 text-left"
        >
          <ChevronIcon open={soundOpen} className="h-3.5 w-3.5 shrink-0 text-sf-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sf-muted">
              {t(locale, 'soundSection')}
            </p>
            {!soundOpen && (
              <p className="mt-0.5 truncate text-[11px] text-sf-muted/80">{selectedLabel}</p>
            )}
          </div>
        </button>

        {soundOpen && (
          <>
            <p className="mt-1.5 mb-2 text-[11px] text-sf-muted/80">
              {t(locale, 'soundHint')}
            </p>
            <div className="flex flex-col gap-1 pb-0.5">
              {SOUND_OPTIONS.map((opt) => {
                const selected = soundId === opt.id;
                const soundLabel = t(locale, soundLabelKey(opt.id));
                return (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                      selected ? 'bg-sf-accent/15' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSoundChange(opt.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      aria-pressed={selected}
                    >
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? 'border-sf-accent bg-sf-accent'
                            : 'border-white/25 bg-transparent'
                        }`}
                        aria-hidden
                      >
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <span
                        className={`truncate text-xs font-medium ${
                          selected ? 'text-sf-text' : 'text-sf-muted'
                        }`}
                      >
                        {soundLabel}
                      </span>
                    </button>
                    {opt.file && (
                      <button
                        type="button"
                        onClick={() => previewSound(opt.id)}
                        aria-label={t(locale, 'previewSound', { name: soundLabel })}
                        title={t(locale, 'previewTitle')}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sf-muted transition-colors hover:bg-white/[0.08] hover:text-sf-text"
                      >
                        <PlayIcon className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {favs.length === 0 ? (
        <div className="flex h-[180px] flex-col items-center justify-center px-6 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-sf-muted/50">
            <Diamond className="h-7 w-7" />
          </span>
          <h2 className="mb-1 text-base font-semibold">{t(locale, 'noSuperFavsTitle')}</h2>
          <p className="text-sm text-sf-muted">{t(locale, 'noSuperFavsSettingsDesc')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="rounded-xl bg-sf-surface px-3 py-2">
            <button
              type="button"
              onClick={() => setFavsOpen((o) => !o)}
              aria-expanded={favsOpen}
              className="flex w-full items-center gap-2 py-0.5 text-left"
            >
              <ChevronIcon open={favsOpen} className="h-3.5 w-3.5 shrink-0 text-sf-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sf-muted">
                  {t(locale, 'mySuperFavs')}
                </p>
                {!favsOpen && (
                  <p className="mt-0.5 text-[11px] text-sf-muted/80">
                    {favs.length === 1
                      ? t(locale, 'channelCountOne')
                      : t(locale, 'channelCountMany', { n: favs.length })}
                  </p>
                )}
              </div>
            </button>
            {favsOpen && (
              <p className="mt-1.5 text-[11px] text-sf-muted/80">
                {t(locale, 'channelPrefsHint')}
              </p>
            )}
          </div>

          {favsOpen && (
            <>
              {hint && (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-100"
                >
                  {hint}
                </div>
              )}

              <ul className="flex flex-col gap-2">
                {favs.map((login) => {
                  const pref = getChannelPref(channelPrefs, login);
                  return (
                    <li key={login} className="rounded-xl bg-sf-surface px-3 py-2.5">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sf-accent/15 text-sf-accent">
                          <Diamond className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate text-sm font-semibold">{login}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 pl-8">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-sf-muted">{t(locale, 'liveLabel')}</span>
                          <MiniToggle
                            checked={pref.live}
                            ariaLabel={t(locale, 'liveAria', { name: login })}
                            onChange={() => onToggle(login, 'live')}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-sf-muted">{t(locale, 'titleLabel')}</span>
                          <MiniToggle
                            checked={pref.title}
                            ariaLabel={t(locale, 'titleAria', { name: login })}
                            onChange={() => onToggle(login, 'title')}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s ease' }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function Preloader({ locale }: { locale: LocaleId }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center gap-5">
      <div className="relative h-14 w-14">
        <span className="sf-spinner absolute inset-0 block" />
        <span className="sf-bolt-pulse absolute inset-0 flex items-center justify-center text-sf-accent">
          <Diamond className="h-6 w-6" />
        </span>
      </div>
      <p className="text-sm text-sf-muted">{t(locale, 'searching')}</p>
    </div>
  );
}

function EmptyState({ locale, hasFavs }: { locale: LocaleId; hasFavs: boolean }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-sf-muted/50">
        <Diamond className="h-7 w-7" />
      </span>
      <h2 className="mb-1 text-base font-semibold">
        {hasFavs ? t(locale, 'emptyNoneLive') : t(locale, 'emptyNoFavs')}
      </h2>
      <p className="text-sm text-sf-muted">
        {hasFavs ? t(locale, 'emptyNoneLiveDesc') : t(locale, 'emptyNoFavsDesc')}
      </p>
    </div>
  );
}

function ErrorState({ locale, onRetry }: { locale: LocaleId; onRetry: () => void }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </span>
      <h2 className="mb-1 text-base font-semibold">{t(locale, 'errorTitle')}</h2>
      <p className="mb-4 text-sm text-sf-muted">{t(locale, 'errorDesc')}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-sf-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sf-accent2"
      >
        {t(locale, 'retry')}
      </button>
    </div>
  );
}
