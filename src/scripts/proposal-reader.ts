import { setupPresentation } from './proposal-presentation';

const reader = document.querySelector<HTMLElement>('#proposal-reader');
if (reader) {
  const pages = [...reader.querySelectorAll<HTMLElement>('.proposal-page')];
  const stage = reader.querySelector<HTMLElement>('.reader-stage')!;
  const previous = reader.querySelector<HTMLButtonElement>('#previous-page')!;
  const next = reader.querySelector<HTMLButtonElement>('#next-page')!;
  const counter = reader.querySelector<HTMLElement>('#page-counter')!;
  const menu = [...reader.querySelectorAll<HTMLAnchorElement>('.proposal-navigation a')];
  const menuByPage = [...menu].reverse();
  const artwork = pages.map(page => page.querySelector<HTMLImageElement>('.slide-artwork')!);
  let selectedMenu: HTMLAnchorElement | undefined;
  let current = -1;
  const presentation = setupPresentation(reader);

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
    if (index === current) {
      presentation.revealControls();
      return;
    }
    const oldPage = pages[current];
    const focused = document.activeElement;
    const moveFocus = (oldPage?.contains(focused) ?? false)
      || (focused === previous && index === 0)
      || (focused === next && index === pages.length - 1);
    if (oldPage) {
      oldPage.hidden = true;
      artwork[current]!.fetchPriority = 'low';
    } else {
      // The server renders the cover, but a shared URL may start elsewhere.
      pages[0]!.hidden = index !== 0;
      artwork[0]!.fetchPriority = 'low';
    }
    pages[index]!.hidden = false;
    current = index;
    const active = pages[current]!;
    previous.disabled = current === 0;
    next.disabled = current === pages.length - 1;
    counter.textContent = `${current + 1} / ${pages.length}`;
    counter.setAttribute('aria-label', `${pages.length}쪽 중 ${current + 1}쪽, ${active.dataset.pageLabel}`);
    // Load the current and adjacent artwork before the next navigation gesture.
    artwork[current]!.fetchPriority = 'high';
    artwork[current]!.loading = 'eager';
    for (const nearby of [current - 1, current + 1]) {
      const image = artwork[nearby];
      if (!image) continue;
      image.fetchPriority = 'low';
      image.loading = 'eager';
    }
    if (moveFocus) stage.focus({ preventScroll: true });

    const nextMenu = menuByPage.find(link => Number(link.dataset.startPage ?? 1) <= current + 1);
    if (selectedMenu !== nextMenu) {
      selectedMenu?.removeAttribute('aria-current');
      selectedMenu = nextMenu;
      selectedMenu?.setAttribute('aria-current', 'location');
      const list = selectedMenu?.closest('ol');
      if (list && selectedMenu) {
        list.scrollTo({ left: list.scrollLeft + selectedMenu.getBoundingClientRect().left - list.getBoundingClientRect().left - (list.clientWidth - selectedMenu.offsetWidth) / 2 });
      }
    }
    if (pushHistory) history.pushState(null, '', `#page-${String(current + 1).padStart(2, '0')}`);
    presentation.revealControls();
  }

  previous.addEventListener('click', () => showPage(current - 1, true));
  next.addEventListener('click', () => showPage(current + 1, true));
  reader.addEventListener('click', event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || (event as MouseEvent).metaKey || (event as MouseEvent).ctrlKey || (event as MouseEvent).shiftKey || (event as MouseEvent).altKey) return;
    const index = pageFromHash(link.hash);
    if (index === undefined) return;
    event.preventDefault();
    showPage(index, true);
  });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented || !(event.target instanceof Element)) return;
    const target = event.target;
    if (target.closest('input, textarea, select, [contenteditable]')) return;
    // The document section below the viewer keeps normal scrolling/link keys.
    if (!presentation.isPresenting() && target.closest('.proposal-download')) return;
    if (event.key === 'Escape' && presentation.isPresenting()) {
      event.preventDefault();
      void presentation.toggle();
      return;
    }
    if (event.key.toLowerCase() === 'f' && !event.repeat) {
      event.preventDefault();
      void presentation.toggle();
      return;
    }
    let destination: number | undefined;
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') destination = current - 1;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') destination = current + 1;
    if (event.key === 'Home') destination = 0;
    if (event.key === 'End') destination = pages.length - 1;
    if (presentation.isPresenting()) {
      if (event.key === 'ArrowUp') destination = current - 1;
      if (event.key === 'ArrowDown') destination = current + 1;
      if (event.key === ' ' && !target.closest('button, a, summary')) destination = current + (event.shiftKey ? -1 : 1);
    }
    if (destination !== undefined) {
      event.preventDefault();
      showPage(destination, true);
    }
  });
  const restoreFromURL = () => {
    const index = pageFromHash(location.hash);
    if (index !== undefined) showPage(index);
    else if (current < 0) showPage(0);
  };
  // Fragment changes also cover back/forward navigation; listening to popstate
  // as well would restore the same slide twice.
  window.addEventListener('beforeprint', () => {
    for (const image of artwork) image.loading = 'eager';
  });
  window.addEventListener('hashchange', restoreFromURL);
  restoreFromURL();
}
