/** Native fullscreen and the in-window presentation fallback. */
export function setupPresentation(reader: HTMLElement) {
  const stage = reader.querySelector<HTMLElement>('.reader-stage')!;
  const controls = reader.querySelector<HTMLElement>('.reader-controls')!;
  const fullscreen = reader.querySelector<HTMLButtonElement>('#fullscreen-toggle')!;
  const status = reader.querySelector<HTMLElement>('#reader-status')!;
  const outsideNavigation = [...document.querySelectorAll<HTMLElement>('body > .site-header, body > .skip-link')]
    .map(element => ({ element, inert: element.inert }));
  let presenting = false;
  let fullscreenPending = false;
  let idleTimer: ReturnType<typeof setTimeout>;
  let statusTimer: ReturnType<typeof setTimeout>;

  function revealControls() {
    reader.classList.remove('controls-idle');
    clearTimeout(idleTimer);
    if (presenting) idleTimer = setTimeout(() => {
      if (!controls.contains(document.activeElement)) reader.classList.add('controls-idle');
    }, 2200);
  }

  function setPresenting(value: boolean) {
    if (presenting === value) return;
    presenting = value;
    reader.classList.toggle('is-presenting', value);
    for (const item of outsideNavigation) item.element.inert = value || item.inert;
    fullscreen.setAttribute('aria-pressed', String(value));
    const label = value ? '전체 화면 종료' : '전체 화면 시작';
    fullscreen.setAttribute('aria-label', label);
    fullscreen.title = label + (value ? ' (Esc)' : ' (F)');
    fullscreen.querySelector('.fullscreen-label')!.textContent = value ? '전체 화면 종료' : '전체 화면';
    if (value) {
      stage.focus({ preventScroll: true });
    } else {
      fullscreen.focus({ preventScroll: true });
      clearTimeout(statusTimer);
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
      } else if (typeof reader.requestFullscreen === 'function' && document.fullscreenEnabled) {
        await reader.requestFullscreen();
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

  fullscreen.addEventListener('click', () => { void toggleFullscreen(); });
  document.addEventListener('fullscreenchange', () => setPresenting(document.fullscreenElement === reader));
  // Pointer movement is frequent; touch the DOM at most once per frame,
  // and only while the presentation controls can actually be hidden.
  let pointerFrame = 0;
  reader.addEventListener('pointermove', () => {
    if (!presenting || pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      revealControls();
    });
  }, { passive: true });
  reader.addEventListener('pointerdown', revealControls);
  controls.addEventListener('focusin', revealControls);
  controls.addEventListener('focusout', revealControls);

  return { isPresenting: () => presenting, toggle: toggleFullscreen, revealControls };
}
