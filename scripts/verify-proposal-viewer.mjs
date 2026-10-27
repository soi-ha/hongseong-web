import assert from 'node:assert/strict';

export function verifyProposalViewer(html, deck) {
  const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
  assert.ok(!/source-button|source-dialog|data-source-page|aria-haspopup="dialog"/.test(html), 'No stale MD source mapping');
  assert.ok(!/v03|v02|30쪽|1박 코스|1박 패스|가이드 v16|\.pptx?|file:\/\/|\/Users\//.test(html), 'No previous version labels, PPT download or local paths');
  assert.ok(!/<table\b|class="slide-text/.test(html), 'No rewritten PDF body');
  const pageTags = [...html.matchAll(/<div\b[^>]*class="proposal-page"[^>]*>/g)].map(m => attributes(m[0]));
  const artworks = [...html.matchAll(/<img\b[^>]*class="slide-artwork"[^>]*>/g)].map(m => attributes(m[0]));
  assert.equal(pageTags.length, deck.pageCount);
  assert.equal(artworks.length, deck.pageCount);
  for (const [i, slide] of deck.slides.entries()) {
    const id = `page-${String(slide.number).padStart(2, '0')}`;
    assert.equal(pageTags[i].id, id, `page ${slide.number}: order and direct URL`);
    assert.equal(pageTags[i]['data-page'], String(slide.number));
    assert.equal(pageTags[i].style, `--slide-ratio: ${slide.width / slide.height}`);
    assert.equal(artworks[i].src, slide.src);
    assert.equal(artworks[i].alt, escape(`${slide.number} / ${deck.pageCount} · ${slide.label} · ${slide.title}`));
    assert.equal(Number(artworks[i].width), slide.pixelWidth);
    assert.equal(Number(artworks[i].height), slide.pixelHeight);
  }
  for (const group of deck.groups) {
    const link = [...html.matchAll(/<a\b[^>]*>/g)].map(m => attributes(m[0])).find(a => a.href === `#${group.id}`);
    assert.equal(Number(link?.['data-start-page']), group.from);
    const pageStart = html.indexOf(`id="page-${String(group.from).padStart(2, '0')}"`);
    const nextPage = html.indexOf('class="proposal-page"', pageStart);
    const anchor = html.indexOf(`id="${group.id}"`, pageStart);
    assert.ok(anchor > pageStart && (nextPage === -1 || anchor < nextPage), `Contents ${group.id} lands on PDF page ${group.from}`);
  }
  for (const anchor of deck.legacyAnchors) {
    const pageStart = html.indexOf(`id="page-${String(anchor.page).padStart(2, '0')}"`);
    const nextPage = html.indexOf('class="proposal-page"', pageStart);
    const position = html.indexOf(`id="${anchor.id}"`, pageStart);
    assert.ok(position > pageStart && (nextPage === -1 || position < nextPage), `Legacy link ${anchor.id} resolves to the reviewed PDF section`);
  }
  const downloadTag = [...html.matchAll(/<a\b[^>]*>/g)].map(m => attributes(m[0])).find(a => a.id === 'archived-pdf-download');
  assert.equal(downloadTag?.href, deck.download.src);
  assert.equal(downloadTag?.download, escape(deck.sourcePdf));
  assert.equal(downloadTag?.type, 'application/pdf');
  assert.ok(downloadTag?.['aria-label'].includes(`${deck.pageCount}쪽`));
  for (const control of ['page-counter', 'previous-page', 'next-page', 'fullscreen-toggle']) assert.ok(html.includes(`id="${control}"`));
  assert.match(html, new RegExp(`id="page-counter"[^>]*>1 / ${deck.pageCount}<`));
}
