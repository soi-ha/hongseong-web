import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
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
assert.equal((html.match(/<img /g) ?? []).length, 8, '8 source photos');
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
console.log(`Verified: 29 sections, 16 tables (all cells in order), 8 photos, 29 notes, 22 condition blocks; ${blocks} source text blocks retained; anchors and assets valid.`);
