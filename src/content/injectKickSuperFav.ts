// src/content/injectKickSuperFav.ts
// SuperFav — Kick content script.
// Kick SPA: MutationObserver + History patch. Anchor near Follow / Subscribe.

import {
  FAVS_KEY,
  hasFav,
  normalizeFavs,
  needsFavMigration,
  toggleFav as toggleFavEntry,
  type FavEntry,
} from '../lib/favorites';
import { LOCALE_KEY, loadStoredLocale, normalizeLocale, t, type LocaleId } from '../lib/i18n';
import { ICON_FILLED } from './diamondIcons';

const PLATFORM = 'kick' as const;
const BTN_ID = 'superfav-kick-btn';
const STYLE_ID = 'superfav-kick-styles';

let locale: LocaleId = 'es';

const RESERVED = new Set([
  'categories', 'category', 'search', 'dashboard', 'settings', 'messages',
  'following', 'browse', 'clips', 'videos', 'community', 'transactions',
  'subscriptions', 'wallet', 'about', 'terms', 'privacy', 'help', 'login',
  'signup', 'register', 'auth', 'api', 'popout', 'embed',
]);

let favs: FavEntry[] = [];
let ready = false;

/** Kick layout classes matching the native icon-button row (size/shape only). */
const KICK_NATIVE_BTN_CLASS = [
  'group',
  'relative',
  'box-border',
  'shrink-0',
  'grow-0',
  'select-none',
  'items-center',
  'justify-center',
  'whitespace-nowrap',
  'rounded',
  'font-semibold',
  'ring-0',
  'transition-all',
  'focus-visible:outline-none',
  'active:scale-[0.95]',
  'size-10',
  'text-base',
  'leading-none',
  'flex',
].join(' ');

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  // White logo always. Inactive = Kick green; active (favorited) = gray.
  style.textContent = `
#${BTN_ID}{
  cursor:pointer;
  border:none;
  padding:0;
  width:40px;height:40px;min-width:40px;min-height:40px;
  display:inline-flex;align-items:center;justify-content:center;
  flex-shrink:0;
  background-color:#53FC18;
  transition:background-color .15s ease,transform .15s ease,filter .15s ease;
}
#${BTN_ID}:hover{filter:brightness(1.06)}
#${BTN_ID}:active{transform:scale(.95)}
#${BTN_ID} svg{
  width:22px;height:22px;
  display:block;flex-shrink:0;
  pointer-events:none;
  overflow:visible;
}
#${BTN_ID}.is-active{
  background-color:#3D4046 !important;
  filter:none;
}
#${BTN_ID}.is-active:hover{filter:brightness(1.1)}
`;
  (document.head ?? document.documentElement).appendChild(style);
}

function getChannel(): string | null {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  const name = segments[0].toLowerCase();
  if (RESERVED.has(name)) return null;
  // Skip nested routes that aren't the channel root (e.g. /user/videos)
  if (segments.length > 1 && ['videos', 'clips', 'chat', 'about', 'schedule'].includes(segments[1])) {
    // Still a channel page — keep slug
  }
  return name;
}

function findAnchor(): HTMLElement | null {
  const byTestId = document.querySelector<HTMLElement>('[data-testid="follow-button"]');
  if (byTestId) return byTestId;

  const favBtn = document.getElementById('tp_favorites_btn');
  if (favBtn instanceof HTMLElement) return favBtn;

  const buttons = Array.from(document.querySelectorAll<HTMLElement>('button, a'));
  const followLike = buttons.find((el) => {
    const text = (el.textContent ?? '').trim().toLowerCase();
    return (
      text === 'follow' ||
      text === 'following' ||
      text === 'unfollow' ||
      text === 'seguir' ||
      text === 'siguiendo' ||
      text === 'subscribe' ||
      text === 'suscribirse' ||
      text === 'subscribed'
    );
  });
  if (followLike) return followLike;

  const header = document.querySelector(
    '[class*="channel-info"], [class*="ChannelInfo"], header, main',
  );
  return (header as HTMLElement | null) ?? null;
}

