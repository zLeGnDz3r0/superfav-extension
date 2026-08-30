import type { Platform } from './favorites';

/** Watchable pop-out (~3× the thumb, plus window chrome). */
const PREVIEW_WIDTH = 480;
const PREVIEW_HEIGHT = 270;
const SCREEN_PAD = 16;

const LOGIN_RE = /^[a-z0-9_-]{1,25}$/;

export type PreviewAnchor = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type PreviewTarget = {
  key: string;
  platform: Platform;
  login: string;
  muted: boolean;
  anchor: PreviewAnchor;
};

let overlayWindowId: number | null = null;
let overlayKey: string | null = null;
let watchingRemoved = false;

function standalonePlayerSrc(platform: Platform, login: string, muted: boolean): string {
  const safeLogin = encodeURIComponent(login);
  if (platform === 'kick') {
    const qs = new URLSearchParams({
      autoplay: 'true',
      muted: muted ? 'true' : 'false',
    });
    qs.set('sf', '1');
    return `https://player.kick.com/${safeLogin}?${qs.toString()}`;
  }
  const qs = new URLSearchParams({
    channel: login,
    autoplay: 'true',
    muted: muted ? 'true' : 'false',
    parent: 'player.twitch.tv',
    sf: '1',
  });
  return `https://player.twitch.tv/?${qs.toString()}`;
}

export function previewAnchorFromElement(el: HTMLElement): PreviewAnchor {
  const r = el.getBoundingClientRect();
  return {
    left: window.screenX + r.left,
    top: window.screenY + r.top,
    right: window.screenX + r.right,
    bottom: window.screenY + r.bottom,
  };
}

type ScreenWorkArea = Screen & { availLeft?: number; availTop?: number };

function workArea(): { left: number; top: number; right: number; bottom: number } {
  const screen = window.screen as ScreenWorkArea;
  const left = screen.availLeft ?? 0;
  const top = screen.availTop ?? 0;
  return {
    left,
    top,
    right: left + screen.availWidth,
    bottom: top + screen.availHeight,
  };
}

function clampToWorkArea(
  left: number,
  top: number,
  width: number,
  height: number,
): { left: number; top: number } {
  const area = workArea();
  let x = left;
  let y = top;
  if (x + width > area.right - SCREEN_PAD) x = area.right - SCREEN_PAD - width;
  if (x < area.left + SCREEN_PAD) x = area.left + SCREEN_PAD;
  if (y + height > area.bottom - SCREEN_PAD) y = area.bottom - SCREEN_PAD - height;
  if (y < area.top + SCREEN_PAD) y = area.top + SCREEN_PAD;
  return { left: Math.round(x), top: Math.round(y) };
}

async function previewWindowBounds(anchor: PreviewAnchor): Promise<{
  left: number;
  top: number;
  width: number;
  height: number;
}> {
  const width = PREVIEW_WIDTH;
  const height = PREVIEW_HEIGHT;
  try {
    const browser = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
    if (browser.left != null && browser.top != null && browser.width) {
      const left = browser.left + browser.width - width - 24;
      const top = browser.top + 72;
      return { width, height, ...clampToWorkArea(left, top, width, height) };
    }
  } catch {
    // Fall through to the popup thumb.
  }
  return {
    width,
    height,
    ...clampToWorkArea(anchor.right + 10, anchor.top, width, height),
  };
}

function watchWindowClosed(): void {
  if (watchingRemoved) return;
  watchingRemoved = true;
  chrome.windows.onRemoved.addListener((id) => {
    if (id === overlayWindowId) {
      overlayWindowId = null;
      overlayKey = null;
    }
  });
}

async function placePreviewWindow(
  src: string,
  bounds: { left: number; top: number; width: number; height: number },
): Promise<void> {
  watchWindowClosed();
  const place = {
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    focused: true,
    state: 'normal' as const,
  };

  if (overlayWindowId != null) {
    try {
      const win = await chrome.windows.get(overlayWindowId, { populate: true });
      const tabId = win.tabs?.[0]?.id;
      await chrome.windows.update(overlayWindowId, place);
      if (tabId != null && (win.tabs?.[0]?.url ?? '') !== src) {
        await chrome.tabs.update(tabId, { url: src });
      }
      return;
    } catch {
      overlayWindowId = null;
    }
  }

  const created = await chrome.windows.create({
    url: src,
    type: 'popup',
    ...place,
  });
  overlayWindowId = created.id ?? null;
  if (overlayWindowId != null) {
    // Windows sometimes parks an unfocused popup on the taskbar only.
    await chrome.windows.update(overlayWindowId, place);
  }
}

export async function showLivePreview(target: PreviewTarget): Promise<void> {
  const login = target.login.trim().toLowerCase();
  if (target.platform !== 'twitch' && target.platform !== 'kick') return;
  if (!LOGIN_RE.test(login)) return;

  overlayKey = target.key;
  const bounds = await previewWindowBounds(target.anchor);
  await placePreviewWindow(standalonePlayerSrc(target.platform, login, target.muted), bounds);
}

export async function hideLivePreview(key: string): Promise<void> {
  if (overlayKey !== key) return;
  overlayKey = null;
  if (overlayWindowId == null) return;
  const windowId = overlayWindowId;
  overlayWindowId = null;
  try {
    await chrome.windows.remove(windowId);
  } catch {
    // Already closed.
  }
}
