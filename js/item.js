/* ============================================================
   아이템 — 생성 / 감정 / 재련 / 가치 계산
   구조: fixed(고정: 주스탯+방어구HP) + affixes(랜덤 옵션) → stats(합산)
   ============================================================ */
var G = window.G;
G.item = {};

/* dropTier(1~4)에 따라 등급 가중치 상향 */
G.item.rollRarity = function(tier){
  var list = G.DATA.RARITY.map(function(r){
    var w=r.weight;
    if(tier>=2 && r.key==="uncommon") w*=1.4;
    if(tier>=3 && (r.key==="rare"||r.key==="epic")) w*=1.8;
    if(tier>=4 && (r.key==="epic"||r.key==="legend")) w*=2.4;
    return { key:r.key, weight:w, ref:r };
  });
  return G.util.weighted(list).ref;
};

/* fixed + affixes → stats 합산 */
function mergeStats(it){
  var s={};
  function add(k,v){ s[k]=(s[k]||0)+v; }
  for(var k in it.fixed) add(k, it.fixed[k]);
  it.affixes.forEach(function(a){ add(a.stat, a.value); });
  it.stats=s;
}
G.item.recompute = mergeStats;

/* 부위별 옵션 값 배율 */
function slotMult(slot, stat){ var m=G.DATA.SLOT_AFFIX_MULT[slot]; return (m&&m[stat])||1; }

/* 옵션 롤 편향(하드코어): 값이 클수록 희귀하게(파워커브). 1=균등, 클수록 저값 쏠림.
   AFFIX_BIAS=옵션 값, COUNT_BIAS=옵션 개수(고등급 풀옵션 희소화). 밸런스 수치 한곳에서 조절. */
G.item.AFFIX_BIAS = 3.0;
G.item.COUNT_BIAS = 2.2;
function skewT(bias){ return Math.pow(Math.random(), bias); }   // 0~1, 0(min)쪽으로 쏠림

/* 옵션 값 1개 굴리기 (부위 배율 + 하드코어 편향 반영) */
function rollAffixValue(af, lvlMult, slot){
  var t = skewT(G.item.AFFIX_BIAS);                 // 고값(=max 근처)일수록 드묾
  if(af.dec){ // 소수점 % 옵션 (1자리)
    var fv=(af.min + t*(af.max-af.min)) * slotMult(slot, af.stat);
    return Math.max(0.1, Math.round(fv*10)/10);
  }
  var span = af.min + t*(af.max-af.min);
  var base = af.flat ? span * lvlMult : span;
  return Math.max(1, Math.round(base * slotMult(slot, af.stat)));
}
/* 등급 옵션 개수 — affMin~affMax, 저개수 쏠림(최대 개수는 드묾) */
function rollAffixCount(rarity){
  return rarity.affMin + Math.round((rarity.affMax - rarity.affMin) * skewT(G.item.COUNT_BIAS));
}

/* 가격 재계산 (stats 기반) */
function priceOf(it, rarity, tier){
  var sum=0; for(var k in it.stats) sum+=it.stats[k];
  return Math.round((10 + sum*4) * rarity.price * (tier*0.5+0.7) * 0.7);   // 기준가 30%↓
}

/* 장비 아이템 1개 생성
   tier: 등급 가중치/가격 (1~4), level: 층(스탯 스케일) */
