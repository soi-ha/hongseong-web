"""Render the reviewed v03 PDF with the v16 cover/closing text exclusions.

Tool-only dependencies: PyMuPDF 1.26.5, Pillow 11.3.0 (not website dependencies).
Usage: python scripts/import-proposal-slides.py --pdf /path/to/v03.pdf --pptx /path/to/v03.pptx --guide /path/to/v16.md
The originals are only read. Text operators are removed in memory, not covered
with rectangles or painted over. All other composition and photo crops are kept.
Accessible/selectable text is provided separately by Astro.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
import pymupdf
from PIL import Image
import PIL

EXPECTED_PDF = 'b4f2da32468aae76ad304176f66b3c5d3e6d89285791ed7751ff323ab57977f2'
EXPECTED_PPTX = 'f8bf0632e1b36149eadfd952f19dc7ce4037be68e04b6ebbf42b7ee3c1cbc82f'
EXPECTED_GUIDE = '74485d5fc93482089a23addaf02214d6497af6a3d101cc8042e50d3e7bca99f6'
ROOT = Path(__file__).resolve().parent.parent

def digest(data):
    return hashlib.sha256(data).hexdigest()

def apply_cover_closing_guide(document, page, number):
    # This narrow stream transform is only valid for the hash-pinned v03 PDF.
    # Its 7pt header/date and 8pt condition note use the following Tm scales.
    # Retain the enclosing graphics operations, images, motifs and other text.
    stream = page.read_contents()
    blocks = list(re.finditer(rb'\bBT\b.*?\bET\b', stream, re.S))
    assert len(blocks) == (39 if number == 1 else 17), 'Unexpected PDF text structure'
    matrix = rb'([-\d.]+)\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+Tm\b'
    removed = []
    for block in blocks:
        scales = re.findall(matrix, block.group())
        if any(abs(float(scale) - target) < .001 for scale in scales for target in (29.16667, 33.33333)):
            removed.append(block)
    assert len(removed) == (23 if number == 1 else 2), 'Unexpected header/note count'
    spans = lambda p: [span for block in p.get_text('dict')['blocks'] if 'lines' in block
                       for line in block['lines'] for span in line['spans']]
    before = spans(page)
    retained = [span for span in before if span['size'] > 8.1]
    assert len(before) - len(retained) == (4 if number == 1 else 2)
    for block in reversed(removed):
        stream = stream[:block.start()] + stream[block.end():]
    xrefs = page.get_contents()
    assert len(xrefs) == 1
    document.update_stream(xrefs[0], stream)
    page = document.reload_page(page)
    assert spans(page) == retained, 'Title/subtitle text, placement and typography must be preserved'
    return page, {'slide': number, 'removedTextBlocks': len(removed),
                  'excluded': ['document-name', 'date'] + (['condition-note'] if number == 1 else [])}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', required=True, type=Path)
    parser.add_argument('--pptx', required=True, type=Path)
    parser.add_argument('--guide', required=True, type=Path)
    args = parser.parse_args()
    assert digest(args.pdf.read_bytes()) == EXPECTED_PDF, 'Review a new source version before importing.'
    assert digest(args.pptx.read_bytes()) == EXPECTED_PPTX, 'PPTX must match the reviewed v03 source.'
    assert digest(args.guide.read_bytes()) == EXPECTED_GUIDE, 'Review guide changes before importing.'
    document = pymupdf.open(args.pdf)
    assert len(document) == 30
    output = ROOT / 'public/slides/proposal-v03'
    output.mkdir(parents=True, exist_ok=True)
    slides = []
    adjustments = []
    for number, page in enumerate(document, 1):
        assert page.rect.width == 720 and page.rect.height == 405
        if number in (1, 30):
            page, adjustment = apply_cover_closing_guide(document, page, number)
            adjustments.append(adjustment)
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(3840 / 720, 3840 / 720), alpha=False)
        image = Image.frombytes('RGB', (pixmap.width, pixmap.height), pixmap.samples)
        name = f'slide-{number:02d}.webp'
        image.save(output / name, 'WEBP', lossless=True, method=6)
        assert Image.open(output / name).convert('RGB').tobytes() == image.tobytes(), 'Lossless pixel preservation'
        data = (output / name).read_bytes()
        slides.append({'number': number, 'src': f'/slides/proposal-v03/{name}',
                       'sha256': digest(data), 'bytes': len(data)})
    manifest = {
        'version': 'v03', 'guide': 'v16', 'width': 720, 'height': 405,
        'pixelWidth': 3840, 'pixelHeight': 2160,
        'sourcePptx': args.pptx.name, 'sourcePptxSha256': EXPECTED_PPTX,
        'sourcePdf': args.pdf.name, 'sourcePdfSha256': EXPECTED_PDF,
        'sourceGuide': args.guide.name, 'sourceGuideSha256': EXPECTED_GUIDE,
        'webAdjustments': {'method': 'remove-native-text-operators-in-memory', 'pages': adjustments},
        'renderer': f'PyMuPDF {pymupdf.VersionBind}; Pillow {PIL.__version__}; lossless WebP',
        'slides': slides,
    }
    (ROOT / 'src/content/proposal-slides.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Imported {len(slides)} lossless 4K slides, {sum(s["bytes"] for s in slides):,} bytes.')

if __name__ == '__main__':
    main()