function findGroup(): HTMLElement | null {
  const anchor = findAnchor();
  if (!anchor) return null;
  let el: HTMLElement | null = anchor.parentElement;
  for (let i = 0; i < 6 && el; i++) {
    const style = getComputedStyle(el);
    if (
      (style.display.includes('flex') || style.display === 'grid') &&
      el.childElementCount >= 1
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return anchor.parentElement;
}

function placeButton(btn: HTMLButtonElement, group: HTMLElement): void {
  if (group.contains(btn)) return;

  // Sit with Kick's icon row (bell / heart), before Follow when possible.
  const favNative = group.querySelector('#tp_favorites_btn');
  if (favNative?.parentElement === group) {
    favNative.insertAdjacentElement('afterend', btn);
    return;
  }
  const follow = group.querySelector('[data-testid="follow-button"]');
  if (follow?.parentElement === group) {
    follow.insertAdjacentElement('beforebegin', btn);
    return;
  }
  group.appendChild(btn);
}

function createButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  btn.className = KICK_NATIVE_BTN_CLASS;
  // Same white mark always; active state only toggles background via .is-active.
  btn.innerHTML = ICON_FILLED;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const channel = btn.dataset.channel;
    if (channel) void toggleFav(channel);
  });
  return btn;
}

function updateVisual(): void {
  const btn = document.getElementById(BTN_ID) as HTMLButtonElement | null;
  if (!btn) return;
  const channel = btn.dataset.channel ?? '';
  const active = hasFav(favs, PLATFORM, channel);
  btn.className = KICK_NATIVE_BTN_CLASS;
  btn.classList.toggle('is-active', active);
  if (btn.dataset.active !== String(active)) {
    btn.dataset.active = String(active);
    btn.innerHTML = ICON_FILLED;
  }
  const label = active ? t(locale, 'removeSuperFav') : t(locale, 'addSuperFav');
  btn.title = label;
  btn.setAttribute('aria-label', label);
  btn.setAttribute('aria-pressed', String(active));
}

async function persistFavs(next: FavEntry[]): Promise<void> {
  favs = next;
  updateVisual();
  await chrome.storage.sync.set({ [FAVS_KEY]: next });
}

async function toggleFav(channel: string): Promise<void> {
  await persistFavs(toggleFavEntry(favs, PLATFORM, channel));
}

function refresh(): void {
  if (!ready) return;
  const channel = getChannel();
  const instances = document.querySelectorAll<HTMLButtonElement>(`#${BTN_ID}`);

  if (!channel) {
    instances.forEach((b) => b.remove());
    return;
  }

  const group = findGroup();
  if (!group) return;

  let btn: HTMLButtonElement | null = instances[0] ?? null;
  for (let i = 1; i < instances.length; i++) instances[i].remove();

  if (!btn) {
    btn = createButton();
    placeButton(btn, group);
  } else if (!group.contains(btn)) {
    placeButton(btn, group);
  }

  btn.dataset.channel = channel;
  updateVisual();
}

let scheduled = false;
function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    refresh();
  });
}

let lastUrl = location.href;
function onMaybeUrlChange(): void {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    schedule();
  }
}

function patchHistory(method: 'pushState' | 'replaceState'): void {
  const original = history[method];
  history[method] = function (this: History, ...args: Parameters<typeof original>) {
    const result = original.apply(this, args);
    onMaybeUrlChange();
    return result;
  } as typeof original;
}

function init(): void {
  injectStyles();
  patchHistory('pushState');
  patchHistory('replaceState');
  window.addEventListener('popstate', onMaybeUrlChange);

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes[FAVS_KEY]) {
      favs = normalizeFavs(changes[FAVS_KEY].newValue);
      updateVisual();
    }
    if (changes[LOCALE_KEY]) {
      locale = normalizeLocale(changes[LOCALE_KEY].newValue);
      updateVisual();
    }
  });

  void loadStoredLocale().then((loc) => {
    locale = loc;
    chrome.storage.sync.get([FAVS_KEY], (res) => {
      const raw = res[FAVS_KEY];
      favs = normalizeFavs(raw);
      if (needsFavMigration(raw)) {
        void chrome.storage.sync.set({ [FAVS_KEY]: favs });
      }
      ready = true;
      refresh();
    });
  });
}

init();