G.item.generate = function(tier, level, partType){
  tier = tier||1; level = level||1;
  // 디아블로식: 일부 드랍은 접사 없는 "소켓 베이스"(룬워드 캔버스)로
  if(Math.random() < (G.DATA.SOCKET_BASE_RATE||0)) return G.item.generateSocketBase(level, partType);
  var bases = partType ? G.DATA.ITEM_BASES.filter(function(b){return b.type===partType||b.slot===partType;}) : G.DATA.ITEM_BASES;
  if(!bases.length) bases=G.DATA.ITEM_BASES;
  var base = G.util.pick(bases);
  var rarity = G.item.rollRarity(tier);
  var prefix = G.util.pick(G.DATA.PREFIX);
  var lvlMult = Math.pow(1.112, level-1);

  // 고정 스탯: 주스탯 (+방어구는 HP). 퍼센트 주스탯(예: 반지 치명타율)은 레벨 스케일 X
  var fixed={};
  var mainMeta=G.DATA.STAT_META[base.main];
  fixed[base.main] = mainMeta && mainMeta.pct
    ? Math.max(1, Math.round(base.val * rarity.mult * (0.85+Math.random()*0.4)))
    : Math.max(1, Math.round(base.val * rarity.mult * lvlMult * (0.85+Math.random()*0.4)));
  if(base.type==="armor") fixed.hp = (fixed.hp||0) + Math.round(base.val * 4 * rarity.mult * lvlMult);

  // 옵션(접사): 등급이 개수 범위 결정, 수치 랜덤, 중복 없음 — 부위별 허용 옵션만
  var affixCount = rollAffixCount(rarity);
  var allowed = G.DATA.SLOT_AFFIXES[base.slot] || [];
  var pool = G.DATA.AFFIXES.filter(function(a){ return allowed.indexOf(a.stat)>=0; });
  var affixes=[];
  for(var i=0;i<affixCount && pool.length>0;i++){
    var idx=Math.floor(Math.random()*pool.length);
    var af=pool.splice(idx,1)[0];
    affixes.push({ stat:af.stat, value:rollAffixValue(af, lvlMult, base.slot), pct:!!af.pct, flat:!!af.flat });
  }

  var rdef=G.DATA.RARITY.find(function(r){return r.key===rarity.key;});
  // 슬롯별 아이콘 이미지 무작위 배정(목록 있으면)
  var iconImg=null;
  var iconList = base.iconDir && G.DATA.EQUIP_ICONS && G.DATA.EQUIP_ICONS[base.iconDir];
  if(iconList && iconList.length) iconImg = "assets/icon/equip/"+base.iconDir+"/"+G.util.pick(iconList);
  // 공격 속성(100층+ 무기 — 디아블로식): 몬스터 약점이면 추가피해/저항이면 감소
  var attackElem = (base.type==="weapon" && level>=100) ? G.util.pick(G.DATA.ELEMENTS).key : null;
  var it = {
    id: G.util.uid(),
    name: prefix+" "+base.base,
    ico: base.ico, iconImg: iconImg, type: base.type, slot: base.slot, attackElem: attackElem,
    rarity: rarity.key, rarityLabel: rarity.label, rarityCls: rdef.cls,
    level: level, tier: tier,
    fixed: fixed, affixes: affixes,
    identified: !(rarity.key==="epic" || rarity.key==="legend"), // 영웅·전설은 미감정 드롭
  };
  mergeStats(it);
  it.basePrice = priceOf(it, rdef, tier);
  return it;
};

/* 룬 생성 (순수 스탯 아이템: 주 스탯 + 옵션) */
/* 룬 생성 — 사다리(RUNES)에서 드랍 가중치(w)로 추첨. 하위 흔함·상위 희귀. */
G.item.runeRarity = function(rank){
  var rc = rank<=6?"r-common":rank<=12?"r-uncommon":rank<=18?"r-rare":rank<=25?"r-epic":"r-legend";
  var lbl= rank<=6?"하급":rank<=12?"중급":rank<=18?"상급":rank<=25?"최상급":"전설";
  return { cls:rc, key:rc.replace("r-",""), label:lbl };
};
G.item.makeRune = function(r){
  var rr=G.item.runeRarity(r.rank);
  return { id:G.util.uid(), name:r.name, runeName:r.name, rank:r.rank, ico:"🔹", iconImg:r.iconImg||null,
    type:"rune", slot:"rune", rarity:rr.key, rarityLabel:rr.label, rarityCls:rr.cls,
    wpn:r.wpn, arm:r.arm, identified:true, basePrice: 20 + r.rank*r.rank*4 };
};
G.item.generateRune = function(tier, level, runeName){
  var R=G.DATA.RUNES;
  var pick;
  if(runeName){ pick=R.find(function(x){return x.name===runeName;}); }
  if(!pick){
    var tot=R.reduce(function(s,r){return s+r.w;},0), roll=Math.random()*tot; pick=R[0];
    for(var i=0;i<R.length;i++){ roll-=R[i].w; if(roll<=0){ pick=R[i]; break; } }
  }
  return G.item.makeRune(pick);
};

/* 룬 드랍 확률 — 적 종류 기본 × 층 배수(저층 타이트, 고층↑).
   배수 f: 1층≈0.31 · 100층≈0.97 · 255층+ 2.0(상한). 기본을 보수적으로 잡아 전체적으로 타이트. */
