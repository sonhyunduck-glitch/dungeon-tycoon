# -*- coding: utf-8 -*-
"""고유장비(장비 연대기) 확장 — 기존 12종에 ~108종 추가(총 ~120).
   슬롯별 시그니처 옵션 고정, 아이콘은 폴더에서 미사용분 배정, minFloor 1~980 분산.
   출력: tools/_uniques_append.txt (data.js UNIQUES 끝에 삽입)."""
import os, re, json, sys
sys.stdout.reconfigure(encoding="utf-8")
ROOT=r"D:\ai\text"
ICON=os.path.join(ROOT,"assets","icon","equip")
data=open(os.path.join(ROOT,"js","data.js"),encoding="utf-8").read()
ublock=data[data.index("G.DATA.UNIQUES"):data.index("];", data.index("G.DATA.UNIQUES"))]
used=set(re.findall(r'icon:"([^"]+)"', ublock))
usednames=set(re.findall(r'name:"([^"]+)"', ublock))

def nat(f): return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', f)]
def icons(dirn):
    fs=[f for f in os.listdir(os.path.join(ICON,dirn)) if f.lower().endswith(".png") and f not in used]
    fs.sort(key=nat); return fs

# iconDir -> (slot, [한글 base 명사], 개수)
PLAN=[
 ("weapon_sword","weapon",["검","대검","장검","도신","명검"],10),
 ("weapon_axe","weapon",["도끼","대부","전부","양날도끼"],10),
 ("weapon_dagger","weapon",["단검","비수","칼날","첨도"],10),
 ("helmet","helmet",["투구","관","면갑","뿔투구","두건"],20),
 ("armor","armor",["갑주","흉갑","판금","전포","비늘갑"],18),
 ("gloves","gloves",["장갑","건틀릿","완갑","손아귀"],18),
 ("boots","boots",["장화","각반","보행구","전투화"],16),
 ("ring","ring",["반지","인장","고리"],4),
 ("necklace","necklace",["목걸이","펜던트","부적"],2),
]
PRE=["용살의","서리","화염","심연의","폭풍","천둥","그림자","성스러운","저주받은","고대의","핏빛","별빛",
 "태양의","달빛","강철","황혼의","여명의","공허의","불멸의","처형자의","폭군의","광휘의","한기의","맹독의",
 "격노의","수호자의","망령의","용암의","빙결의","질풍의","파멸의","영겁의","흑요석","야수의","천상의",
 "지옥의","왕의","서약의","핏빛달","폭풍눈의","사신의","청염의","뇌광의","고요의","혹한의","작열의","무한의","심판의"]
# 슬롯 -> main 스탯, (affix 풀: (stat, base, flat, pct))
MAIN={"weapon":("atk",14,True,False),"helmet":("def",10,True,False),"armor":("def",12,True,False),
 "gloves":("atk",9,True,False),"boots":("def",9,True,False),"ring":("crit",8,False,True),"necklace":("elemAtk",22,False,True)}
POOL={
 "weapon":[("atk",13,True,False),("crit",7,False,True),("critDmg",32,False,True),("penet",13,False,True),("lifesteal",7,False,True),("multihit",8,False,True),("elemAtk",22,False,True)],
 "helmet":[("hp",80,True,False),("allRes",11,False,True),("stunResist",17,False,True),("def",9,True,False),("elemAtk",22,False,True)],
 "armor":[("hp",120,True,False),("thorns",15,False,True),("allRes",13,False,True),("def",10,True,False)],
 "gloves":[("atk",11,True,False),("crit",8,False,True),("multihit",7,False,True),("critDmg",30,False,True)],
 "boots":[("dodge",8,False,True),("hp",80,True,False),("def",9,True,False),("allRes",11,False,True)],
 "ring":[("crit",7,False,True),("critDmg",30,False,True),("atk",10,True,False),("goldFind",20,False,True),("lifesteal",7,False,True)],
 "necklace":[("elemAtk",22,False,True),("allRes",12,False,True),("hp",80,True,False),("crit",7,False,True)],
}
DESC={"weapon":"적을 베어내는","helmet":"머리를 지키는","armor":"몸을 감싸는","gloves":"손에 깃든",
 "boots":"발걸음을 인도하는","ring":"손가락에 끼우는","necklace":"목에 두르는"}

entries=[]; pi=0
for dirn,slot,bases,cnt in PLAN:
    av=icons(dirn)
    if len(av)<cnt: print("!! 아이콘 부족:",dirn,len(av),"<",cnt)
    for j in range(cnt):
        ic=av[j]
        # 이름(접두사+base) 유니크 보장
        for _ in range(len(PRE)):
            nm=PRE[pi%len(PRE)]+" "+bases[j%len(bases)]; pi+=1
            if nm not in usednames: break
        usednames.add(nm)
        ms,mv,mflat,mpct=MAIN[slot]
        pool=POOL[slot]; off=(j*1)%len(pool)
        chosen=[pool[(off+k)%len(pool)] for k in range(3)]
        # 중복 stat 제거(다르게)
        seen=set(); aff=[]
        kk=0
        while len(aff)<3 and kk<len(pool)*2:
            st,bv,fl,pc=pool[(off+kk)%len(pool)]; kk+=1
            if st in seen: continue
            seen.add(st); aff.append((st,bv,fl,pc))
        afftxt=",".join('{stat:"%s",v:%d%s%s}'%(st,bv,(",flat:true" if fl else ""),(",pct:true" if pc else "")) for st,bv,fl,pc in aff)
        slug="u_%s_%d"%(dirn.replace("weapon_","w").replace("necklace","nk"), j+1)
        entries.append({"slot":slot,"dir":dirn,"icon":ic,"name":nm,"main":ms,"mainVal":mv,
            "mpct":mpct,"aff":afftxt,"slug":slug,"desc":PRE_DESC if False else (DESC[slot])})

# minFloor 분산 1~980
N=len(entries)
for i,e in enumerate(entries):
    e["minFloor"]=max(1, round((i/(N-1))*980/5)*5) if N>1 else 1

lines=["  /* === 확장 고유장비 +%d (자동생성) === */"%N]
for e in entries:
    lines.append('  { id:"%s", name:"%s", slot:"%s", iconDir:"%s", icon:"%s", main:"%s", mainVal:%d, minFloor:%d, affixes:[%s], desc:"%s %s." },'
        %(e["slug"],e["name"],e["slot"],e["dir"],e["icon"],e["main"],e["mainVal"],e["minFloor"],e["aff"],e["name"],e["desc"]+" 고유 장비"))
open(os.path.join(ROOT,"tools","_uniques_append.txt"),"w",encoding="utf-8").write("\n".join(lines))
import collections
bs=collections.Counter(e["slot"] for e in entries)
print("생성:",N,"종  슬롯별:",dict(bs))
print("minFloor 범위:",min(e["minFloor"] for e in entries),"~",max(e["minFloor"] for e in entries))
print("이름 샘플:",[e["name"] for e in entries[:6]])
