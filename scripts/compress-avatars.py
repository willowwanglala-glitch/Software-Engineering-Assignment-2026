from PIL import Image
from pathlib import Path

src_dir = Path(r'd:\miniprogram-1\miniprogram-1\miniprogram\images\avatars')
total_before = 0
total_after = 0
for p in sorted(src_dir.glob('*.png')):
    before = p.stat().st_size
    total_before += before
    im = Image.open(p).convert('RGB')
    im = im.resize((256, 256), Image.Resampling.LANCZOS)
    out = src_dir / (p.stem + '.jpg')
    im.save(out, 'JPEG', quality=80, optimize=True)
    after = out.stat().st_size
    total_after += after
    p.unlink()
    print(f'{p.name} {before} -> {out.name} {after}')

print(f'avatars_saved={total_before - total_after}')
root = Path(r'd:\miniprogram-1\miniprogram-1\miniprogram')
total = sum(f.stat().st_size for f in root.rglob('*') if f.is_file())
print(f'package_total_kb={total / 1024:.1f}')