G.item.runeDropChance = function(kind, floor){
  floor = floor||1;
  var base = ({ full:0.20, mini:0.06, elite:0.04, normal:0.02 })[kind] || 0.02;
  var f = Math.max(0.3, Math.min(2.0, 0.3 + floor/150));
  var band = 1;   // 특정 층 구간 소폭 보너스(겹치면 최대 1개)
  (G.DATA.RUNE_DROP_BANDS||[]).forEach(function(b){ if(floor>=b.min && floor<=b.max && b.mult>band) band=b.mult; });
  return base * f * band;
};

/* 소켓 베이스 — 접사 없음, 부위 기본 주스탯만, 소켓 1~5개(룬워드 캔버스) */
G.item.generateSocketBase = function(level, partType){
  level=level||1;
  var bases = partType ? G.DATA.ITEM_BASES.filter(function(b){return b.type===partType||b.slot===partType;}) : G.DATA.ITEM_BASES;
  if(!bases.length) bases=G.DATA.ITEM_BASES;
  var base=G.util.pick(bases);
  var lvlMult=Math.pow(1.112, level-1);
  var fixed={}, mainMeta=G.DATA.STAT_META[base.main];
  fixed[base.main] = (mainMeta&&mainMeta.pct)
    ? Math.max(1, Math.round(base.val * (0.9+Math.random()*0.2)))
    : Math.max(1, Math.round(base.val * lvlMult * (0.9+Math.random()*0.2)));
  if(base.type==="armor") fixed.hp=(fixed.hp||0)+Math.round(base.val * 4 * lvlMult);
  var n=G.util.rand(1, G.DATA.SOCKET_MAX), sockets=[]; for(var k=0;k<n;k++) sockets.push(null);
  var iconImg=null, iconList=base.iconDir && G.DATA.EQUIP_ICONS && G.DATA.EQUIP_ICONS[base.iconDir];
  if(iconList&&iconList.length) iconImg="assets/icon/equip/"+base.iconDir+"/"+G.util.pick(iconList);
  var attackElem=(base.type==="weapon" && level>=100)?G.util.pick(G.DATA.ELEMENTS).key:null;
  var it={ id:G.util.uid(), name:"["+base.base+"]", baseName:base.base, ico:base.ico, iconImg:iconImg,
    type:base.type, slot:base.slot, rarity:"socket", rarityLabel:"소켓 "+n, rarityCls:"r-socket",
    level:level, tier:1, fixed:fixed, affixes:[], sockets:sockets, socketBase:true, attackElem:attackElem, identified:true };
  mergeStats(it);
  it.basePrice=priceOf(it, { price:6 }, 1);
  return it;
};

/* 🌟 고유(unique) 장비 생성 — 시그니처 옵션 고정(최고급), 층 비례 스케일. 획득 시 연대기 기록 */
G.item.generateUnique = function(u, level){
  level=level||1; var lvlMult=Math.pow(1.112, level-1);
  var fixed={}, mm=G.DATA.STAT_META[u.main];
  fixed[u.main] = (mm&&mm.pct) ? u.mainVal : Math.max(1, Math.round(u.mainVal*lvlMult));
  if(u.slot==="armor") fixed.hp = (fixed.hp||0) + Math.round(u.mainVal*5*lvlMult);
  var affixes=u.affixes.map(function(a){
    var v = a.flat ? Math.max(1, Math.round(a.v*lvlMult)) : a.v;
    return { stat:a.stat, value:v, pct:!!a.pct, flat:!!a.flat };
  });
  var type = u.slot==="weapon"?"weapon" : (u.slot==="ring"||u.slot==="necklace"?"accessory":"armor");
  var it = {
    id:G.util.uid(), name:u.name, ico:"🌟",
    iconImg:(u.iconDir&&u.icon)?("assets/icon/equip/"+u.iconDir+"/"+u.icon):null,
    type:type, slot:u.slot, rarity:"unique", rarityLabel:"고유", rarityCls:"r-unique",
    uniqueId:u.id, desc:u.desc, level:level, tier:5, fixed:fixed, affixes:affixes, identified:true
  };
  mergeStats(it);
  it.basePrice = priceOf(it, { price:24 }, 5);
  // 연대기(도감) 기록 — 한 번이라도 획득하면 발견 처리
  G.state.collection = G.state.collection || { uniques:{} };
  if(!G.state.collection.uniques) G.state.collection.uniques={};
  G.state.collection.uniques[u.id]=true;
  if(G.glow) G.glow.apply();   // 새 고유 발견 → 글로우 티어 갱신 가능
  return it;
};

