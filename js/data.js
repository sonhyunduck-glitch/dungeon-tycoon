/* ============================================================
   정적 데이터 — 몬스터 / 아이템 베이스 / 층·스테이지
   전역 G 네임스페이스 사용 (file:// 환경 호환)
   ============================================================ */
var G = window.G || {};
G.DATA = {};

/* 등급 정의: 가중치 / 스탯·가격 배율 / 표시 라벨 */
/* 등급: mult=주스탯배율, price=가격배율, affMin~affMax=랜덤 옵션(접사) 개수 범위 */
G.DATA.RARITY = [
  { key:"common",   label:"일반", cls:"r-common",   weight:60,  mult:1.0,  price:1.0,  affMin:0, affMax:1 },
  { key:"uncommon", label:"고급", cls:"r-uncommon", weight:24,  mult:1.35, price:1.8,  affMin:1, affMax:2 },
  { key:"rare",     label:"희귀", cls:"r-rare",     weight:11,  mult:1.8,  price:3.4,  affMin:2, affMax:3 },
  { key:"epic",     label:"영웅", cls:"r-epic",     weight:3.5, mult:2.5,  price:7.0,  affMin:3, affMax:4 },
  { key:"legend",   label:"전설", cls:"r-legend",   weight:1.5, mult:3.6,  price:16.0, affMin:4, affMax:6 },
];

/* 장비 타입 정의 + 주 스탯 */
G.DATA.ITEM_BASES = [
  { base:"검",     ico:"🗡️", type:"weapon", slot:"weapon", main:"atk", val:10, iconDir:"weapon_sword" },
  { base:"도끼",   ico:"🪓", type:"weapon", slot:"weapon", main:"atk", val:13, iconDir:"weapon_axe" },
  { base:"단검",   ico:"🔪", type:"weapon", slot:"weapon", main:"atk", val:8,  iconDir:"weapon_dagger" },
  { base:"투구",   ico:"⛑️", type:"armor",  slot:"helmet", main:"def", val:5,  iconDir:"helmet" },
  { base:"갑옷",   ico:"🛡️", type:"armor",  slot:"armor",  main:"def", val:9,  iconDir:"armor" },
  { base:"장갑",   ico:"🧤", type:"armor",  slot:"gloves", main:"def", val:4,  iconDir:"gloves" },
  { base:"신발",   ico:"🥾", type:"armor",  slot:"boots",  main:"def", val:4,  iconDir:"boots" },
  { base:"반지",   ico:"💍", type:"acc",    slot:"ring",     main:"crit",val:4,  iconDir:"ring" },
  { base:"목걸이", ico:"📿", type:"acc",    slot:"necklace", main:"hp",  val:20, iconDir:"necklace" },
];

/* 접두 수식어 */
G.DATA.PREFIX = ["낡은","녹슨","평범한","단단한","날카로운","빛나는","고대의","용맹한","파괴적인","불멸의"];

/* 소켓 시스템(디아블로식): 장비에 소켓 → 룬 삽입. 룬은 무기/방어구에 따라 다른 효과(정통). */
G.DATA.SOCKET_MAX = 5;          // 소켓 최대 개수
G.DATA.SOCKET_BASE_RATE = 0.10; // 장비 드랍 중 소켓 베이스(접사X·소켓O) 비율
/* 룬 드랍 "아주 조금 더" 구간 — 밀스톤 층대에서 소폭 보너스(mult). 겹치면 최대값 1개 적용. */
G.DATA.RUNE_DROP_BANDS = [
  { min:45,  max:55,   mult:1.08 },  // 50층대
  { min:95,  max:105,  mult:1.10 },  // 100층대
  { min:195, max:205,  mult:1.12 },  // 200층대
  { min:295, max:305,  mult:1.15 },  // 300층대
  { min:495, max:505,  mult:1.18 },  // 500층대
  { min:990, max:1000, mult:1.22 },  // 1000층 정복대
];

// 전리품 무게 — 정산(나가기/사망) 화면의 휴대 예산 계산용. 부위별 고정.
G.DATA.SLOT_WEIGHT = { weapon:4, armor:4, helmet:3, gloves:3, boots:3, ring:2, necklace:2, rune:1 };
G.DATA.CARRY_CAP   = 50;   // 정산 시 챙길 수 있는 총 무게(사망 시 ×0.5)
G.DATA.RUN_LOOT_CAP= 100;  // 런 전리품 누적 상한(무게) — 초과분은 최저가치부터 폐기

/* 룬 사다리(15) — 하위→상위. 소켓에 박으며, 무기/방어구에 따라 효과가 다름(정통 디아블로).
   w=드랍 가중치(하위 흔함·상위 희귀). wpn=무기 효과, arm=방어구 효과. */
G.DATA.RUNES = [
  { rank:1,  name:"티끌", iconImg:"assets/icon/runs/1.jpg",  w:60,   wpn:{atk:3},               arm:{hp:12} },
  { rank:2,  name:"불씨", iconImg:"assets/icon/runs/2.jpg",  w:50,   wpn:{crit:2},              arm:{stunResist:6} },
  { rank:3,  name:"잔영", iconImg:"assets/icon/runs/3.jpg",  w:42,   wpn:{atk:5},               arm:{goldFind:8} },
  { rank:4,  name:"미명", iconImg:"assets/icon/runs/4.jpg",  w:36,   wpn:{penet:3},             arm:{dodge:3} },
  { rank:5,  name:"여명", iconImg:"assets/icon/runs/5.jpg",  w:30,   wpn:{penet:5},             arm:{hp:25} },
  { rank:6,  name:"서슬", iconImg:"assets/icon/runs/6.jpg",  w:25,   wpn:{atk:9},               arm:{def:6} },
  { rank:7,  name:"노을", iconImg:"assets/icon/runs/7.jpg",  w:20,   wpn:{elemAtk:8},           arm:{resPoison:12} },
  { rank:8,  name:"섬광", iconImg:"assets/icon/runs/8.jpg",  w:16,   wpn:{elemAtk:8},           arm:{resFire:12} },
  { rank:9,  name:"뇌명", iconImg:"assets/icon/runs/9.jpg",  w:13,   wpn:{elemAtk:8},           arm:{resLight:12} },
  { rank:10, name:"한설", iconImg:"assets/icon/runs/10.jpg", w:10,   wpn:{elemAtk:8},           arm:{resCold:12} },
  { rank:11, name:"업화", iconImg:"assets/icon/runs/11.jpg", w:7,    wpn:{lifesteal:5},         arm:{thorns:12} },
  { rank:12, name:"멸각", iconImg:"assets/icon/runs/12.jpg", w:5,    wpn:{atk:14},              arm:{def:10} },
  { rank:13, name:"천뢰", iconImg:"assets/icon/runs/13.jpg", w:3,    wpn:{multihit:5},          arm:{stunResist:15} },
  { rank:14, name:"성휘", iconImg:"assets/icon/runs/14.jpg", w:2,    wpn:{critDmg:18},          arm:{hp:45} },
  { rank:15, name:"종언", iconImg:"assets/icon/runs/15.jpg", w:1,    wpn:{crit:5,penet:5},      arm:{allRes:8} },
  { rank:16, name:"심연", iconImg:"assets/icon/runs/16.jpg", w:0.8,  wpn:{lifesteal:6},         arm:{allRes:10} },
  { rank:17, name:"명동", iconImg:"assets/icon/runs/17.jpg", w:0.64, wpn:{atk:18},              arm:{stunResist:18} },
  { rank:18, name:"연무", iconImg:"assets/icon/runs/18.jpg", w:0.5,  wpn:{penet:8},             arm:{dodge:6} },
  { rank:19, name:"진공", iconImg:"assets/icon/runs/19.jpg", w:0.4,  wpn:{multihit:6},          arm:{hp:55} },
  { rank:20, name:"빙벽", iconImg:"assets/icon/runs/20.jpg", w:0.32, wpn:{critDmg:20},          arm:{def:14} },
  { rank:21, name:"낙일", iconImg:"assets/icon/runs/21.jpg", w:0.26, wpn:{atk:20},              arm:{allRes:10} },
  { rank:22, name:"월영", iconImg:"assets/icon/runs/22.jpg", w:0.2,  wpn:{crit:6},              arm:{dodge:7} },
  { rank:23, name:"성운", iconImg:"assets/icon/runs/23.jpg", w:0.16, wpn:{elemAtk:14},          arm:{allRes:12} },
  { rank:24, name:"암영", iconImg:"assets/icon/runs/24.jpg", w:0.13, wpn:{critDmg:24},          arm:{thorns:18} },
  { rank:25, name:"린광", iconImg:"assets/icon/runs/25.jpg", w:0.1,  wpn:{crit:7,critDmg:10},   arm:{allRes:12} },
  { rank:26, name:"귀곡", iconImg:"assets/icon/runs/26.jpg", w:0.08, wpn:{lifesteal:7},         arm:{stunResist:20} },
  { rank:27, name:"삭풍", iconImg:"assets/icon/runs/27.jpg", w:0.064,wpn:{multihit:8},          arm:{resCold:20} },
  { rank:28, name:"균열", iconImg:"assets/icon/runs/28.jpg", w:0.05, wpn:{penet:12},            arm:{thorns:22} },
  { rank:29, name:"식멸", iconImg:"assets/icon/runs/29.jpg", w:0.04, wpn:{elemAtk:18,crit:5},   arm:{allRes:14} },
  { rank:30, name:"인과", iconImg:"assets/icon/runs/30.jpg", w:0.032,wpn:{critDmg:28},          arm:{hp:70} },
  { rank:31, name:"신벌", iconImg:"assets/icon/runs/31.jpg", w:0.025,wpn:{atk:26,crit:6},       arm:{allRes:16} },
  { rank:32, name:"영면", iconImg:"assets/icon/runs/32.jpg", w:0.02, wpn:{lifesteal:8,multihit:8}, arm:{hp:90} },
  { rank:33, name:"연옥", iconImg:"assets/icon/runs/33.jpg", w:0.015,wpn:{critDmg:35,penet:10}, arm:{allRes:18,thorns:25} },
];

/* 🔗 룬워드 — 소켓 수 = 길이(3/4/5)가 정확히 일치하고, 부위(cat: weapon/armor)와
   필요 룬(순서 무관) 전부 들어있을 때 발동. bonus는 % 보조. (발견형) */
G.DATA.RUNEWORDS = [
  // 3룬 — 무기
  { id:"rage",     name:"분노",   ico:"🔥", cat:"weapon", runes:["불씨","서슬","멸각"], bonus:{ crit:6, critDmg:15 } },
  { id:"pierce",   name:"관통격", ico:"💢", cat:"weapon", runes:["미명","여명","종언"], bonus:{ penet:12, crit:4 } },
  { id:"bloodaxe", name:"흡혈도", ico:"🩸", cat:"weapon", runes:["업화","불씨","서슬"], bonus:{ lifesteal:6, crit:5 } },
  { id:"swift",    name:"속공",   ico:"🌀", cat:"weapon", runes:["잔영","천뢰","섬광"], bonus:{ multihit:8, crit:4 } },
  { id:"elemental",name:"원소",   ico:"⚡", cat:"weapon", runes:["노을","섬광","뇌명"], bonus:{ elemAtk:20 } },
  { id:"doom",     name:"파멸",   ico:"💥", cat:"weapon", runes:["멸각","성휘","종언"], bonus:{ critDmg:25, penet:6 } },
  { id:"combo",    name:"연격",   ico:"🌀", cat:"weapon", runes:["천뢰","미명","잔영"], bonus:{ multihit:10, penet:6 } },
  // 3룬 — 방어구
  { id:"rampart",  name:"성벽",   ico:"🛡️", cat:"armor",  runes:["서슬","멸각","업화"], bonus:{ thorns:18, allRes:6 } },
  { id:"guardian", name:"수호",   ico:"🪖", cat:"armor",  runes:["여명","한설","종언"], bonus:{ allRes:10, stunResist:8 } },
  { id:"greed",    name:"황금",   ico:"💰", cat:"armor",  runes:["잔영","미명","티끌"], bonus:{ goldFind:40, dodge:5 } },
  { id:"thornmail",name:"가시갑",  ico:"🌵", cat:"armor",  runes:["업화","서슬","한설"], bonus:{ thorns:25 } },
  { id:"steadfast",name:"불굴",   ico:"🪨", cat:"armor",  runes:["서슬","여명","한설"], bonus:{ allRes:8, stunResist:10 } },
  // 4룬 — 무기
  { id:"frenzy",   name:"광폭",   ico:"😡", cat:"weapon", runes:["불씨","서슬","멸각","성휘"], bonus:{ crit:8, critDmg:22, multihit:5 } },
  { id:"massacre", name:"학살",   ico:"🗡️", cat:"weapon", runes:["미명","여명","종언","멸각"], bonus:{ penet:16, critDmg:18 } },
  { id:"tempest",  name:"폭풍우", ico:"🌩️", cat:"weapon", runes:["노을","섬광","뇌명","한설"], bonus:{ elemAtk:35, multihit:6 } },
  { id:"vamplord", name:"흡왕",   ico:"🧛", cat:"weapon", runes:["업화","불씨","멸각","천뢰"], bonus:{ lifesteal:8, multihit:8, crit:5 } },
  // 4룬 — 방어구
  { id:"bastion",  name:"철옹성", ico:"🏰", cat:"armor",  runes:["서슬","멸각","업화","종언"], bonus:{ thorns:25, allRes:10, stunResist:10 } },
  { id:"immortal", name:"불멸",   ico:"♾️", cat:"armor",  runes:["여명","한설","종언","성휘"], bonus:{ allRes:14, thorns:12 } },
  // 5룬 — 무기(빌드 정의급)
  { id:"monarch",  name:"군주",   ico:"👑", cat:"weapon", runes:["멸각","성휘","종언","불씨","업화"], bonus:{ crit:10, critDmg:30, lifesteal:6, multihit:6 } },
  { id:"endgame",  name:"종말",   ico:"☄️", cat:"weapon", runes:["종언","성휘","멸각","천뢰","미명"], bonus:{ penet:18, critDmg:28, multihit:8 } },
  // 5룬 — 방어구
  { id:"aegis",    name:"신성방벽",ico:"✨", cat:"armor",  runes:["종언","한설","여명","서슬","업화"], bonus:{ allRes:18, thorns:30, stunResist:15 } },
  { id:"undying",  name:"불사",   ico:"💖", cat:"armor",  runes:["성휘","여명","업화","한설","종언"], bonus:{ allRes:16, lifesteal:6, thorns:20 } },
  // ===== 상위 룬(16~33) 룬워드 — 엔드게임 =====
  // 3룬
  { id:"abyssguard",name:"심연수호",ico:"🌑", cat:"armor",  runes:["심연","빙벽","귀곡"], bonus:{ allRes:16, lifesteal:5, stunResist:12 } },
  { id:"sunfall",  name:"낙일",   ico:"🌇", cat:"weapon", runes:["낙일","암영","균열"], bonus:{ critDmg:30, penet:12, crit:5 } },
  // 4룬
  { id:"nebula",   name:"성운",   ico:"🌌", cat:"weapon", runes:["성운","식멸","린광","월영"], bonus:{ elemAtk:45, crit:8, critDmg:12 } },
  { id:"glacierwall",name:"빙하벽",ico:"🧊", cat:"armor",  runes:["빙벽","귀곡","진공","인과"], bonus:{ allRes:18, thorns:28, stunResist:16 } },
  // 5룬 — 빌드 정의급
  { id:"judgment", name:"종말심판",ico:"⚖️", cat:"weapon", runes:["연옥","신벌","인과","식멸","암영"], bonus:{ crit:12, critDmg:42, penet:15, lifesteal:8 } },
  { id:"eternity", name:"영원",   ico:"♾️", cat:"armor",  runes:["영면","연옥","진공","빙벽","심연"], bonus:{ allRes:24, thorns:38, stunResist:20, dodge:6 } },
];

