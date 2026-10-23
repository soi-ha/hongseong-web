import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';

// Check the built site as a visitor would follow it: all pages, local assets,
// and cross-page fragments. This complements the proposal's source checks.
const root = new URL('../dist/', import.meta.url);
const files = await readdir(root, { recursive: true });
const htmlFiles = files.filter(file => file.endsWith('/index.html') || file === 'index.html');
const pages = new Map(await Promise.all(htmlFiles.map(async file => [
  `/${file.replace(/index\.html$/, '')}`,
  await readFile(new URL(file, root), 'utf8'),
])));
assert.equal(pages.size, 6, 'Proposal, ideas list, three examples and research');

const origin = 'https://site.invalid';
let localLinks = 0;
for (const [path, html] of pages) {
  assert.match(html, /<html\b[^>]*lang="ko"/, `${path}: Korean document`);
  assert.match(html, /<title>[^<]+ \| 홍성 아이디어북<\/title>/, `${path}: page title`);
  assert.match(html, /noindex, nofollow, noarchive/, `${path}: search exclusion`);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path}: one main heading`);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1, `${path}: selected site menu`);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${path}: unique IDs`);

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
console.log(`Verified: ${pages.size} pages, ${localLinks} local links/assets, cross-page anchors, titles, navigation, image dimensions and search exclusion.`);
