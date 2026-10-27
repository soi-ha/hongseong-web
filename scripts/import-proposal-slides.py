"""Import a reviewed PDF unchanged, together with lossless page artwork.

Tool-only dependencies: PyMuPDF and Pillow (not website dependencies).
Import: python scripts/import-proposal-slides.py --pdf /path/final.pdf --metadata /path/reviewed.json
Verify: python scripts/import-proposal-slides.py --pdf /path/final.pdf --verify-only

Metadata contains version, sourcePdfSha256, slides[{number,title,label}],
groups[{id,label,from}] and optional legacyAnchors[{id,page}]. Reuse the current manifest when reimporting the same PDF;
review the titles and contents again when its bytes change. No PPT/MD is read.
No text removal, redaction, crop, overlay or PDF rewrite is performed.
"""
import argparse
import hashlib
import io
import json
import re
import unicodedata
from pathlib import Path
import pymupdf
from PIL import Image
import PIL

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'src/content/proposal-slides.json'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical_text(value):
    return re.sub(r'\W', '', unicodedata.normalize('NFC', value), flags=re.UNICODE)


def render(page, long_edge):
    scale = long_edge / max(page.rect.width, page.rect.height)
    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), colorspace=pymupdf.csRGB, alpha=False, annots=True)
    return Image.frombytes('RGB', (pixmap.width, pixmap.height), pixmap.samples)


def check_metadata(metadata, document, source_hash):
    assert metadata['sourcePdfSha256'] == source_hash, 'PDF changed: review page titles and contents before importing.'
    assert [s['number'] for s in metadata['slides']] == list(range(1, len(document) + 1)), 'Metadata must follow every PDF page in order.'
    for info, page in zip(metadata['slides'], document):
        assert info['title'].strip() and info['label'].strip()
        assert canonical_text(info['title']) in canonical_text(page.get_text()), f'Title not found on PDF page {info["number"]}'
    groups = metadata['groups']
    assert [g['from'] for g in groups] == sorted(set(g['from'] for g in groups)), 'Contents must be ordered and unique.'
    assert all(1 <= g['from'] <= len(document) for g in groups)
    ids = [g['id'] for g in groups]
    aliases = metadata.get('legacyAnchors', [])
    assert all(1 <= alias['page'] <= len(document) for alias in aliases)
    ids.extend(alias['id'] for alias in aliases)
    assert len(ids) == len(set(ids)) and all(re.fullmatch(r'[a-z][a-z0-9-]*', id) and id != 'top' and not id.startswith('page-') for id in ids)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pdf', required=True, type=Path)
    parser.add_argument('--metadata', type=Path, default=MANIFEST)
    parser.add_argument('--long-edge', type=int, default=3840)
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    source_bytes = args.pdf.read_bytes()
    source_hash = digest(source_bytes)
    document = pymupdf.open(stream=source_bytes, filetype='pdf')
    assert not document.is_encrypted and len(document), 'A readable, nonempty PDF is required.'
    metadata = json.loads((MANIFEST if args.verify_only else args.metadata).read_text(encoding='utf-8'))
    check_metadata(metadata, document, source_hash)

    if args.verify_only:
        assert metadata['webAdjustments'] == []
        assert metadata['pageCount'] == len(document)
        assert (ROOT / 'public' / metadata['download']['src'].lstrip('/')).read_bytes() == source_bytes, 'Download differs from source PDF.'
        for slide, page in zip(metadata['slides'], document):
            path = ROOT / 'public' / slide['src'].lstrip('/')
            data = path.read_bytes()
            assert digest(data) == slide['sha256'] and len(data) == slide['bytes']
            expected = render(page, metadata['renderLongEdge'])
            with Image.open(path) as decoded:
                assert decoded.size == expected.size == (slide['pixelWidth'], slide['pixelHeight'])
                assert decoded.convert('RGB').tobytes() == expected.tobytes(), f'PDF pixel mismatch on page {slide["number"]}'
            assert [slide['width'], slide['height']] == [page.rect.width, page.rect.height]
            assert slide['rotation'] == page.rotation
        print(f'Verified {len(document)} complete PDF pages: decoded pixels, order, dimensions, hashes and byte-identical download.')
        return

    assert 720 <= args.long_edge <= 7680, 'Use a readable, bounded rendering size.'
    # Source and artwork hashes give new URLs even when the source filename stays the same.
    public = ROOT / 'public'
    output = public / 'slides' / f'proposal-{source_hash[:16]}'
    output.mkdir(parents=True, exist_ok=True)
    slides = []
    for info, page in zip(metadata['slides'], document):
        image = render(page, args.long_edge)
        buffer = io.BytesIO()
        image.save(buffer, 'WEBP', lossless=True, method=6)
        data = buffer.getvalue()
        image_hash = digest(data)
        name = f'page-{info["number"]:02d}-{image_hash[:16]}.webp'
        path = output / name
        path.write_bytes(data)
        with Image.open(path) as decoded:
            assert decoded.convert('RGB').tobytes() == image.tobytes(), 'Lossless pixel preservation'
        slides.append({**{key: info[key] for key in ('number', 'title', 'label')},
                       'width': page.rect.width, 'height': page.rect.height, 'rotation': page.rotation,
                       'pixelWidth': image.width, 'pixelHeight': image.height,
                       'src': '/' + str(path.relative_to(public)), 'sha256': image_hash, 'bytes': len(data)})
        print(f'Rendered {info["number"]}/{len(document)}: {image.width}x{image.height}', flush=True)
    download_path = public / 'downloads' / f'proposal-{source_hash[:16]}.pdf'
    download_path.parent.mkdir(parents=True, exist_ok=True)
    download_path.write_bytes(source_bytes)
    assert download_path.read_bytes() == source_bytes
    assert digest(args.pdf.read_bytes()) == source_hash, 'Source changed during import; import again.'
    manifest = {
        'version': metadata['version'],
        'sourcePdf': unicodedata.normalize('NFC', args.pdf.name),
        'sourcePdfSha256': source_hash, 'pageCount': len(document),
        'sourceBytes': len(source_bytes), 'renderLongEdge': args.long_edge,
        'webAdjustments': [],
        'sourceModal': 'omitted: previous MD page mappings do not apply to this final PDF',
        'renderer': f'PyMuPDF {pymupdf.VersionBind}; Pillow {PIL.__version__}; lossless WebP; RGB; annotations included',
        'download': {'src': '/' + str(download_path.relative_to(public)),
                     'filename': unicodedata.normalize('NFC', args.pdf.name),
                     'bytes': len(source_bytes), 'sha256': source_hash},
        'groups': metadata['groups'], 'legacyAnchors': metadata.get('legacyAnchors', []), 'slides': slides,
    }
    # Switch the active manifest only after every image and the download exist.
    temporary = MANIFEST.with_suffix('.tmp')
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(MANIFEST)
    print(f'Imported {len(slides)} lossless pages and unchanged PDF ({len(source_bytes):,} bytes).')


if __name__ == '__main__':
    main()
