# -*- coding: utf-8 -*-
"""
1000층 몬스터 확장 빌더.
- 새 슬라이스(assets/slice_config.json, 215종)에서 신규 종만 골라(정크/무idle/기존키 제외)
- 원본 팩(D:/ai/elten)에서 PNG를 tools/sheets/<key>/ 로 복사(NFC 안전) + 경로 리라이트
- tier = idle 프레임높이 fh>32 → boss
- 기존 60종 config와 병합해 assets/enemies/slice_config.json(정본) 갱신
- data.js 추가 블록(NORMAL/BOSS_SPECIES, ENEMY_SPRITES, ENEMY_ANIMS) 출력
실행 후 apply_config.py를 정본 config로 돌려 CSS/스트립/sprite_foot 재생성.
"""
import os, json, shutil, unicodedata, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ROOT=r"D:\ai\text"
PACK=r"D:\ai\elten"                      # 원본 팩 부모 (경로가 'elthen Asset Pack(11월8일)/...' 형태)
OLD=os.path.join(ROOT,"assets","enemies","slice_config.json")
NEW=os.path.join(ROOT,"assets","slice_config.json")
SHEETS=os.path.join(ROOT,"tools","sheets")

def nfc(s): return unicodedata.normalize("NFC",s)

def resolve(rel):
    """팩 상대경로(한글 폴더 포함)를 NFC 정규화로 단계별 해석해 실제 절대경로 반환."""
    cur=PACK
    for seg in rel.split("/"):
        if not os.path.isdir(cur): return None
        entries={nfc(e):e for e in os.listdir(cur)}
        hit=entries.get(nfc(seg))
        if hit is None: return None
        cur=os.path.join(cur,hit)
    return cur if os.path.exists(cur) else None