/* 옵션(접사) 풀 — 디아블로식
   flat:true  → 평면 수치(층 레벨에 비례해 성장)
   pct:true   → 퍼센트 수치(레벨 무관, 등급/운으로만 결정) */
G.DATA.AFFIXES = [
  { stat:"atk",       min:2,  max:9,  flat:true },
  { stat:"def",       min:2,  max:7,  flat:true },
  { stat:"hp",        min:12, max:45, flat:true },
  { stat:"crit",      min:1,  max:5,  pct:true },
  { stat:"critDmg",   min:6,  max:22, pct:true },
  { stat:"lifesteal", min:1,  max:5,  pct:true },
  { stat:"dodge",     min:1,  max:4,  pct:true },
  { stat:"penet",     min:2,  max:9,  pct:true },
  { stat:"multihit",  min:1,  max:6,  pct:true },
  { stat:"goldFind",  min:4,  max:15, pct:true },
  { stat:"thorns",    min:2,  max:10, pct:true },
  { stat:"stunResist",min:3,  max:12, pct:true },
  { stat:"elemAtk",   min:5,  max:18, pct:true },   // 속성공격 (100층+ 피해 유지)
  { stat:"resFire",   min:4,  max:16, pct:true },   // 화염 저항
  { stat:"resCold",   min:4,  max:16, pct:true },   // 냉기 저항
  { stat:"resLight",  min:4,  max:16, pct:true },   // 번개 저항
  { stat:"resPoison", min:4,  max:16, pct:true },   // 맹독 저항
  { stat:"allRes",    min:2,  max:8,  pct:true },   // 모든 저항(올레지) — 4속성에 모두 합산
  { stat:"potionBoost",min:1, max:5, dec:true, runeOnly:true },  // 물약 회복% (룬 전용, 소수점, 최대 5%)
];

/* 부위별 붙을 수 있는 옵션(접사) 종류 — 디아블로식 슬롯 제한
   (룬은 제한 없이 전체 옵션 가능) */
G.DATA.SLOT_AFFIXES = {
  weapon:   ["atk","crit","critDmg","penet","multihit","lifesteal","elemAtk"],
  helmet:   ["def","hp","stunResist","allRes","resFire","resCold","resLight","resPoison"],
  armor:    ["def","hp","thorns","allRes","resFire","resCold","resLight","resPoison"],
  gloves:   ["atk","def","crit","multihit","penet"],
  boots:    ["def","hp","dodge","allRes","goldFind"],
  ring:     ["crit","critDmg","lifesteal","penet","goldFind","elemAtk"],
  necklace: ["hp","critDmg","allRes","elemAtk","goldFind","resFire","resCold","resLight","resPoison"],
};

/* 부위별 옵션 값 배율 — 부위 성격에 맞는 옵션이 더 높게/낮게 (디아블로식 차등)
   미지정 옵션은 1.0배 */
G.DATA.SLOT_AFFIX_MULT = {
  weapon:   { atk:1.5, critDmg:1.3, penet:1.2, elemAtk:1.2 },
  helmet:   { hp:1.3, allRes:1.3, stunResist:1.4 },
  armor:    { hp:1.5, def:1.4, thorns:1.3 },
  gloves:   { crit:1.4, multihit:1.4, atk:0.7 },
  boots:    { dodge:1.5, hp:0.8, goldFind:1.3 },
  ring:     { critDmg:1.4, crit:1.3, lifesteal:1.3 },
  necklace: { hp:1.4, allRes:1.4, critDmg:1.2 },
};

/* 스탯 표기 메타 (라벨 + 퍼센트 여부) */
G.DATA.STAT_META = {
  atk:       { label:"공격력",     pct:false },
  def:       { label:"방어력",     pct:false },
  hp:        { label:"체력",       pct:false },
  crit:      { label:"치명타율",   pct:true  },
  critDmg:   { label:"치명타피해", pct:true  },
  lifesteal: { label:"생명력흡수", pct:true  },
  dodge:     { label:"회피",       pct:true  },
  penet:     { label:"방어관통",   pct:true  },
  multihit:  { label:"추가타확률", pct:true  },
  goldFind:  { label:"골드획득",   pct:true  },
  thorns:    { label:"피해반사",   pct:true  },
  stunResist:{ label:"기절저항",   pct:true  },
  shopSlot:  { label:"가판대칸",   pct:false, unit:"칸" },
  mercFind:  { label:"손님 방문율", pct:true  },
  potionBoost:{ label:"물약회복",  pct:true  },
  elemAtk:   { label:"속성공격",   pct:true  },
  resFire:   { label:"화염저항",   pct:true  },
  resCold:   { label:"냉기저항",   pct:true  },
  resLight:  { label:"번개저항",   pct:true  },
  resPoison: { label:"맹독저항",   pct:true  },
  allRes:    { label:"모든저항",   pct:true  },
};
/* 합산 대상 스탯 키 목록 */
G.DATA.STAT_KEYS = ["atk","def","hp","crit","critDmg","lifesteal","dodge","penet","multihit","goldFind","thorns","stunResist","elemAtk","resFire","resCold","resLight","resPoison","allRes","shopSlot","mercFind","potionBoost"];

/* 속성 4종 (100층+) — 디아블로식: 몬스터 속성 피해 ↔ 속성별 저항 */
G.DATA.ELEMENTS = [
  { key:"fire",   name:"화염", emoji:"🔥", res:"resFire"   },
  { key:"cold",   name:"냉기", emoji:"❄️", res:"resCold"   },
  { key:"light",  name:"번개", emoji:"⚡", res:"resLight"  },
  { key:"poison", name:"맹독", emoji:"☠️", res:"resPoison" },
];
/* 층의 속성 (100층 미만은 무속성) — 10층 밴드마다 순환 */
G.elementForFloor = function(f){ return f>=100 ? G.DATA.ELEMENTS[Math.floor((f-1)/10)%4] : null; };
/* 속성 상극(약점): 몬스터는 자기 속성에 저항, 상극 속성에 약점. 화염↔냉기, 번개↔맹독 */
G.DATA.ELEM_OPP = { fire:"cold", cold:"fire", light:"poison", poison:"light" };

/* 소모품 */
G.DATA.CONSUMABLES = [
  { id:"potion_s", name:"체력 물약(소)", ico:"🧪", heal:40, basePrice:25 },
];

/* 분해 시 재료 산출량(등급별) */
G.DATA.SALVAGE = { common:1, uncommon:2, rare:5, epic:12, legend:30 };

/* 시장 경쟁 AI 상인 (가상 경제) */
G.DATA.MERCHANTS = ["상인 잭","상인 제니","상인 톰","상인 바바라","상인 핀"];

/* 가판대를 찾는 영웅 NPC (방명록·구매 연출용) */
G.DATA.NPCS = [
  { name:"검사 레온",   cls:"전사", emoji:"⚔️" },
  { name:"궁수 리나",   cls:"궁수", emoji:"🏹" },
  { name:"마법사 모건", cls:"법사", emoji:"🔮" },
  { name:"성기사 단테", cls:"기사", emoji:"🛡️" },
  { name:"도적 케이",   cls:"도적", emoji:"🗡️" },
  { name:"사냥꾼 보라", cls:"헌터", emoji:"🐺" },
  { name:"수도사 진",   cls:"무도", emoji:"👊" },
  { name:"음유시인 라엘",cls:"음유", emoji:"🎵" },
];

/* 방명록 댓글 템플릿 ({floor}=층, {opt}=주요옵션, {item}=아이템명) */
G.DATA.GUEST_COMMENTS = [
  "사장님 {floor}층 보스 뚝배기 깨고 왔습니다, {opt} 지리네요!",
  "{opt} 붙은 거 찾았다… 바로 질렀습니다 🔥",
  "이 가격에 {opt}이라니, 사장님 미쳤어요(좋은 뜻).",
  "{item} 덕분에 {floor}층 클리어했습니다 💪",
  "옆 가게보다 여기가 훨씬 낫네요 ㅎㅎ 단골 등록!",
  "{opt} 세팅 완성했습니다, 감사합니다 🙏",
  "다음 신상도 기대할게요~",
];

/* 특성(자동화 기능) — 골드로 해금 후 ON/OFF 토글
   req.floor: 해당 층이 해금되어야 구매 가능 */
/* 자동화 = 층 클리어 보상 퀘스트 (freeFloor 클리어 시 해금) */
G.DATA.PERKS = [
  { id:"auto_potion",   name:"자동 물약",     ico:"🧪", freeFloor:1,  desc:"체력 35% 이하가 되면 물약을 자동 사용합니다." },
  { id:"auto_battle",   name:"자동 전투",     ico:"🤖", freeFloor:5,  desc:"전투 중 자동으로 공격합니다." },
  { id:"auto_advance",  name:"자동 전진",     ico:"🦶", freeFloor:10, desc:"전투·이벤트 후 다음 노드로 자동 전진합니다." },
  { id:"auto_next",     name:"자동 다음 진행", ico:"⏭️", freeFloor:20, desc:"층 클리어 시 다음 층으로 자동 입장합니다." },
];

/* 전사 스킬 — 골드 해금 후 ON/OFF. 전투 중 우선순위(배열 순)대로 자동 시전, 쿨타임 존재 */
/* req: 해금 도달 층수 (골드 아님 — 해당 층 도달 시 자동 해금) */
G.DATA.SKILLS = [
  { id:"cleave",  name:"휩쓸기",     ico:"🌀", req:50,  cd:3, desc:"적 전체에게 공격력의 80% 광역 피해. (무리 전투 핵심)" },
  { id:"stun",    name:"방패 밀치기", ico:"🛡️", req:120, cd:4, desc:"맨 앞 적을 1턴 기절(반격 스킵)시키고 피해. 적의 기절저항에 막힐 수 있음." },
  { id:"execute", name:"필사의 일격", ico:"🗡️", req:190, cd:3, desc:"맨 앞 적에게 강타 — 치명타피해 효율 2배 적용." },
  { id:"guard",   name:"가시 방패",   ico:"🪖", req:250, cd:4, desc:"2턴간 받는 피해 40% 감소 + 피해반사 2배." },
];

/* 🌟 고유(unique) 장비 — 보스 처치 시 낮은 확률 발견, 시그니처 옵션 고정. 연대기 도감 수집 대상.
   affixes의 v: flat(공/방/체)은 층 비례 스케일, %는 고정. 슬롯 허용 옵션에 맞춤. */
