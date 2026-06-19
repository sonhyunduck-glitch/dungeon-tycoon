# -*- coding: utf-8 -*-
"""
slicer.html이 내보낸 slice_config.json을 받아:
  1) 각 동작 행을 가로 스트립으로 추출 → assets/enemies/<key>(_attack/_hurt/_death).png
  2) css/enemies_phaseb.css 전체 재생성 (idle + 모션)
  3) data.js에 붙여넣을 스니펫(종족/스프라이트맵/모션정보) 출력
사용: python apply_config.py [config경로]
"""
import sys, os, json, math
from PIL import Image
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ROOT = r"D:\ai\text"
TOOLS = os.path.join(ROOT,"tools")
OUT_DIR = os.path.join(ROOT,"assets","enemies")
CSS_OUT = os.path.join(ROOT,"css","enemies_phaseb.css")

DUR = {"idle":0.12, "attack":0.07, "hurt":0.085, "death":0.10, "walk":0.11}
SUFFIX = {"idle":"", "attack":"_attack", "hurt":"_hurt", "death":"_death", "walk":"_walk"}
CLS = {"attack":"atk", "hurt":"hurt", "death":"die"}
FILL = {"attack":"1 forwards", "hurt":"1", "death":"1 forwards"}
ANIMKEY = {"attack":"atk","hurt":"hurt","death":"die"}

SCALE    = 1.5   # 타겟(big, .es-<key>) 배율
SCALE_SM = 1.0   # 비타겟(-sm, .es-<key>-sm) 배율 — 원본 크기
LARGE_PX = 96    # 네이티브 프레임 최대변이 이 값 이상이면 '이미 큰 스프라이트' → 확대 안 함(1.0)
MAX_DISP = 128   # 표시 최대 변(px) — 아레나 크기 고정을 위해 이 값을 넘으면 축소
SCALE_OVERRIDE = {}   # 종별 수동 예외 {key:배율}. (임계값 규칙보다 우선)
def _cap(s, fw, fh):
    m = max(fw,fh)
    return (MAX_DISP/float(m)) if m*s > MAX_DISP else s   # 표시 최대변 상한
def big_scale(key,fw,fh):
    if key in SCALE_OVERRIDE: s=SCALE_OVERRIDE[key]
    elif max(fw,fh) >= LARGE_PX: s=1.0   # 이미 큰 스프라이트는 1.0배
    else: s=SCALE
    return _cap(s, fw, fh)
def sm_scale(key,fw,fh):
    return _cap(SCALE_OVERRIDE.get(key, SCALE_SM), fw, fh)

def extract(src, fw, fh, row, frames, outname, overwrite=True):
    """소스 시트에서 행을 가로 스트립으로 추출. 소스가 없으면(커스텀: 슬라이서에서 직접 다운로드)
       이미 assets/enemies에 있는 스트립을 그대로 사용. 둘 다 없으면 False.
       overwrite=False: 대상 스트립이 이미 있으면 재추출하지 않고 재사용(불필요한 PNG 재기록 방지)."""
    tgt = os.path.join(OUT_DIR, outname)
    if not overwrite and os.path.exists(tgt):
        return True
    if not os.path.exists(src):
        if os.path.exists(tgt):
            print("   · 소스없음→기존 스트립 사용:", outname); return True
        print("   !! 소스/스트립 모두 없음:", outname); return False
    im = Image.open(src).convert("RGBA")
    strip = Image.new("RGBA",(fw*frames,fh),(0,0,0,0))
    for i in range(frames):
        strip.paste(im.crop((i*fw,row*fh,i*fw+fw,row*fh+fh)),(i*fw,0))
    strip.save(tgt)
    return True

def css_idle(key, fw, fh, frames):
    out=[]
    for tag,scl in (("",big_scale),("-sm",sm_scale)):
        s=scl(key,fw,fh); W=round(fw*s); H=round(fh*s); BGW=W*frames
        nm="eska-%s%s"%(key,tag)
        out.append('.es-%s%s{ width:%dpx; height:%dpx; background:url("../assets/enemies/%s.png") 0 0 no-repeat; background-size:%dpx %dpx; animation:%s %.2fs steps(%d) infinite; }'%(key,tag,W,H,key,BGW,H,nm,DUR["idle"]*frames,frames))
        out.append('@keyframes %s{ from{ background-position:0 0; } to{ background-position:-%dpx 0; } }'%(nm,BGW))
    return "\n".join(out)

def css_motion(key, typ, fw, fh, frames):
    cls=CLS[typ]; suf=SUFFIX[typ]; out=[]
    stp=max(1, frames-1)   # 유한 모션: 마지막 실제 프레임에서 멈춤(끝에 빈 프레임 방지)
    for tag,scl in (("",big_scale),("-sm",sm_scale)):   # 타겟(big) + 비타겟(-sm) 모두
        s=scl(key,fw,fh); W=round(fw*s); H=round(fh*s); BGW=W*frames; ENDW=W*stp
        nm="eska-%s-%s%s"%(key,cls,tag)
        out.append('.es-%s%s.%s{ background-image:url("../assets/enemies/%s%s.png"); background-size:%dpx %dpx; animation:%s %.2fs steps(%d) %s; }'
                   %(key,tag,cls,key,suf,BGW,H,nm,DUR[typ]*frames,stp,FILL[typ]))
        out.append('@keyframes %s{ from{ background-position:0 0; } to{ background-position:-%dpx 0; } }'%(nm,ENDW))
    return "\n".join(out)

