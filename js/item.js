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
  var bases = partType ? G.DATA.ITEM_BASES.filter(function(b){return b.type===partType;}) : G.DATA.ITEM_BASES;
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
G.item.generateRune = function(tier, level, baseName){
  tier=tier||1; level=level||1;
  // baseName 지정 시 해당 룬 / 미지정(드롭)이면 제작전용(craft) 제외
  var base = baseName ? G.DATA.RUNE_BASES.find(function(b){return b.base===baseName;})
                      : G.util.pick(G.DATA.RUNE_BASES.filter(function(b){return !b.craft;}));
  if(!base) base=G.DATA.RUNE_BASES[0];
  var rarity=G.item.rollRarity(tier);
  var lvlMult=Math.pow(1.112, level-1);
  var meta=G.DATA.STAT_META[base.main];

  var fixed={};
  fixed[base.main] = meta.pct
    ? Math.max(1, Math.round(base.val * rarity.mult))                         // 퍼센트 주스탯: 레벨 무관
    : Math.max(1, Math.round(base.val * rarity.mult * lvlMult * (0.85+Math.random()*0.4)));

  var affixCount=rollAffixCount(rarity);
  var pool=G.DATA.AFFIXES.slice(), affixes=[];
  for(var i=0;i<affixCount && pool.length>0;i++){
    var idx=Math.floor(Math.random()*pool.length);
    var af=pool.splice(idx,1)[0];
    affixes.push({ stat:af.stat, value:rollAffixValue(af, lvlMult, "rune"), pct:!!af.pct, flat:!!af.flat });
  }

  var rdef=G.DATA.RARITY.find(function(r){return r.key===rarity.key;});
  var it={
    id:G.util.uid(), name:base.base, runeBase:base.base, ico:base.ico, iconImg:base.iconImg||null, type:"rune", slot:"rune",
    rarity:rarity.key, rarityLabel:rarity.label, rarityCls:rdef.cls,
    level:level, tier:tier, fixed:fixed, affixes:affixes, identified:true,
    attackElem: (level>=100) ? G.util.pick(G.DATA.ELEMENTS).key : null,   // 100층+ 룬 공격 속성
  };
  mergeStats(it);
  it.basePrice=priceOf(it, rdef, tier);
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
   🔗 룬워드 — 룬 3칸 조합으로 발동(순서 무관). 개별 룬 + 룬워드 % 보너스
   ============================================================ */
G.runeword = {};
G.runeword.equippedBases = function(){
  var eq=G.state.equipment, out=[];
  (G.DATA.RUNE_SLOTS||[]).forEach(function(k){ var it=eq[k]; if(it) out.push(it.runeBase||it.name); });
  return out;
};
function _multisetEq(a,b){
  if(a.length!==b.length) return false;
  var m={},i; for(i=0;i<a.length;i++) m[a[i]]=(m[a[i]]||0)+1;
  for(i=0;i<b.length;i++){ if(!m[b[i]]) return false; m[b[i]]--; }
  return true;
}
G.runeword.active = function(){
  var bases=G.runeword.equippedBases();
  if(bases.length < 3) return null;
  var ws=G.DATA.RUNEWORDS||[];
  for(var i=0;i<ws.length;i++){ if(_multisetEq(bases, ws[i].runes)) return ws[i]; }
  return null;
};
G.runeword.activeBonus = function(){ var w=G.runeword.active(); return w?w.bonus:null; };
/* 현재 발동 중인 룬워드를 연대기에 발견 등록(저장은 호출측에서) */
G.runeword.recordActive = function(){
  var w=G.runeword.active(); if(!w) return null;
  G.state.collection=G.state.collection||{}; G.state.collection.runewords=G.state.collection.runewords||{};
  G.state.collection.runewords[w.id]=true; return w;
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

/* 재련: 옵션(접사) 한 줄을 무작위로 교체 */
G.item.rerollCost = function(it){
  return { mat: Math.max(3, (G.DATA.SALVAGE[it.rarity]||1)), gold: Math.round((it.basePrice||50)*0.2) };
};
G.item.reroll = function(id){
  var it=G.state.inventory.find(function(x){return x.id===id;});
  if(!it) return;
  if(!it.identified){ G.ui.toast("감정 후 재련할 수 있습니다"); return; }
  if(!it.affixes || !it.affixes.length){ G.ui.toast("재련할 옵션이 없습니다"); return; }
  var cost=G.item.rerollCost(it);
  if((G.state.materials||0)<cost.mat){ G.ui.toast("재료 부족 (🔩"+cost.mat+")"); return; }
  if(G.state.player.gold<cost.gold){ G.ui.toast("골드 부족 (🪙"+G.ui.fmt(cost.gold)+")"); return; }
  G.state.materials-=cost.mat; G.state.player.gold-=cost.gold;

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

/* 확정 제작: 특정 옵션을 100% 보장(높은 값으로) 장착 */
G.item.forceAffix = function(it, stat){
  var af=G.DATA.AFFIXES.find(function(a){return a.stat===stat;});
  if(!af) return;
  var lvlMult=Math.pow(1.112, (it.level||1)-1);
  // 보장 옵션은 최대치 근처로 굴림 (부위 배율 반영)
  var hi = Math.max(1, Math.round((af.flat ? af.max*lvlMult : af.max) * slotMult(it.slot, stat)));
  var node={ stat:stat, value:hi, pct:!!af.pct, flat:!!af.flat };
  var ex=it.affixes.find(function(a){return a.stat===stat;});
  if(ex){ ex.value=Math.max(ex.value, hi); }
  else if(it.affixes.length){ it.affixes[0]=node; }
  else { it.affixes.push(node); }
  mergeStats(it);
  var rdef=G.DATA.RARITY.find(function(r){return r.key===it.rarity;});
  it.basePrice=priceOf(it, rdef, it.tier||1);
};

/* 분해 시 재료 산출 */
G.item.salvageYield = function(it){ return G.DATA.SALVAGE[it.rarity]||1; };

/* 스탯을 사람이 읽는 문자열로 (미감정은 가림) */
G.item.statText = function(it){
  if(it.identified===false) return "??? (미감정)";
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