G.DATA.UNIQUES = [
  { id:"u_bloodfang", name:"피의 송곳니", slot:"weapon", iconDir:"weapon_dagger", icon:"kn_t_01.png", main:"atk", mainVal:14, minFloor:15,
    affixes:[{stat:"atk",v:12,flat:true},{stat:"lifesteal",v:8,pct:true},{stat:"crit",v:7,pct:true}], desc:"적의 피를 갈망하는 단검." },
  { id:"u_shadowedge", name:"그림자 칼날", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_05.png", main:"atk", mainVal:15, minFloor:35,
    affixes:[{stat:"atk",v:13,flat:true},{stat:"critDmg",v:35,pct:true},{stat:"multihit",v:8,pct:true}], desc:"그림자에서 벼려진 검." },
  { id:"u_dragonsplit", name:"용살자 도끼", slot:"weapon", iconDir:"weapon_axe", icon:"axe_t_03.png", main:"atk", mainVal:18, minFloor:80,
    affixes:[{stat:"atk",v:16,flat:true},{stat:"penet",v:14,pct:true},{stat:"elemAtk",v:24,pct:true}], desc:"용의 비늘을 가르는 도끼." },
  { id:"u_aegishelm", name:"수호의 투구", slot:"helmet", iconDir:"helmet", icon:"helmets_3.PNG", main:"def", mainVal:10, minFloor:25,
    affixes:[{stat:"hp",v:70,flat:true},{stat:"stunResist",v:18,pct:true},{stat:"allRes",v:10,pct:true}], desc:"무너지지 않는 의지." },
  { id:"u_sagecrown", name:"현자의 관", slot:"helmet", iconDir:"helmet", icon:"helmets_8.PNG", main:"def", mainVal:9, minFloor:110,
    affixes:[{stat:"hp",v:90,flat:true},{stat:"elemAtk",v:26,pct:true},{stat:"allRes",v:12,pct:true}], desc:"고대 지혜가 깃든 관." },
  { id:"u_titanplate", name:"거인의 갑주", slot:"armor", iconDir:"armor", icon:"armor_4.png", main:"def", mainVal:12, minFloor:50,
    affixes:[{stat:"hp",v:110,flat:true},{stat:"thorns",v:16,pct:true},{stat:"def",v:10,flat:true}], desc:"거인의 힘을 두른 갑옷." },
  { id:"u_phoenixmail", name:"불사조 흉갑", slot:"armor", iconDir:"armor", icon:"armor_9.png", main:"def", mainVal:11, minFloor:130,
    affixes:[{stat:"hp",v:140,flat:true},{stat:"allRes",v:14,pct:true},{stat:"thorns",v:14,pct:true}], desc:"재에서 되살아나는 가호." },
  { id:"u_swiftgrips", name:"신속의 장갑", slot:"gloves", iconDir:"gloves", icon:"gloves_2.PNG", main:"atk", mainVal:9, minFloor:40,
    affixes:[{stat:"multihit",v:8,pct:true},{stat:"crit",v:7,pct:true},{stat:"atk",v:10,flat:true}], desc:"바람보다 빠른 손놀림." },
  { id:"u_crushfist", name:"분쇄의 건틀릿", slot:"gloves", iconDir:"gloves", icon:"gloves_6.png", main:"atk", mainVal:11, minFloor:95,
    affixes:[{stat:"penet",v:14,pct:true},{stat:"atk",v:14,flat:true},{stat:"def",v:8,flat:true}], desc:"방어를 부수는 일격." },
  { id:"u_galeboots", name:"질풍의 군화", slot:"boots", iconDir:"boots", icon:"boots_3.png", main:"def", mainVal:8, minFloor:30,
    affixes:[{stat:"dodge",v:6,pct:true},{stat:"hp",v:60,flat:true},{stat:"goldFind",v:20,pct:true}], desc:"질풍처럼 스치는 발걸음." },
  { id:"u_conqueror_ring", name:"정복자의 반지", slot:"ring", iconDir:"ring", icon:"rings_2.PNG", main:"crit", mainVal:6, minFloor:60,
    affixes:[{stat:"critDmg",v:35,pct:true},{stat:"lifesteal",v:7,pct:true},{stat:"crit",v:6,pct:true}], desc:"승리를 새긴 반지." },
  { id:"u_sovereign_amulet", name:"군주의 목걸이", slot:"necklace", iconDir:"necklace", icon:"necklace_2.PNG", main:"hp", mainVal:80, minFloor:110,
    affixes:[{stat:"critDmg",v:30,pct:true},{stat:"allRes",v:12,pct:true},{stat:"elemAtk",v:22,pct:true}], desc:"군주의 위엄이 깃든 목걸이." },
  /* === 확장 고유장비 +108 (자동생성) === */
  { id:"u_wsword_1", name:"용살의 검", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_01.png", main:"atk", mainVal:14, minFloor:1, affixes:[{stat:"atk",v:13,flat:true},{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true}], desc:"용살의 검 적을 베어내는 고유 장비." },
  { id:"u_wsword_2", name:"서리 대검", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_02.png", main:"atk", mainVal:14, minFloor:10, affixes:[{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true}], desc:"서리 대검 적을 베어내는 고유 장비." },
  { id:"u_wsword_3", name:"화염 장검", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_03.png", main:"atk", mainVal:14, minFloor:20, affixes:[{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true},{stat:"lifesteal",v:7,pct:true}], desc:"화염 장검 적을 베어내는 고유 장비." },
  { id:"u_wsword_4", name:"심연의 도신", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_04.png", main:"atk", mainVal:14, minFloor:25, affixes:[{stat:"penet",v:13,pct:true},{stat:"lifesteal",v:7,pct:true},{stat:"multihit",v:8,pct:true}], desc:"심연의 도신 적을 베어내는 고유 장비." },
  { id:"u_wsword_5", name:"폭풍 명검", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_06.png", main:"atk", mainVal:14, minFloor:35, affixes:[{stat:"lifesteal",v:7,pct:true},{stat:"multihit",v:8,pct:true},{stat:"elemAtk",v:22,pct:true}], desc:"폭풍 명검 적을 베어내는 고유 장비." },
  { id:"u_wsword_6", name:"천둥 검", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_07.png", main:"atk", mainVal:14, minFloor:45, affixes:[{stat:"multihit",v:8,pct:true},{stat:"elemAtk",v:22,pct:true},{stat:"atk",v:13,flat:true}], desc:"천둥 검 적을 베어내는 고유 장비." },
  { id:"u_wsword_7", name:"그림자 대검", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_08.PNG", main:"atk", mainVal:14, minFloor:55, affixes:[{stat:"elemAtk",v:22,pct:true},{stat:"atk",v:13,flat:true},{stat:"crit",v:7,pct:true}], desc:"그림자 대검 적을 베어내는 고유 장비." },
  { id:"u_wsword_8", name:"성스러운 장검", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_09.png", main:"atk", mainVal:14, minFloor:65, affixes:[{stat:"atk",v:13,flat:true},{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true}], desc:"성스러운 장검 적을 베어내는 고유 장비." },
  { id:"u_wsword_9", name:"저주받은 도신", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_10.png", main:"atk", mainVal:14, minFloor:75, affixes:[{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true}], desc:"저주받은 도신 적을 베어내는 고유 장비." },
  { id:"u_wsword_10", name:"고대의 명검", slot:"weapon", iconDir:"weapon_sword", icon:"sv_t_11.PNG", main:"atk", mainVal:14, minFloor:80, affixes:[{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true},{stat:"lifesteal",v:7,pct:true}], desc:"고대의 명검 적을 베어내는 고유 장비." },
  { id:"u_waxe_1", name:"핏빛 도끼", slot:"weapon", iconDir:"weapon_axe", icon:"a_n_t_01.png", main:"atk", mainVal:14, minFloor:90, affixes:[{stat:"atk",v:13,flat:true},{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true}], desc:"핏빛 도끼 적을 베어내는 고유 장비." },
  { id:"u_waxe_2", name:"별빛 대부", slot:"weapon", iconDir:"weapon_axe", icon:"a_n_t_02.png", main:"atk", mainVal:14, minFloor:100, affixes:[{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true}], desc:"별빛 대부 적을 베어내는 고유 장비." },
  { id:"u_waxe_3", name:"태양의 전부", slot:"weapon", iconDir:"weapon_axe", icon:"a_n_t_03.png", main:"atk", mainVal:14, minFloor:110, affixes:[{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true},{stat:"lifesteal",v:7,pct:true}], desc:"태양의 전부 적을 베어내는 고유 장비." },
  { id:"u_waxe_4", name:"달빛 양날도끼", slot:"weapon", iconDir:"weapon_axe", icon:"a_n_t_04.png", main:"atk", mainVal:14, minFloor:120, affixes:[{stat:"penet",v:13,pct:true},{stat:"lifesteal",v:7,pct:true},{stat:"multihit",v:8,pct:true}], desc:"달빛 양날도끼 적을 베어내는 고유 장비." },
  { id:"u_waxe_5", name:"강철 도끼", slot:"weapon", iconDir:"weapon_axe", icon:"a_n_t_05.png", main:"atk", mainVal:14, minFloor:130, affixes:[{stat:"lifesteal",v:7,pct:true},{stat:"multihit",v:8,pct:true},{stat:"elemAtk",v:22,pct:true}], desc:"강철 도끼 적을 베어내는 고유 장비." },
  { id:"u_waxe_6", name:"황혼의 대부", slot:"weapon", iconDir:"weapon_axe", icon:"axe_t_01.png", main:"atk", mainVal:14, minFloor:135, affixes:[{stat:"multihit",v:8,pct:true},{stat:"elemAtk",v:22,pct:true},{stat:"atk",v:13,flat:true}], desc:"황혼의 대부 적을 베어내는 고유 장비." },
  { id:"u_waxe_7", name:"여명의 전부", slot:"weapon", iconDir:"weapon_axe", icon:"axe_t_02.png", main:"atk", mainVal:14, minFloor:145, affixes:[{stat:"elemAtk",v:22,pct:true},{stat:"atk",v:13,flat:true},{stat:"crit",v:7,pct:true}], desc:"여명의 전부 적을 베어내는 고유 장비." },
  { id:"u_waxe_8", name:"공허의 양날도끼", slot:"weapon", iconDir:"weapon_axe", icon:"axe_t_04.png", main:"atk", mainVal:14, minFloor:155, affixes:[{stat:"atk",v:13,flat:true},{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true}], desc:"공허의 양날도끼 적을 베어내는 고유 장비." },
  { id:"u_waxe_9", name:"불멸의 도끼", slot:"weapon", iconDir:"weapon_axe", icon:"axe_t_05.png", main:"atk", mainVal:14, minFloor:165, affixes:[{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true}], desc:"불멸의 도끼 적을 베어내는 고유 장비." },
  { id:"u_waxe_10", name:"처형자의 대부", slot:"weapon", iconDir:"weapon_axe", icon:"axe_t_06.png", main:"atk", mainVal:14, minFloor:175, affixes:[{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true},{stat:"lifesteal",v:7,pct:true}], desc:"처형자의 대부 적을 베어내는 고유 장비." },
  { id:"u_wdagger_1", name:"폭군의 단검", slot:"weapon", iconDir:"weapon_dagger", icon:"k_nt_01.png", main:"atk", mainVal:14, minFloor:185, affixes:[{stat:"atk",v:13,flat:true},{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true}], desc:"폭군의 단검 적을 베어내는 고유 장비." },
  { id:"u_wdagger_2", name:"광휘의 비수", slot:"weapon", iconDir:"weapon_dagger", icon:"k_nt_02.png", main:"atk", mainVal:14, minFloor:190, affixes:[{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true}], desc:"광휘의 비수 적을 베어내는 고유 장비." },
  { id:"u_wdagger_3", name:"한기의 칼날", slot:"weapon", iconDir:"weapon_dagger", icon:"k_nt_03.png", main:"atk", mainVal:14, minFloor:200, affixes:[{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true},{stat:"lifesteal",v:7,pct:true}], desc:"한기의 칼날 적을 베어내는 고유 장비." },
  { id:"u_wdagger_4", name:"맹독의 첨도", slot:"weapon", iconDir:"weapon_dagger", icon:"k_nt_04.png", main:"atk", mainVal:14, minFloor:210, affixes:[{stat:"penet",v:13,pct:true},{stat:"lifesteal",v:7,pct:true},{stat:"multihit",v:8,pct:true}], desc:"맹독의 첨도 적을 베어내는 고유 장비." },
  { id:"u_wdagger_5", name:"격노의 단검", slot:"weapon", iconDir:"weapon_dagger", icon:"k_nt_05.png", main:"atk", mainVal:14, minFloor:220, affixes:[{stat:"lifesteal",v:7,pct:true},{stat:"multihit",v:8,pct:true},{stat:"elemAtk",v:22,pct:true}], desc:"격노의 단검 적을 베어내는 고유 장비." },
  { id:"u_wdagger_6", name:"수호자의 비수", slot:"weapon", iconDir:"weapon_dagger", icon:"k_nt_06.png", main:"atk", mainVal:14, minFloor:230, affixes:[{stat:"multihit",v:8,pct:true},{stat:"elemAtk",v:22,pct:true},{stat:"atk",v:13,flat:true}], desc:"수호자의 비수 적을 베어내는 고유 장비." },
  { id:"u_wdagger_7", name:"망령의 칼날", slot:"weapon", iconDir:"weapon_dagger", icon:"kn_t_02.png", main:"atk", mainVal:14, minFloor:240, affixes:[{stat:"elemAtk",v:22,pct:true},{stat:"atk",v:13,flat:true},{stat:"crit",v:7,pct:true}], desc:"망령의 칼날 적을 베어내는 고유 장비." },
  { id:"u_wdagger_8", name:"용암의 첨도", slot:"weapon", iconDir:"weapon_dagger", icon:"kn_t_03.png", main:"atk", mainVal:14, minFloor:245, affixes:[{stat:"atk",v:13,flat:true},{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true}], desc:"용암의 첨도 적을 베어내는 고유 장비." },
  { id:"u_wdagger_9", name:"빙결의 단검", slot:"weapon", iconDir:"weapon_dagger", icon:"kn_t_04.png", main:"atk", mainVal:14, minFloor:255, affixes:[{stat:"crit",v:7,pct:true},{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true}], desc:"빙결의 단검 적을 베어내는 고유 장비." },
  { id:"u_wdagger_10", name:"질풍의 비수", slot:"weapon", iconDir:"weapon_dagger", icon:"kn_t_05.png", main:"atk", mainVal:14, minFloor:265, affixes:[{stat:"critDmg",v:32,pct:true},{stat:"penet",v:13,pct:true},{stat:"lifesteal",v:7,pct:true}], desc:"질풍의 비수 적을 베어내는 고유 장비." },
  { id:"u_helmet_1", name:"파멸의 투구", slot:"helmet", iconDir:"helmet", icon:"helmets_1.PNG", main:"def", mainVal:10, minFloor:275, affixes:[{stat:"hp",v:80,flat:true},{stat:"allRes",v:11,pct:true},{stat:"stunResist",v:17,pct:true}], desc:"파멸의 투구 머리를 지키는 고유 장비." },
  { id:"u_helmet_2", name:"영겁의 관", slot:"helmet", iconDir:"helmet", icon:"helmets_2.PNG", main:"def", mainVal:10, minFloor:285, affixes:[{stat:"allRes",v:11,pct:true},{stat:"stunResist",v:17,pct:true},{stat:"def",v:9,flat:true}], desc:"영겁의 관 머리를 지키는 고유 장비." },
  { id:"u_helmet_3", name:"흑요석 면갑", slot:"helmet", iconDir:"helmet", icon:"helmets_4.PNG", main:"def", mainVal:10, minFloor:295, affixes:[{stat:"stunResist",v:17,pct:true},{stat:"def",v:9,flat:true},{stat:"elemAtk",v:22,pct:true}], desc:"흑요석 면갑 머리를 지키는 고유 장비." },
  { id:"u_helmet_4", name:"야수의 뿔투구", slot:"helmet", iconDir:"helmet", icon:"helmets_5.PNG", main:"def", mainVal:10, minFloor:300, affixes:[{stat:"def",v:9,flat:true},{stat:"elemAtk",v:22,pct:true},{stat:"hp",v:80,flat:true}], desc:"야수의 뿔투구 머리를 지키는 고유 장비." },
  { id:"u_helmet_5", name:"천상의 두건", slot:"helmet", iconDir:"helmet", icon:"helmets_6.PNG", main:"def", mainVal:10, minFloor:310, affixes:[{stat:"elemAtk",v:22,pct:true},{stat:"hp",v:80,flat:true},{stat:"allRes",v:11,pct:true}], desc:"천상의 두건 머리를 지키는 고유 장비." },
  { id:"u_helmet_6", name:"지옥의 투구", slot:"helmet", iconDir:"helmet", icon:"helmets_7.PNG", main:"def", mainVal:10, minFloor:320, affixes:[{stat:"hp",v:80,flat:true},{stat:"allRes",v:11,pct:true},{stat:"stunResist",v:17,pct:true}], desc:"지옥의 투구 머리를 지키는 고유 장비." },
  { id:"u_helmet_7", name:"왕의 관", slot:"helmet", iconDir:"helmet", icon:"helmets_9.PNG", main:"def", mainVal:10, minFloor:330, affixes:[{stat:"allRes",v:11,pct:true},{stat:"stunResist",v:17,pct:true},{stat:"def",v:9,flat:true}], desc:"왕의 관 머리를 지키는 고유 장비." },
  { id:"u_helmet_8", name:"서약의 면갑", slot:"helmet", iconDir:"helmet", icon:"helmets_10.PNG", main:"def", mainVal:10, minFloor:340, affixes:[{stat:"stunResist",v:17,pct:true},{stat:"def",v:9,flat:true},{stat:"elemAtk",v:22,pct:true}], desc:"서약의 면갑 머리를 지키는 고유 장비." },
  { id:"u_helmet_9", name:"핏빛달 뿔투구", slot:"helmet", iconDir:"helmet", icon:"helmets_11.PNG", main:"def", mainVal:10, minFloor:350, affixes:[{stat:"def",v:9,flat:true},{stat:"elemAtk",v:22,pct:true},{stat:"hp",v:80,flat:true}], desc:"핏빛달 뿔투구 머리를 지키는 고유 장비." },
  { id:"u_helmet_10", name:"폭풍눈의 두건", slot:"helmet", iconDir:"helmet", icon:"helmets_12.PNG", main:"def", mainVal:10, minFloor:355, affixes:[{stat:"elemAtk",v:22,pct:true},{stat:"hp",v:80,flat:true},{stat:"allRes",v:11,pct:true}], desc:"폭풍눈의 두건 머리를 지키는 고유 장비." },
  { id:"u_helmet_11", name:"사신의 투구", slot:"helmet", iconDir:"helmet", icon:"helmets_13.PNG", main:"def", mainVal:10, minFloor:365, affixes:[{stat:"hp",v:80,flat:true},{stat:"allRes",v:11,pct:true},{stat:"stunResist",v:17,pct:true}], desc:"사신의 투구 머리를 지키는 고유 장비." },
  { id:"u_helmet_12", name:"청염의 관", slot:"helmet", iconDir:"helmet", icon:"helmets_14.png", main:"def", mainVal:10, minFloor:375, affixes:[{stat:"allRes",v:11,pct:true},{stat:"stunResist",v:17,pct:true},{stat:"def",v:9,flat:true}], desc:"청염의 관 머리를 지키는 고유 장비." },
  { id:"u_helmet_13", name:"뇌광의 면갑", slot:"helmet", iconDir:"helmet", icon:"helmets_15.png", main:"def", mainVal:10, minFloor:385, affixes:[{stat:"stunResist",v:17,pct:true},{stat:"def",v:9,flat:true},{stat:"elemAtk",v:22,pct:true}], desc:"뇌광의 면갑 머리를 지키는 고유 장비." },
  { id:"u_helmet_14", name:"고요의 뿔투구", slot:"helmet", iconDir:"helmet", icon:"helmets_16.png", main:"def", mainVal:10, minFloor:395, affixes:[{stat:"def",v:9,flat:true},{stat:"elemAtk",v:22,pct:true},{stat:"hp",v:80,flat:true}], desc:"고요의 뿔투구 머리를 지키는 고유 장비." },
  { id:"u_helmet_15", name:"혹한의 두건", slot:"helmet", iconDir:"helmet", icon:"helmets_17.png", main:"def", mainVal:10, minFloor:405, affixes:[{stat:"elemAtk",v:22,pct:true},{stat:"hp",v:80,flat:true},{stat:"allRes",v:11,pct:true}], desc:"혹한의 두건 머리를 지키는 고유 장비." },
  { id:"u_helmet_16", name:"작열의 투구", slot:"helmet", iconDir:"helmet", icon:"helmets_18.png", main:"def", mainVal:10, minFloor:410, affixes:[{stat:"hp",v:80,flat:true},{stat:"allRes",v:11,pct:true},{stat:"stunResist",v:17,pct:true}], desc:"작열의 투구 머리를 지키는 고유 장비." },
  { id:"u_helmet_17", name:"무한의 관", slot:"helmet", iconDir:"helmet", icon:"helmets_19.png", main:"def", mainVal:10, minFloor:420, affixes:[{stat:"allRes",v:11,pct:true},{stat:"stunResist",v:17,pct:true},{stat:"def",v:9,flat:true}], desc:"무한의 관 머리를 지키는 고유 장비." },
  { id:"u_helmet_18", name:"심판의 면갑", slot:"helmet", iconDir:"helmet", icon:"helmets_20.png", main:"def", mainVal:10, minFloor:430, affixes:[{stat:"stunResist",v:17,pct:true},{stat:"def",v:9,flat:true},{stat:"elemAtk",v:22,pct:true}], desc:"심판의 면갑 머리를 지키는 고유 장비." },
  { id:"u_helmet_19", name:"용살의 뿔투구", slot:"helmet", iconDir:"helmet", icon:"helmets_21.png", main:"def", mainVal:10, minFloor:440, affixes:[{stat:"def",v:9,flat:true},{stat:"elemAtk",v:22,pct:true},{stat:"hp",v:80,flat:true}], desc:"용살의 뿔투구 머리를 지키는 고유 장비." },
  { id:"u_helmet_20", name:"서리 두건", slot:"helmet", iconDir:"helmet", icon:"helmets_22.PNG", main:"def", mainVal:10, minFloor:450, affixes:[{stat:"elemAtk",v:22,pct:true},{stat:"hp",v:80,flat:true},{stat:"allRes",v:11,pct:true}], desc:"서리 두건 머리를 지키는 고유 장비." },
  { id:"u_armor_1", name:"화염 갑주", slot:"armor", iconDir:"armor", icon:"armor_1.png", main:"def", mainVal:12, minFloor:460, affixes:[{stat:"hp",v:120,flat:true},{stat:"thorns",v:15,pct:true},{stat:"allRes",v:13,pct:true}], desc:"화염 갑주 몸을 감싸는 고유 장비." },
  { id:"u_armor_2", name:"심연의 흉갑", slot:"armor", iconDir:"armor", icon:"armor_2.png", main:"def", mainVal:12, minFloor:465, affixes:[{stat:"thorns",v:15,pct:true},{stat:"allRes",v:13,pct:true},{stat:"def",v:10,flat:true}], desc:"심연의 흉갑 몸을 감싸는 고유 장비." },
  { id:"u_armor_3", name:"폭풍 판금", slot:"armor", iconDir:"armor", icon:"armor_3.png", main:"def", mainVal:12, minFloor:475, affixes:[{stat:"allRes",v:13,pct:true},{stat:"def",v:10,flat:true},{stat:"hp",v:120,flat:true}], desc:"폭풍 판금 몸을 감싸는 고유 장비." },
  { id:"u_armor_4", name:"천둥 전포", slot:"armor", iconDir:"armor", icon:"armor_5.PNG", main:"def", mainVal:12, minFloor:485, affixes:[{stat:"def",v:10,flat:true},{stat:"hp",v:120,flat:true},{stat:"thorns",v:15,pct:true}], desc:"천둥 전포 몸을 감싸는 고유 장비." },
  { id:"u_armor_5", name:"그림자 비늘갑", slot:"armor", iconDir:"armor", icon:"armor_6.PNG", main:"def", mainVal:12, minFloor:495, affixes:[{stat:"hp",v:120,flat:true},{stat:"thorns",v:15,pct:true},{stat:"allRes",v:13,pct:true}], desc:"그림자 비늘갑 몸을 감싸는 고유 장비." },
  { id:"u_armor_6", name:"성스러운 갑주", slot:"armor", iconDir:"armor", icon:"armor_7.png", main:"def", mainVal:12, minFloor:505, affixes:[{stat:"thorns",v:15,pct:true},{stat:"allRes",v:13,pct:true},{stat:"def",v:10,flat:true}], desc:"성스러운 갑주 몸을 감싸는 고유 장비." },
  { id:"u_armor_7", name:"저주받은 흉갑", slot:"armor", iconDir:"armor", icon:"armor_8.png", main:"def", mainVal:12, minFloor:515, affixes:[{stat:"allRes",v:13,pct:true},{stat:"def",v:10,flat:true},{stat:"hp",v:120,flat:true}], desc:"저주받은 흉갑 몸을 감싸는 고유 장비." },
  { id:"u_armor_8", name:"고대의 판금", slot:"armor", iconDir:"armor", icon:"armor_10.png", main:"def", mainVal:12, minFloor:520, affixes:[{stat:"def",v:10,flat:true},{stat:"hp",v:120,flat:true},{stat:"thorns",v:15,pct:true}], desc:"고대의 판금 몸을 감싸는 고유 장비." },
  { id:"u_armor_9", name:"핏빛 전포", slot:"armor", iconDir:"armor", icon:"armor_11.png", main:"def", mainVal:12, minFloor:530, affixes:[{stat:"hp",v:120,flat:true},{stat:"thorns",v:15,pct:true},{stat:"allRes",v:13,pct:true}], desc:"핏빛 전포 몸을 감싸는 고유 장비." },
  { id:"u_armor_10", name:"별빛 비늘갑", slot:"armor", iconDir:"armor", icon:"armor_12.png", main:"def", mainVal:12, minFloor:540, affixes:[{stat:"thorns",v:15,pct:true},{stat:"allRes",v:13,pct:true},{stat:"def",v:10,flat:true}], desc:"별빛 비늘갑 몸을 감싸는 고유 장비." },
  { id:"u_armor_11", name:"태양의 갑주", slot:"armor", iconDir:"armor", icon:"armor_13.png", main:"def", mainVal:12, minFloor:550, affixes:[{stat:"allRes",v:13,pct:true},{stat:"def",v:10,flat:true},{stat:"hp",v:120,flat:true}], desc:"태양의 갑주 몸을 감싸는 고유 장비." },
  { id:"u_armor_12", name:"달빛 흉갑", slot:"armor", iconDir:"armor", icon:"armor_14.png", main:"def", mainVal:12, minFloor:560, affixes:[{stat:"def",v:10,flat:true},{stat:"hp",v:120,flat:true},{stat:"thorns",v:15,pct:true}], desc:"달빛 흉갑 몸을 감싸는 고유 장비." },
  { id:"u_armor_13", name:"강철 판금", slot:"armor", iconDir:"armor", icon:"armor_15.png", main:"def", mainVal:12, minFloor:570, affixes:[{stat:"hp",v:120,flat:true},{stat:"thorns",v:15,pct:true},{stat:"allRes",v:13,pct:true}], desc:"강철 판금 몸을 감싸는 고유 장비." },
  { id:"u_armor_14", name:"황혼의 전포", slot:"armor", iconDir:"armor", icon:"armor_16.PNG", main:"def", mainVal:12, minFloor:575, affixes:[{stat:"thorns",v:15,pct:true},{stat:"allRes",v:13,pct:true},{stat:"def",v:10,flat:true}], desc:"황혼의 전포 몸을 감싸는 고유 장비." },
  { id:"u_armor_15", name:"여명의 비늘갑", slot:"armor", iconDir:"armor", icon:"armor_17.PNG", main:"def", mainVal:12, minFloor:585, affixes:[{stat:"allRes",v:13,pct:true},{stat:"def",v:10,flat:true},{stat:"hp",v:120,flat:true}], desc:"여명의 비늘갑 몸을 감싸는 고유 장비." },
  { id:"u_armor_16", name:"공허의 갑주", slot:"armor", iconDir:"armor", icon:"armor_18.png", main:"def", mainVal:12, minFloor:595, affixes:[{stat:"def",v:10,flat:true},{stat:"hp",v:120,flat:true},{stat:"thorns",v:15,pct:true}], desc:"공허의 갑주 몸을 감싸는 고유 장비." },
  { id:"u_armor_17", name:"불멸의 흉갑", slot:"armor", iconDir:"armor", icon:"armor_19.png", main:"def", mainVal:12, minFloor:605, affixes:[{stat:"hp",v:120,flat:true},{stat:"thorns",v:15,pct:true},{stat:"allRes",v:13,pct:true}], desc:"불멸의 흉갑 몸을 감싸는 고유 장비." },
  { id:"u_armor_18", name:"처형자의 판금", slot:"armor", iconDir:"armor", icon:"armor_20.PNG", main:"def", mainVal:12, minFloor:615, affixes:[{stat:"thorns",v:15,pct:true},{stat:"allRes",v:13,pct:true},{stat:"def",v:10,flat:true}], desc:"처형자의 판금 몸을 감싸는 고유 장비." },
  { id:"u_gloves_1", name:"폭군의 장갑", slot:"gloves", iconDir:"gloves", icon:"gloves_1.PNG", main:"atk", mainVal:9, minFloor:625, affixes:[{stat:"atk",v:11,flat:true},{stat:"crit",v:8,pct:true},{stat:"multihit",v:7,pct:true}], desc:"폭군의 장갑 손에 깃든 고유 장비." },
  { id:"u_gloves_2", name:"광휘의 건틀릿", slot:"gloves", iconDir:"gloves", icon:"gloves_3.PNG", main:"atk", mainVal:9, minFloor:630, affixes:[{stat:"crit",v:8,pct:true},{stat:"multihit",v:7,pct:true},{stat:"critDmg",v:30,pct:true}], desc:"광휘의 건틀릿 손에 깃든 고유 장비." },
  { id:"u_gloves_3", name:"한기의 완갑", slot:"gloves", iconDir:"gloves", icon:"gloves_4.PNG", main:"atk", mainVal:9, minFloor:640, affixes:[{stat:"multihit",v:7,pct:true},{stat:"critDmg",v:30,pct:true},{stat:"atk",v:11,flat:true}], desc:"한기의 완갑 손에 깃든 고유 장비." },
  { id:"u_gloves_4", name:"맹독의 손아귀", slot:"gloves", iconDir:"gloves", icon:"gloves_5.PNG", main:"atk", mainVal:9, minFloor:650, affixes:[{stat:"critDmg",v:30,pct:true},{stat:"atk",v:11,flat:true},{stat:"crit",v:8,pct:true}], desc:"맹독의 손아귀 손에 깃든 고유 장비." },
  { id:"u_gloves_5", name:"격노의 장갑", slot:"gloves", iconDir:"gloves", icon:"gloves_7.png", main:"atk", mainVal:9, minFloor:660, affixes:[{stat:"atk",v:11,flat:true},{stat:"crit",v:8,pct:true},{stat:"multihit",v:7,pct:true}], desc:"격노의 장갑 손에 깃든 고유 장비." },
  { id:"u_gloves_6", name:"수호자의 건틀릿", slot:"gloves", iconDir:"gloves", icon:"gloves_8.png", main:"atk", mainVal:9, minFloor:670, affixes:[{stat:"crit",v:8,pct:true},{stat:"multihit",v:7,pct:true},{stat:"critDmg",v:30,pct:true}], desc:"수호자의 건틀릿 손에 깃든 고유 장비." },
  { id:"u_gloves_7", name:"망령의 완갑", slot:"gloves", iconDir:"gloves", icon:"gloves_9.PNG", main:"atk", mainVal:9, minFloor:680, affixes:[{stat:"multihit",v:7,pct:true},{stat:"critDmg",v:30,pct:true},{stat:"atk",v:11,flat:true}], desc:"망령의 완갑 손에 깃든 고유 장비." },
  { id:"u_gloves_8", name:"용암의 손아귀", slot:"gloves", iconDir:"gloves", icon:"gloves_10.PNG", main:"atk", mainVal:9, minFloor:685, affixes:[{stat:"critDmg",v:30,pct:true},{stat:"atk",v:11,flat:true},{stat:"crit",v:8,pct:true}], desc:"용암의 손아귀 손에 깃든 고유 장비." },
  { id:"u_gloves_9", name:"빙결의 장갑", slot:"gloves", iconDir:"gloves", icon:"gloves_11.PNG", main:"atk", mainVal:9, minFloor:695, affixes:[{stat:"atk",v:11,flat:true},{stat:"crit",v:8,pct:true},{stat:"multihit",v:7,pct:true}], desc:"빙결의 장갑 손에 깃든 고유 장비." },
  { id:"u_gloves_10", name:"질풍의 건틀릿", slot:"gloves", iconDir:"gloves", icon:"gloves_12.PNG", main:"atk", mainVal:9, minFloor:705, affixes:[{stat:"crit",v:8,pct:true},{stat:"multihit",v:7,pct:true},{stat:"critDmg",v:30,pct:true}], desc:"질풍의 건틀릿 손에 깃든 고유 장비." },
  { id:"u_gloves_11", name:"파멸의 완갑", slot:"gloves", iconDir:"gloves", icon:"gloves_13.PNG", main:"atk", mainVal:9, minFloor:715, affixes:[{stat:"multihit",v:7,pct:true},{stat:"critDmg",v:30,pct:true},{stat:"atk",v:11,flat:true}], desc:"파멸의 완갑 손에 깃든 고유 장비." },
  { id:"u_gloves_12", name:"영겁의 손아귀", slot:"gloves", iconDir:"gloves", icon:"gloves_14.png", main:"atk", mainVal:9, minFloor:725, affixes:[{stat:"critDmg",v:30,pct:true},{stat:"atk",v:11,flat:true},{stat:"crit",v:8,pct:true}], desc:"영겁의 손아귀 손에 깃든 고유 장비." },
  { id:"u_gloves_13", name:"흑요석 장갑", slot:"gloves", iconDir:"gloves", icon:"gloves_15.PNG", main:"atk", mainVal:9, minFloor:735, affixes:[{stat:"atk",v:11,flat:true},{stat:"crit",v:8,pct:true},{stat:"multihit",v:7,pct:true}], desc:"흑요석 장갑 손에 깃든 고유 장비." },
  { id:"u_gloves_14", name:"야수의 건틀릿", slot:"gloves", iconDir:"gloves", icon:"gloves_16.png", main:"atk", mainVal:9, minFloor:740, affixes:[{stat:"crit",v:8,pct:true},{stat:"multihit",v:7,pct:true},{stat:"critDmg",v:30,pct:true}], desc:"야수의 건틀릿 손에 깃든 고유 장비." },
  { id:"u_gloves_15", name:"천상의 완갑", slot:"gloves", iconDir:"gloves", icon:"gloves_17.png", main:"atk", mainVal:9, minFloor:750, affixes:[{stat:"multihit",v:7,pct:true},{stat:"critDmg",v:30,pct:true},{stat:"atk",v:11,flat:true}], desc:"천상의 완갑 손에 깃든 고유 장비." },
  { id:"u_gloves_16", name:"지옥의 손아귀", slot:"gloves", iconDir:"gloves", icon:"gloves_18.png", main:"atk", mainVal:9, minFloor:760, affixes:[{stat:"critDmg",v:30,pct:true},{stat:"atk",v:11,flat:true},{stat:"crit",v:8,pct:true}], desc:"지옥의 손아귀 손에 깃든 고유 장비." },
  { id:"u_gloves_17", name:"왕의 장갑", slot:"gloves", iconDir:"gloves", icon:"gloves_19.png", main:"atk", mainVal:9, minFloor:770, affixes:[{stat:"atk",v:11,flat:true},{stat:"crit",v:8,pct:true},{stat:"multihit",v:7,pct:true}], desc:"왕의 장갑 손에 깃든 고유 장비." },
  { id:"u_gloves_18", name:"서약의 건틀릿", slot:"gloves", iconDir:"gloves", icon:"gloves_20.png", main:"atk", mainVal:9, minFloor:780, affixes:[{stat:"crit",v:8,pct:true},{stat:"multihit",v:7,pct:true},{stat:"critDmg",v:30,pct:true}], desc:"서약의 건틀릿 손에 깃든 고유 장비." },
  { id:"u_boots_1", name:"핏빛달 장화", slot:"boots", iconDir:"boots", icon:"boots_1.PNG", main:"def", mainVal:9, minFloor:790, affixes:[{stat:"dodge",v:8,pct:true},{stat:"hp",v:80,flat:true},{stat:"def",v:9,flat:true}], desc:"핏빛달 장화 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_2", name:"폭풍눈의 각반", slot:"boots", iconDir:"boots", icon:"boots_2.png", main:"def", mainVal:9, minFloor:795, affixes:[{stat:"hp",v:80,flat:true},{stat:"def",v:9,flat:true},{stat:"allRes",v:11,pct:true}], desc:"폭풍눈의 각반 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_3", name:"사신의 보행구", slot:"boots", iconDir:"boots", icon:"boots_4.png", main:"def", mainVal:9, minFloor:805, affixes:[{stat:"def",v:9,flat:true},{stat:"allRes",v:11,pct:true},{stat:"dodge",v:8,pct:true}], desc:"사신의 보행구 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_4", name:"청염의 전투화", slot:"boots", iconDir:"boots", icon:"boots_5.png", main:"def", mainVal:9, minFloor:815, affixes:[{stat:"allRes",v:11,pct:true},{stat:"dodge",v:8,pct:true},{stat:"hp",v:80,flat:true}], desc:"청염의 전투화 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_5", name:"뇌광의 장화", slot:"boots", iconDir:"boots", icon:"boots_6.png", main:"def", mainVal:9, minFloor:825, affixes:[{stat:"dodge",v:8,pct:true},{stat:"hp",v:80,flat:true},{stat:"def",v:9,flat:true}], desc:"뇌광의 장화 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_6", name:"고요의 각반", slot:"boots", iconDir:"boots", icon:"boots_7.png", main:"def", mainVal:9, minFloor:835, affixes:[{stat:"hp",v:80,flat:true},{stat:"def",v:9,flat:true},{stat:"allRes",v:11,pct:true}], desc:"고요의 각반 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_7", name:"혹한의 보행구", slot:"boots", iconDir:"boots", icon:"boots_8.png", main:"def", mainVal:9, minFloor:845, affixes:[{stat:"def",v:9,flat:true},{stat:"allRes",v:11,pct:true},{stat:"dodge",v:8,pct:true}], desc:"혹한의 보행구 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_8", name:"작열의 전투화", slot:"boots", iconDir:"boots", icon:"boots_9.PNG", main:"def", mainVal:9, minFloor:850, affixes:[{stat:"allRes",v:11,pct:true},{stat:"dodge",v:8,pct:true},{stat:"hp",v:80,flat:true}], desc:"작열의 전투화 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_9", name:"무한의 장화", slot:"boots", iconDir:"boots", icon:"boots_10.PNG", main:"def", mainVal:9, minFloor:860, affixes:[{stat:"dodge",v:8,pct:true},{stat:"hp",v:80,flat:true},{stat:"def",v:9,flat:true}], desc:"무한의 장화 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_10", name:"심판의 각반", slot:"boots", iconDir:"boots", icon:"boots_11.PNG", main:"def", mainVal:9, minFloor:870, affixes:[{stat:"hp",v:80,flat:true},{stat:"def",v:9,flat:true},{stat:"allRes",v:11,pct:true}], desc:"심판의 각반 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_11", name:"용살의 보행구", slot:"boots", iconDir:"boots", icon:"boots_12.PNG", main:"def", mainVal:9, minFloor:880, affixes:[{stat:"def",v:9,flat:true},{stat:"allRes",v:11,pct:true},{stat:"dodge",v:8,pct:true}], desc:"용살의 보행구 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_12", name:"서리 전투화", slot:"boots", iconDir:"boots", icon:"boots_13.PNG", main:"def", mainVal:9, minFloor:890, affixes:[{stat:"allRes",v:11,pct:true},{stat:"dodge",v:8,pct:true},{stat:"hp",v:80,flat:true}], desc:"서리 전투화 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_13", name:"화염 장화", slot:"boots", iconDir:"boots", icon:"boots_14.png", main:"def", mainVal:9, minFloor:900, affixes:[{stat:"dodge",v:8,pct:true},{stat:"hp",v:80,flat:true},{stat:"def",v:9,flat:true}], desc:"화염 장화 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_14", name:"심연의 각반", slot:"boots", iconDir:"boots", icon:"boots_15.png", main:"def", mainVal:9, minFloor:905, affixes:[{stat:"hp",v:80,flat:true},{stat:"def",v:9,flat:true},{stat:"allRes",v:11,pct:true}], desc:"심연의 각반 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_15", name:"폭풍 보행구", slot:"boots", iconDir:"boots", icon:"boots_16.png", main:"def", mainVal:9, minFloor:915, affixes:[{stat:"def",v:9,flat:true},{stat:"allRes",v:11,pct:true},{stat:"dodge",v:8,pct:true}], desc:"폭풍 보행구 발걸음을 인도하는 고유 장비." },
  { id:"u_boots_16", name:"천둥 전투화", slot:"boots", iconDir:"boots", icon:"boots_17.png", main:"def", mainVal:9, minFloor:925, affixes:[{stat:"allRes",v:11,pct:true},{stat:"dodge",v:8,pct:true},{stat:"hp",v:80,flat:true}], desc:"천둥 전투화 발걸음을 인도하는 고유 장비." },
  { id:"u_ring_1", name:"그림자 반지", slot:"ring", iconDir:"ring", icon:"rings_1.PNG", main:"crit", mainVal:8, minFloor:935, affixes:[{stat:"crit",v:7,pct:true},{stat:"critDmg",v:30,pct:true},{stat:"atk",v:10,flat:true}], desc:"그림자 반지 손가락에 끼우는 고유 장비." },
  { id:"u_ring_2", name:"성스러운 인장", slot:"ring", iconDir:"ring", icon:"rings_3.PNG", main:"crit", mainVal:8, minFloor:945, affixes:[{stat:"critDmg",v:30,pct:true},{stat:"atk",v:10,flat:true},{stat:"goldFind",v:20,pct:true}], desc:"성스러운 인장 손가락에 끼우는 고유 장비." },
  { id:"u_ring_3", name:"저주받은 고리", slot:"ring", iconDir:"ring", icon:"rings_4.PNG", main:"crit", mainVal:8, minFloor:955, affixes:[{stat:"atk",v:10,flat:true},{stat:"goldFind",v:20,pct:true},{stat:"lifesteal",v:7,pct:true}], desc:"저주받은 고리 손가락에 끼우는 고유 장비." },
  { id:"u_ring_4", name:"고대의 반지", slot:"ring", iconDir:"ring", icon:"rings_5.PNG", main:"crit", mainVal:8, minFloor:960, affixes:[{stat:"goldFind",v:20,pct:true},{stat:"lifesteal",v:7,pct:true},{stat:"crit",v:7,pct:true}], desc:"고대의 반지 손가락에 끼우는 고유 장비." },
  { id:"u_nk_1", name:"핏빛 목걸이", slot:"necklace", iconDir:"necklace", icon:"necklace_1.PNG", main:"elemAtk", mainVal:22, minFloor:970, affixes:[{stat:"elemAtk",v:22,pct:true},{stat:"allRes",v:12,pct:true},{stat:"hp",v:80,flat:true}], desc:"핏빛 목걸이 목에 두르는 고유 장비." },
  { id:"u_nk_2", name:"별빛 펜던트", slot:"necklace", iconDir:"necklace", icon:"necklace_3.PNG", main:"elemAtk", mainVal:22, minFloor:980, affixes:[{stat:"allRes",v:12,pct:true},{stat:"hp",v:80,flat:true},{stat:"crit",v:7,pct:true}], desc:"별빛 펜던트 목에 두르는 고유 장비." },
];

/* 최대 층수 */
G.DATA.MAX_FLOOR = 1000;

/* 몬스터 종족 (스탯은 층에 따라 combat.js에서 스케일) */
G.DATA.NORMAL_SPECIES = [
  {name:"슬라임",emoji:"🟢"},   {name:"박쥐",emoji:"🦇"},     {name:"임프",emoji:"👺"},
  {name:"화염 해골",emoji:"💀"},{name:"거미",emoji:"🕷️"},     {name:"늑대",emoji:"🐺"},
  {name:"오크 전사",emoji:"🧌"},{name:"골렘",emoji:"🗿"},     {name:"유령",emoji:"👻"},
  {name:"서리 거인",emoji:"🧊"}, {name:"화염 정령",emoji:"🔥"}, {name:"냉기 정령",emoji:"❄️"},
  {name:"뱀",emoji:"🐍"},        {name:"하피",emoji:"🦅"},       {name:"미노타우로스",emoji:"🐂"},
  {name:"새끼 드래곤",emoji:"🐲"},{name:"문어",emoji:"🦑"},    {name:"떠다니는 눈",emoji:"👁️"},
  /* Phase B 배치1 */
  {name:"거대 슬라임",emoji:"🟩"},{name:"검은 푸딩",emoji:"⬛"}, {name:"말벌",emoji:"🐝"},
  {name:"거대 파리",emoji:"🪰"},  {name:"전갈",emoji:"🦂"},      {name:"핏빛 거미",emoji:"🕸️"},
  /* Phase B 확장 */
  {name:"콰지트",emoji:"👿"},    {name:"그렘린",emoji:"👹"},    {name:"놀",emoji:"🐕"},
  {name:"구울",emoji:"🧟"},      {name:"미라",emoji:"🪦"},      {name:"좀비",emoji:"🧟‍♂️"},
  {name:"도깨비불",emoji:"✨"},  {name:"드레이크",emoji:"🐉"},  {name:"번개 정령",emoji:"⚡"},
  {name:"미니 골렘",emoji:"🪨"}, {name:"가고일",emoji:"🗿"},    {name:"멧돼지",emoji:"🐗"},
  {name:"새끼 늑대",emoji:"🐺"}, {name:"코브라",emoji:"🐍"},    {name:"해파리",emoji:"🪼"},
  {name:"게",emoji:"🦀"},
  /* === 신규 확장 (일반 +114) === */
  {name:"심연의 닭",emoji:"🐔"}, {name:"아카나메",emoji:"👅"}, {name:"고대 갑각류",emoji:"🦞"},
  {name:"아누비스 전사",emoji:"🐺"}, {name:"궁수",emoji:"🏹"}, {name:"아르마딜로",emoji:"🦔"},
  {name:"다락의 속삭임",emoji:"👻"}, {name:"산적",emoji:"🗡️"}, {name:"산적 마법사",emoji:"🪄"},
  {name:"산적 투석꾼",emoji:"🪨"}, {name:"작은 검은 푸딩",emoji:"⬛"}, {name:"핏실 거미",emoji:"🕷️"},
  {name:"뇌두더지 군주",emoji:"🧠"}, {name:"브라우니",emoji:"🧚"}, {name:"황소",emoji:"🐂"},
  {name:"불리웍 전사",emoji:"🐸"}, {name:"콤프소그나투스",emoji:"🦖"}, {name:"광신도",emoji:"🕯️"},
  {name:"악령",emoji:"😈"}, {name:"도플갱어",emoji:"👥"}, {name:"새끼 용",emoji:"🥚"},
  {name:"잠자리",emoji:"🪰"}, {name:"작은 화염 정령",emoji:"🔥"}, {name:"육신 괴물",emoji:"🩸"},
  {name:"비행 뇌수",emoji:"🧠"}, {name:"비행 안구",emoji:"👁️"}, {name:"파리지옥 레쉬",emoji:"🪴"},
  {name:"버섯 괴물(중)",emoji:"🍄"}, {name:"버섯 괴물(소)",emoji:"🍄"}, {name:"지오니드",emoji:"🪨"},
  {name:"거대 버섯 괴물",emoji:"🍄"}, {name:"검투사",emoji:"🛡️"}, {name:"글럿몬",emoji:"👾"},
  {name:"수호 두루마리",emoji:"📜"}, {name:"고슴도치",emoji:"🦔"}, {name:"지옥 짐승",emoji:"🔥"},
  {name:"소라게",emoji:"🦀"}, {name:"호문쿨루스",emoji:"🧪"}, {name:"홉킨스 그렘린",emoji:"👹"},
  {name:"작은 냉기 정령",emoji:"❄️"}, {name:"꼬마 임프",emoji:"👺"}, {name:"지능 포식자",emoji:"🧠"},
  {name:"기사",emoji:"⚔️"}, {name:"코레드",emoji:"🌳"}, {name:"무당벌레",emoji:"🐞"},
  {name:"작은 번개 정령",emoji:"⚡"}, {name:"도마뱀 궁수",emoji:"🦎"}, {name:"도마뱀 수도사",emoji:"🦎"},
  {name:"마법사",emoji:"🪄"}, {name:"마법사냥꾼",emoji:"🗡️"}, {name:"아귀 마귀",emoji:"👹"},
  {name:"미믹",emoji:"🎁"}, {name:"괴물 달팽이",emoji:"🐌"}, {name:"벌거숭이두더지쥐",emoji:"🐀"},
  {name:"강령술사",emoji:"🧙"}, {name:"닌자",emoji:"🥷"}, {name:"노식",emoji:"👁️"},
  {name:"새끼 문어",emoji:"🐙"}, {name:"오크 사냥꾼",emoji:"🏹"}, {name:"오크 주술사",emoji:"🪬"},
  {name:"오크 작업반장",emoji:"👺"}, {name:"올빼미",emoji:"🦉"}, {name:"앵무새",emoji:"🦜"},
  {name:"펭귄",emoji:"🐧"}, {name:"역병 의사",emoji:"⚕️"}, {name:"여사제",emoji:"🙏"},
  {name:"화염술사",emoji:"🔥"}, {name:"쾌속요정",emoji:"💨"}, {name:"쥐족 광전사",emoji:"🐀"},
  {name:"쥐족 조련사",emoji:"🐀"}, {name:"도적",emoji:"🗡️"}, {name:"스카라베",emoji:"🪲"},
  {name:"해골 궁수",emoji:"🏹"}, {name:"해골 마법사",emoji:"💀"}, {name:"해골 전사",emoji:"💀"},
  {name:"중형 슬라임",emoji:"🟢"}, {name:"소형 슬라임",emoji:"🟢"}, {name:"종자",emoji:"🛡️"},
  {name:"도둑",emoji:"🗡️"}, {name:"바르구일",emoji:"👹"}, {name:"흑마법사",emoji:"🟣"},
  {name:"좀비 주민",emoji:"🧟"}, {name:"고블린 암살자",emoji:"👺"}, {name:"고블린 멧돼지 기수",emoji:"🐗"},
  {name:"고블린 폭탄병",emoji:"💣"}, {name:"고블린 주술사",emoji:"🪬"}, {name:"드워프",emoji:"🧔"},
  {name:"드워프 석궁병",emoji:"🏹"}, {name:"언데드 드워프",emoji:"🧟"}, {name:"어인 대사제",emoji:"🐟"},
  {name:"어인 광전사",emoji:"🐟"}, {name:"어인 최면술사",emoji:"🌀"}, {name:"어인 해파리",emoji:"🪼"},
  {name:"어인 기사",emoji:"🐟"}, {name:"어인 그물잡이",emoji:"🕸️"}, {name:"어인 주술사",emoji:"🪬"},
  {name:"어인 채찍병",emoji:"🐟"}, {name:"선인장 괴물",emoji:"🌵"}, {name:"작은 나뭇잎 정령",emoji:"🍃"},
  {name:"잎사귀 레쉬",emoji:"🌿"}, {name:"호리병 레쉬",emoji:"🪴"}, {name:"괴물 꽃",emoji:"🌸"},
  {name:"가지 마름병",emoji:"🌿"}, {name:"채소 괴물",emoji:"🥦"}, {name:"엘프 궁수",emoji:"🧝"},
  {name:"엘프 전사",emoji:"🧝"}, {name:"엘프 마법사",emoji:"🧝"}, {name:"코볼트",emoji:"🐲"},
  {name:"코볼트 용방패병",emoji:"🛡️"}, {name:"코볼트 사제",emoji:"🙏"}, {name:"코볼트 화염술사",emoji:"🔥"},
  {name:"코볼트 주술사",emoji:"🪬"}, {name:"코볼트 투석병",emoji:"🪨"}, {name:"날개 코볼트",emoji:"🐲"},
];
/* 보스: mat=고유 재료명, gstat=확정 제작 시 보장되는 옵션 */
G.DATA.BOSS_SPECIES = [
  {name:"네크로맨서", emoji:"👹", mat:"네크로맨서의 정수", gstat:"penet"},
  {name:"해골 왕",    emoji:"☠️", mat:"해골 왕의 정수",     gstat:"critDmg"},
  {name:"오크 감독관",emoji:"👺", mat:"오크 감독관의 정수", gstat:"atk"},
  {name:"마녀",       emoji:"🧙", mat:"마녀의 정수",       gstat:"lifesteal"},
  {name:"리치",       emoji:"🧟", mat:"리치의 정수",       gstat:"thorns"},
  {name:"드래곤",     emoji:"🐉", mat:"드래곤의 정수",     gstat:"crit"},
  {name:"아귀 악마",  emoji:"😈", mat:"아귀 악마의 정수",   gstat:"multihit"},
  {name:"대천사",     emoji:"😇", mat:"대천사의 정수",     gstat:"dodge"},
  {name:"요정 드래곤",emoji:"🐲", mat:"요정 드래곤의 정수", gstat:"def"},
  {name:"악마",       emoji:"👿", mat:"악마의 정수",       gstat:"goldFind"},
  /* Phase B 확장 보스 */
  {name:"오우거",       emoji:"👹", mat:"오우거의 정수",        gstat:"atk"},
  {name:"트롤",         emoji:"🧌", mat:"트롤의 정수",          gstat:"thorns"},
  {name:"미라 군주",    emoji:"⚰️", mat:"미라 군주의 정수",     gstat:"penet"},
  {name:"밴시",         emoji:"👻", mat:"밴시의 정수",          gstat:"dodge"},
  {name:"뱀파이어",     emoji:"🧛", mat:"뱀파이어의 정수",      gstat:"lifesteal"},
  {name:"사이클롭스",   emoji:"👁️", mat:"사이클롭스의 정수",    gstat:"critDmg"},
  {name:"엘더 드래곤",  emoji:"🐲", mat:"엘더 드래곤의 정수",   gstat:"crit"},
  {name:"비홀더",       emoji:"🧿", mat:"비홀더의 정수",        gstat:"multihit"},
  {name:"마인드 플레이어",emoji:"🦑", mat:"마인드 플레이어의 정수", gstat:"def"},
  {name:"거대 고릴라",  emoji:"🦍", mat:"거대 고릴라의 정수",   gstat:"goldFind"},
  /* === 신규 확장 (보스 +50) === */
  {name:"외계 공포체", emoji:"👽", mat:"외계 공포체의 정수", gstat:"atk"},
  {name:"천사", emoji:"👼", mat:"천사의 정수", gstat:"crit"},
  {name:"비전 골렘", emoji:"💠", mat:"비전 골렘의 정수", gstat:"critDmg"},
  {name:"대천사장", emoji:"😇", mat:"대천사장의 정수", gstat:"penet"},
  {name:"바바리안", emoji:"🪓", mat:"바바리안의 정수", gstat:"lifesteal"},
  {name:"바실리스크", emoji:"🦎", mat:"바실리스크의 정수", gstat:"thorns"},
  {name:"마수", emoji:"🐾", mat:"마수의 정수", gstat:"multihit"},
  {name:"버그베어", emoji:"🐻", mat:"버그베어의 정수", gstat:"dodge"},
  {name:"카코데몬", emoji:"👹", mat:"카코데몬의 정수", gstat:"def"},
  {name:"켄타우로스", emoji:"🐎", mat:"켄타우로스의 정수", gstat:"goldFind"},
  {name:"클로커", emoji:"🦇", mat:"클로커의 정수", gstat:"hp"},
  {name:"광신 괴물", emoji:"🕯️", mat:"광신 괴물의 정수", gstat:"atk"},
  {name:"죽음", emoji:"💀", mat:"죽음의 정수", gstat:"crit"},
  {name:"레드 드래곤", emoji:"🐉", mat:"레드 드래곤의 정수", gstat:"critDmg"},
  {name:"드워프 수호 기관", emoji:"🗿", mat:"드워프 수호 기관의 정수", gstat:"penet"},
  {name:"요정룡", emoji:"🐲", mat:"요정룡의 정수", gstat:"lifesteal"},
  {name:"어인 먹물술사", emoji:"🐟", mat:"어인 먹물술사의 정수", gstat:"thorns"},
  {name:"불꽃 해골", emoji:"💀", mat:"불꽃 해골의 정수", gstat:"multihit"},
  {name:"개구리수", emoji:"🐸", mat:"개구리수의 정수", gstat:"dodge"},
  {name:"서리 대거인", emoji:"🧊", mat:"서리 대거인의 정수", gstat:"def"},
  {name:"거대 골렘", emoji:"🗿", mat:"거대 골렘의 정수", gstat:"goldFind"},
  {name:"이프리트", emoji:"🔥", mat:"이프리트의 정수", gstat:"hp"},
  {name:"광대 정령", emoji:"🃏", mat:"광대 정령의 정수", gstat:"atk"},
  {name:"나가", emoji:"🐍", mat:"나가의 정수", gstat:"crit"},
  {name:"문어 왕", emoji:"🐙", mat:"문어 왕의 정수", gstat:"critDmg"},
  {name:"오크 결사대", emoji:"💥", mat:"오크 결사대의 정수", gstat:"penet"},
  {name:"오크 흑마법사", emoji:"🟣", mat:"오크 흑마법사의 정수", gstat:"lifesteal"},
  {name:"오크 무사", emoji:"🧌", mat:"오크 무사의 정수", gstat:"thorns"},
  {name:"아울베어", emoji:"🦉", mat:"아울베어의 정수", gstat:"multihit"},
  {name:"팔라딘", emoji:"✝️", mat:"팔라딘의 정수", gstat:"dodge"},
  {name:"그림자 존재", emoji:"🌑", mat:"그림자 존재의 정수", gstat:"def"},
  {name:"파편혼 학살자", emoji:"⚔️", mat:"파편혼 학살자의 정수", gstat:"goldFind"},
  {name:"방패 수호자", emoji:"🛡️", mat:"방패 수호자의 정수", gstat:"hp"},
  {name:"서큐버스", emoji:"😈", mat:"서큐버스의 정수", gstat:"atk"},
  {name:"천둥 야수", emoji:"⚡", mat:"천둥 야수의 정수", gstat:"crit"},
  {name:"엄버 헐크", emoji:"🪲", mat:"엄버 헐크의 정수", gstat:"critDmg"},
  {name:"원혼", emoji:"👻", mat:"원혼의 정수", gstat:"penet"},
  {name:"웬디고", emoji:"🦌", mat:"웬디고의 정수", gstat:"lifesteal"},
  {name:"예티", emoji:"❄️", mat:"예티의 정수", gstat:"thorns"},
  {name:"고블린 왕", emoji:"👑", mat:"고블린 왕의 정수", gstat:"multihit"},
  {name:"드워프 왕", emoji:"👑", mat:"드워프 왕의 정수", gstat:"dodge"},
  {name:"도마뱀 마법사", emoji:"🦎", mat:"도마뱀 마법사의 정수", gstat:"def"},
  {name:"도마뱀 창병", emoji:"🦎", mat:"도마뱀 창병의 정수", gstat:"goldFind"},
  {name:"도마뱀 전사", emoji:"🦎", mat:"도마뱀 전사의 정수", gstat:"hp"},
  {name:"어인 야수", emoji:"🐟", mat:"어인 야수의 정수", gstat:"atk"},
  {name:"어인 거품술사", emoji:"🫧", mat:"어인 거품술사의 정수", gstat:"crit"},
  {name:"사악한 나무", emoji:"🌳", mat:"사악한 나무의 정수", gstat:"critDmg"},
  {name:"거대 호박 괴물", emoji:"🎃", mat:"거대 호박 괴물의 정수", gstat:"penet"},
  {name:"큰 나뭇잎 정령", emoji:"🍃", mat:"큰 나뭇잎 정령의 정수", gstat:"lifesteal"},
  {name:"코볼트 함정장인", emoji:"🪤", mat:"코볼트 함정장인의 정수", gstat:"thorns"},
];

/* 적 종 → idle 스프라이트 클래스 키 (css/enemies.css의 .es-<key>) */
G.DATA.ENEMY_SPRITES = {
  "슬라임":"slime", "박쥐":"bat", "임프":"goblin", "화염 해골":"skeleton",
  "거미":"spider", "늑대":"wolf", "오크 전사":"orc", "골렘":"golem",
  "유령":"ghost", "리치":"lich", "화염 정령":"fire_elem", "냉기 정령":"ice_elem",
  "뱀":"snake", "하피":"harpy", "미노타우로스":"minotaur", "새끼 드래곤":"wyvern",
  "문어":"octopus", "떠다니는 눈":"eye",
  "거대 슬라임":"giant_slime", "검은 푸딩":"black_pudding", "말벌":"wasp",
  "거대 파리":"giant_fly", "전갈":"scorpion", "핏빛 거미":"bloodsilk",
  "콰지트":"quasit", "그렘린":"gremlin", "놀":"gnoll", "구울":"ghoul",
  "미라":"mummy", "좀비":"zombie", "도깨비불":"wisp", "드레이크":"drake",
  "번개 정령":"lightning_elem", "미니 골렘":"mini_golem", "가고일":"gargoyle",
  "멧돼지":"boar", "새끼 늑대":"wolf_cub", "코브라":"cobra", "해파리":"jellyfish", "게":"crab",
  "오우거":"ogre", "트롤":"troll", "미라 군주":"mummy_lord", "밴시":"banshee",
  "뱀파이어":"vampire", "사이클롭스":"cyclops", "엘더 드래곤":"elder_dragon",
  "비홀더":"beholder", "마인드 플레이어":"mind_flayer", "거대 고릴라":"giant_gorilla",
  "네크로맨서":"goblin_lord", "해골 왕":"skeleton_king", "오크 감독관":"orc_chief",
  "마녀":"witch", "서리 거인":"fire_giant", "드래곤":"ice_dragon",
  "아귀 악마":"demon_lord", "대천사":"fallen_angel", "요정 드래곤":"ancient_dragon",
  "악마":"demon_king",
  /* === 신규 확장 +164 === */
  "심연의 닭":"abyssal_chicken", "아카나메":"akaname", "외계 공포체":"alien_horror",
  "고대 갑각류":"ancient_crustacean", "천사":"angel", "아누비스 전사":"anubis_warrior",
  "비전 골렘":"arcane_golem", "대천사장":"archangel", "궁수":"archer",
  "아르마딜로":"armadillo", "다락의 속삭임":"attic_whisperer", "산적":"bandit",
  "산적 마법사":"bandit_mage", "산적 투석꾼":"bandit_slingshot", "바바리안":"barbarian",
  "바실리스크":"basilisk", "마수":"beast", "작은 검은 푸딩":"black_pudding_small",
  "핏실 거미":"bloodsilk_spider", "뇌두더지 군주":"brain_mole_monarch", "브라우니":"brownie",
  "버그베어":"bugbear", "황소":"bull", "불리웍 전사":"bullywug_warrior",
  "카코데몬":"cacodaemon", "켄타우로스":"centaur", "클로커":"cloaker",
  "콤프소그나투스":"compsognathus", "광신 괴물":"cultist_horror", "광신도":"cultists",
  "죽음":"death", "악령":"demon", "도플갱어":"dopperganger",
  "레드 드래곤":"dragon", "새끼 용":"dragon_hatchling", "잠자리":"dragonfly",
  "드워프 수호 기관":"dwarven_guardian_construct", "요정룡":"faerie_dragon", "작은 화염 정령":"fire_elemental_small",
  "어인 먹물술사":"fishfolk_inkbender", "불꽃 해골":"flameskull", "육신 괴물":"flesh_horror",
  "비행 뇌수":"flying_brain_monster", "비행 안구":"flying_eye_monster", "파리지옥 레쉬":"flytrap_leshy",
  "개구리수":"froghemoth", "서리 대거인":"frost_giant", "버섯 괴물(중)":"fungal_monster_medium",
  "버섯 괴물(소)":"fungal_monster_small", "지오니드":"geonid", "거대 골렘":"giant_golem",
  "거대 버섯 괴물":"giant_mushroom_monster", "검투사":"gladiator", "글럿몬":"glutmon",
  "수호 두루마리":"guardian_scroll", "고슴도치":"hedgehog", "지옥 짐승":"hell_critter",
  "소라게":"hermit_crab", "호문쿨루스":"homunculus", "홉킨스 그렘린":"hopkins_gremlin",
  "작은 냉기 정령":"ice_elemental_small", "이프리트":"ifrit", "꼬마 임프":"imp",
  "지능 포식자":"intellect_devourer", "광대 정령":"jester_sprite", "기사":"knight",
  "코레드":"korred", "무당벌레":"ladybug", "작은 번개 정령":"lightning_elemental_small",
  "도마뱀 궁수":"lizardfolk_archer", "도마뱀 수도사":"lizardfolk_monk", "마법사":"mage",
  "마법사냥꾼":"mageripper", "아귀 마귀":"maw_demon", "미믹":"mimic",
  "괴물 달팽이":"monster_snail", "나가":"naga", "벌거숭이두더지쥐":"naked_molerat",
  "강령술사":"necromancer", "닌자":"ninja", "노식":"nothic",
  "문어 왕":"octopus_king", "새끼 문어":"octopus_small", "오크 사냥꾼":"orc_hunter",
  "오크 결사대":"orc_kamikaze", "오크 주술사":"orc_shaman", "오크 작업반장":"orc_taskmaster",
  "오크 흑마법사":"orc_warlock", "오크 무사":"orc_warrior", "올빼미":"owl",
  "아울베어":"owlbear", "팔라딘":"paladin", "앵무새":"parrot",
  "펭귄":"penguin", "역병 의사":"plague_doctor", "여사제":"priestess",
  "화염술사":"pyromancer", "쾌속요정":"quickling", "쥐족 광전사":"ratfolk_berserker_sprite",
  "쥐족 조련사":"ratfolk_tamer", "도적":"rogue", "스카라베":"scarab",
  "그림자 존재":"shadow_entity", "파편혼 학살자":"shardsoul_slayer", "방패 수호자":"shield_guardian",
  "해골 궁수":"skeletal_archer", "해골 마법사":"skeletal_mage", "해골 전사":"skeletal_warrior",
  "중형 슬라임":"slime_medium", "소형 슬라임":"slime_small", "종자":"squire",
  "서큐버스":"succubus", "도둑":"thief_medieval", "천둥 야수":"thunder_beast",
  "엄버 헐크":"umber_hulk", "바르구일":"vargouille", "원혼":"vengeful_spirit",
  "흑마법사":"warlock", "웬디고":"wendigo", "예티":"yeti",
  "좀비 주민":"zombie_townsfolk", "고블린 암살자":"goblin_assassin", "고블린 멧돼지 기수":"goblin_boar_rider",
  "고블린 폭탄병":"goblin_bomber", "고블린 왕":"goblin_king", "고블린 주술사":"goblin_shaman",
  "드워프":"dwarf", "드워프 석궁병":"dwarf_arbelest", "언데드 드워프":"dwarf_undead",
  "드워프 왕":"king_dwarf", "도마뱀 마법사":"lizardfolk_mage", "도마뱀 창병":"lizardfolk_spearman",
  "도마뱀 전사":"lizardfolk_warrior", "어인 대사제":"fishfolk_archpriest", "어인 광전사":"fishfolk_berserker",
  "어인 야수":"fishfolk_brute", "어인 거품술사":"fishfolk_bubblemancer", "어인 최면술사":"fishfolk_hypnotist",
  "어인 해파리":"fishfolk_jelly", "어인 기사":"fishfolk_knight", "어인 그물잡이":"fishfolk_net",
  "어인 주술사":"fishfolk_shaman", "어인 채찍병":"fishfolk_whip", "선인장 괴물":"cactus_monster_s",
  "사악한 나무":"evil_tree", "거대 호박 괴물":"giant_pumpkin_monster", "큰 나뭇잎 정령":"leaf_elemental_big",
  "작은 나뭇잎 정령":"leaf_elemental_small", "잎사귀 레쉬":"leafy_leshy", "호리병 레쉬":"leshy_gourd",
  "괴물 꽃":"monster_flower", "가지 마름병":"twig_blight", "채소 괴물":"vegetable_monsters_1",
  "엘프 궁수":"elven_archer", "엘프 전사":"elven_warrior", "엘프 마법사":"elven_wizard",
  "코볼트":"kobold", "코볼트 용방패병":"kobold_dragonshield", "코볼트 사제":"kobold_priest",
  "코볼트 화염술사":"kobold_pyromancer", "코볼트 주술사":"kobold_shaman", "코볼트 투석병":"kobold_slinger",
  "코볼트 함정장인":"kobold_trapmaster", "날개 코볼트":"winged_kobold",
};

/* 적 모션 보유 정보 (스프라이트 키별) — 있는 모션만 프레임 재생, 없으면 폴백
   atk: 공격 프레임 / hurt: 피격 프레임 / die: 사망 프레임
   slicer 라벨 → apply_config 출력 기반. skeleton_king·minotaur는 idle만(모션 폴백). */
G.DATA.ENEMY_ANIMS = {
  /* Phase B 신규 32종 */
  giant_slime: { walk:8, atk:16, hurt:8, die:7 },
  black_pudding: { atk:7, hurt:4, die:6 },
  wasp: { atk:4, hurt:4, die:4 },
  giant_fly: { atk:4, hurt:4, die:6 },
  scorpion: { atk:4, hurt:3, die:5 },
  bloodsilk: { atk:8, hurt:3, die:8 },
  quasit: { atk:5, die:5 },
  gremlin: { atk:8, hurt:4, die:5 },
  gnoll: { atk:8, hurt:4, die:7 },
  ghoul: { atk:6, hurt:4, die:6 },
  mummy: { atk:6, hurt:4, die:5 },
  zombie: { atk:7, hurt:4, die:5 },
  wisp: { atk:8, hurt:4, die:7 },
  drake: { atk:8, hurt:8, die:8 },
  lightning_elem: { atk:7, hurt:5, die:13 },
  mini_golem: { atk:7, hurt:5, die:5 },
  gargoyle: { atk:5, hurt:2, die:6 },
  boar: { atk:4, hurt:4, die:3 },
  wolf_cub: { atk:8, hurt:3, die:3 },
  cobra: { atk:6, hurt:4, die:6 },
  jellyfish: { atk:5, hurt:5, die:7 },
  crab: { atk:4, die:4 },
  ogre: { atk:6, hurt:3, die:11 },
  troll: { atk:6, hurt:4, die:4 },
  mummy_lord: { atk:6, hurt:4, die:9 },
  banshee: { atk:6, hurt:4, die:8 },
  vampire: { atk:8, hurt:3, die:9 },
  cyclops: { atk:7, hurt:5, die:9 },
  elder_dragon: { atk:8, hurt:4, die:8 },
  beholder: { atk:6, hurt:8, die:5 },
  mind_flayer: { atk:8, hurt:8, die:15 },
  giant_gorilla: { atk:7, hurt:4, die:5 },
  /* 원본 26종 (슬라이서로 모션 추가) */
  slime: { walk:8, atk:7, hurt:4, die:7 },
  bat: { atk:5, die:5 },
  goblin: { walk:8, atk:6, hurt:4, die:6 },
  skeleton: { walk:8, atk:8, hurt:8, die:8 },
  spider: { walk:6, atk:4, hurt:3, die:9 },
  wolf: { walk:8, atk:7, hurt:4, die:4 },
  orc: { walk:8, atk:7, hurt:4, die:6 },
  golem: { walk:5, atk:5, hurt:5, die:10 },
  ghost: { walk:7, atk:8, hurt:5, die:9 },
  lich: { atk:5, hurt:4, die:16 },
  fire_elem: { walk:8, atk:8, hurt:6, die:8 },
  ice_elem: { walk:4, atk:5, hurt:3, die:8 },
  snake: { walk:5, atk:5, hurt:5, die:5 },
  harpy: { atk:5, hurt:5, die:7 },
  wyvern: { walk:5, atk:10, hurt:5, die:10 },
  octopus: { walk:4, atk:4, hurt:6, die:7 },
  eye: { atk:4, die:8 },
  goblin_lord: { walk:8, atk:7, hurt:7, die:8 },
  orc_chief: { walk:8, atk:6, hurt:3, die:6 },
  witch: { walk:8, atk:8, hurt:4, die:10 },
  fire_giant: { walk:6, atk:6, hurt:4, die:7 },
  ice_dragon: { atk:10, hurt:8, die:10 },
  demon_lord: { walk:8, atk:6, hurt:4, die:5 },
  fallen_angel: { walk:8, atk:8, hurt:8, die:7 },
  ancient_dragon: { atk:8, hurt:4, die:8 },
  demon_king: { walk:8, atk:8, hurt:4, die:5 },
  skeleton_king: { walk:8, atk:7, hurt:4, die:9 },
  minotaur: { walk:8, atk:9, hurt:3, die:6 },
  /* === 신규 확장 +164 === */
  abyssal_chicken: { walk:6, atk:5, hurt:4, die:5 },
  akaname: { walk:8, atk:8, die:6 },
  alien_horror: { walk:8, atk:7, hurt:4, die:4 },
  ancient_crustacean: { walk:8, atk:8, hurt:4, die:8 },
  angel: { atk:6, hurt:4, die:6 },
  anubis_warrior: { walk:8, atk:4, hurt:4, die:5 },
  arcane_golem: { walk:8, atk:12, hurt:4, die:14 },
  archangel: { walk:8, atk:8, hurt:4, die:7 },
  archer: { walk:8, atk:8, hurt:4, die:4 },
  armadillo: { walk:4, atk:8, hurt:3, die:3 },
  attic_whisperer: { walk:4, atk:8, hurt:4, die:4 },
  bandit: { walk:8, atk:7, hurt:3, die:7 },
  bandit_mage: { walk:8, atk:8, hurt:5, die:5 },
  bandit_slingshot: { walk:8, atk:9, hurt:4, die:6 },
  barbarian: { walk:8, atk:8, hurt:4, die:5 },
  basilisk: { walk:8, atk:8, hurt:4, die:6 },
  beast: { walk:8, atk:8, hurt:5, die:11 },
  black_pudding_small: { walk:10, atk:7, hurt:4, die:6 },
  bloodsilk_spider: { walk:4, atk:4, hurt:3, die:8 },
  brain_mole_monarch: { atk:4, hurt:4, die:7 },
  brownie: { walk:8, atk:6, hurt:4, die:9 },
  bugbear: { walk:6, atk:6, hurt:4, die:6 },
  bull: { walk:8, atk:8, hurt:3 },
  bullywug_warrior: { walk:8, atk:6, hurt:4, die:6 },
  cacodaemon: { atk:6, hurt:4, die:8 },
  centaur: { walk:7, atk:8, hurt:8, die:10 },
  cloaker: { walk:5, atk:10, hurt:5, die:11 },
  compsognathus: { walk:8, atk:6, hurt:6, die:7 },
  cultist_horror: { walk:4, atk:11, hurt:5, die:10 },
  cultists: { walk:5, atk:6, hurt:4, die:5 },
  death: { walk:4, atk:7, hurt:5, die:9 },
  demon: { walk:8, atk:8, hurt:4, die:5 },
  dopperganger: { walk:6, atk:8, hurt:4, die:8 },
  dragon: { walk:5, atk:8, hurt:8, die:10 },
  dragon_hatchling: { walk:5, atk:10, hurt:5, die:10 },
  dragonfly: { walk:4, atk:4, die:7 },
  dwarven_guardian_construct: { walk:5, atk:12, hurt:4, die:12 },
  faerie_dragon: { atk:8, hurt:4, die:8 },
  fire_elemental_small: { walk:8, atk:8, hurt:6, die:8 },
  fishfolk_inkbender: { walk:8, atk:16, hurt:6, die:8 },
  flameskull: { walk:8, atk:8, hurt:8, die:8 },
  flesh_horror: { atk:4, hurt:4, die:1 },
  flying_brain_monster: { atk:8, hurt:5, die:7 },
  flying_eye_monster: { atk:4, hurt:8 },
  flytrap_leshy: { walk:8, atk:4, hurt:4, die:4 },
  froghemoth: { walk:12, atk:4, hurt:6, die:9 },
  frost_giant: { walk:6, atk:6, hurt:4, die:7 },
  fungal_monster_medium: { walk:8, atk:5, hurt:4, die:6 },
  fungal_monster_small: { walk:6, atk:6, hurt:4, die:4 },
  geonid: { walk:8, atk:7, hurt:4, die:5 },
  giant_golem: { walk:8, atk:5, die:10 },
  giant_mushroom_monster: { walk:8, atk:5, hurt:6, die:6 },
  gladiator: { walk:8, atk:7, hurt:3, die:7 },
  glutmon: { walk:8, atk:8, hurt:4, die:4 },
  guardian_scroll: { walk:6, atk:12, die:10 },
  hedgehog: { walk:4, atk:4, hurt:3 },
  hell_critter: { walk:8, atk:5, hurt:5, die:4 },
  hermit_crab: { walk:6, atk:6, hurt:3, die:5 },
  homunculus: { walk:4, atk:5, hurt:3, die:10 },
  hopkins_gremlin: { walk:8, atk:8, hurt:4, die:5 },
  ice_elemental_small: { walk:4, atk:5, hurt:3, die:8 },
  ifrit: { walk:8, atk:13, hurt:4, die:18 },
  imp: { walk:8, atk:6, hurt:4, die:6 },
  intellect_devourer: { walk:8, atk:6, hurt:4, die:4 },
  jester_sprite: { walk:8, atk:9, hurt:5, die:5 },
  knight: { walk:8, atk:5, hurt:3, die:7 },
  korred: { walk:8, atk:5, hurt:3, die:5 },
  ladybug: { walk:8, atk:8, hurt:4, die:8 },
  lightning_elemental_small: { walk:8, atk:7, hurt:5, die:13 },
  lizardfolk_archer: { walk:8, atk:4, hurt:4, die:6 },
  lizardfolk_monk: { walk:8, atk:8, hurt:8, die:8 },
  mage: { walk:11, atk:5, hurt:9, die:9 },
  mageripper: { walk:4, atk:5, hurt:3, die:3 },
  maw_demon: { walk:8, atk:6, hurt:4, die:5 },
  mimic: { walk:4, atk:4, die:6 },
  monster_snail: { walk:6, atk:6, hurt:4, die:7 },
  naga: { walk:8, atk:7, hurt:4, die:8 },
  naked_molerat: { walk:8, atk:4, hurt:3, die:6 },
  necromancer: { walk:8, atk:7, hurt:4, die:8 },
  ninja: { walk:8, atk:5, hurt:4, die:7 },
  nothic: { walk:5, atk:5, hurt:3, die:3 },
  octopus_king: { walk:8, atk:8, hurt:5, die:8 },
  octopus_small: { walk:4, atk:6, hurt:4, die:7 },
  orc_hunter: { walk:8, atk:6, hurt:4, die:4 },
  orc_kamikaze: { walk:8, atk:15, hurt:4, die:10 },
  orc_shaman: { walk:8, atk:7, hurt:4, die:6 },
  orc_taskmaster: { walk:8, atk:6, hurt:3, die:6 },
  orc_warlock: { walk:8, atk:8, hurt:3, die:6 },
  orc_warrior: { walk:8, atk:7, hurt:4, die:6 },
  owl: { atk:5, hurt:5, die:6 },
  owlbear: { walk:8, atk:4, hurt:4, die:5 },
  paladin: { walk:8, atk:8, hurt:4, die:7 },
  parrot: { walk:8, atk:4, hurt:2, die:5 },
  penguin: { walk:6, atk:3, hurt:4, die:4 },
  plague_doctor: { walk:8, atk:8, hurt:4, die:15 },
  priestess: { walk:8, atk:5, hurt:4, die:6 },
  pyromancer: { walk:8, atk:15, hurt:4, die:4 },
  quickling: { walk:6, atk:6, hurt:8, die:9 },
  ratfolk_berserker_sprite: { walk:8, atk:8, hurt:4, die:6 },
  ratfolk_tamer: { walk:8, atk:8, hurt:5, die:8 },
  rogue: { walk:8, atk:5, hurt:4, die:8 },
  scarab: { walk:4, atk:4, hurt:4, die:5 },
  shadow_entity: { walk:11, atk:16, hurt:16, die:12 },
  shardsoul_slayer: { walk:8, atk:5, hurt:4, die:6 },
  shield_guardian: { walk:6, atk:7, hurt:4, die:8 },
  skeletal_archer: { walk:5, atk:8, hurt:3, die:7 },
  skeletal_mage: { walk:8, atk:8, hurt:3, die:6 },
  skeletal_warrior: { walk:5, atk:10, hurt:5, die:10 },
  slime_medium: { walk:11, atk:8, hurt:4, die:11 },
  slime_small: { walk:8, atk:7, hurt:4, die:7 },
  squire: { walk:8, atk:7, hurt:4, die:5 },
  succubus: { walk:8, atk:6, hurt:4, die:5 },
  thief_medieval: { walk:8, atk:10, hurt:6, die:5 },
  thunder_beast: { walk:8, atk:8, hurt:4, die:6 },
  umber_hulk: { walk:6, atk:6, hurt:4, die:8 },
  vargouille: { atk:5, hurt:5, die:9 },
  vengeful_spirit: { atk:12, hurt:6, die:10 },
  warlock: { walk:8, atk:6, hurt:4, die:5 },
  wendigo: { walk:4, atk:8, hurt:8, die:8 },
  yeti: { walk:6, atk:6, hurt:8, die:6 },
  zombie_townsfolk: { walk:6, atk:7, hurt:4, die:5 },
  goblin_assassin: { walk:8, atk:5, hurt:4, die:7 },
  goblin_boar_rider: { walk:8, hurt:4, die:8 },
  goblin_bomber: { walk:8, atk:5, hurt:4, die:4 },
  goblin_king: { walk:6, atk:8, hurt:4, die:11 },
  goblin_shaman: { atk:6, hurt:4, die:5 },
  dwarf: { walk:8, atk:2, hurt:4, die:7 },
  dwarf_arbelest: { walk:8, atk:6, hurt:4, die:4 },
  dwarf_undead: { walk:8, atk:6, hurt:4, die:5 },
  king_dwarf: { walk:8, atk:5, hurt:5, die:5 },
  lizardfolk_mage: { walk:8, atk:8, hurt:5, die:5 },
  lizardfolk_spearman: { walk:8, atk:8, hurt:4, die:5 },
  lizardfolk_warrior: { walk:8, atk:6, hurt:4, die:5 },
  fishfolk_archpriest: { walk:4, atk:9, hurt:4, die:4 },
  fishfolk_berserker: { walk:8, atk:6, hurt:4, die:5 },
  fishfolk_brute: { walk:8, atk:8, hurt:4, die:6 },
  fishfolk_bubblemancer: { walk:8, atk:8, hurt:5, die:8 },
  fishfolk_hypnotist: { walk:8, atk:6, hurt:4, die:5 },
  fishfolk_jelly: { walk:8, atk:7, hurt:4, die:8 },
  fishfolk_knight: { walk:8, atk:7, hurt:4, die:4 },
  fishfolk_net: { walk:8, atk:6, hurt:4, die:4 },
  fishfolk_shaman: { walk:8, atk:6, hurt:4, die:6 },
  fishfolk_whip: { walk:8, atk:7, hurt:4, die:4 },
  cactus_monster_s: { walk:4, atk:8, hurt:3, die:4 },
  evil_tree: { walk:8, atk:8, hurt:4, die:5 },
  giant_pumpkin_monster: { walk:6, atk:6, hurt:4, die:15 },
  leaf_elemental_big: { walk:7, atk:6, hurt:4, die:7 },
  leaf_elemental_small: { walk:5, atk:6, hurt:5, die:7 },
  leafy_leshy: { walk:8, atk:7, hurt:4, die:5 },
  leshy_gourd: { walk:8, atk:8, hurt:4, die:8 },
  monster_flower: { walk:8, atk:6, hurt:4, die:8 },
  twig_blight: { walk:8, atk:6, hurt:5, die:5 },
  vegetable_monsters_1: { walk:6, atk:7, hurt:4, die:7 },
  elven_archer: { walk:8, atk:7, hurt:4, die:6 },
  elven_warrior: { walk:8, atk:4, hurt:3, die:6 },
  elven_wizard: { walk:8, atk:6, hurt:4, die:5 },
  kobold: { walk:8, atk:4, hurt:4, die:7 },
  kobold_dragonshield: { walk:8, atk:6, hurt:4, die:7 },
  kobold_priest: { walk:8, atk:8, hurt:4, die:7 },
  kobold_pyromancer: { walk:8, atk:2, hurt:4, die:7 },
  kobold_shaman: { walk:8, atk:8, hurt:5, die:6 },
  kobold_slinger: { walk:8, atk:7, hurt:4, die:7 },
  kobold_trapmaster: { walk:8, atk:8, hurt:5, die:7 },
  winged_kobold: { walk:6, atk:4, hurt:2, die:4 },
};

/* 100개 층 절차적 생성
   각 층 = 한 번의 진행(□…■). 마지막 노드는 층 보스(full). */
G.DATA.FLOORS = (function(){
  var NS=G.DATA.NORMAL_SPECIES, BS=G.DATA.BOSS_SPECIES, arr=[];
  for(var f=1; f<=G.DATA.MAX_FLOOR; f++){
    var band=Math.floor((f-1)/10);                 // 10층 단위 테마
    var pool=[0,1,2].map(function(i){ return NS[(band*2+i)%NS.length]; });
    var boss=BS[band%BS.length];
    var dropTier=Math.min(4, 1+Math.floor(f/10));  // 등급 가중치(1~4)
    var recPow=Math.round(100*Math.pow(1.112,f-1)); // 권장 전투력 (1층 100, 적정 장비의 ~40~70%)
    var nodeCount=Math.min(12, 4 + Math.floor(f/12)); // 4~12칸 (상한)
    var nodes=[];
    for(var k=0;k<nodeCount;k++) nodes.push({type:"normal"});
    nodes.push({ type:"boss", species:boss, kind:"full" });
    arr.push({
      floor:f, recommendPower:recPow, pool:pool, dropTier:dropTier, nodes:nodes,
      gold: Math.round((50+f*25) * Math.pow(1.07,f-1)),
    });
  }
  return arr;
})();

window.G = G;
