// Ordinary documents and links own browser back/forward restoration.
// Only explicit return links request our saved position; origin values are allowlisted in HTML.
const researchPositionKey = 'hongseong:research:position';
const researchPendingKey = 'hongseong:research:pending';
interface ResearchPosition { destination: string; origin: string; y: number; returnHref?: string; policyOpen?: boolean }
function readResearchPosition(key: string): ResearchPosition | undefined {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (value && typeof value.destination === 'string' && typeof value.origin === 'string'
      && value.origin.startsWith('/') && !value.origin.startsWith('//')
      && Number.isFinite(value.y) && value.y >= 0) return value;
  } catch { /* Native links work without storage. */ }
}
function saveResearchPosition(key: string, value: ResearchPosition) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Optional enhancement. */ }
}
function resolveLegacyResearch() {
  if (!document.querySelector('[data-research-list]')) return;
  let id = '';
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  const href = target?.dataset.legacyResearchUrl;
  if (href?.startsWith('/research/')) location.replace(href);
}
resolveLegacyResearch();
window.addEventListener('hashchange', resolveLegacyResearch);

// Reopen the home explanation before restoring its link focus and reading position.
const policyDisclosure = document.querySelector<HTMLDetailsElement>('#policy-more');
if (policyDisclosure) {
  const pending = readResearchPosition(researchPendingKey);
  const returning = pending?.returnHref === location.pathname + location.search + location.hash;
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if ((returning && pending?.policyOpen) || (navigation?.type === 'back_forward' && history.state?.policyOpen)) policyDisclosure.open = true;
  window.addEventListener('pagehide', () => {
    history.replaceState({...history.state, policyOpen:policyDisclosure.open}, '');
  });
}

// Reveal citations before native anchor navigation. Keep ordinary visits collapsed.
function revealResearchSource(hash: string) {
  let id = '';
  try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  const disclosure = target?.closest<HTMLDetailsElement>('[data-research-sources]')
    ?? (id === 'sources' ? target?.querySelector<HTMLDetailsElement>('[data-research-sources]') : null);
  if (!disclosure || disclosure.open) return;
  disclosure.open = true;
  return target;
}
revealResearchSource(location.hash);
const sourceDisclosure = document.querySelector<HTMLDetailsElement>('[data-research-sources]');
if (sourceDisclosure) {
  // A collapsed document is shorter; restore its open state before restoring scroll.
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const reading = navigation?.type === 'back_forward' ? history.state?.researchReading : undefined;
  const restoreReading = reading && typeof reading.open === 'boolean' && Number.isFinite(reading.y) && reading.y >= 0;
  if (restoreReading) sourceDisclosure.open = reading.open;
  window.addEventListener('pagehide', () => {
    history.replaceState({...history.state, researchReading:{open:sourceDisclosure.open,y:scrollY}}, '');
  });
  window.addEventListener('pageshow', async event => {
    if (!restoreReading || event.persisted) return;
    await document.fonts.ready;
    requestAnimationFrame(() => window.scrollTo({top:reading.y,behavior:'instant'}));
  });
}
window.addEventListener('hashchange', () => {
  const revealed = revealResearchSource(location.hash);
  if (revealed) revealed.scrollIntoView({behavior:'instant', block:'start'});
});
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a') : null;
  if (link && !link.target && link.origin === location.origin && link.pathname === location.pathname
    && link.search === location.search && link.hash) revealResearchSource(link.hash);
}, {capture:true});
const from = new URLSearchParams(location.search).get('from');
document.querySelectorAll<HTMLAnchorElement>('[data-research-origin]').forEach(link => {
  link.hidden = link.dataset.researchOrigin !== from;
});
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a') : null;
  if (!link || link.target || link.hasAttribute('download')) return;
  if (link.hasAttribute('data-research-link')) {
    saveResearchPosition(researchPositionKey, { destination: link.pathname + link.search, origin: location.pathname + location.search + location.hash, y: scrollY, policyOpen:policyDisclosure?.open });
  } else if (link.hasAttribute('data-research-return')) {
    const saved = readResearchPosition(researchPositionKey);
    // A list return from an idea-origin visit must land on the list card, not reuse the idea's y.
    if (saved && saved.destination === location.pathname + location.search
      && new URL(saved.origin, location.origin).pathname === link.pathname) {
      saveResearchPosition(researchPendingKey, {...saved, returnHref: link.pathname + link.search + link.hash});
    }
  }
});
window.addEventListener('pageshow', async event => {
  const pending = readResearchPosition(researchPendingKey);
  if (!pending || pending.returnHref !== location.pathname + location.search + location.hash) return;
  try { sessionStorage.removeItem(researchPendingKey); } catch { /* Optional enhancement. */ }
  if (event.persisted) return;
  await document.fonts.ready;
  requestAnimationFrame(() => {
    const link = [...document.querySelectorAll<HTMLAnchorElement>('[data-research-link]')]
      .find(link => link.pathname + link.search === pending.destination);
    link?.focus({preventScroll:true});
    window.scrollTo({top:pending.y,behavior:'instant'});
  });
});
