#!/usr/bin/env python3
"""Chuyển ảnh (jpg/png/webp, thư mục hoặc .zip) thành NAME-800/-1600/-3200.webp.

  python3 scripts/convert_webp.py images/*.jpg -o images --prefix dl
  python3 scripts/convert_webp.py "Ảnh.zip" -o images

Không phóng to ảnh nhỏ hơn mốc: file -3200 khi đó giữ nguyên kích thước gốc.
"""
import argparse, io, os, sys, zipfile
from PIL import Image, ImageOps

WIDTHS = (800, 1600, 3200)
EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.heic')

def sources(paths):
    for p in paths:
        if p.lower().endswith('.zip'):
            with zipfile.ZipFile(p) as z:
                for n in sorted(z.namelist()):
                    if n.lower().endswith(EXTS) and not os.path.basename(n).startswith('.'):
                        yield os.path.basename(n), io.BytesIO(z.read(n))
        elif os.path.isdir(p):
            for n in sorted(os.listdir(p)):
                if n.lower().endswith(EXTS): yield n, os.path.join(p, n)
        else:
            yield os.path.basename(p), p

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('inputs', nargs='+')
    ap.add_argument('-o', '--out', default='images')
    ap.add_argument('-q', '--quality', type=int, default=82)
    ap.add_argument('--prefix', help='đổi tên thành PREFIX-01, PREFIX-02, ...')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    for i, (name, src) in enumerate(sources(a.inputs), 1):
        base = f'{a.prefix}-{i:02d}' if a.prefix else os.path.splitext(name)[0]
        im = ImageOps.exif_transpose(Image.open(src))
        im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') and 'transparency' in im.info or im.mode == 'RGBA' else 'RGB')
        for w in WIDTHS:
            out = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            out.save(os.path.join(a.out, f'{base}-{w}.webp'), 'WEBP', quality=a.quality, method=6)
        print(f'{name} -> {base}  ({im.width}x{im.height})')

if __name__ == '__main__':
    sys.exit(main())