# key -> (한글명, 이모지). 기존 60종과 충돌하지 않도록 변형명 사용(슬라임→중형 슬라임 등).
NAMES={
 "abyssal_chicken":("심연의 닭","🐔"),"akaname":("아카나메","👅"),"alien_horror":("외계 공포체","👽"),
 "ancient_crustacean":("고대 갑각류","🦞"),"angel":("천사","👼"),"anubis_warrior":("아누비스 전사","🐺"),
 "arcane_golem":("비전 골렘","💠"),"archangel":("대천사장","😇"),"archer":("궁수","🏹"),
 "armadillo":("아르마딜로","🦔"),"attic_whisperer":("다락의 속삭임","👻"),"bandit":("산적","🗡️"),
 "bandit_mage":("산적 마법사","🪄"),"bandit_slingshot":("산적 투석꾼","🪨"),"barbarian":("바바리안","🪓"),
 "basilisk":("바실리스크","🦎"),"beast":("마수","🐾"),"black_pudding_small":("작은 검은 푸딩","⬛"),
 "bloodsilk_spider":("핏실 거미","🕷️"),"brain_mole_monarch":("뇌두더지 군주","🧠"),"brownie":("브라우니","🧚"),
 "bugbear":("버그베어","🐻"),"bull":("황소","🐂"),"bullywug_warrior":("불리웍 전사","🐸"),
 "cacodaemon":("카코데몬","👹"),"centaur":("켄타우로스","🐎"),"cloaker":("클로커","🦇"),
 "compsognathus":("콤프소그나투스","🦖"),"cultist_horror":("광신 괴물","🕯️"),"cultists":("광신도","🕯️"),
 "death":("죽음","💀"),"demon":("악령","😈"),"dopperganger":("도플갱어","👥"),
 "dragon":("레드 드래곤","🐉"),"dragon_hatchling":("새끼 용","🥚"),"dragonfly":("잠자리","🪰"),
 "dwarven_guardian_construct":("드워프 수호 기관","🗿"),"faerie_dragon":("요정룡","🐲"),
 "fire_elemental_small":("작은 화염 정령","🔥"),"fishfolk_inkbender":("어인 먹물술사","🐟"),
 "flameskull":("불꽃 해골","💀"),"flesh_horror":("육신 괴물","🩸"),"flying_brain_monster":("비행 뇌수","🧠"),
 "flying_eye_monster":("비행 안구","👁️"),"flytrap_leshy":("파리지옥 레쉬","🪴"),"froghemoth":("개구리수","🐸"),
 "frost_giant":("서리 대거인","🧊"),"fungal_monster_medium":("버섯 괴물(중)","🍄"),
 "fungal_monster_small":("버섯 괴물(소)","🍄"),"geonid":("지오니드","🪨"),"giant_golem":("거대 골렘","🗿"),
 "giant_mushroom_monster":("거대 버섯 괴물","🍄"),"gladiator":("검투사","🛡️"),"glutmon":("글럿몬","👾"),
 "guardian_scroll":("수호 두루마리","📜"),"hedgehog":("고슴도치","🦔"),"hell_critter":("지옥 짐승","🔥"),
 "hermit_crab":("소라게","🦀"),"homunculus":("호문쿨루스","🧪"),"hopkins_gremlin":("홉킨스 그렘린","👹"),
 "ice_elemental_small":("작은 냉기 정령","❄️"),"ifrit":("이프리트","🔥"),"imp":("꼬마 임프","👺"),
 "intellect_devourer":("지능 포식자","🧠"),"jester_sprite":("광대 정령","🃏"),"knight":("기사","⚔️"),
 "korred":("코레드","🌳"),"ladybug":("무당벌레","🐞"),"lightning_elemental_small":("작은 번개 정령","⚡"),
 "lizardfolk_archer":("도마뱀 궁수","🦎"),"lizardfolk_monk":("도마뱀 수도사","🦎"),"mage":("마법사","🪄"),
 "mageripper":("마법사냥꾼","🗡️"),"maw_demon":("아귀 마귀","👹"),"mimic":("미믹","🎁"),
 "monster_snail":("괴물 달팽이","🐌"),"naga":("나가","🐍"),"naked_molerat":("벌거숭이두더지쥐","🐀"),
 "necromancer":("강령술사","🧙"),"ninja":("닌자","🥷"),"nothic":("노식","👁️"),
 "octopus_king":("문어 왕","🐙"),"octopus_small":("새끼 문어","🐙"),"orc_hunter":("오크 사냥꾼","🏹"),
 "orc_kamikaze":("오크 결사대","💥"),"orc_shaman":("오크 주술사","🪬"),"orc_taskmaster":("오크 작업반장","👺"),
 "orc_warlock":("오크 흑마법사","🟣"),"orc_warrior":("오크 무사","🧌"),"owl":("올빼미","🦉"),
 "owlbear":("아울베어","🦉"),"paladin":("팔라딘","✝️"),"parrot":("앵무새","🦜"),"penguin":("펭귄","🐧"),
 "plague_doctor":("역병 의사","⚕️"),"priestess":("여사제","🙏"),"pyromancer":("화염술사","🔥"),
 "quickling":("쾌속요정","💨"),"ratfolk_berserker_sprite":("쥐족 광전사","🐀"),"ratfolk_tamer":("쥐족 조련사","🐀"),
 "rogue":("도적","🗡️"),"scarab":("스카라베","🪲"),"shadow_entity":("그림자 존재","🌑"),
 "shardsoul_slayer":("파편혼 학살자","⚔️"),"shield_guardian":("방패 수호자","🛡️"),
 "skeletal_archer":("해골 궁수","🏹"),"skeletal_mage":("해골 마법사","💀"),"skeletal_warrior":("해골 전사","💀"),
 "slime_medium":("중형 슬라임","🟢"),"slime_small":("소형 슬라임","🟢"),"squire":("종자","🛡️"),
 "succubus":("서큐버스","😈"),"thief_medieval":("도둑","🗡️"),"thunder_beast":("천둥 야수","⚡"),
 "umber_hulk":("엄버 헐크","🪲"),"vargouille":("바르구일","👹"),"vengeful_spirit":("원혼","👻"),
 "warlock":("흑마법사","🟣"),"wendigo":("웬디고","🦌"),"yeti":("예티","❄️"),"zombie_townsfolk":("좀비 주민","🧟"),
 "goblin_assassin":("고블린 암살자","👺"),"goblin_boar_rider":("고블린 멧돼지 기수","🐗"),
 "goblin_bomber":("고블린 폭탄병","💣"),"goblin_king":("고블린 왕","👑"),"goblin_shaman":("고블린 주술사","🪬"),
 "dwarf":("드워프","🧔"),"dwarf_arbelest":("드워프 석궁병","🏹"),"dwarf_undead":("언데드 드워프","🧟"),
 "king_dwarf":("드워프 왕","👑"),"lizardfolk_mage":("도마뱀 마법사","🦎"),"lizardfolk_spearman":("도마뱀 창병","🦎"),
 "lizardfolk_warrior":("도마뱀 전사","🦎"),"fishfolk_archpriest":("어인 대사제","🐟"),
 "fishfolk_berserker":("어인 광전사","🐟"),"fishfolk_brute":("어인 야수","🐟"),
 "fishfolk_bubblemancer":("어인 거품술사","🫧"),"fishfolk_hypnotist":("어인 최면술사","🌀"),
 "fishfolk_jelly":("어인 해파리","🪼"),"fishfolk_knight":("어인 기사","🐟"),"fishfolk_net":("어인 그물잡이","🕸️"),
 "fishfolk_shaman":("어인 주술사","🪬"),"fishfolk_whip":("어인 채찍병","🐟"),"cactus_monster_s":("선인장 괴물","🌵"),
 "evil_tree":("사악한 나무","🌳"),"giant_pumpkin_monster":("거대 호박 괴물","🎃"),
 "leaf_elemental_big":("큰 나뭇잎 정령","🍃"),"leaf_elemental_small":("작은 나뭇잎 정령","🍃"),
 "leafy_leshy":("잎사귀 레쉬","🌿"),"leshy_gourd":("호리병 레쉬","🪴"),"monster_flower":("괴물 꽃","🌸"),
 "twig_blight":("가지 마름병","🌿"),"vegetable_monsters_1":("채소 괴물","🥦"),"elven_archer":("엘프 궁수","🧝"),
 "elven_warrior":("엘프 전사","🧝"),"elven_wizard":("엘프 마법사","🧝"),"kobold":("코볼트","🐲"),
 "kobold_dragonshield":("코볼트 용방패병","🛡️"),"kobold_priest":("코볼트 사제","🙏"),
 "kobold_pyromancer":("코볼트 화염술사","🔥"),"kobold_shaman":("코볼트 주술사","🪬"),
 "kobold_slinger":("코볼트 투석병","🪨"),"kobold_trapmaster":("코볼트 함정장인","🪤"),
 "winged_kobold":("날개 코볼트","🐲"),
}
GSTATS=["atk","crit","critDmg","penet","lifesteal","thorns","multihit","dodge","def","goldFind","hp"]
ANIMKEY={"attack":"atk","hurt":"hurt","death":"die","walk":"walk"}

