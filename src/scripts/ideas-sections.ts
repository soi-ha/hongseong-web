// Native fragment links handle scrolling and browser history, even without JS.
// Home and detail pages share the indicator and narrow-screen tab positioning.
const sectionNav = document.querySelector<HTMLElement>('[data-section-nav]');
if (sectionNav) {
  const links = [...sectionNav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  const list = sectionNav.querySelector('ol')!;
  let current: HTMLAnchorElement | undefined;
  let queued = false;
  let navigation: { index: number; landedY?: number } | undefined;

  function followFragment(hash: string) {
    const index = links.findIndex(link => link.hash === hash);
    navigation = index < 0 ? undefined : { index };
    scheduleUpdate();
  }

  function update() {
    queued = false;
    const y = window.scrollY;
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    let selected = 0;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= parseFloat(getComputedStyle(section).scrollMarginTop) + 16) selected = index;
    });
    // Short final sections cannot reach the top without artificial empty space.
    // Ordinary scrolling selects the last section at the real document end.
    if (maxY > 0 && y >= maxY - 2) selected = links.length - 1;
    if (navigation) {
      const section = sections[navigation.index];
      if (section) {
        const targetY = Math.min(maxY, Math.max(0, y + section.getBoundingClientRect().top - parseFloat(getComputedStyle(section).scrollMarginTop)));
        if (Math.abs(y - targetY) <= 2) navigation.landedY = y;
      }
      // Two links may land at the same bottom position. Keep the link actually
      // followed selected until the reader moves away, including after a toggle.
      if (navigation.landedY !== undefined) {
        if (Math.abs(y - navigation.landedY) <= 2) selected = navigation.index;
        else navigation = undefined;
      }
    }
    const next = links[selected];
    if (!next) return;
    if (current !== next) {
      links.forEach(link => link.removeAttribute('aria-current'));
      next.setAttribute('aria-current', 'location');
      current = next;
    }
  }

  function revealCurrentLink() {
    if (!current) return;
    if (window.matchMedia('(max-width: 106rem)').matches) {
      const linkRect = current.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      if (linkRect.left < listRect.left || linkRect.right > listRect.right) {
        list.scrollTo({ left: list.scrollLeft + linkRect.left - listRect.left - (list.clientWidth - linkRect.width) / 2, behavior: 'instant' });
      }
    } else {
      const linkRect = current.getBoundingClientRect();
      const navRect = sectionNav!.getBoundingClientRect();
      if (linkRect.top < navRect.top || linkRect.bottom > navRect.bottom) {
        sectionNav!.scrollTo({ top: sectionNav!.scrollTop + linkRect.top - navRect.top - (sectionNav!.clientHeight - linkRect.height) / 2, behavior: 'instant' });
      }
    }
  }

  function scheduleUpdate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  // Moving the horizontal tab list during a smooth document scroll can
  // interrupt the browser's anchor animation. Wait until it has finished.
  const refresh = () => { update(); revealCurrentLink(); };
  window.addEventListener('scrollend', refresh);
  window.addEventListener('resize', () => requestAnimationFrame(refresh));
  window.addEventListener('pageshow', refresh);
  links.forEach(link => link.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    followFragment(link.hash);
  }));
  window.addEventListener('hashchange', () => followFragment(location.hash));
  // A stale URL fragment must not override subsequent wheel/touch/key scrolling.
  const releaseNavigation = () => { navigation = undefined; scheduleUpdate(); };
  window.addEventListener('wheel', event => { if (event.deltaY) releaseNavigation(); }, { passive: true });
  window.addEventListener('touchmove', releaseNavigation, { passive: true });
  window.addEventListener('keydown', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (event.defaultPrevented || target?.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === ' ' && target?.closest('button, summary, a[href]')) return;
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) releaseNavigation();
  });
  const content = document.querySelector('[data-section-content]');
  if (content) new ResizeObserver(scheduleUpdate).observe(content);
  void document.fonts.ready.then(scheduleUpdate);
  followFragment(location.hash);
}