/* ============================================================
   🔗 룬워드 — 한 아이템의 소켓을 가득 채우고(소켓수=길이 3/4/5),
   부위(cat: weapon/armor)와 필요 룬(순서 무관)이 일치하면 발동.
   ============================================================ */
function _multisetEq(a,b){
  if(a.length!==b.length) return false;
  var m={},i; for(i=0;i<a.length;i++) m[a[i]]=(m[a[i]]||0)+1;
  for(i=0;i<b.length;i++){ if(!m[b[i]]) return false; m[b[i]]--; }
  return true;
}
G.runeword = {};
/* 아이템의 소켓 구성이 어떤 룬워드와 일치하면 그 룬워드 반환 */
G.runeword.ofItem = function(it){
  if(!it || !it.sockets || !it.sockets.length) return null;
  for(var i=0;i<it.sockets.length;i++){ if(!it.sockets[i]) return null; }   // 가득 차야
  var names=it.sockets.map(function(s){ return s.runeName||s.name; });
  var cat=(it.type==="weapon")?"weapon":"armor";
  var ws=G.DATA.RUNEWORDS||[], found=null;
  for(var j=0;j<ws.length;j++){
    if(ws[j].cat!==cat || ws[j].runes.length!==names.length) continue;
    if(_multisetEq(ws[j].runes, names)){ found=ws[j]; break; }
  }
  return found;
};
/* 현재 장착 장비에서 발동 중인 룬워드 전부 */
G.runeword.activeList = function(){
  var eq=G.state.equipment, out=[];
  for(var k in eq){ var w=G.runeword.ofItem(eq[k]); if(w) out.push(w); }
  return out;
};
G.runeword.active = function(){ return G.runeword.activeList()[0] || null; };   // 호환(첫 룬워드)
/* 발동 중인 룬워드를 연대기에 발견 등록(저장은 호출측에서) */
G.runeword.recordActive = function(){
  var list=G.runeword.activeList(); if(!list.length) return null;
  G.state.collection=G.state.collection||{}; G.state.collection.runewords=G.state.collection.runewords||{};
  list.forEach(function(w){ G.state.collection.runewords[w.id]=true; });
  return list[0];
};

/* ============================================================
   🔩 소켓 — 룬 삽입/제거(임시: 회수형, 영구파괴 정책 미정)
   ============================================================ */
G.socket = {};
G.socket.findItem = function(id){
  var eq=G.state.equipment; for(var k in eq){ if(eq[k] && eq[k].id===id) return eq[k]; }
  return (G.state.inventory||[]).find(function(x){ return x.id===id; }) || null;
};
G.socket.openCount = function(it){ return (it && it.sockets) ? it.sockets.filter(function(s){return !s;}).length : 0; };
G.socket.insert = function(itemId, runeId){
  var it=G.socket.findItem(itemId); if(!it || !it.sockets){ return false; }
  var slot=it.sockets.indexOf(null); if(slot<0){ G.ui.toast("빈 소켓이 없습니다"); return false; }
  var ri=(G.state.inventory||[]).findIndex(function(x){ return x.id===runeId && x.slot==="rune"; });
  if(ri<0) return false;
  var rune=G.state.inventory.splice(ri,1)[0];
  it.sockets[slot]=rune;
  var w=G.runeword.ofItem(it);
  G.log("🔩 소켓 장착: "+it.name+" ◁ "+rune.name + (w?(" → 🔗"+w.name+" 발동!"):""), it.rarityCls);
  if(w){ G.runeword.recordActive(); }
  return true;
};
/* 소켓 해제 불가 — 한번 박은 룬은 뺄 수 없음(영구) */
G.socket.remove = function(){ G.ui.toast("한번 박은 룬은 뺄 수 없습니다"); return false; };

/* ============================================================
   🧊 호라드릭 큐브 — 룬 승급(하위 3개 → 상위 1개, 룬만 소모)
   ============================================================ */