def css_walk(key, fw, fh, frames):
    """걷기 = idle 처럼 루프(steps(frames), to=-BGW)지만 별도 스트립(_walk.png) + .walk 클래스."""
    out=[]
    for tag,scl in (("",big_scale),("-sm",sm_scale)):
        s=scl(key,fw,fh); W=round(fw*s); H=round(fh*s); BGW=W*frames
        nm="eska-%s-walk%s"%(key,tag)
        out.append('.es-%s%s.walk{ background-image:url("../assets/enemies/%s_walk.png"); background-size:%dpx %dpx; animation:%s %.2fs steps(%d) infinite; }'
                   %(key,tag,key,BGW,H,nm,DUR["walk"]*frames,frames))
        out.append('@keyframes %s{ from{ background-position:0 0; } to{ background-position:-%dpx 0; } }'%(nm,BGW))
    return "\n".join(out)

def main():
    cfgpath = sys.argv[1] if len(sys.argv)>1 else os.path.join(TOOLS,"slice_config.json")
    cfg=json.load(open(cfgpath,encoding="utf-8"))
    css=["/* Phase B 적 스프라이트 — slicer.html 라벨 기반 자동생성. 직접 수정 금지. */",
         ".esprite{ display:inline-block; image-rendering:pixelated; image-rendering:crisp-edges; filter:drop-shadow(0 4px 6px rgba(0,0,0,.55)); }"]
    sprites=[]; anims=[]; normals=[]; bosses=[]; foot={}
    for m in cfg["monsters"]:
        key,name,tier=m["key"],m["name"],m.get("tier","normal")
        idle=next((a for a in m["anims"] if a["type"]=="idle"),None)
        if not idle: print("!! idle 없음, 건너뜀:",key); continue
        fw,fh=idle["fw"],idle["fh"]
        if not extract(os.path.join(TOOLS,idle["file"]),fw,fh,idle["row"],idle["frames"],key+".png"):
            print("!! idle 추출 실패, 건너뜀:",key); continue
        css.append("/* "+name+" */")
        css.append(css_idle(key,fw,fh,idle["frames"]))
        # 발 위치(하단 투명여백 비율) + 표시 높이 — 그림자를 발밑에 두기 위함
        try:
            im=Image.open(os.path.join(OUT_DIR,key+".png")).convert("RGBA"); px=im.load(); W,Hh=im.size
            maxy=0
            for y in range(Hh):
                row=False
                for x in range(0,W,2):
                    if px[x,y][3]>20: row=True; break
                if row: maxy=y
            ratio=round(max(0.0,(fh-1-maxy))/float(fh), 4)
            foot[key]={"r":ratio, "h":round(fh*big_scale(key,fw,fh)), "hsm":round(fh*sm_scale(key,fw,fh))}
        except Exception as e:
            foot[key]={"r":0,"h":round(fh*big_scale(key,fw,fh)),"hsm":round(fh*sm_scale(key,fw,fh))}
        amap={}
        for a in m["anims"]:
            if a["type"] in ("attack","hurt","death"):
                if not extract(os.path.join(TOOLS,a["file"]),a["fw"],a["fh"],a["row"],a["frames"],key+SUFFIX[a["type"]]+".png"):
                    continue
                css.append(css_motion(key,a["type"],a["fw"],a["fh"],a["frames"]))
                amap[ANIMKEY[a["type"]]]=a["frames"]
            elif a["type"]=="walk":
                if not extract(os.path.join(TOOLS,a["file"]),a["fw"],a["fh"],a["row"],a["frames"],key+"_walk.png",overwrite=True):
                    continue
                css.append(css_walk(key,a["fw"],a["fh"],a["frames"]))
                amap["walk"]=a["frames"]
        sprites.append('  "%s":"%s",'%(name,key))
        if amap:
            anims.append('  %s: { %s },'%(key, ", ".join("%s:%d"%(k,v) for k,v in amap.items())))
        (bosses if tier=="boss" else normals).append('  {name:"%s",emoji:"❓"},'%name)
    open(CSS_OUT,"w",encoding="utf-8").write("\n".join(css)+"\n")
    # 발 위치 데이터(그림자 배치용)
    FOOT_OUT=os.path.join(ROOT,"js","sprite_foot.js")
    open(FOOT_OUT,"w",encoding="utf-8").write(
        "/* 스프라이트 발 위치(하단여백 비율 r, 표시높이 h/hsm) — 그림자 배치용. 자동생성 */\n"
        "(function(){var G=window.G;G.DATA=G.DATA||{};G.DATA.SPRITE_FOOT="+json.dumps(foot,ensure_ascii=False)+";})();\n")
    print("✅ CSS 작성:",CSS_OUT,"(",len([m for m in cfg['monsters']]),"종 )")
    print("✅ sprite_foot.js 작성:",FOOT_OUT)
    print("\n===== data.js 붙여넣기 스니펫 =====")
    print("\n-- NORMAL_SPECIES 추가 --"); print("\n".join(normals))
    print("\n-- BOSS_SPECIES 추가 (mat/gstat 직접 보완) --"); print("\n".join(bosses))
    print("\n-- ENEMY_SPRITES 추가 --"); print("\n".join(sprites))
    print("\n-- ENEMY_ANIMS 추가 --"); print("\n".join(anims))

if __name__=="__main__":
    main()
