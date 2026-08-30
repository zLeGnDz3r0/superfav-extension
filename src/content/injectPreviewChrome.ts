// Hides Follow / Gift / Subscribe on SuperFav's pop-out player (sf=1).
// Keeps channel name, title, category and viewer count.

const STYLE_ID = 'sf-preview-chrome';

const CTA_SEL = [
  '[data-a-target="follow-button"]',
  '[data-a-target="unfollow-button"]',
  '[data-a-target="subscribe-button"]',
  '[data-a-target="gift-button"]',
  '[data-a-target="gift-sub-button"]',
  '[data-test-selector="gift-subscribe-button"]',
  '[data-a-target="player-overlay-follow-button"]',
  'button[aria-label*="Regalar una sub" i]',
  'button[aria-label*="Gift a sub" i]',
  'button[aria-label*="Gift a Sub" i]',
  'a[href*="/products/"]',
].join(',');

function isOurPreview(): boolean {
  return new URLSearchParams(location.search).get('sf') === '1';
}

function isMetaBlock(el: Element): boolean {
  const text = el.textContent ?? '';
  return /espectadores|viewers|jugando a|playing/i.test(text);
}

function injectCss(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    [data-sf-hidden-cta="1"] { display: none !important; }
    ${CTA_SEL} { display: none !important; }
    #superfav-injected-btn, #superfav-kick-btn { display: none !important; }
  `;
  (document.head ?? document.documentElement).appendChild(style);
}

function hideCtaRow(): void {
  const cta = document.querySelector(CTA_SEL);
  if (!(cta instanceof HTMLElement)) return;
  if (cta.closest('[data-sf-hidden-cta="1"]')) return;

  let node: HTMLElement | null = cta;
  let hide: HTMLElement | null = null;

  while (node && node !== document.body) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent || parent === document.body) break;

    const rowBox = node.getBoundingClientRect();
    const looksLikeBar =
      rowBox.height > 0 &&
      rowBox.height <= 88 &&
      node.querySelectorAll('button, a[href]').length >= 2;

    if (looksLikeBar) hide = node;

    // Parent has title / "Jugando a … espectadores"; this child is only the CTA strip.
    if (isMetaBlock(parent) && !isMetaBlock(node)) {
      hide = node;
      break;
    }

    node = parent;
  }

  const target = hide ?? cta.parentElement;
  if (target && target !== document.body) {
    target.setAttribute('data-sf-hidden-cta', '1');
  }
}

function tick(): void {
  injectCss();
  hideCtaRow();
}

function init(): void {
  if (!isOurPreview()) return;
  tick();
  const observer = new MutationObserver(() => {
    requestAnimationFrame(tick);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