def main():
    old=json.load(open(OLD,encoding="utf-8"))
    new=json.load(open(NEW,encoding="utf-8"))
    oldkeys={m["key"] for m in old["monsters"]}
    oldnames={m["name"] for m in old["monsters"]}

    add=[]; missing_name=[]; copied=0
    for m in new["monsters"]:
        k=m["key"]
        if k.startswith("2x") or k.startswith("royal"): continue
        idle=next((a for a in m["anims"] if a["type"]=="idle"),None)
        if not idle: continue                 # porcupine
        if k in oldkeys: continue             # 기존 키 중복 제외
        if k not in NAMES: missing_name.append(k); continue
        ko,emo=NAMES[k]
        tier="boss" if idle["fh"]>32 else "normal"
        # 파일 복사 + 경로 리라이트
        dstdir=os.path.join(SHEETS,k); os.makedirs(dstdir,exist_ok=True)
        anims2=[]
        ok=True
        for a in m["anims"]:
            src=resolve(a["file"])
            base=os.path.basename(a["file"])
            dst=os.path.join(dstdir,base)
            if src is None:
                if not os.path.exists(dst): ok=False; print("  !! 소스없음:",k,a["file"]); break
            else:
                if not os.path.exists(dst): shutil.copy2(src,dst); copied_inc=True
                else: copied_inc=False
                if copied_inc:
                    pass
            a2=dict(a); a2["file"]="sheets/%s/%s"%(k,base); anims2.append(a2)
        if not ok: continue
        add.append({"key":k,"name":ko,"emoji":emo,"tier":tier,"anims":anims2})

    if missing_name:
        print("!! 한글명 누락 키:",missing_name);
    # 한글명 충돌 검사
    newnames=[a["name"] for a in add]
    dup=set([n for n in newnames if newnames.count(n)>1]) | (set(newnames)&oldnames)
    if dup:
        print("!! 이름 충돌:",dup); sys.exit(1)

    # 병합 config(정본) — 기존 그대로 + 신규(emoji 키는 config에 남겨도 무해)
    merged={"monsters": old["monsters"] + [{"key":a["key"],"name":a["name"],"tier":a["tier"],"anims":a["anims"]} for a in add]}
    json.dump(merged, open(OLD,"w",encoding="utf-8"), ensure_ascii=False, indent=2)

    # data.js 추가 블록 생성
    norm=[a for a in add if a["tier"]=="normal"]
    boss=[a for a in add if a["tier"]=="boss"]
    L=[]
    L.append("// === 신규 일반 %d종 (NORMAL_SPECIES 끝에 삽입) ==="%len(norm))
    for i in range(0,len(norm),3):
        L.append("  "+" ".join('{name:"%s",emoji:"%s"},'%(a["name"],a["emoji"]) for a in norm[i:i+3]))
    L.append("")
    L.append("// === 신규 보스 %d종 (BOSS_SPECIES 끝에 삽입) ==="%len(boss))
    for j,a in enumerate(boss):
        L.append('  {name:"%s", emoji:"%s", mat:"%s의 정수", gstat:"%s"},'%(a["name"],a["emoji"],a["name"],GSTATS[j%len(GSTATS)]))
    L.append("")
    L.append("// === 신규 ENEMY_SPRITES (맵 끝에 삽입) ===")
    for i in range(0,len(add),3):
        L.append("  "+" ".join('"%s":"%s",'%(a["name"],a["key"]) for a in add[i:i+3]))
    L.append("")
    L.append("// === 신규 ENEMY_ANIMS (맵 끝에 삽입) ===")
    for a in add:
        amap={}
        for an in a["anims"]:
            if an["type"] in ANIMKEY and an["type"]!="idle":
                amap[ANIMKEY[an["type"]]]=an["frames"]
        if amap:
            order=[("walk","walk"),("atk","atk"),("hurt","hurt"),("die","die")]
            parts=", ".join("%s:%d"%(kk,amap[kk]) for _,kk in order if kk in amap)
            L.append("  %s: { %s },"%(a["key"],parts))
    open(os.path.join(ROOT,"tools","_datajs_append.txt"),"w",encoding="utf-8").write("\n".join(L))

    print("✅ 신규 추가:",len(add),"종 (일반",len(norm),"/ 보스",len(boss),")")
    print("✅ 병합 config 작성:",OLD,"→ 총",len(merged["monsters"]),"종")
    print("✅ data.js 추가 블록:",os.path.join(ROOT,"tools","_datajs_append.txt"))
    print("   다음: python tools/apply_config.py assets/enemies/slice_config.json")

if __name__=="__main__": main()
