import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyProposalViewer } from './verify-proposal-viewer.mjs';

// Check the retained PDF and page artwork against one reviewed PDF manifest.
// Pixel equality to the source PDF is additionally checked by the importer's --verify-only.
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex');
const deck = JSON.parse(await read('src/content/proposal-slides.json'));
assert.equal(deck.pageCount, deck.slides.length);
assert.ok(deck.pageCount > 0);
assert.deepEqual(deck.webAdjustments, [], 'The edited final PDF must not receive cover/closing adjustments');
assert.deepEqual(deck.slides.map(s => s.number), Array.from({ length: deck.pageCount }, (_, i) => i + 1));
assert.equal(deck.download.sha256, deck.sourcePdfSha256, 'Artwork and download share one PDF');
assert.equal(deck.download.filename, deck.sourcePdf, 'Download retains original filename');
assert.equal(deck.download.bytes, deck.sourceBytes);
assert.ok(deck.download.src.includes(deck.sourcePdfSha256.slice(0, 16)), 'PDF content-versioned URL');
for (const prefix of ['public', 'dist']) {
  const pdf = await read(prefix + deck.download.src);
  assert.equal(hash(pdf), deck.sourcePdfSha256, `${prefix}: original PDF bytes`);
  assert.equal(pdf.length, deck.sourceBytes);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
}
for (const slide of deck.slides) {
  assert.ok(slide.src.includes(deck.sourcePdfSha256.slice(0, 16)) && slide.src.includes(slide.sha256.slice(0, 16)), 'Content-versioned artwork URL');
  for (const prefix of ['public', 'dist']) {
    const data = await read(prefix + slide.src);
    assert.equal(hash(data), slide.sha256, `page ${slide.number}: ${prefix} image hash`);
    assert.equal(data.length, slide.bytes);
    assert.equal(data.subarray(0, 4).toString(), 'RIFF');
    assert.equal(data.subarray(8, 12).toString(), 'WEBP');
    assert.equal(data.subarray(12, 16).toString(), 'VP8L', 'Lossless WebP');
    const bits = data.readUInt32LE(21);
    assert.equal((bits & 0x3fff) + 1, slide.pixelWidth);
    assert.equal(((bits >>> 14) & 0x3fff) + 1, slide.pixelHeight);
  }
}
assert.equal(hash(await read('src/content/proposal-v02.md')), '13941d277ec2d0a2bd8d1c0f6d92bd92bfca03d718972573377d104f917c10ce', 'Legacy source preserved, not used for new pages');
// The viewer is preserved outside the public routes. Opt in to its rendered
// checks after mounting src/archived/ProposalPage.astro on a future page.
if (process.argv[2] === '--viewer-html') {
  assert.ok(process.argv[3], 'Supply the rendered viewer HTML path');
  verifyProposalViewer(await readFile(process.argv[3], 'utf8'), deck);
}
console.log(`Verified: ${deck.pageCount} retained lossless PDF page assets, original PDF download bytes, dimensions and versioned URLs.`);