G.cube = {};
G.cube.RATIO = 3;   // 승급 비율(3:1)
G.cube.count = function(rank){ return (G.state.inventory||[]).filter(function(x){ return x.slot==="rune" && x.rank===rank; }).length; };
G.cube.canUpgrade = function(rank){ return rank < G.DATA.RUNES.length && G.cube.count(rank) >= G.cube.RATIO; };
G.cube.upgrade = function(rank){
  if(!G.cube.canUpgrade(rank)){ G.ui.toast("재료 룬이 부족합니다 ("+G.cube.count(rank)+"/"+G.cube.RATIO+")"); return false; }
  var inv=G.state.inventory, removed=0;
  for(var i=inv.length-1;i>=0 && removed<G.cube.RATIO;i--){ if(inv[i].slot==="rune" && inv[i].rank===rank){ inv.splice(i,1); removed++; } }
  var next=G.DATA.RUNES.find(function(r){ return r.rank===rank+1; });
  var nr=G.item.makeRune(next);
  G.inventory.add(nr);   // 3개 소모 후 1개 추가 → 항상 칸 여유
  var from=G.DATA.RUNES.find(function(r){ return r.rank===rank; });
  G.log("🧊 룬 승급: "+from.name+" ×"+G.cube.RATIO+" → "+next.name, nr.rarityCls);
  return true;
};

/* 매각가 — 기준가의 일정 비율(가판대 폐지로 직접 처분이 주 수입원이 되어 상향) */
G.item.SELL_RATE = 0.4;
G.item.sellPrice = function(it){ return Math.round(((it&&it.basePrice)||0) * G.item.SELL_RATE); };

/* 전리품 무게 (정산 휴대 예산용) — 부위별 고정, 소모품은 0 */
G.item.weightOf = function(it){
  if(!it || it.type==="consumable") return 0;
  return (G.DATA.SLOT_WEIGHT && G.DATA.SLOT_WEIGHT[it.slot]) || 2;
};

/* 감정 */
G.item.identifyCost = function(it){
  var c=Math.max(80, Math.round((it.basePrice||50)*0.35));
  if((it.level||1) >= 100) c=Math.round(c*1.2);   // 100층 이상 아이템 감정비 20%↑
  return c;
};
G.item.identify = function(id){
  var it=G.state.inventory.find(function(x){return x.id===id;});
  if(!it || it.identified) return;
  var cost=G.item.identifyCost(it);
  if(G.state.player.gold<cost){ G.ui.toast("골드 부족 (감정비 🪙"+G.ui.fmt(cost)+")"); return; }
  G.state.player.gold-=cost;
  it.identified=true;
  G.log("🔍 감정: ["+it.rarityLabel+"] "+it.name+" — "+G.item.statText(it), it.rarityCls);
};

/* 재련: 옵션(접사) 한 줄을 무작위로 교체 (골드 전용) */
G.item.rerollCost = function(it){
  return { gold: Math.round((it.basePrice||50)*0.3) };
};
G.item.reroll = function(id){
  var it=G.state.inventory.find(function(x){return x.id===id;});
  if(!it) return;
  if(!it.identified){ G.ui.toast("감정 후 재련할 수 있습니다"); return; }
  if(!it.affixes || !it.affixes.length){ G.ui.toast("재련할 옵션이 없습니다"); return; }
  var cost=G.item.rerollCost(it);
  if(G.state.player.gold<cost.gold){ G.ui.toast("골드 부족 (🪙"+G.ui.fmt(cost.gold)+")"); return; }
  G.state.player.gold-=cost.gold;

  var lvlMult=Math.pow(1.112, (it.level||1)-1);
  var i=Math.floor(Math.random()*it.affixes.length);
  var old=it.affixes[i];
  // 현재 다른 옵션과 겹치지 않는 새 옵션 선택
  var used={}; it.affixes.forEach(function(a,j){ if(j!==i) used[a.stat]=1; });
  for(var k in it.fixed) used[k]=1;                  // 고정스탯과도 안 겹치게
  var allow = it.type==="rune" ? G.DATA.AFFIXES : G.DATA.AFFIXES.filter(function(a){ return (G.DATA.SLOT_AFFIXES[it.slot]||[]).indexOf(a.stat)>=0; });
  var cand=allow.filter(function(a){ return !used[a.stat]; });
  var af = cand.length? cand[Math.floor(Math.random()*cand.length)] : G.util.pick(G.DATA.AFFIXES);
  it.affixes[i]={ stat:af.stat, value:rollAffixValue(af, lvlMult, it.slot), pct:!!af.pct, flat:!!af.flat };
  mergeStats(it);
  var rdef=G.DATA.RARITY.find(function(r){return r.key===it.rarity;});
  it.basePrice=priceOf(it, rdef, it.tier||1);
  var om=G.DATA.STAT_META[old.stat], nm=G.DATA.STAT_META[af.stat];
  G.log("♻️ 재련: "+om.label+" → "+nm.label+" +"+G.ui.fmt(it.affixes[i].value)+(nm.pct?"%":""), it.rarityCls);
};

