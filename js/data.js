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

/* 룬: 장비 룬 슬롯에 장착하는 순수 스탯 아이템 (main = 주 스탯) */
G.DATA.RUNE_SLOTS = ["rune1","rune2","rune3"];   // 룬워드 3룬 조합 기준(5→3 축소)

/* 🔗 룬워드 — 룬 3칸을 특정 룬 조합으로 채우면 발동(순서 무관). 조합법은 숨김(발견형).
   발동 시 룬창에 이름·능력 표시. 효과는 % 보조 수준. */
G.DATA.RUNEWORDS = [
  { id:"berserk",   name:"광전사",   ico:"🔥", runes:["공격의 룬","치명의 룬","파멸의 룬"], bonus:{ crit:8, critDmg:25, multihit:6 } },
  { id:"fortress",  name:"철벽",     ico:"🛡️", runes:["수호의 룬","활력의 룬","가시의 룬"], bonus:{ thorns:25, stunResist:20, allRes:8 } },
  { id:"vampire",   name:"흡왕",     ico:"🩸", runes:["흡혈의 룬","공격의 룬","질풍의 룬"], bonus:{ lifesteal:8, multihit:8, crit:5 } },
  { id:"greed",     name:"황금광",   ico:"💰", runes:["황금의 룬","활력의 룬","수호의 룬"], bonus:{ goldFind:60, allRes:6 } },
  { id:"storm",     name:"폭풍",     ico:"⚡", runes:["질풍의 룬","치명의 룬","관통의 룬"], bonus:{ multihit:10, crit:6, penet:10 } },
  { id:"piercer",   name:"파괴자",   ico:"💢", runes:["관통의 룬","파멸의 룬","공격의 룬"], bonus:{ penet:14, critDmg:20, crit:4 } },
  { id:"executioner",name:"처형자",  ico:"🗡️", runes:["공격의 룬","치명의 룬","흡혈의 룬"], bonus:{ crit:7, lifesteal:6, critDmg:12 } },
  { id:"onslaught", name:"연격",     ico:"🌀", runes:["공격의 룬","질풍의 룬","관통의 룬"], bonus:{ multihit:10, penet:8, crit:5 } },
  { id:"gladiator", name:"검투사",   ico:"⚔️", runes:["공격의 룬","활력의 룬","치명의 룬"], bonus:{ crit:6, lifesteal:5, stunResist:8 } },
  { id:"slayer",    name:"광살",     ico:"💥", runes:["공격의 룬","파멸의 룬","질풍의 룬"], bonus:{ critDmg:22, multihit:8, crit:4 } },
  { id:"thornknight",name:"가시기사", ico:"🌵", runes:["공격의 룬","수호의 룬","가시의 룬"], bonus:{ thorns:22, stunResist:12, crit:3 } },
  { id:"march",     name:"강행군",   ico:"🥾", runes:["수호의 룬","활력의 룬","질풍의 룬"], bonus:{ multihit:6, allRes:6, thorns:10 } },
  { id:"regrowth",  name:"재생가시", ico:"♻️", runes:["활력의 룬","흡혈의 룬","가시의 룬"], bonus:{ lifesteal:6, thorns:18, stunResist:8 } },
  { id:"assassin",  name:"암살",     ico:"🥷", runes:["치명의 룬","파멸의 룬","흡혈의 룬"], bonus:{ crit:8, critDmg:28, lifesteal:5 } },
  { id:"plunder",   name:"도굴꾼",   ico:"🪙", runes:["관통의 룬","황금의 룬","공격의 룬"], bonus:{ penet:10, goldFind:40, crit:4 } },
  { id:"treasure",  name:"보물추적", ico:"🗺️", runes:["활력의 룬","질풍의 룬","황금의 룬"], bonus:{ goldFind:50, multihit:6, dodge:6 } },
  { id:"riposte",   name:"반격태세", ico:"🪖", runes:["수호의 룬","관통의 룬","가시의 룬"], bonus:{ thorns:20, penet:8, stunResist:10 } },
  { id:"bloodrush", name:"핏빛질주", ico:"🩸", runes:["치명의 룬","흡혈의 룬","질풍의 룬"], bonus:{ lifesteal:7, multihit:8, crit:6 } },
  { id:"richblow",  name:"부유한일격",ico:"💎", runes:["활력의 룬","파멸의 룬","황금의 룬"], bonus:{ critDmg:20, goldFind:35, allRes:5 } },
  { id:"warden",    name:"광전수호", ico:"🛡️", runes:["공격의 룬","활력의 룬","가시의 룬"], bonus:{ thorns:14, crit:5, stunResist:10 } }
];
/* craft:true = 대장간 제작 전용(드롭 안 됨) / 나머지(활력·황금·가시) = 사냥 드롭 */
G.DATA.RUNE_BASES = [
  { base:"공격의 룬", ico:"🔴", iconImg:"assets/icon/runs/1.PNG",  main:"atk",       val:12, craft:true },
  { base:"수호의 룬", ico:"🔵", iconImg:"assets/icon/runs/2.PNG",  main:"def",       val:8,  craft:true },
  { base:"활력의 룬", ico:"🟢", iconImg:"assets/icon/runs/3.png",  main:"hp",        val:40 },
  { base:"치명의 룬", ico:"🟡", iconImg:"assets/icon/runs/4.PNG",  main:"crit",      val:4,  craft:true },
  { base:"파멸의 룬", ico:"🟣", iconImg:"assets/icon/runs/5.PNG",  main:"critDmg",   val:14, craft:true },
  { base:"흡혈의 룬", ico:"🟠", iconImg:"assets/icon/runs/6.PNG",  main:"lifesteal", val:3,  craft:true },
  { base:"관통의 룬", ico:"⚪", iconImg:"assets/icon/runs/7.PNG",  main:"penet",     val:6,  craft:true },
  { base:"질풍의 룬", ico:"🟤", iconImg:"assets/icon/runs/8.png",  main:"multihit",  val:3,  craft:true },
  { base:"황금의 룬", ico:"🟡", iconImg:"assets/icon/runs/9.png",  main:"goldFind",  val:10 },
  { base:"가시의 룬", ico:"🔶", iconImg:"assets/icon/runs/10.png", main:"thorns",    val:6  },
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
  { stat:"shopSlot",  min:1,  max:2,  runeOnly:true },   // 가판대 칸 (룬 전용)
  { stat:"mercFind",  min:5,  max:15, runeOnly:true },   // 손님 방문율 % (룬 전용)
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
  { id:"auto_list",     name:"자동 진열",     ico:"🛒", freeFloor:15, desc:"착용보다 못한 아이템을 가판대에 자동 진열합니다." },
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
    affixes:[{stat:"critDmg",v:30,pct:true},{stat:"allRes",v:12,pct:true},{stat:"elemAtk",v:22,pct:true}], desc:"군주의 위엄이 깃든 목걸이." }
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
  "악마":"demon_king"
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
  minotaur: { walk:8, atk:9, hurt:3, die:6 }
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
