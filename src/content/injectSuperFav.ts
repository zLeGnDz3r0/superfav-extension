// src/content/injectSuperFav.ts
// SuperFav — Twitch content script.
// Tailwind NO se aplica aquí: CSS inyectado vía injectStyles().

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

const PLATFORM = 'twitch' as const;
const BTN_ID = 'superfav-injected-btn';
const STYLE_ID = 'superfav-styles';

let locale: LocaleId = 'es';

const RESERVED = new Set([
  'directory', 'videos', 'settings', 'subscriptions', 'wallet', 'inventory',
  'drops', 'friends', 'u', 'p', 'search', 'following', 'prime', 'turbo',
  'downloads', 'jobs', 'about', 'store', 'bits', 'team', 'teams', 'event',
  'popout', 'moderator', 'payments', 'security', 'collections',
]);

const ANCHOR_SELECTOR =
  '[data-a-target="follow-button"],[data-a-target="unfollow-button"],[data-a-target="subscribe-button"]';

let favs: FavEntry[] = [];
let ready = false;

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  // White logo always; only background changes (inactive = Twitch purple, active = muted).
  style.textContent = `
#${BTN_ID}{
  display:inline-flex;align-items:center;justify-content:center;gap:5px;flex-shrink:0;
  align-self:center;
  height:32px;padding:0 10px;margin:0 0 0 6px;
  border:none;border-radius:9999px;cursor:pointer;
  background:#9146FF;
  color:#fff;
  font-family:inherit;font-size:13px;font-weight:600;line-height:1;
  overflow:hidden;
  transition:filter .15s ease,width .15s ease,padding .15s ease,gap .15s ease,background-color .15s ease;
}
#${BTN_ID}:hover{filter:brightness(1.08)}
#${BTN_ID}:active{transform:scale(.96)}
#${BTN_ID} svg{width:18px;height:18px;display:block;flex-shrink:0}
#${BTN_ID} span{white-space:nowrap;overflow:hidden;transition:width .15s ease,opacity .15s ease;color:#fff}
#${BTN_ID}.is-active{width:52px;padding:0;gap:0;background:#53535F61;filter:none}
#${BTN_ID}.is-active:hover{filter:brightness(1.08)}
#${BTN_ID}.is-active span{width:0;opacity:0;font-size:0}
html.tw-root--theme-dark #${BTN_ID}.is-active{background-color:#53535F61}
html.tw-root--theme-light #${BTN_ID}.is-active{background-color:rgba(0,0,0,.14)}
`;
  (document.head ?? document.documentElement).appendChild(style);
}

function getChannel(): string | null {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  const name = segments[0].toLowerCase();
  if (RESERVED.has(name)) return null;
  return name;
}

function findGroup(): HTMLElement | null {
  const anchor = document.querySelector(ANCHOR_SELECTOR);
  if (!anchor) return null;
  let el: HTMLElement | null = anchor.parentElement;
  for (let i = 0; i < 4 && el; i++) {
    if (el.childElementCount >= 2) return el;
    el = el.parentElement;
  }
  return anchor.parentElement;
}

function placeButton(btn: HTMLButtonElement, group: HTMLElement): void {
  const parent = group.parentElement;
  if (parent && getComputedStyle(parent).display.includes('flex')) {
    group.insertAdjacentElement('afterend', btn);
  } else {
    group.appendChild(btn);
  }
}

function createButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  // Same white mark always; active state only toggles background via .is-active.
  btn.innerHTML = ICON_FILLED + '<span>Super Fav</span>';
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
  btn.classList.toggle('is-active', active);
  if (btn.dataset.active !== String(active)) {
    btn.dataset.active = String(active);
    btn.innerHTML = ICON_FILLED + '<span>Super Fav</span>';
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
  observer.observe(document.body, { childList: true, subtree: true });

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