/* ============================================================
   🎲 겜블(디아블로식 도박) — 부위 선택 → 골드로 랜덤 아이템 구매(즉시 감정)
   일반 드랍과 동일 확률(소켓 베이스 포함) + 낮은 확률 고유 잭팟
   ============================================================ */
G.gamble = {};
G.gamble.UNIQUE_CHANCE = 0.03;     // 고유 잭팟 확률
G.gamble.PARTS = [
  { key:"weapon",   label:"무기",   ico:"🗡️" },
  { key:"helmet",   label:"투구",   ico:"⛑️" },
  { key:"armor",    label:"갑옷",   ico:"🛡️" },
  { key:"gloves",   label:"장갑",   ico:"🧤" },
  { key:"boots",    label:"신발",   ico:"🥾" },
  { key:"ring",     label:"반지",   ico:"💍" },
  { key:"necklace", label:"목걸이", ico:"📿" },
  { key:"random",   label:"무작위", ico:"🎲" },
];
G.gamble.level = function(){ return G.state.dungeon.maxFloor||1; };
G.gamble.cost = function(part){
  var lvl=G.gamble.level();
  var mult = (part==="weapon"||part==="armor") ? 1.25 : 1.0;
  return Math.round(120 * mult * Math.pow(1.05, lvl-1));
};
G.gamble.buy = function(part){
  var lvl=G.gamble.level(), cost=G.gamble.cost(part);
  if(G.state.player.gold < cost){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(cost)+")"); return null; }
  // 부위 결정(무작위면 추첨)
  var slot = part==="random" ? G.util.pick(["weapon","helmet","armor","gloves","boots","ring","necklace"]) : part;
  // 결과 롤
  var it=null;
  if(Math.random() < G.gamble.UNIQUE_CHANCE){
    var elig=(G.DATA.UNIQUES||[]).filter(function(u){ return u.slot===slot && (u.minFloor||1)<=lvl; });
    if(elig.length) it=G.item.generateUnique(G.util.pick(elig), lvl);
  }
  if(!it) it=G.item.generate(3, lvl, slot);   // 일반 드랍과 동일 확률(소켓 베이스 10% 포함)
  it.identified=true;   // 즉시 감정
  if(!G.inventory.add(it)){ G.ui.toast("창고가 가득 찼습니다"); return null; }   // 자리 없으면 미차감
  G.state.player.gold -= cost;
  G.log("🎲 겜블: ["+it.rarityLabel+"] "+it.name+" 획득! (🪙-"+G.ui.fmt(cost)+")", it.rarityCls);
  return it;
};

/* 스탯을 사람이 읽는 문자열로 (미감정은 가림) */
G.item.statText = function(it){
  if(it.identified===false) return "??? (미감정)";
  // 룬은 stats가 없고 wpn/arm 효과를 가짐 — 소켓 장착 시 부위에 따라 적용
  if(it.slot==="rune"){
    function eff(o){ return Object.keys(o||{}).map(function(k){ var m=G.DATA.STAT_META[k]; return m?(m.label+" +"+o[k]+(m.pct?"%":"")):""; }).filter(Boolean).join(" "); }
    return "⚔️ "+eff(it.wpn)+" / 🛡️ "+eff(it.arm);
  }
  if(!it.stats) return "";
  var parts=[];
  G.DATA.STAT_KEYS.forEach(function(k){
    if(!it.stats[k]) return;
    var m=G.DATA.STAT_META[k];
    var u = (m.unit!==undefined) ? m.unit : (m.pct?"%":"");
    parts.push(m.label+" +"+(m.pct?it.stats[k]:G.ui.fmt(it.stats[k]))+u);
  });
  if(it.attackElem){ var ae=G.DATA.ELEMENTS.find(function(e){return e.key===it.attackElem;}); if(ae) parts.push(ae.emoji+ae.name+" 속성"); }
  return parts.join(" · ");
};
