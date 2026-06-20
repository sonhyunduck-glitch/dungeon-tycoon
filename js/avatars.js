/* ============================================================
   아바타(플레이어 전투 스프라이트) 시스템 — 데이터 기반
   - 각 아바타: 시트 이미지 + 프레임 크기 + 모션(idle/attack/hurt/death) 행·프레임수
   - 슬라이서로 캐릭터 시트의 모션 프레임 범위를 잡아 아래 목록에 추가하면 옵션에 노출됨
   - 선택 시 #pc-sprite 용 CSS(애니메이션+키프레임)를 동적 주입
   ============================================================ */
(function(){
  var G = window.G;
  G.DATA = G.DATA || {};

  // 모션={row,frames,dur}, unlock=해금 최고도달층(0=기본). 배치 순서 = 표시 순서.
  G.DATA.AVATARS = [
    { id:"adventurer", name:"모험가", unlock:0, sheet:"assets/adventurer.png", fw:32, fh:32, scale:1.5,
      idle:{row:0,frames:13,dur:1.4}, walk:{row:1,frames:8,dur:0.7}, attack:{row:4,frames:10,dur:0.42}, hurt:{row:6,frames:4,dur:0.32}, death:{row:7,frames:7,dur:0.70} },
    { id:"dwarf", name:"드워프", unlock:10, sheet:"assets/avatars/dwarf.png", fw:64, fh:32, scale:0.9,
      idle:{row:0,frames:5,dur:0.55}, attack:{row:3,frames:6,dur:0.27}, hurt:{row:6,frames:4,dur:0.32}, death:{row:7,frames:7,dur:0.7} },
    { id:"fishfolk_berserker", name:"어인 광전사", unlock:20, sheet:"assets/avatars/fishfolk_berserker.png", fw:96, fh:32, scale:0.9,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:4,frames:6,dur:0.27}, hurt:{row:5,frames:4,dur:0.32}, death:{row:6,frames:5,dur:0.5} },
    { id:"fishfolk_whip", name:"어인 채찍병", unlock:30, sheet:"assets/avatars/fishfolk_whip.png", fw:64, fh:32, scale:0.9,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:2,frames:7,dur:0.32}, hurt:{row:3,frames:4,dur:0.32}, death:{row:4,frames:4,dur:0.4} },
    { id:"goblin_assassin", name:"고블린 암살자", unlock:40, sheet:"assets/avatars/goblin_assassin.png", fw:32, fh:32, scale:1.5,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:4,frames:3,dur:0.2}, hurt:{row:6,frames:4,dur:0.32}, death:{row:7,frames:7,dur:0.7} },
    { id:"lizardfolk_spearman", name:"리자드맨 창병", unlock:50, sheet:"assets/avatars/lizardfolk_spearman.png", fw:64, fh:64, scale:0.9,
      idle:{row:0,frames:8,dur:0.88}, attack:{row:2,frames:8,dur:0.36}, hurt:{row:3,frames:4,dur:0.32}, death:{row:4,frames:5,dur:0.5} },
    { id:"lizardfolk_warrior", name:"리자드맨 전사", unlock:60, sheet:"assets/avatars/lizardfolk_warrior.png", fw:64, fh:64, scale:0.9,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:2,frames:6,dur:0.27}, hurt:{row:4,frames:4,dur:0.32}, death:{row:5,frames:5,dur:0.5} },
    { id:"fishfolk_brute", name:"어인 투사", unlock:70, sheet:"assets/avatars/fishfolk_brute.png", fw:64, fh:64, scale:0.9,
      idle:{row:1,frames:5,dur:0.55}, attack:{row:3,frames:8,dur:0.36}, hurt:{row:4,frames:4,dur:0.32}, death:{row:5,frames:6,dur:0.6} },
    { id:"fishfolk_knight", name:"어인 기사", unlock:80, sheet:"assets/avatars/fishfolk_knight.png", fw:32, fh:32, scale:1.5,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:2,frames:7,dur:0.32}, hurt:{row:4,frames:4,dur:0.32}, death:{row:5,frames:4,dur:0.4} },
    { id:"yeti", name:"예티", unlock:90, sheet:"assets/avatars/yeti.png", fw:64, fh:64, scale:0.9,
      idle:{row:0,frames:7,dur:0.77}, attack:{row:2,frames:6,dur:0.27}, hurt:{row:4,frames:4,dur:0.32}, death:{row:5,frames:6,dur:0.6} },
    { id:"wendigo", name:"웬디고", unlock:100, sheet:"assets/avatars/wendigo.png", fw:64, fh:64, scale:0.9,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:2,frames:8,dur:0.36}, hurt:{row:3,frames:8,dur:0.64}, death:{row:5,frames:8,dur:0.8} },
    { id:"elven_warrior", name:"엘프 전사", unlock:110, sheet:"assets/avatars/elven_warrior.png", fw:32, fh:32, scale:1.5,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:2,frames:4,dur:0.2}, hurt:{row:3,frames:3,dur:0.24}, death:{row:4,frames:6,dur:0.6} },
    { id:"vengeful_spirit", name:"원혼", unlock:150, sheet:"assets/avatars/vengeful_spirit.png", fw:64, fh:64, scale:0.9,
      idle:{row:0,frames:6,dur:0.66}, attack:{row:1,frames:12,dur:0.54}, hurt:{row:2,frames:6,dur:0.48}, death:{row:3,frames:10,dur:1} },
  /* === 몬스터 기반 신규 아바타 (스트립 모드) — 일반 42(층해금) === */
    { id:"goblin_shaman", name:"고블린 주술사", unlock:20, mon:"goblin_shaman", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:5,dur:0.5} },
    { id:"cultists", name:"광신도", unlock:45, mon:"cultists", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:5,dur:0.55}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:5,dur:0.5} },
    { id:"archer", name:"궁수", unlock:65, mon:"archer", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:4,dur:0.34}, death:{frames:4,dur:0.4} },
    { id:"knight", name:"기사", unlock:90, mon:"knight", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:5,dur:0.35}, hurt:{frames:3,dur:0.26}, death:{frames:7,dur:0.7} },
    { id:"gnoll", name:"놀", unlock:115, mon:"gnoll", fw:64, fh:32, scale:0.84, idle:{frames:4,dur:0.48}, attack:{frames:8,dur:0.56}, hurt:{frames:4,dur:0.34}, death:{frames:7,dur:0.7} },
    { id:"ninja", name:"닌자", unlock:135, mon:"ninja", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:5,dur:0.35}, hurt:{frames:4,dur:0.34}, death:{frames:7,dur:0.7} },
    { id:"thief_medieval", name:"도둑", unlock:160, mon:"thief_medieval", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:10,dur:0.7}, hurt:{frames:6,dur:0.51}, death:{frames:5,dur:0.5} },
    { id:"lizardfolk_archer", name:"도마뱀 궁수", unlock:185, mon:"lizardfolk_archer", fw:64, fh:32, scale:0.84, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:4,dur:0.28}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"lizardfolk_monk", name:"도마뱀 수도사", unlock:205, mon:"lizardfolk_monk", fw:64, fh:32, scale:0.84, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:8,dur:0.68}, death:{frames:8,dur:0.8} },
    { id:"rogue", name:"도적", unlock:230, mon:"rogue", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:5,dur:0.35}, hurt:{frames:4,dur:0.34}, death:{frames:8,dur:0.8} },
    { id:"dwarf_arbelest", name:"드워프 석궁병", unlock:255, mon:"dwarf_arbelest", fw:64, fh:32, scale:0.84, idle:{frames:6,dur:0.72}, walk:{frames:8,dur:0.88}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:4,dur:0.4} },
    { id:"lich", name:"리치", unlock:280, mon:"lich", fw:192, fh:160, scale:0.55, idle:{frames:8,dur:0.96}, attack:{frames:5,dur:0.35}, hurt:{frames:4,dur:0.34}, death:{frames:16,dur:1.6} },
    { id:"mage", name:"마법사", unlock:300, mon:"mage", fw:64, fh:32, scale:0.84, idle:{frames:8,dur:0.96}, walk:{frames:11,dur:1.21}, attack:{frames:5,dur:0.35}, hurt:{frames:9,dur:0.77}, death:{frames:9,dur:0.9} },
    { id:"minotaur", name:"미노타우로스", unlock:325, mon:"minotaur", fw:96, fh:96, scale:0.56, idle:{frames:5,dur:0.6}, walk:{frames:8,dur:0.88}, attack:{frames:9,dur:0.63}, hurt:{frames:3,dur:0.26}, death:{frames:6,dur:0.6} },
    { id:"bullywug_warrior", name:"불리웍 전사", unlock:350, mon:"bullywug_warrior", fw:64, fh:32, scale:0.84, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"bandit", name:"산적", unlock:370, mon:"bandit", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:7,dur:0.49}, hurt:{frames:3,dur:0.26}, death:{frames:7,dur:0.7} },
    { id:"bandit_mage", name:"산적 마법사", unlock:395, mon:"bandit_mage", fw:32, fh:32, scale:1.6, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:5,dur:0.43}, death:{frames:5,dur:0.5} },
    { id:"bandit_slingshot", name:"산적 투석꾼", unlock:420, mon:"bandit_slingshot", fw:64, fh:32, scale:0.84, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:9,dur:0.63}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"anubis_warrior", name:"아누비스 전사", unlock:440, mon:"anubis_warrior", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:4,dur:0.28}, hurt:{frames:4,dur:0.34}, death:{frames:5,dur:0.5} },
    { id:"fishfolk_archpriest", name:"어인 대사제", unlock:465, mon:"fishfolk_archpriest", fw:64, fh:32, scale:0.84, idle:{frames:4,dur:0.48}, walk:{frames:4,dur:0.44}, attack:{frames:9,dur:0.63}, hurt:{frames:4,dur:0.34}, death:{frames:4,dur:0.4} },
    { id:"fishfolk_shaman", name:"어인 주술사", unlock:490, mon:"fishfolk_shaman", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"fishfolk_hypnotist", name:"어인 최면술사", unlock:510, mon:"fishfolk_hypnotist", fw:64, fh:32, scale:0.84, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:5,dur:0.5} },
    { id:"dwarf_undead", name:"언데드 드워프", unlock:535, mon:"dwarf_undead", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:5,dur:0.5} },
    { id:"elven_archer", name:"엘프 궁수", unlock:560, mon:"elven_archer", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:7,dur:0.49}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"elven_wizard", name:"엘프 마법사", unlock:580, mon:"elven_wizard", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:5,dur:0.5} },
    { id:"priestess", name:"여사제", unlock:605, mon:"priestess", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:5,dur:0.35}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"plague_doctor", name:"역병 의사", unlock:630, mon:"plague_doctor", fw:32, fh:32, scale:1.6, idle:{frames:12,dur:1.44}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:4,dur:0.34}, death:{frames:15,dur:1.5} },
    { id:"orc_hunter", name:"오크 사냥꾼", unlock:650, mon:"orc_hunter", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:4,dur:0.4} },
    { id:"orc_taskmaster", name:"오크 작업반장", unlock:675, mon:"orc_taskmaster", fw:64, fh:32, scale:0.84, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:6,dur:0.42}, hurt:{frames:3,dur:0.26}, death:{frames:6,dur:0.6} },
    { id:"orc", name:"오크 전사", unlock:700, mon:"orc", fw:64, fh:64, scale:0.84, idle:{frames:5,dur:0.6}, walk:{frames:8,dur:0.88}, attack:{frames:7,dur:0.49}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"orc_shaman", name:"오크 주술사", unlock:720, mon:"orc_shaman", fw:32, fh:32, scale:1.6, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:7,dur:0.49}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"ratfolk_berserker_sprite", name:"쥐족 광전사", unlock:745, mon:"ratfolk_berserker_sprite", fw:64, fh:32, scale:0.84, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"ratfolk_tamer", name:"쥐족 조련사", unlock:770, mon:"ratfolk_tamer", fw:64, fh:32, scale:0.84, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:5,dur:0.43}, death:{frames:8,dur:0.8} },
    { id:"korred", name:"코레드", unlock:795, mon:"korred", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:5,dur:0.35}, hurt:{frames:3,dur:0.26}, death:{frames:5,dur:0.5} },
    { id:"kobold_priest", name:"코볼트 사제", unlock:815, mon:"kobold_priest", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:4,dur:0.34}, death:{frames:7,dur:0.7} },
    { id:"kobold_dragonshield", name:"코볼트 용방패병", unlock:840, mon:"kobold_dragonshield", fw:64, fh:32, scale:0.84, idle:{frames:5,dur:0.6}, walk:{frames:8,dur:0.88}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:7,dur:0.7} },
    { id:"kobold_shaman", name:"코볼트 주술사", unlock:865, mon:"kobold_shaman", fw:32, fh:32, scale:1.6, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:5,dur:0.43}, death:{frames:6,dur:0.6} },
    { id:"kobold_slinger", name:"코볼트 투석병", unlock:885, mon:"kobold_slinger", fw:64, fh:32, scale:0.84, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:7,dur:0.49}, hurt:{frames:4,dur:0.34}, death:{frames:7,dur:0.7} },
    { id:"skeletal_archer", name:"해골 궁수", unlock:910, mon:"skeletal_archer", fw:32, fh:32, scale:1.6, idle:{frames:10,dur:1.2}, walk:{frames:5,dur:0.55}, attack:{frames:8,dur:0.56}, hurt:{frames:3,dur:0.26}, death:{frames:7,dur:0.7} },
    { id:"skeletal_mage", name:"해골 마법사", unlock:935, mon:"skeletal_mage", fw:32, fh:32, scale:1.6, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:3,dur:0.26}, death:{frames:6,dur:0.6} },
    { id:"skeletal_warrior", name:"해골 전사", unlock:955, mon:"skeletal_warrior", fw:32, fh:32, scale:1.6, idle:{frames:10,dur:1.2}, walk:{frames:5,dur:0.55}, attack:{frames:10,dur:0.7}, hurt:{frames:5,dur:0.43}, death:{frames:10,dur:1.0} },
    { id:"pyromancer", name:"화염술사", unlock:980, mon:"pyromancer", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:15,dur:1.05}, hurt:{frames:4,dur:0.34}, death:{frames:4,dur:0.4} },
  /* === 보스 19(외형 뽑기) === */
    { id:"naga", name:"나가", unlock:9999, rarity:"epic", mon:"naga", fw:64, fh:64, scale:0.84, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:7,dur:0.49}, hurt:{frames:4,dur:0.34}, death:{frames:8,dur:0.8} },
    { id:"fallen_angel", name:"대천사", unlock:9999, rarity:"legend", mon:"fallen_angel", fw:96, fh:96, scale:0.56, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:8,dur:0.68}, death:{frames:7,dur:0.7} },
    { id:"lizardfolk_mage", name:"도마뱀 마법사", unlock:9999, rarity:"epic", mon:"lizardfolk_mage", fw:64, fh:64, scale:0.84, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:5,dur:0.43}, death:{frames:5,dur:0.5} },
    { id:"king_dwarf", name:"드워프 왕", unlock:9999, rarity:"legend", mon:"king_dwarf", fw:96, fh:96, scale:0.56, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:5,dur:0.35}, hurt:{frames:5,dur:0.43}, death:{frames:5,dur:0.5} },
    { id:"witch", name:"마녀", unlock:9999, rarity:"epic", mon:"witch", fw:32, fh:32, scale:1.6, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:4,dur:0.34}, death:{frames:10,dur:1.0} },
    { id:"mind_flayer", name:"마인드 플레이어", unlock:9999, rarity:"legend", mon:"mind_flayer", fw:64, fh:64, scale:0.84, idle:{frames:8,dur:0.96}, attack:{frames:8,dur:0.56}, hurt:{frames:8,dur:0.68}, death:{frames:15,dur:1.5} },
    { id:"octopus_king", name:"문어 왕", unlock:9999, rarity:"legend", mon:"octopus_king", fw:128, fh:96, scale:0.55, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:5,dur:0.43}, death:{frames:8,dur:0.8} },
    { id:"mummy_lord", name:"미라 군주", unlock:9999, rarity:"epic", mon:"mummy_lord", fw:64, fh:64, scale:0.84, idle:{frames:4,dur:0.48}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:9,dur:0.9} },
    { id:"barbarian", name:"바바리안", unlock:9999, rarity:"epic", mon:"barbarian", fw:96, fh:96, scale:0.56, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:4,dur:0.34}, death:{frames:5,dur:0.5} },
    { id:"fire_giant", name:"서리 거인", unlock:9999, rarity:"epic", mon:"fire_giant", fw:64, fh:64, scale:0.84, idle:{frames:4,dur:0.48}, walk:{frames:6,dur:0.66}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:7,dur:0.7} },
    { id:"fishfolk_bubblemancer", name:"어인 거품술사", unlock:9999, rarity:"rare", mon:"fishfolk_bubblemancer", fw:64, fh:64, scale:0.84, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:5,dur:0.43}, death:{frames:8,dur:0.8} },
    { id:"orc_chief", name:"오크 감독관", unlock:9999, rarity:"epic", mon:"orc_chief", fw:64, fh:32, scale:0.84, idle:{frames:8,dur:0.96}, walk:{frames:8,dur:0.88}, attack:{frames:6,dur:0.42}, hurt:{frames:3,dur:0.26}, death:{frames:6,dur:0.6} },
    { id:"orc_warrior", name:"오크 무사", unlock:9999, rarity:"rare", mon:"orc_warrior", fw:64, fh:64, scale:0.84, idle:{frames:5,dur:0.6}, walk:{frames:8,dur:0.88}, attack:{frames:7,dur:0.49}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"orc_warlock", name:"오크 흑마법사", unlock:9999, rarity:"rare", mon:"orc_warlock", fw:64, fh:64, scale:0.84, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:3,dur:0.26}, death:{frames:6,dur:0.6} },
    { id:"ifrit", name:"이프리트", unlock:9999, rarity:"legend", mon:"ifrit", fw:64, fh:64, scale:0.84, idle:{frames:5,dur:0.6}, walk:{frames:8,dur:0.88}, attack:{frames:13,dur:0.91}, hurt:{frames:4,dur:0.34}, death:{frames:18,dur:1.8} },
    { id:"death", name:"죽음", unlock:9999, rarity:"legend", mon:"death", fw:96, fh:96, scale:0.56, idle:{frames:6,dur:0.72}, walk:{frames:4,dur:0.44}, attack:{frames:7,dur:0.49}, hurt:{frames:5,dur:0.43}, death:{frames:9,dur:0.9} },
    { id:"angel", name:"천사", unlock:9999, rarity:"legend", mon:"angel", fw:64, fh:64, scale:0.84, idle:{frames:5,dur:0.6}, attack:{frames:6,dur:0.42}, hurt:{frames:4,dur:0.34}, death:{frames:6,dur:0.6} },
    { id:"paladin", name:"팔라딘", unlock:9999, rarity:"epic", mon:"paladin", fw:64, fh:64, scale:0.84, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:8,dur:0.56}, hurt:{frames:4,dur:0.34}, death:{frames:7,dur:0.7} },
    { id:"skeleton_king", name:"해골 왕", unlock:9999, rarity:"legend", mon:"skeleton_king", fw:96, fh:96, scale:0.56, idle:{frames:4,dur:0.48}, walk:{frames:8,dur:0.88}, attack:{frames:7,dur:0.49}, hurt:{frames:4,dur:0.34}, death:{frames:9,dur:0.9} },
  ];

  G.avatar = {};
  // 장착 아바타 스탯 보너스 — 등급(가챠 희귀도 ∥ 층해금 깊이)이 높을수록 강함. 공격%·체력% 부여.
  G.avatar.GRADE_BONUS = { 0:{atkPct:2,hpPct:2}, 1:{atkPct:4,hpPct:4}, 2:{atkPct:7,hpPct:7}, 3:{atkPct:10,hpPct:10}, 4:{atkPct:15,hpPct:15} };
  G.avatar.GRADE_LABEL = { 0:"기본", 1:"일반", 2:"희귀", 3:"영웅", 4:"전설" };
  G.avatar.gradeOf = function(a){
    if(!a || a.id==="adventurer") return 0;
    var r = (G.gacha&&G.gacha.rarityOf) ? G.gacha.rarityOf(a) : (a.rarity||null);
    if(r) return ({common:1,rare:2,epic:3,legend:4})[r] || 1;   // 가챠 희귀도 우선
    var f=a.unlock||0;                                            // 층해금: 깊을수록↑
    return f>=500?4 : f>=200?3 : f>=50?2 : f>0?1 : 0;
  };
  G.avatar.statBonus = function(id){ return G.avatar.GRADE_BONUS[G.avatar.gradeOf(G.avatar.get(id||G.avatar.currentId()))] || {atkPct:0,hpPct:0}; };

  G.avatar.get = function(id){ return G.DATA.AVATARS.filter(function(a){return a.id===id;})[0] || G.DATA.AVATARS[0]; };
  G.avatar.randomId = function(rnd){ var r=(typeof rnd==="function")?rnd():Math.random(); return G.DATA.AVATARS[Math.floor(r*G.DATA.AVATARS.length)].id; };

  // 애니 소스 해석 — 멀티행 시트(sheet) 모드 ∥ 몬스터 추출 스트립(mon) 모드 통합.
  // 반환 {url,row,frames,fw,fh,dur} (없는 모션은 null). mon 모드: 모션별 단일행 스트립(row 0).
  var MONSUF={ idle:"", walk:"_walk", attack:"_attack", hurt:"_hurt", death:"_death" };
  G.avatar._src = function(c, name){
    var m=c[name]; if(!m) return null;
    if(c.mon) return { url:"assets/enemies/"+c.mon+(MONSUF[name]||"")+".png", row:0, frames:m.frames, fw:c.fw, fh:c.fh, dur:m.dur };
    return { url:c.sheet, row:m.row, frames:m.frames, fw:c.fw, fh:c.fh, dur:m.dur };
  };

  // 작은 정적 아바타(idle 0프레임) — 랭킹/아레나 등 목록에서 남들 아바타 표시용
  G.avatar.miniHTML = function(id, size){
    size = size||26;
    var c=G.avatar.get(id||"adventurer");
    var s=G.avatar._src(c,"idle"); if(!s) return "";
    var z=size/Math.max(s.fw,s.fh);
    var y=-(s.row*s.fh);
    var inner='width:'+s.fw+'px;height:'+s.fh+'px;background:url(\''+s.url+'\') 0px '+y+'px no-repeat;background-size:auto;'+
      'image-rendering:pixelated;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale('+z+');';
    var box='position:relative;display:inline-block;width:'+size+'px;height:'+size+'px;vertical-align:middle;flex:0 0 auto;';
    return '<span style="'+box+'"><span style="'+inner+'"></span></span>';
  };
  G.avatar.currentId = function(){ return (G.state && G.state.avatar) || "adventurer"; };
  G.avatar.current = function(){ return G.avatar.get(G.avatar.currentId()); };
  G.avatar.hasWalk = function(){ var c=G.avatar.current(); return !!(c && c.walk); };   // 진짜 걷기 프레임 보유 여부

  G.avatar.unlocked = function(a){
    if(typeof a==="string") a=G.avatar.get(a);
    var max=(G.state&&G.state.dungeon&&G.state.dungeon.maxFloor)||1;
    return max >= (a.unlock||0);
  };
  // 보유 여부 = 층 해금 ∥ 외형 뽑기 보유 (선택 가능 판정 일원화)
  G.avatar.owned = function(id){
    var a=(typeof id==="object")?id:G.avatar.get(id); if(!a) return false;
    if((a.unlock!=null) && G.avatar.unlocked(a)) return true;
    var c=G.state&&G.state.cosmetics; return !!(c&&c.owned&&c.owned[a.id]);
  };

  // 층 도달로 새로 해금된 아바타 → 해금 모달용 항목 반환(최초/구버전은 조용히 동기화)
  G.avatar.syncUnlocks = function(){
    if(!G.state) return [];
    var max=(G.state.dungeon&&G.state.dungeon.maxFloor)||1;
    if(!G.state.avatarSeen){
      G.state.avatarSeen={};
      G.DATA.AVATARS.forEach(function(a){ if((a.unlock||0)<=max) G.state.avatarSeen[a.id]=true; });
      return [];
    }
    var fresh=[];
    G.DATA.AVATARS.forEach(function(a){
      if((a.unlock||0)<=max && !G.state.avatarSeen[a.id]){
        G.state.avatarSeen[a.id]=true;
        fresh.push({ ico:G.avatar.miniHTML(a.id,34), name:a.name+" 아바타", desc:"캐릭터 탭에서 외형 변경 가능", sub:"아바타 · "+(a.unlock||0)+"층" });
        if(G.log) G.log("🎭 아바타 해금: "+a.name+" ("+(a.unlock||0)+"층 도달)","r-legend");
      }
    });
    return fresh;
  };
  G.avatar.set = function(id){
    if(!G.state) return false;
    var a=G.avatar.get(id);
    if(!G.avatar.owned(id)){
      var msg=(a.unlock!=null && a.unlock<9999) ? ("🔒 "+a.unlock+"층 도달 시 해금됩니다") : "🎰 외형 뽑기에서 획득하세요";
      if(G.ui&&G.ui.toast) G.ui.toast(msg); return false;
    }
    G.state.avatar = id;
    if(G.save) G.save.save(true);
    G.avatar.apply();
    if(G.net && G.net.syncProfile) G.net.syncProfile();   // 프로필에도 반영(랭킹·아레나 표시용)
    return true;
  };

  // loop=true(idle): N프레임 루프(to=-(N*fw)). loop=false(공격/피격/사망): 마지막 실제 프레임에서 멈춤(to=-((N-1)*fw)) → 끝에 빈 프레임 방지
  function steps(m, loop){ return Math.max(1, loop ? m.frames : m.frames-1); }
  function kf(name, m, fw, fh, loop){
    var y = -(m.row*fh);
    var end = loop ? m.frames : Math.max(1, m.frames-1);
    return "@keyframes "+name+"{from{background-position:0 "+y+"px}to{background-position:"+(-(end*fw))+"px "+y+"px}}";
  }

  // 선택 아바타용 스타일을 #pc-avatar-style 에 주입(시트/크기/애니메이션/키프레임). 양 모드(sheet/mon) 공통.
  G.avatar.apply = function(){
    var c=G.avatar.current(); if(!c) return;
    var sc=(c.scale||1.5), S=G.avatar._src;
    var idle=S(c,"idle"), atk=S(c,"attack"), hurt=S(c,"hurt"), death=S(c,"death"), walk=S(c,"walk");
    if(!idle) return;
    function kf2(name, s, loop){ var end=loop?s.frames:Math.max(1,s.frames-1); var y=-(s.row*s.fh);
      return "@keyframes "+name+"{from{background-position:0 "+y+"px}to{background-position:"+(-(end*s.fw))+"px "+y+"px}}"; }
    function stp(s, loop){ return Math.max(1, loop?s.frames:s.frames-1); }
    var css=
      '#pc-sprite{--pc-scale:'+sc+';width:'+idle.fw+'px;height:'+idle.fh+'px;background-image:url("'+idle.url+'");background-repeat:no-repeat;background-size:auto;'+
        'transform:translateX(-50%) scale('+sc+');animation:pc-idle '+c.idle.dur+'s steps('+stp(idle,true)+') infinite;}'+
      (atk ? '#pc-sprite.attack{background-image:url("'+atk.url+'");animation:pc-attack '+c.attack.dur+'s steps('+stp(atk,false)+') 1 forwards;}' : '')+
      (hurt ? '#pc-sprite.hurt{background-image:url("'+hurt.url+'");animation:pc-hurt '+c.hurt.dur+'s steps('+stp(hurt,false)+') 1;}' : '')+
      (death ? '#pc-sprite.death{background-image:url("'+death.url+'");animation:pc-death '+c.death.dur+'s steps('+stp(death,false)+') 1 forwards;}' : '')+
      (walk ? '#pc-sprite.walk{background-image:url("'+walk.url+'");animation:pc-walk '+c.walk.dur+'s steps('+stp(walk,true)+') infinite;}'+kf2("pc-walk",walk,true) : '')+
      kf2("pc-idle",idle,true)+(atk?kf2("pc-attack",atk,false):"")+(hurt?kf2("pc-hurt",hurt,false):"")+(death?kf2("pc-death",death,false):"");
    var st=document.getElementById("pc-avatar-style");
    if(!st){ st=document.createElement("style"); st.id="pc-avatar-style"; document.head.appendChild(st); }
    st.textContent=css;
    if(G.glow) G.glow.apply();   // 컬렉션 글로우 갱신
  };

  /* ============================================================
     컬렉션 글로우 — 장비 연대기(고유장비) 발견 수에 따라 플레이어 스프라이트에 실루엣 글로우.
     티어=발견/전체 비율 단계. #pc-glow-style(id) 주입 → 재렌더된 #pc-sprite에도 자동 적용.
     ============================================================ */
  G.glow = {};
  G.glow.DEF = {                          // 티어 → {name, layers:[[색, 블러px], ...]}
    1:{ name:"여명",   layers:[["#ffffff",2],["#ffffff",5]] },
    2:{ name:"비취",   layers:[["#6ad0ff",2],["#3aa0ff",6]] },
    3:{ name:"심령",   layers:[["#c08bff",2],["#9a4dff",6]] },
    4:{ name:"황금",   layers:[["#ffe08a",2],["#ffb43c",5],["#ff9a2c",9]] },
    5:{ name:"프리즘", layers:[["#7afcff",2],["#ff7ad0",6],["#ffe08a",10]] }
  };
  G.glow.total = function(){ return (G.DATA.UNIQUES||[]).length || 1; };
  G.glow.discovered = function(){
    var d=(G.state&&G.state.collection&&G.state.collection.uniques)||{};
    var n=0; for(var k in d){ if(d[k]) n++; } return n;
  };
  G.glow.enabled = function(){ return !(G.state && G.state.glow===false); };
  G.glow.tier = function(){
    var p=G.glow.discovered()/G.glow.total();
    return p>=1?5 : p>=0.8?4 : p>=0.6?3 : p>=0.4?2 : p>=0.2?1 : 0;
  };
  G.glow.layers = function(tier){ var d=G.glow.DEF[tier]; if(!d) return "";
    return d.layers.map(function(l){ return "drop-shadow(0 0 "+l[1]+"px "+l[0]+")"; }).join(" "); };
  G.glow.apply = function(){
    var st=document.getElementById("pc-glow-style");
    var tier=G.glow.enabled()?G.glow.tier():0;
    if(!tier){ if(st) st.remove(); return; }
    if(!st){ st=document.createElement("style"); st.id="pc-glow-style"; document.head.appendChild(st); }
    st.textContent='#pc-sprite{ filter:drop-shadow(0 3px 4px rgba(0,0,0,.55)) '+G.glow.layers(tier)+'; }';
  };

  // 선택 UI용 프리뷰(컨테이너 fw*zoom × fh*zoom, 안쪽 원본크기 요소를 scale 확대).
  // 애니메이션(idle→attack 순차)은 animatePreview가 background-position을 갱신.
  G.avatar.zoomFor = function(c){ var s=G.avatar._src(c,"idle")||{fw:c.fw,fh:c.fh}; return Math.min(2.4, Math.max(1, 64/Math.max(s.fw,s.fh))); };
  G.avatar.previewHTML = function(c){
    var s=G.avatar._src(c,"idle"); if(!s) return "";
    var zoom=G.avatar.zoomFor(c);
    var y = -(s.row*s.fh);
    var inner='width:'+s.fw+'px;height:'+s.fh+'px;'+
      'background:url(\''+s.url+'\') 0px '+y+'px no-repeat;background-size:auto;'+
      'image-rendering:pixelated;position:absolute;left:0;top:0;'+
      'transform:scale('+zoom+');transform-origin:top left;';
    var box='position:relative;width:'+(s.fw*zoom)+'px;height:'+(s.fh*zoom)+'px;';
    return '<div style="'+box+'"><div class="av-prev-inner" data-av="'+c.id+'" style="'+inner+'"></div></div>';
  };

  // 전투용 파이터 스프라이트(아레나 전투화면 등) — 임의 아바타를 holder에 렌더.
  // idle 루프, set("attack"/"hurt"/"death")은 1회 재생 후 idle 복귀. flip=좌우반전(상대측).
  G.avatar.makeFighter = function(holder, id, flip, dispScale, glowTier){
    var c=G.avatar.get(id), S=G.avatar._src;
    var idle=S(c,"idle"); if(!idle) return null;
    var z=(dispScale||2.2)*(c.scale||1.5);
    var gl=(glowTier && G.glow)? " "+G.glow.layers(glowTier) : "";
    var sp=document.createElement("div");
    sp.style.cssText="position:absolute;left:50%;bottom:0;width:"+idle.fw+"px;height:"+idle.fh+"px;"+
      "background:url('"+idle.url+"') 0 0 no-repeat;background-size:auto;image-rendering:pixelated;"+
      "transform:translateX(-50%) scale("+z+")"+(flip?" scaleX(-1)":"")+";transform-origin:center bottom;"+
      "filter:drop-shadow(0 3px 4px rgba(0,0,0,.55))"+gl+";";
    holder.appendChild(sp);
    var st={ mo:"idle", frame:0, t:null };
    function src(){ return S(c, st.mo) || idle; }
    function draw(){ var s=src(); var f=st.frame%Math.max(1,s.frames);
      sp.style.backgroundImage="url('"+s.url+"')";
      sp.style.backgroundPosition=(-(f*s.fw))+"px "+(-(s.row*s.fh))+"px"; }
    draw();
    st.t=setInterval(function(){ if(!sp.isConnected){ clearInterval(st.t); return; }
      var s=src(); st.frame++;
      if(st.mo!=="idle" && st.frame>=s.frames){ if(st.mo==="death"){ st.frame=s.frames-1; } else { st.mo="idle"; st.frame=0; } }
      draw();
    }, 90);
    return { el:sp,
      set:function(n){ if(S(c,n)){ st.mo=n; st.frame=0; draw(); } },
      stop:function(){ if(st.t){ clearInterval(st.t); st.t=null; } } };
  };

  // 프리뷰 요소를 idle 프레임들 → attack 프레임들 순차 재생(루프). DOM에서 제거되면 자동 정지.
  G.avatar.animatePreview = function(el){
    var c=G.avatar.get(el.getAttribute("data-av")); if(!c) return null;
    var idle=G.avatar._src(c,"idle"), atk=G.avatar._src(c,"attack");
    var seq=[], i;
    if(idle) for(i=0;i<idle.frames;i++) seq.push([i, idle.row, idle.url, idle.fw, idle.fh]);
    if(atk) for(i=0;i<atk.frames;i++) seq.push([i, atk.row, atk.url, atk.fw, atk.fh]);
    if(!seq.length && idle) seq.push([0, idle.row, idle.url, idle.fw, idle.fh]);
    var k=0;
    var t=setInterval(function(){
      if(!el.isConnected){ clearInterval(t); return; }
      var f=seq[k%seq.length];
      el.style.backgroundImage="url('"+f[2]+"')";
      el.style.backgroundPosition = (-(f[0]*f[3]))+"px "+(-(f[1]*f[4]))+"px";
      k++;
    }, 90);
    return t;
  };
})();
