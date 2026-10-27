// Keep ordinary links and native back/forward behavior. Only an explicit
// "아이디어 목록으로" link requests restoration on a fresh list visit.
const key = 'hongseong:ideas:return';
interface ReturnPosition { y: number; href: string; linkKey?: string; restore: boolean }

function readPosition(): ReturnPosition | undefined {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (value && Number.isFinite(value.y) && value.y >= 0
      && typeof value.href === 'string' && value.href.startsWith('/ideas/')
      && (value.linkKey === undefined || typeof value.linkKey === 'string')
      && typeof value.restore === 'boolean') return value;
  } catch { /* Storage may be unavailable; ordinary navigation still works. */ }
}

function savePosition(value: ReturnPosition) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Optional enhancement. */ }
}

document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a') : null;
  if (!link || link.target || link.hasAttribute('download')) return;
  if (link.matches('[data-idea-detail-link]') && document.querySelector('[data-ideas-list]')) {
    savePosition({ y: window.scrollY, href: link.getAttribute('href')!, linkKey: link.getAttribute('data-idea-detail-link') || undefined, restore: false });
  } else if (link.matches('[data-ideas-return]')) {
    const saved = readPosition();
    if (saved) savePosition({ ...saved, restore: true });
  }
});

window.addEventListener('pageshow', async () => {
  if (!document.querySelector('[data-ideas-list]')) return;
  const saved = readPosition();
  if (!saved?.restore) return;
  savePosition({ ...saved, restore: false });
  if (location.hash) return;
  // Intrinsic image dimensions reserve space; wait for the local font before
  // restoring the text layout. No animated scroll, including reduced motion.
  const initialY = window.scrollY;
  await document.fonts.ready;
  requestAnimationFrame(() => {
    if (location.hash || window.scrollY !== initialY) return;
    const link = [...document.querySelectorAll<HTMLAnchorElement>('[data-idea-detail-link]')]
      .find(candidate => candidate.getAttribute('href') === saved.href
        && (!saved.linkKey || candidate.getAttribute('data-idea-detail-link') === saved.linkKey));
    link?.focus({ preventScroll: true });
    window.scrollTo({ top: saved.y, behavior: 'instant' });
  });
});
