(function () {
  const WUXING_ICON_PATHS = {
    木: '<path d="M6 1.2C3.2 4.2 3.2 7.8 6 10.8c2.8-3 2.8-6.6 0-9.6z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/><path d="M6 10.8V7.5" fill="none" stroke="currentColor" stroke-width="0.85" stroke-linecap="round"/>',
    火: '<path d="M6 10.5L3.2 6.2q2.8-2.2 2.8-4.7Q6 3.5 8.8 6.2L6 10.5z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
    土: '<path d="M2.2 10.2h7.6L6 4.2 2.2 10.2z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/><path d="M4.2 8.2h3.6" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"/>',
    金: '<circle cx="6" cy="6" r="3.6" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="6" cy="6" r="1" fill="currentColor" opacity="0.55"/>',
    水: '<path d="M6 1.8c-1.8 2.8-1.8 5 0 7.8 1.8-2.8 1.8-5 0-7.8z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
  };

  function iconHtml(wx, sizeClass) {
    const paths = WUXING_ICON_PATHS[wx];
    if (!paths) return '';
    const cls = sizeClass ? ` wx-icon ${sizeClass}` : ' wx-icon';
    return `<svg class="${cls.trim()}" viewBox="0 0 12 12" aria-hidden="true" focusable="false">${paths}</svg>`;
  }

  function charWithIcon(char, wx, sizeClass) {
    const safeWx = wx ? String(wx).replace(/"/g, '&quot;') : '';
    return `<span class="wx-char-wrap" data-wuxing="${safeWx}">${iconHtml(wx, sizeClass)}<span class="wx-char-text">${char}</span></span>`;
  }

  window.WuxingIcon = {
    WUXING_ICON_PATHS,
    iconHtml,
    charWithIcon,
  };
})();
