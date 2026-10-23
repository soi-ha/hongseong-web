"""Read the reviewed PowerPoint PDF and export faithful 4K lossless WebP pages.

Tool-only dependencies: PyMuPDF 1.26.5, Pillow 11.3.0 (not website dependencies).
Usage: python scripts/import-proposal-slides.py --pdf /path/to/v03.pdf --pptx /path/to/v03.pptx
The originals are only read. The native PDF composition and photo crops are kept.
Accessible/selectable text is provided separately by Astro.
"""
import argparse
import hashlib
import json
from pathlib import Path
import pymupdf
from PIL import Image
import PIL

EXPECTED_PDF = 'b4f2da32468aae76ad304176f66b3c5d3e6d89285791ed7751ff323ab57977f2'
EXPECTED_PPTX = 'f8bf0632e1b36149eadfd952f19dc7ce4037be68e04b6ebbf42b7ee3c1cbc82f'
ROOT = Path(__file__).resolve().parent.parent

def digest(data):
    return hashlib.sha256(data).hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', required=True, type=Path)
    parser.add_argument('--pptx', required=True, type=Path)
    args = parser.parse_args()
    assert digest(args.pdf.read_bytes()) == EXPECTED_PDF, 'Review a new source version before importing.'
    assert digest(args.pptx.read_bytes()) == EXPECTED_PPTX, 'PPTX must match the reviewed v03 source.'
    document = pymupdf.open(args.pdf)
    assert len(document) == 30
    output = ROOT / 'public/slides/proposal-v03'
    output.mkdir(parents=True, exist_ok=True)
    slides = []
    for number, page in enumerate(document, 1):
        assert page.rect.width == 720 and page.rect.height == 405
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(3840 / 720, 3840 / 720), alpha=False)
        image = Image.frombytes('RGB', (pixmap.width, pixmap.height), pixmap.samples)
        name = f'slide-{number:02d}.webp'
        image.save(output / name, 'WEBP', lossless=True, method=6)
        assert Image.open(output / name).convert('RGB').tobytes() == image.tobytes(), 'Lossless pixel preservation'
        data = (output / name).read_bytes()
        slides.append({'number': number, 'src': f'/slides/proposal-v03/{name}',
                       'sha256': digest(data), 'bytes': len(data)})
    manifest = {
        'version': 'v03', 'guide': 'v15', 'width': 720, 'height': 405,
        'pixelWidth': 3840, 'pixelHeight': 2160,
        'sourcePptx': args.pptx.name, 'sourcePptxSha256': EXPECTED_PPTX,
        'sourcePdf': args.pdf.name, 'sourcePdfSha256': EXPECTED_PDF,
        'renderer': f'PyMuPDF {pymupdf.VersionBind}; Pillow {PIL.__version__}; lossless WebP',
        'slides': slides,
    }
    (ROOT / 'src/content/proposal-slides.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Imported {len(slides)} lossless 4K slides, {sum(s["bytes"] for s in slides):,} bytes.')

if __name__ == '__main__':
    main()
