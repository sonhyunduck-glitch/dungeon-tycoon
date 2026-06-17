# -*- coding: utf-8 -*-
"""
Phase B 스프라이트 추출 툴킷.
ASSET_BASE에 Korean 경로를 UTF-8로 박아 인코딩 문제 회피.
사용:
  python spritekit.py dims "<folder>" [file]          # 시트 크기 출력
  python spritekit.py grid "<folder>" "<file>" W H     # WxH 격자로 분할 미리보기 PNG 저장(/tmp/preview_*)
  python spritekit.py rowstrip "<folder>" "<file>" W H ROW N OUT  # ROW행 0~N프레임을 가로스트립으로 OUT 저장
"""
import sys, os
from PIL import Image

ASSET_BASE = r"D:\ai\elten\elthen Asset Pack(11월8일)"
OUT_DIR = r"D:\ai\text\assets\enemies"
PREVIEW_DIR = r"D:\ai\text\tools\preview"
os.makedirs(PREVIEW_DIR, exist_ok=True)

def find_file(folder, hint=None):
    d = os.path.join(ASSET_BASE, folder)
    pngs = [f for f in os.listdir(d) if f.lower().endswith(".png")]
    if hint:
        for f in pngs:
            if hint.lower() in f.lower():
                return os.path.join(d, f)
    return os.path.join(d, pngs[0]) if pngs else None

def cmd_dims(folder, hint=None):
    d = os.path.join(ASSET_BASE, folder)
    for f in sorted(os.listdir(d)):
        if f.lower().endswith(".png"):
            im = Image.open(os.path.join(d, f))
            w, h = im.size
            # 흔한 프레임크기 후보로 행/열 추정
            cand = []
            for s in (16, 24, 32, 48, 64, 96, 128, 192):
                if w % s == 0 and h % s == 0:
                    cand.append("%d(%dx%d)" % (s, w//s, h//s))
            print("%-40s %dx%d  격자후보: %s" % (f, w, h, ", ".join(cand)))

def cmd_grid(folder, file, W, H):
    W, H = int(W), int(H)
    path = find_file(folder, file)
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    cols, rows = w//W, h//H
    # 각 행을 가로로 이어붙인 미리보기(행 경계 빨강선) — 행별 내용 확인용
    scale = max(1, 64//H)
    canvas = Image.new("RGBA", (w*scale, h*scale), (30,30,40,255))
    big = im.resize((w*scale, h*scale), Image.NEAREST)
    canvas.alpha_composite(big)
    px = canvas.load()
    for r in range(rows+1):
        y = min(r*H*scale, canvas.height-1)
        for x in range(canvas.width):
            px[x,y] = (255,0,0,255)
    for c in range(cols+1):
        x = min(c*W*scale, canvas.width-1)
        for y in range(canvas.height):
            px[x,y] = (255,80,0,160)
    out = os.path.join(PREVIEW_DIR, "grid_%s.png" % folder.replace(" ","_").replace("-","_"))
    canvas.save(out)
    print("grid %dx%d -> %d cols x %d rows" % (W,H,cols,rows))
    print("saved", out)

def cmd_rowstrip(folder, file, W, H, ROW, N, out):
    W,H,ROW,N = int(W),int(H),int(ROW),int(N)
    path = find_file(folder, file)
    im = Image.open(path).convert("RGBA")
    strip = Image.new("RGBA", (W*N, H), (0,0,0,0))
    for i in range(N):
        fr = im.crop((i*W, ROW*H, i*W+W, ROW*H+H))
        strip.paste(fr, (i*W, 0))
    outp = os.path.join(OUT_DIR, out)
    strip.save(outp)
    print("saved", outp, "(%dx%d, %d frames)" % (W*N, H, N))

if __name__ == "__main__":
    c = sys.argv[1]
    if c == "dims": cmd_dims(*sys.argv[2:])
    elif c == "grid": cmd_grid(*sys.argv[2:])
    elif c == "rowstrip": cmd_rowstrip(*sys.argv[2:])
