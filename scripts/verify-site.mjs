import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
const deck = JSON.parse(await readFile(new URL('../src/content/proposal-slides.json', import.meta.url), 'utf8'));
const research = JSON.parse(await readFile(new URL('../src/content/research.json', import.meta.url), 'utf8'));
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

// Check the built site as a visitor would follow it: all pages, local assets,
// and cross-page fragments. This complements the proposal's source checks.
const root = new URL('../dist/', import.meta.url);
const files = await readdir(root, { recursive: true });
const htmlFiles = files.filter(file => file.endsWith('/index.html') || file === 'index.html');
const pages = new Map(await Promise.all(htmlFiles.map(async file => [
  `/${file.replace(/index\.html$/, '')}`,
  await readFile(new URL(file, root), 'utf8'),
])));
assert.deepEqual([...pages.keys()].sort(), ['/', '/ideas/', '/ideas/gungri-brand-meetup/', '/ideas/gungri-overnight/', '/ideas/hongseong-stay-pass/', '/research/', ...research.map(entry=>`/research/${entry.slug}/`)].sort(), 'Home, legacy redirect, three ideas, research list and every article');
assert.match(pages.get('/ideas/'), /http-equiv="refresh"[^>]*content="0;url=\/"/, 'Legacy ideas address redirects home');
const redirects = await readFile(new URL('_redirects', root), 'utf8');
assert.match(redirects, /^\/ideas \/ 301$/m);
assert.match(redirects, /^\/ideas\/ \/ 301$/m);
pages.delete('/ideas/');

const origin = 'https://site.invalid';
let localLinks = 0;
for (const [path, html] of pages) {
  assert.match(html, /<html\b[^>]*lang="ko"/, `${path}: Korean document`);
  assert.match(html, /<title>[^<]+ \| 홍성 아이디어북<\/title>/, `${path}: page title`);
  assert.match(html, /noindex, nofollow, noarchive/, `${path}: search exclusion`);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path}: one main heading`);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1, `${path}: selected site menu`);
  const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] ?? '';
  const links = [...header.matchAll(/<a\b[^>]*>/g)].map(match => attributes(match[0]));
  const pdf = links.find(link => link.id === 'pdf-download');
  assert.equal(pdf?.href, deck.download.src, `${path}: PDF directly in the header`);
  assert.equal(pdf?.download, escape(deck.download.filename));
  assert.equal(pdf?.type, 'application/pdf');
  assert.ok(pdf?.['aria-label'].includes(`${deck.pageCount}쪽`));
  assert.ok(header.indexOf('href="/research/"') < header.indexOf('id="pdf-download"'), `${path}: PDF after research`);
  assert.ok(!header.includes('>제안서</a>'), `${path}: no proposal menu`);
  assert.ok(!/proposal-reader|slide-artwork|proposal-download|fullscreen-toggle/.test(html), `${path}: archived viewer not rendered`);
  for (const link of [...html.matchAll(/<a\b[^>]*data-ideas-return[^>]*>/g)].map(match => attributes(match[0]))) {
    assert.equal(link.href, '/', `${path}: detail returns home`);
  }

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${path}: unique IDs`);

  if (path === '/' || path.startsWith('/ideas/')) {
    for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
      const link = attributes(tag);
      assert.equal(new URL(link.href, origin).origin, origin, `${path}: references use internal research summaries`);
      assert.notEqual(link.target, '_blank', `${path}: internal reading stays in this tab`);
    }
  }

  for (const match of html.matchAll(/<(?:a|link|script|img)\b[^>]*\b(?:href|src)="([^"]+)"/g)) {
    const url = new URL(match[1].replace(/&amp;/g, '&'), origin + path);
    if (url.origin !== origin) continue;
    const target = pages.get(url.pathname);
    if (target !== undefined) {
      if (url.hash) {
        assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${path}: missing fragment ${url.pathname}${url.hash}`);
      }
    } else {
      await access(new URL(`.${url.pathname}`, root));
    }
    localLinks++;
  }

  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    assert.match(tag, /\balt="[^"]*"/, `${path}: image alternative text`);
    assert.match(tag, /\bwidth="\d+"/, `${path}: image width prevents layout shifts`);
    assert.match(tag, /\bheight="\d+"/, `${path}: image height prevents layout shifts`);
  }
}
const home = pages.get('/');
assert.match(home, /<title>아이디어 \| 홍성 아이디어북<\/title>/);
assert.match(home, /data-ideas-list/);
const sectionNav = home.match(/<nav\b[^>]*data-section-nav[\s\S]*?<\/nav>/)?.[0] ?? '';
const sectionLinks = [...sectionNav.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(sectionLinks, ['introduction', 'flow', 'programs', 'stay-pass', 'policy']);
assert.equal((sectionNav.match(/aria-current="location"/g) ?? []).length, 1);
await access(new URL('../src/archived/ProposalPage.astro', import.meta.url));
const researchList = pages.get('/research/');
assert.ok(researchList.includes(`조사 주제 ${research.length}개`));
assert.equal((researchList.match(/class="research-card"/g) ?? []).length, research.length);
for (const entry of research) {
  const article = pages.get(`/research/${entry.slug}/`);
  assert.ok(researchList.includes(`/research/${entry.slug}/?from=research`));
  assert.ok(article.includes('aria-label="현재 위치"'));
  assert.ok(article.includes(`/research/#research-card-${entry.slug}`));
  const disclosure = article.match(/<details\b[^>]*data-research-sources[^>]*>/)?.[0];
  assert.ok(disclosure && !/\bopen(?:\s|=|>)/.test(disclosure), `${entry.slug}: sources initially collapsed`);
  const sourceIds = new Set(entry.sources.map(source=>source.id));
  for (const section of entry.sections) for (const paragraph of section.paragraphs) {
    assert.ok(article.includes(escape(paragraph.text)), `${entry.slug}: paragraph preserved`);
    for (const id of paragraph.sourceIds) assert.ok(sourceIds.has(id), `${entry.slug}: source ${id} exists`);
  }
  for (const tag of article.matchAll(/<a\b[^>]*href="https?:[^>]*>/g)) {
    assert.ok(!tag[0].includes('target='), `${entry.slug}: external sources stay in this tab`);
  }
}
for (const [path, href] of [
  ['/', '/research/local-extinction-fund-2026/?from=home'],
  ['/', '/research/population-decline-designation/?from=home'],
  ['/', '/research/half-price-travel-2026/?from=home'],
  ['/ideas/hongseong-stay-pass/', '/research/hongseong-refund/?from=pass'],
  ['/ideas/gungri-brand-meetup/', '/research/toyota-tgr-rally-play/?from=rally'],
  ['/ideas/gungri-brand-meetup/', '/research/gangwon-eco-rally-2019/?from=rally'],
]) assert.ok(pages.get(path).includes(href), `${path}: shared research destination`);
for (const match of researchList.matchAll(/data-legacy-research-url="([^"]+)"/g)) {
  const url = new URL(match[1].replace(/&amp;/g,'&'), origin);
  assert.ok(pages.has(url.pathname), `Legacy research target ${url.pathname}`);
  if (url.hash) assert.ok(pages.get(url.pathname).includes(`id="${url.hash.slice(1)}"`), `Legacy anchor ${url.hash}`);
}
console.log(`Verified: ${pages.size} pages, legacy home redirect, ${localLinks} local links/assets, section navigation, shared PDF download and archived viewer exclusion.`);
