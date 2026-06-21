/* ============================================================
   전리품 정산 — 미정산(runLoot) 누적 / 추천 판정 / 휴대 예산 / 정산 적용
   무게는 "정산 화면의 휴대 예산"으로만 사용(기존 가방/창고는 그대로).
   ============================================================ */
var G = window.G;
G.loot = {};

G.loot.weightOf = function(it){ return G.item.weightOf(it); };
G.loot.list     = function(){ return (G.state.dungeon && G.state.dungeon.runLoot) || []; };
G.loot.count    = function(){ return G.loot.list().length; };
G.loot.pending  = function(){ return G.loot.count() > 0; };
G.loot.totalWeight = function(){ return G.loot.list().reduce(function(s,it){ return s+G.loot.weightOf(it); },0); };

/* 휴대 예산(무게) — 사망 시 절반 */
G.loot.carryCap = function(dead){ var c=(G.DATA.CARRY_CAP||30); return dead ? Math.floor(c/2) : c; };
G.loot.isDead   = function(){ return !!(G.state.dungeon && G.state.dungeon.run && G.state.dungeon.run.dead); };

/* 아이템 판정 → 정산 화면 배지 */
G.loot.verdict = function(it){
  if(it.identified===false) return { key:"id",   label:"❓ 미감정",        cls:"r-epic" };
  var u = G.inventory.upgradeInfo ? G.inventory.upgradeInfo(it) : null;
  if(u && u.pct>=0.5)          return { key:"up",   label:(u.pct>=200?"▲ 대폭 착용↑":"▲ "+u.pct.toFixed(0)+"% 착용↑"), cls:"r-uncommon", pct:u.pct };
  var sellGold = G.item.sellPrice(it);
  if((it.basePrice||0)>=80)    return { key:"sell", label:"💰 "+G.ui.fmt(sellGold), cls:"gold" };
  return { key:"salv", label:"🔧 분해", cls:"muted" };
};
/* 추천 처리(keep/sell/salvage) */
G.loot.suggest = function(it){
  var v=G.loot.verdict(it);
  return (v.key==="up"||v.key==="id") ? "keep" : (v.key==="sell" ? "sell" : "salvage");
};

/* 누적 상한 초과분 자동매각 — 최저가치부터(업그레이드·미감정 보호) */
G.loot.enforceCap = function(){
  var loot=G.loot.list(); var cap=(G.DATA.RUN_LOOT_CAP||60);
  function w(){ return loot.reduce(function(s,it){ return s+G.loot.weightOf(it); },0); }
  function score(it){
    var u = it.identified!==false && G.inventory.upgradeInfo ? G.inventory.upgradeInfo(it) : null;
    if(u && u.delta>0)        return 1e9 + u.delta;        // 업그레이드 = 마지막까지 보호
    if(it.identified===false) return 1e6 + (it.basePrice||0); // 미감정 보호
    return (it.basePrice||0);                              // 그 외 기준가 낮은 것부터
  }
  var guard=0;
  while(w()>cap && loot.length && guard++<500){
    var wi=0, ws=Infinity;
    for(var i=0;i<loot.length;i++){ var s=score(loot[i]); if(s<ws){ ws=s; wi=i; } }
    var it=loot.splice(wi,1)[0];
    var g=G.item.sellPrice(it); G.state.player.gold+=g;
    G.log("📤 창고가 넘쳐 "+it.name+" 자동 판매 🪙+"+G.ui.fmt(g),"");
  }
};

/* 추천 자동 선별 — 챙김 후보(업그레이드·미감정)를 가치순으로 예산(cap)까지 채우고 나머지는 추천 처리 */
function keepScore(it){
  var u = it.identified!==false && G.inventory.upgradeInfo ? G.inventory.upgradeInfo(it) : null;
  if(u && u.pct>0)          return 1e6 + u.pct*1000;
  if(it.identified===false) return 5e5 + (it.basePrice||0);
  return (it.basePrice||0);
}
G.loot.autoDisp = function(cap){
  cap = (cap==null) ? G.loot.carryCap(G.loot.isDead()) : cap;
  var disp={}, keepCands=[];
  G.loot.list().forEach(function(it){
    var s=G.loot.suggest(it);
    if(s==="keep") keepCands.push(it); else disp[it.id]=s;
  });
  keepCands.sort(function(a,b){ return keepScore(b)-keepScore(a); });
  var w=0;
  keepCands.forEach(function(it){
    var wt=G.loot.weightOf(it);
    if(w+wt<=cap){ disp[it.id]="keep"; w+=wt; }
    else { disp[it.id]="sell"; }   // 예산 초과 → 매각
  });
  return disp;
};

/* 정산 적용 — disp: {itemId: "keep"|"sell"|"salvage"} (없으면 추천) */
G.loot.applySettle = function(disp){
  disp=disp||{};
  var loot=G.loot.list().slice();
  var kept=0, sold=0, soldGold=0, mats=0;
  loot.forEach(function(it){
    var d = disp[it.id] || G.loot.suggest(it);
    if(d==="keep"){
      if(G.inventory.add(it)){ kept++; }
      else { var g=G.item.sellPrice(it); G.state.player.gold+=g; soldGold+=g; sold++; } // 창고 가득 → 매각
    } else if(d==="salvage"){
      var m=G.item.salvageYield(it); G.state.materials=(G.state.materials||0)+m; mats+=m;
    } else { // sell
      var gg=G.item.sellPrice(it); G.state.player.gold+=gg; soldGold+=gg; sold++;
    }
  });
  G.state.dungeon.runLoot=[];
  var parts=[]; if(kept)parts.push("🎒 "+kept); if(sold)parts.push("💰 "+G.ui.fmt(soldGold)); if(mats)parts.push("🔩 "+mats);
  G.log("📦 전리품 정산: "+(parts.join(" · ")||"없음"),"r-uncommon");
  return { kept:kept, sold:sold, gold:soldGold, mats:mats };
};
