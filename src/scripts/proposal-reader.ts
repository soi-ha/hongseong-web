const reader = document.querySelector<HTMLElement>('#proposal-reader');
if (reader) {
  const pages = [...reader.querySelectorAll<HTMLElement>('.proposal-page')];
  const stage = reader.querySelector<HTMLElement>('.reader-stage')!;
  const previous = reader.querySelector<HTMLButtonElement>('#previous-page')!;
  const next = reader.querySelector<HTMLButtonElement>('#next-page')!;
  const counter = reader.querySelector<HTMLElement>('#page-counter')!;
  const controls = reader.querySelector<HTMLElement>('.reader-controls')!;
  const fullscreen = reader.querySelector<HTMLButtonElement>('#fullscreen-toggle')!;
  const textToggle = reader.querySelector<HTMLButtonElement>('#text-toggle')!;
  const status = reader.querySelector<HTMLElement>('#reader-status')!;
  const outsideNavigation = [...document.querySelectorAll<HTMLElement>('body > .site-header, body > .skip-link')].map(element => ({element, inert: element.inert}));
  const menu = [...reader.querySelectorAll<HTMLAnchorElement>('.proposal-navigation a')];
  let current = -1;
  let textView = false;
  let presenting = false;
  let fullscreenPending = false;
  let idleTimer: ReturnType<typeof setTimeout>;
  let statusTimer: ReturnType<typeof setTimeout>;

  function revealControls() {
    reader!.classList.remove('controls-idle');
    clearTimeout(idleTimer);
    if (presenting) idleTimer = setTimeout(() => {
      if (!controls.contains(document.activeElement)) reader!.classList.add('controls-idle');
    }, 2200);
  }

  function renderView() {
    reader!.dataset.view = textView ? 'text' : 'slide';
    for (const [index, page] of pages.entries()) {
      page.querySelector<HTMLElement>('.slide-text')!.hidden = !textView || index !== current;
      page.querySelector<HTMLImageElement>('.slide-artwork')!.hidden = textView;
    }
    textToggle.setAttribute('aria-pressed', String(textView));
    textToggle.textContent = textView ? '슬라이드 보기' : '본문·출처';
    stage.scrollTo({ top: 0, behavior: 'instant' });
  }

  function setPresenting(value: boolean) {
    presenting = value;
    reader!.classList.toggle('is-presenting', value);
    for (const item of outsideNavigation) item.element.inert = value || item.inert;
    fullscreen.setAttribute('aria-pressed', String(value));
    const label = value ? '전체 화면 종료' : '전체 화면 시작';
    fullscreen.setAttribute('aria-label', label);
    fullscreen.title = label + (value ? ' (Esc)' : ' (F)');
    fullscreen.querySelector('.fullscreen-label')!.textContent = value ? '전체 화면 종료' : '전체 화면';
    if (value) {
      textView = false;
      renderView();
      stage.focus({ preventScroll: true });
    } else {
      fullscreen.focus({ preventScroll: true });
      status.hidden = true;
    }
    revealControls();
  }

  async function toggleFullscreen() {
    if (fullscreenPending) return;
    fullscreenPending = true;
    try {
      if (presenting) {
        if (document.fullscreenElement === reader) await document.exitFullscreen();
        else setPresenting(false);
      } else if (typeof reader!.requestFullscreen === 'function' && document.fullscreenEnabled) {
        await reader!.requestFullscreen();
      } else {
        setPresenting(true);
        announceFallback();
      }
    } catch {
      if (!presenting) {
        setPresenting(true);
        announceFallback();
      } else {
        status.hidden = false;
        status.textContent = 'Esc 키로 전체 화면을 종료할 수 있습니다.';
      }
    } finally {
      fullscreenPending = false;
    }
  }

  function announceFallback() {
    status.hidden = false;
    status.textContent = '전체 화면을 사용할 수 없어 창 안에서 발표 모드로 표시합니다. Esc로 돌아갑니다.';
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.hidden = true; }, 6000);
  }

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
    previous.disabled = current === 0;
    next.disabled = current === pages.length - 1;
    counter.textContent = `${current + 1} / ${pages.length}`;
    counter.setAttribute('aria-label', `${pages.length}쪽 중 ${current + 1}쪽, ${active.dataset.pageLabel}`);
    renderView();
    // Load the current and adjacent artwork before the next navigation gesture.
    for (const nearby of pages.slice(Math.max(0, current - 1), current + 2)) {
      nearby.querySelector<HTMLImageElement>('.slide-artwork')!.loading = 'eager';
    }
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
    revealControls();
  }

  previous.addEventListener('click', () => showPage(current - 1, true));
  next.addEventListener('click', () => showPage(current + 1, true));
  textToggle.addEventListener('click', () => {
    textView = !textView;
    renderView();
    revealControls();
  });
  fullscreen.addEventListener('click', () => { void toggleFullscreen(); });
  document.addEventListener('fullscreenchange', () => setPresenting(document.fullscreenElement === reader));
  reader.addEventListener('pointermove', revealControls);
  reader.addEventListener('pointerdown', revealControls);
  controls.addEventListener('focusin', revealControls);
  controls.addEventListener('focusout', revealControls);
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
    if (event.key === 'Escape' && presenting) {
      event.preventDefault();
      void toggleFullscreen();
      return;
    }
    if (event.key.toLowerCase() === 'f' && !event.repeat) {
      event.preventDefault();
      void toggleFullscreen();
      return;
    }
    // In text view, arrow keys inside a table keep their scrolling behavior.
    if (textView && target.closest('.table-scroll')) return;
    let destination: number | undefined;
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') destination = current - 1;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') destination = current + 1;
    if (event.key === 'Home') destination = 0;
    if (event.key === 'End') destination = pages.length - 1;
    if (presenting && !textView) {
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
  window.addEventListener('popstate', restoreFromURL);
  window.addEventListener('hashchange', restoreFromURL);
  restoreFromURL();
}
