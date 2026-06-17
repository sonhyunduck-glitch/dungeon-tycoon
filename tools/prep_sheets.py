# -*- coding: utf-8 -*-
"""로스터 시트를 tools/sheets/<key>/ 로 복사하고 manifest.json 생성.
   group 필드로 슬라이서 드롭다운을 그룹화(원본28 / Phase B 32)."""
import os, shutil, json

ASSET_BASE = r"D:\ai\elten\elthen Asset Pack(11월8일)"
SHEETS = r"D:\ai\text\tools\sheets"

G_ORIG = "■ 원본 28종 (옛 자동검출 · 수정대상)"
G_NEW  = "● Phase B 신규 32종 (슬라이서 제작)"

# (key, 한글명, tier, 에셋폴더, group)
ROSTER = [
  # ===== 원본 28종 (내가 옛날 자동검출로 만든 것 — 슬라이서에서 재작업/수정용) =====
  ("slime","슬라임","normal","Slime - Small",G_ORIG),
  ("bat","박쥐","normal","Bat",G_ORIG),
  ("goblin","임프","normal","Imp",G_ORIG),
  ("skeleton","화염 해골","normal","Flameskull",G_ORIG),
  ("spider","거미","normal","Spider",G_ORIG),
  ("wolf","늑대","normal","Wolf",G_ORIG),
  ("orc","오크 전사","normal","Orc Warrior",G_ORIG),
  ("golem","골렘","normal","Golem",G_ORIG),
  ("ghost","유령","normal","Ghost",G_ORIG),
  ("lich","리치","normal","Lich",G_ORIG),
  ("fire_elem","화염 정령","normal","Fire Elemental - Small",G_ORIG),
  ("ice_elem","냉기 정령","normal","Ice Elemental - Small",G_ORIG),
  ("snake","뱀","normal","Snake",G_ORIG),
  ("harpy","하피","normal","Harpy",G_ORIG),
  ("minotaur","미노타우로스","normal","Minotaur",G_ORIG),
  ("wyvern","새끼 드래곤","normal","Dragon Hatchling",G_ORIG),
  ("octopus","문어","normal","Octopus Small",G_ORIG),
  ("eye","떠다니는 눈","normal","Flying Eye Monster",G_ORIG),
  ("goblin_lord","네크로맨서","boss","Necromancer",G_ORIG),
  ("skeleton_king","해골 왕","boss","Skeleton King",G_ORIG),
  ("orc_chief","오크 감독관","boss","Orc Taskmaster",G_ORIG),
  ("witch","마녀","boss","Witch",G_ORIG),
  ("fire_giant","서리 거인","boss","Frost Giant",G_ORIG),
  ("ice_dragon","드래곤","boss","Dragon",G_ORIG),
  ("demon_lord","아귀 악마","boss","Maw Demon",G_ORIG),
  ("fallen_angel","대천사","boss","Archangel",G_ORIG),
  ("ancient_dragon","요정 드래곤","boss","Faerie Dragon",G_ORIG),
  ("demon_king","악마","boss","Demon",G_ORIG),
  # ===== Phase B 신규 32종 =====
  ("giant_slime","거대 슬라임","normal","Giant Slime",G_NEW),
  ("black_pudding","검은 푸딩","normal","Black Pudding - small",G_NEW),
  ("wasp","말벌","normal","Wasp",G_NEW),
  ("giant_fly","거대 파리","normal","Giant Fly",G_NEW),
  ("scorpion","전갈","normal","Scorpion",G_NEW),
  ("bloodsilk","핏빛 거미","normal","Bloodsilk Spider",G_NEW),
  ("quasit","콰지트","normal","Quasit",G_NEW),
  ("gremlin","그렘린","normal","Hopkins Gremlin",G_NEW),
  ("gnoll","놀","normal","Gnoll",G_NEW),
  ("ghoul","구울","normal","Ghoul",G_NEW),
  ("mummy","미라","normal","Mummy",G_NEW),
  ("zombie","좀비","normal","Zombie Townsfolk",G_NEW),
  ("wisp","도깨비불","normal","Wisp",G_NEW),
  ("drake","드레이크","normal","Drake",G_NEW),
  ("lightning_elem","번개 정령","normal","Lightning Elemental - Small",G_NEW),
  ("mini_golem","미니 골렘","normal","Mini Golem",G_NEW),
  ("gargoyle","가고일","normal","Gargoyle",G_NEW),
  ("boar","멧돼지","normal","Boar",G_NEW),
  ("wolf_cub","새끼 늑대","normal","Wolf Cub",G_NEW),
  ("cobra","코브라","normal","Cobra",G_NEW),
  ("jellyfish","해파리","normal","Jellyfish",G_NEW),
  ("crab","게","normal","Crab",G_NEW),
  ("ogre","오우거","boss","Ogre",G_NEW),
  ("troll","트롤","boss","Troll",G_NEW),
  ("cyclops","사이클롭스","boss","Cyclops",G_NEW),
  ("mummy_lord","미라 군주","boss","Mummy Lord",G_NEW),
  ("banshee","밴시","boss","Banshee",G_NEW),
  ("vampire","뱀파이어","boss","Vampire",G_NEW),
  ("elder_dragon","엘더 드래곤","boss","Elder Dragon",G_NEW),
  ("beholder","비홀더","boss","Beholder",G_NEW),
  ("mind_flayer","마인드 플레이어","boss","Mind Flayer",G_NEW),
  ("giant_gorilla","거대 고릴라","boss","Giant Gorilla",G_NEW),
]

def main():
    os.makedirs(SHEETS, exist_ok=True)
    manifest = []
    for key, name, tier, folder, group in ROSTER:
        src = os.path.join(ASSET_BASE, folder)
        if not os.path.isdir(src):
            print("!! 폴더 없음:", folder); manifest.append({"key":key,"name":name,"tier":tier,"folder":folder,"group":group,"files":[],"missing":True}); continue
        dst = os.path.join(SHEETS, key)
        os.makedirs(dst, exist_ok=True)
        files = []
        for f in sorted(os.listdir(src)):
            if f.lower().endswith(".png"):
                shutil.copy2(os.path.join(src,f), os.path.join(dst,f))
                files.append("sheets/%s/%s" % (key, f))
        manifest.append({"key":key,"name":name,"tier":tier,"folder":folder,"group":group,"files":files})
        print("%-16s %-30s %d개" % (key, folder, len(files)))
    with open(os.path.join(r"D:\ai\text\tools","manifest.json"),"w",encoding="utf-8") as fp:
        json.dump({"monsters":manifest}, fp, ensure_ascii=False, indent=2)
    print("manifest.json:", len(manifest), "종")

if __name__=="__main__":
    main()
