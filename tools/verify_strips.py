# -*- coding: utf-8 -*-
"""원본 28종(내가 옛날 자동검출로 만든 것) 스트립 검증.
   각 idle 스트립을 frame_w로 나눴을 때:
   - 스프라이트 덩어리가 프레임 경계를 가로지르면 = 폭 오류(클러스터/빈공간)
   - 덩어리 수가 프레임 수와 크게 다르면 = 병합/누락
   enemies.css에서 .es-<key>{...steps(N)...}을 파싱해 N과 strip을 가져옴."""
import os, re, sys
from PIL import Image
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ROOT=r"D:\ai\text"
CSS=open(os.path.join(ROOT,"css","enemies.css"),encoding="utf-8").read()
ENEM=os.path.join(ROOT,"assets","enemies")

# .es-key{ ... background:url("../assets/enemies/key.png") ... steps(N) ... }  (idle만; -sm/.atk 제외)
rx=re.compile(r'\.es-([a-z0-9_]+)\{[^}]*?enemies/\1\.png[^}]*?steps\((\d+)\)')
items=rx.findall(CSS)

def col_occupied(im):
    w,h=im.size; px=im.load(); occ=[]
    for x in range(w):
        f=False
        for y in range(h):
            if px[x,y][3]>16: f=True;break
        occ.append(f)
    return occ

def clusters(occ):
    runs=[]; s=None
    for x,v in enumerate(occ):
        if v and s is None: s=x
        elif not v and s is not None: runs.append((s,x-1)); s=None
    if s is not None: runs.append((s,len(occ)-1))
    return runs

print("%-16s %-7s %-9s %-8s %s"%("key","frames","frame_w","덩어리","판정"))
print("-"*70)
flagged=[]
for key,n in items:
    n=int(n); p=os.path.join(ENEM,key+".png")
    if not os.path.exists(p): print("%-16s  파일없음"%key); continue
    im=Image.open(p).convert("RGBA"); w,h=im.size
    fw=w//n
    occ=col_occupied(im); cl=clusters(occ)
    # 내부 프레임 경계(fw,2fw,...,(n-1)fw)를 가로지르는 덩어리?
    straddle=0
    for a,b in cl:
        for k in range(1,n):
            bnd=k*fw
            if a < bnd < b:  # 경계가 덩어리 내부를 지남
                straddle+=1; break
    verdict="OK"
    if straddle>0: verdict="⚠ 경계가로지름 %d"%straddle;
    # 덩어리 수가 프레임 수의 ~2배면 클러스터 의심
    if len(cl) >= n*2 and len(cl)>=4: verdict="⚠ 덩어리과다(클러스터?)"
    if verdict!="OK": flagged.append(key)
    print("%-16s %-7d %-9d %-8d %s"%(key,n,fw,len(cl),verdict))

print("\n의심 목록:", flagged if flagged else "없음")
