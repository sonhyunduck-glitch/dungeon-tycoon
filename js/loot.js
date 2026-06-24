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

/* 휴대 예산(무게) — 사망 여부와 무관하게 항상 전체(사망 ½ 페널티 제거) */
G.loot.carryCap = function(){ return (G.DATA.CARRY_CAP||30); };
G.loot.isDead   = function(){ return !!(G.state.dungeon && G.state.dungeon.run && G.state.dungeon.run.dead); };

/* 챙길 가치 점수 — 업그레이드 > 미감정 > 기준가(반출 후 매각가치) */
function keepScore(it){
  var u = it.identified!==false && G.inventory.upgradeInfo ? G.inventory.upgradeInfo(it) : null;
  if(u && u.pct>0)          return 1e9 + u.pct*1000;
  if(it.identified===false) return 5e8 + (it.basePrice||0);
  return (it.basePrice||0);
}

/* 아이템 판정 → 정산 화면 배지(챙길 가치 안내). 챙기지 않으면 삭제됨 */
G.loot.verdict = function(it){
  if(it.identified===false) return { key:"id", label:"❓ 미감정", cls:"r-epic" };
  var u = G.inventory.upgradeInfo ? G.inventory.upgradeInfo(it) : null;
  if(u && u.pct>=0.5)       return { key:"up", label:(u.pct>=200?"▲ 대폭 착용↑":"▲ "+u.pct.toFixed(0)+"% 착용↑"), cls:"r-uncommon", pct:u.pct };
  if((it.basePrice||0)>=80) return { key:"val", label:"💰 "+G.ui.fmt(G.item.sellPrice(it)), cls:"gold" };   // 반출 후 매각 시 가치
  return { key:"low", label:"· 잡템", cls:"muted" };
};

/* 누적 상한(개수) 초과분 폐기 — 정산 전까지 계속 누적, 한계 초과 시에만 최저가치부터 삭제(안전장치) */
G.loot.enforceCap = function(){
  var loot=G.loot.list(); var max=(G.DATA.RUN_LOOT_MAX||400);
  var guard=0;
  while(loot.length>max && guard++<2000){
    var wi=0, ws=Infinity;
    for(var i=0;i<loot.length;i++){ var s=keepScore(loot[i]); if(s<ws){ ws=s; wi=i; } }
    var it=loot.splice(wi,1)[0];
    G.log("🗑️ 미정산 전리품이 "+max+"개를 넘어 "+it.name+" 폐기","");
  }
};

/* 추천 자동 선별 — 가치순으로 예산(cap)까지 챙기고 나머지는 폐기 */
G.loot.autoDisp = function(cap){
  cap = (cap==null) ? G.loot.carryCap(G.loot.isDead()) : cap;
  var disp={};
  var items = G.loot.list().slice().sort(function(a,b){ return keepScore(b)-keepScore(a); });
  var w=0;
  items.forEach(function(it){
    var wt=G.loot.weightOf(it);
    if(w+wt<=cap){ disp[it.id]="keep"; w+=wt; }
    else { disp[it.id]="discard"; }   // 예산 초과 → 폐기
  });
  return disp;
};

/* 정산 적용 — disp: {itemId:"keep"}. 챙긴 것만 창고로 반출, 나머지는 삭제 */
G.loot.applySettle = function(disp){
  disp=disp||{};
  var loot=G.loot.list().slice();
  var kept=0, lost=0;
  loot.forEach(function(it){
    if(disp[it.id]==="keep" && G.inventory.add(it)){ kept++; }   // 종류 칸 가득이면 반출 실패 → 폐기
    else { lost++; }                                             // 챙기지 않음 → 삭제
  });
  G.state.dungeon.runLoot=[];
  var parts=[]; if(kept)parts.push("🎒 "+kept+" 반출"); if(lost)parts.push("🗑️ "+lost+" 폐기");
  G.log("📦 전리품 정산: "+(parts.join(" · ")||"없음"),"r-uncommon");
  return { kept:kept, lost:lost };
};
