import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';

// Slide images preserve the reviewed PPT; the modal must preserve the right
// source URLs and note statements for each page without rendering a second body.
const source = await readFile(new URL('../src/content/proposal-v02.md', import.meta.url), 'utf8');
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const renderer = await createSatteriMarkdownProcessor({ syntaxHighlight: false, features: { smartPunctuation: false } });
const text = html => html.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, name) => ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'"})[name]).replace(/\s+/g, '');
const pages = new Map([...html.matchAll(/<(?:article|section)\b[^>]*data-source-page="(\d+)"[^>]*>([\s\S]*?)<\/(?:article|section)>/g)].map(m => [Number(m[1]), m[2]]));
assert.equal(createHash('sha256').update(source).digest('hex'), '13941d277ec2d0a2bd8d1c0f6d92bd92bfca03d718972573377d104f917c10ce', 'Original full source snapshot is unchanged');
assert.equal(pages.size, 30, '30 page-specific source panels');
assert.equal((html.match(/<dialog\b/g) ?? []).length, 1, 'One source dialog');
assert.ok(html.includes('aria-haspopup="dialog"'), 'Source button opens a dialog');
assert.ok(!/class="slide-text|id="text-toggle"|<table>/.test(html), 'No alternate body page');
assert.equal((html.match(/<img /g) ?? []).length, 30, '30 slide artworks, no alternate photo/body view');
assert.equal((html.match(/class="slide-artwork"/g) ?? []).length, 30, '30 visual slides');
assert.ok(!html.includes('id="page-select"'), 'No page select box');
assert.ok(html.includes('id="fullscreen-toggle"'), 'Fullscreen control');
assert.ok(!html.includes('<del>'), 'Numeric ranges must not become strikethrough');
const sections = [...source.matchAll(/^## (\d{2})\. (.+)$/gm)];
let statements = 0;
let linkCount = 0;
const hrefs = value => [...value.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map(m => m[1].replace(/&amp;/g, '&'));
for (let i = 0; i < sections.length; i++) {
  const match = sections[i];
  const number = Number(match[1]);
  const markdown = source.slice(match.index + match[0].length, sections[i + 1]?.index ?? source.length).replace(/(?<!\\)~/g, '\\~');
  const expected = (await renderer.render(markdown)).code.match(/<details>([\s\S]*?)<\/details>/)?.[1];
  assert.ok(expected, `page ${number}: original notes exist`);
  const actual = text(pages.get(number));
  for (const paragraph of expected.matchAll(/<p>([\s\S]*?)<\/p>/g)) {
    for (const line of paragraph[1].split(/<br\s*\/?>/)) {
      if (/<a\b/.test(line)) continue; // URLs are checked exactly below, as labeled cards.
      const value = text(line);
      if (!value) continue;
      assert.ok(actual.includes(value), `page ${number}: omitted note: ${value.slice(0, 100)}`);
      statements++;
    }
  }
  const expectedLinks = [...new Set(hrefs(expected))].sort();
  assert.deepEqual(hrefs(pages.get(number)).sort(), expectedLinks, `page ${number}: exact source URLs, no cross-page links`);
  if (!expectedLinks.length) assert.ok(pages.get(number).includes('이 페이지에 등록된 외부 출처 링크가 없습니다.'), `page ${number}: honest empty state`);
  linkCount += expectedLinks.length;
}
assert.deepEqual(hrefs(pages.get(30)).sort(), hrefs(pages.get(1)).sort(), 'Closing and cover use the same photo sources');
for (const [, anchor] of html.matchAll(/(<a\b[^>]*href="https?:[^>]*>)/g)) {
  assert.ok(anchor.includes('target="_blank"') && anchor.includes('rel="noopener noreferrer"'), 'Sources open safely in a new tab');
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
console.log(`Verified: 30 PPT v03 lossless slides; 30 source panels, ${linkCount} original page-specific links and ${statements} note statements; closing photo sources; full source snapshot, anchors and artwork hashes unchanged.`);
