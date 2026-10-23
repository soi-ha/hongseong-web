import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';

// Compare the built visitor page to the selected source, including every table cell
// and note. This catches omissions when the presentation layout changes.
const source = await readFile(new URL('../src/content/proposal-v02.md', import.meta.url), 'utf8');
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const renderer = await createSatteriMarkdownProcessor({ syntaxHighlight: false, features: { smartPunctuation: false } });
const text = html => html.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, name) => ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'"})[name]).replace(/\s+/g, '');
const pages = new Map([...html.matchAll(/<(?:article|section)\b[^>]*data-source-page="(\d+)"[^>]*>([\s\S]*?)<\/(?:article|section)>/g)].map(m => [Number(m[1]), m[2]]));
assert.equal(pages.size, 29, '29 source sections');
assert.equal((html.match(/<table>/g) ?? []).length, 16, '16 source tables');
assert.equal((html.match(/<summary>출처<\/summary>/g) ?? []).length, 29, '29 source disclosures with the requested short label');
assert.equal((html.match(/<blockquote>/g) ?? []).length, 22, '22 source condition/case blocks');
assert.equal((html.match(/<img /g) ?? []).length, 38, '8 source photos and 30 slide artworks');
assert.equal((html.match(/class="slide-artwork"/g) ?? []).length, 30, '30 visual slides');
assert.ok(!html.includes('id="page-select"'), 'No page select box');
assert.ok(html.includes('id="fullscreen-toggle"'), 'Fullscreen control');
assert.ok(!html.includes('<del>'), 'Numeric ranges must not become strikethrough');
const sections = [...source.matchAll(/^## (\d{2})\. (.+)$/gm)];
let blocks = 0;
for (let i = 0; i < sections.length; i++) {
  const match = sections[i];
  const number = Number(match[1]);
  const markdown = source.slice(match.index + match[0].length, sections[i + 1]?.index ?? source.length).replace(/(?<!\\)~/g, '\\~');
  const expected = (await renderer.render(markdown)).code;
  const actual = text(pages.get(number));
  for (const block of expected.matchAll(/<(p|h3|h4|th|td|summary)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    // The user requested this UI label change; all note paragraphs remain exact.
    const value = block[1] === 'summary' && text(block[2]) === '출처·발표자노트' ? '출처' : text(block[2]);
    if (!value) continue; // An image-only paragraph is verified separately below.
    assert.ok(actual.includes(value), `page ${number}: omitted or changed: ${value.slice(0, 100)}`);
    blocks++;
  }
  // Exact ordered cell contents also catch moving a value into the wrong column.
  const cells = value => [...value.matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m => text(m[2]));
  assert.deepEqual(cells(pages.get(number)), cells(expected), `page ${number}: table values/order`);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'Unique heading IDs');
for (const [, href] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(href), `Missing anchor ${href}`);
for (const [, src] of html.matchAll(/<img[^>]+src="([^"]+)"/g)) await access(new URL(`../dist${src}`, import.meta.url));
assert.ok(!/file:\/\/|\/Users\/|구성안_PPT_제작자료/.test(html), 'No local source paths in deployed HTML');
assert.ok(html.includes('noindex, nofollow, noarchive'), 'Internal review search exclusion');
const deck = JSON.parse(await readFile(new URL('../src/content/proposal-slides.json', import.meta.url), 'utf8'));
assert.equal(deck.sourcePdfSha256, 'b4f2da32468aae76ad304176f66b3c5d3e6d89285791ed7751ff323ab57977f2', 'Reviewed final v03 PDF');
assert.equal(deck.slides.length, 30);
assert.deepEqual(deck.slides.map(s => s.number), Array.from({length: 30}, (_, i) => i + 1));
for (const slide of deck.slides) {
  const bytes = await readFile(new URL(`../dist${slide.src}`, import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), slide.sha256, `slide ${slide.number}: artwork integrity`);
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
  assert.equal(bytes.subarray(12, 16).toString(), 'VP8L', 'Lossless WebP');
}
assert.equal(deck.pixelWidth, 3840);
assert.equal(deck.pixelHeight, 2160);
console.log(`Verified: 30 PPT v03 lossless slides; 29 source sections, 16 tables (all cells in order), 8 photos, 29 notes, 22 condition blocks; ${blocks} source text blocks retained; anchors, artwork hashes and assets valid.`);
