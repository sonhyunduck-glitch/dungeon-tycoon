# -*- coding: utf-8 -*-
import sys, os
from PIL import Image
OUT_DIR = r"D:\ai\text\assets\enemies"
PREVIEW_DIR = r"D:\ai\text\tools\preview"
keys = sys.argv[1:]
pad = 8
scale = 2
rows = []
maxw = 0
for k in keys:
    im = Image.open(os.path.join(OUT_DIR, k+".png")).convert("RGBA")
    im = im.resize((im.width*scale, im.height*scale), Image.NEAREST)
    rows.append((k, im))
    maxw = max(maxw, im.width)
H = sum(r[1].height+pad for r in rows)+pad
canvas = Image.new("RGBA", (maxw+pad*2, H), (40,40,52,255))
y = pad
for k, im in rows:
    canvas.alpha_composite(im, (pad, y))
    y += im.height+pad
out = os.path.join(PREVIEW_DIR, "batch1_result.png")
canvas.save(out)
print("saved", out)
