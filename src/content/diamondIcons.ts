/** Split purple/green diamond SVGs for content-script buttons (no Tailwind). */

export const ICON_OUTLINE = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <defs>
    <linearGradient id="sf-split-stroke" x1="0" y1="0" x2="1" y2="0">
      <stop offset="50%" stop-color="#9146FF"/>
      <stop offset="50%" stop-color="#53FC18"/>
    </linearGradient>
  </defs>
  <path d="M6 3h12l4 6-10 13L2 9Z" fill="none" stroke="url(#sf-split-stroke)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11 3 8 9l4 13 4-13-3-6" fill="none" stroke="url(#sf-split-stroke)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 9h20" fill="none" stroke="url(#sf-split-stroke)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`.replace(/\s+/g, ' ').trim();

export const ICON_FILLED = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <defs>
    <linearGradient id="sf-split-fill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="50%" stop-color="#9146FF"/>
      <stop offset="50%" stop-color="#53FC18"/>
    </linearGradient>
  </defs>
  <path class="sf-gem" d="M6 3h12l4 6-10 13L2 9Z" fill="url(#sf-split-fill)"/>
  <g class="sf-facets" fill="none" stroke="#0E0E10" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 3 8 9l4 13 4-13-3-6"/>
    <path d="M2 9h20"/>
  </g>
</svg>`.replace(/\s+/g, ' ').trim();
