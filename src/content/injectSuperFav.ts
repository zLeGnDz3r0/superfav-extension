// src/content/injectSuperFav.ts
// SuperFav for Twitch — content script.
// Inyecta un botón nativo e INDEPENDIENTE en la cabecera del canal (separado del
// grupo de acciones nativo: Seguir / Suscribirse / campana) y lo mantiene
// sincronizado mientras Twitch navega como SPA.
//
// Nota clave: Tailwind NO se aplica aquí. El content script vive dentro del DOM
// de Twitch, que no carga nuestra hoja de estilos, así que estilamos con CSS
// real inyectado una sola vez (ver injectStyles).

import { LOCALE_KEY, loadStoredLocale, normalizeLocale, t, type LocaleId } from '../lib/i18n';

const BTN_ID = 'superfav-injected-btn';
const STYLE_ID = 'superfav-styles';
const STORAGE_KEY = 'superfavs';

let locale: LocaleId = 'es';

// Rutas cuyo primer segmento NO es un canal.
const RESERVED = new Set([
  'directory', 'videos', 'settings', 'subscriptions', 'wallet', 'inventory',
  'drops', 'friends', 'u', 'p', 'search', 'following', 'prime', 'turbo',
  'downloads', 'jobs', 'about', 'store', 'bits', 'team', 'teams', 'event',
  'popout', 'moderator', 'payments', 'security', 'collections',
]);

// Botón Seguir / Suscribirse: lo usamos como ancla para localizar la botonera.
const ANCHOR_SELECTOR =
  '[data-a-target="follow-button"],[data-a-target="unfollow-button"],[data-a-target="subscribe-button"]';

const ICON_OUTLINE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>';
const ICON_FILLED =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="sf-gem" d="M6 3h12l4 6-10 13L2 9Z"/><g class="sf-facets" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></g></svg>';

let favs: string[] = [];
let ready = false;

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#${BTN_ID}{
  display:inline-flex;align-items:center;justify-content:center;gap:5px;flex-shrink:0;
  align-self:center;
  height:32px;padding:0 10px;margin:0 0 0 6px;
  border:none;border-radius:9999px;cursor:pointer;
  background-color:#9146FF;
  color:#fff;
  font-family:inherit;font-size:13px;font-weight:600;line-height:1;
  overflow:hidden;
  transition:background-color .15s ease,width .15s ease,padding .15s ease,gap .15s ease;
}
#${BTN_ID}:hover{background-color:#A970FF}
#${BTN_ID}:active{transform:scale(.96)}
#${BTN_ID} svg{width:20px;height:20px;display:block;flex-shrink:0}
#${BTN_ID} span{white-space:nowrap;overflow:hidden;transition:width .15s ease,opacity .15s ease}
#${BTN_ID}.is-active{width:52px;padding:0;gap:0}
#${BTN_ID}.is-active svg{transition:opacity .15s ease}
#${BTN_ID}.is-active:hover svg{opacity:.7}
#${BTN_ID}.is-active span{width:0;opacity:0;font-size:0}
html.tw-root--theme-dark #${BTN_ID}.is-active{background-color:#53535F61;color:#EFEFF1}
html.tw-root--theme-dark #${BTN_ID}.is-active:hover{background-color:#53535F61}
html.tw-root--theme-dark #${BTN_ID}.is-active .sf-gem{fill:#fff}
html.tw-root--theme-dark #${BTN_ID}.is-active .sf-facets{stroke:#9146FF}
html.tw-root--theme-light #${BTN_ID}.is-active{background-color:rgba(0,0,0,.08);color:#0E0E10}
html.tw-root--theme-light #${BTN_ID}.is-active:hover{background-color:rgba(0,0,0,.12)}
html.tw-root--theme-light #${BTN_ID}.is-active .sf-gem{fill:#9146FF}
html.tw-root--theme-light #${BTN_ID}.is-active .sf-facets{stroke:#fff}
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
  btn.innerHTML = ICON_OUTLINE + '<span>Super Fav</span>';
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
  const active = favs.includes(channel);
  btn.classList.toggle('is-active', active);
  if (btn.dataset.active !== String(active)) {
    btn.dataset.active = String(active);
    btn.innerHTML = (active ? ICON_FILLED : ICON_OUTLINE) + '<span>Super Fav</span>';
  }
  const label = active ? t(locale, 'removeSuperFav') : t(locale, 'addSuperFav');
  btn.title = label;
  btn.setAttribute('aria-label', label);
  btn.setAttribute('aria-pressed', String(active));
}

async function toggleFav(channel: string): Promise<void> {
  favs = favs.includes(channel) ? favs.filter((c) => c !== channel) : [...favs, channel];
  updateVisual();
  await chrome.storage.sync.set({ [STORAGE_KEY]: favs });
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
    if (changes[STORAGE_KEY]) {
      favs = (changes[STORAGE_KEY].newValue as string[] | undefined) ?? [];
      updateVisual();
    }
    if (changes[LOCALE_KEY]) {
      locale = normalizeLocale(changes[LOCALE_KEY].newValue);
      updateVisual();
    }
  });

  void loadStoredLocale().then((loc) => {
    locale = loc;
    chrome.storage.sync.get([STORAGE_KEY], (res) => {
      favs = (res[STORAGE_KEY] as string[] | undefined) ?? [];
      ready = true;
      refresh();
    });
  });
}

init();
