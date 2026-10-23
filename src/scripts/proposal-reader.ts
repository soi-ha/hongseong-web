const reader = document.querySelector<HTMLElement>('#proposal-reader');
if (reader) {
  const pages = [...reader.querySelectorAll<HTMLElement>('.proposal-page')];
  const stage = reader.querySelector<HTMLElement>('.reader-stage')!;
  const surface = reader.querySelector<HTMLElement>('.reader-surface')!;
  const previous = reader.querySelector<HTMLButtonElement>('#previous-page')!;
  const next = reader.querySelector<HTMLButtonElement>('#next-page')!;
  const select = reader.querySelector<HTMLSelectElement>('#page-select')!;
  const counter = reader.querySelector<HTMLElement>('#page-counter')!;
  const menu = [...reader.querySelectorAll<HTMLAnchorElement>('.proposal-navigation a')];
  let current = -1;

  // Resolve existing shared section links as well as direct page links.
  function pageFromHash(hash: string): number | undefined {
    if (!hash || hash === '#top' || hash === '#page-01') return 0;
    let id: string;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return undefined; }
    const target = document.getElementById(id);
    const page = target?.closest<HTMLElement>('.proposal-page');
    const index = page ? pages.indexOf(page) : -1;
    return index >= 0 ? index : undefined;
  }

  function showPage(index: number, pushHistory = false) {
    if (index < 0 || index >= pages.length) return;
    const oldPage = pages[current];
    const focused = document.activeElement;
    const moveFocus = (oldPage?.contains(focused) ?? false)
      || (focused === previous && index === 0)
      || (focused === next && index === pages.length - 1);
    pages.forEach((page, i) => { page.hidden = i !== index; });
    current = index;
    const active = pages[current]!;
    if (active.dataset.theme) surface.dataset.theme = active.dataset.theme;
    else delete surface.dataset.theme;
    previous.disabled = current === 0;
    next.disabled = current === pages.length - 1;
    select.value = String(current + 1);
    counter.textContent = `${current + 1} / ${pages.length}`;
    counter.setAttribute('aria-label', `${pages.length}쪽 중 ${current + 1}쪽, ${active.dataset.pageLabel}`);
    stage.scrollTo({ top: 0, behavior: 'instant' });
    if (moveFocus) stage.focus({ preventScroll: true });

    const selectedMenu = [...menu].reverse().find(link => Number(link.dataset.startPage ?? 1) <= current + 1);
    for (const link of menu) {
      if (link === selectedMenu) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    const list = selectedMenu?.closest('ol');
    if (list && selectedMenu) {
      list.scrollTo({ left: list.scrollLeft + selectedMenu.getBoundingClientRect().left - list.getBoundingClientRect().left - (list.clientWidth - selectedMenu.offsetWidth) / 2 });
    }
    if (pushHistory) history.pushState(null, '', `#page-${String(current + 1).padStart(2, '0')}`);
  }

  previous.addEventListener('click', () => showPage(current - 1, true));
  next.addEventListener('click', () => showPage(current + 1, true));
  select.addEventListener('change', () => showPage(Number(select.value) - 1, true));
  reader.addEventListener('click', event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || (event as MouseEvent).metaKey || (event as MouseEvent).ctrlKey || (event as MouseEvent).shiftKey || (event as MouseEvent).altKey) return;
    const index = pageFromHash(link.hash);
    if (index === undefined) return;
    event.preventDefault();
    showPage(index, true);
  });
  document.addEventListener('keydown', event => {
    // Preserve text editing, select controls and horizontal table scrolling.
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return;
    if ((event.target as Element).closest('input, textarea, select, [contenteditable], .table-scroll')) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showPage(current + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  const restoreFromURL = () => {
    const index = pageFromHash(location.hash);
    if (index !== undefined) showPage(index);
    else if (current < 0) showPage(0);
  };
  window.addEventListener('popstate', restoreFromURL);
  window.addEventListener('hashchange', restoreFromURL);
  restoreFromURL();
}
