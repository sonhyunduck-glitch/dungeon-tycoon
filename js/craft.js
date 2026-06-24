/* ============================================================
   대장간(확정 제작) + NPC 맞춤 주문(의뢰) + 워프 타겟
   ============================================================ */
var G = window.G;

/* 대장간 확정제작·룬제작 폐지 → 🎲 겜블([item.js] G.gamble)로 대체. */

/* ---------- NPC 맞춤 주문 ---------- */
G.orders = {};
G.orders.MAX = 3;
// 타입(part)별로 실제 굴릴 수 있는 pct 옵션 합집합(SLOT_AFFIXES 기반 → 룬전용·flat 자동 제외 → 이행 불가 주문 방지)
G.orders._slotsOf = { weapon:["weapon"], acc:["ring","necklace"], armor:["helmet","armor","gloves","boots"] };
G.orders.statPoolFor = function(part){
  var set={}, slots=G.orders._slotsOf[part]||[];
  slots.forEach(function(sl){ (G.DATA.SLOT_AFFIXES[sl]||[]).forEach(function(st){
    var m=G.DATA.STAT_META[st]; if(m && m.pct) set[st]=1;
  }); });
  return Object.keys(set);
};
G.orders.refresh = function(){
  var lvl=G.state.dungeon.maxFloor||1;
  var parts=["weapon","armor","acc"];
  var arr=[];
  for(var i=0;i<G.orders.MAX;i++){
    var part=G.util.pick(parts);
    var stat=G.util.pick(G.orders.statPoolFor(part));
    var rg=G.item.affixRange(stat);
    var minVal=G.util.rand(rg.min, Math.round((rg.min+rg.max)/2));
    var npc=G.util.pick(G.DATA.NPCS);
    var reward=Math.round((300+lvl*120) * Math.pow(1.06, lvl-1) * (1+Math.random()*0.5));
    arr.push({ id:G.util.uid(), npc:npc.name, emoji:npc.emoji, part:part, stat:stat, minVal:minVal, reward:reward });
  }
  G.state.orders=arr; G.state.lastOrders=Date.now();
};
G.orders.ensure = function(){ if(!G.state.orders || !G.state.orders.length) G.orders.refresh(); };

G.orders.match = function(order, it){
  return it.type===order.part && it.identified!==false && (it.stats[order.stat]||0) >= order.minVal;
};
/* 가방에서 조건 충족 아이템 자동 선택 후 납품 */
G.orders.fulfill = function(orderId){
  var oi=G.state.orders.findIndex(function(o){return o.id===orderId;});
  if(oi<0) return;
  var order=G.state.orders[oi];
  var match=G.state.inventory
    .filter(function(it){ return G.orders.match(order, it); })
    .sort(function(a,b){ return (b.stats[order.stat]||0)-(a.stats[order.stat]||0); })[0];
  if(!match){ G.ui.toast("조건에 맞는 아이템이 가방에 없습니다"); return; }
  G.inventory.remove(match.id);
  G.state.player.gold += order.reward;
  G.log("📋 주문 납품! "+order.npc+"에게 "+match.name+" 전달 → 🪙+"+G.ui.fmt(order.reward),"r-legend");
  G.state.orders.splice(oi,1);
  // 빈 자리 보충
  while(G.state.orders.length < G.orders.MAX){
    var lvl=G.state.dungeon.maxFloor||1;
    var parts=["weapon","armor","acc"];
    var part=G.util.pick(parts), stat=G.util.pick(G.orders.statPoolFor(part));
    var rg=G.item.affixRange(stat);
    var npc=G.util.pick(G.DATA.NPCS);
    G.state.orders.push({ id:G.util.uid(), npc:npc.name, emoji:npc.emoji, part:part, stat:stat,
      minVal:G.util.rand(rg.min, Math.round((rg.min+rg.max)/2)),
      reward:Math.round((300+lvl*120)*Math.pow(1.06,lvl-1)*(1+Math.random()*0.5)) });
  }
};

/* ---------- 워프 타겟: 옵션을 보장하는 보스가 있는 층 ---------- */
G.dungeon.floorForStat = function(stat){
  var bl=G.DATA.BOSS_SPECIES.length;
  var b=G.DATA.BOSS_SPECIES.findIndex(function(x){return x.gstat===stat;});
  var maxF=G.state.dungeon.maxFloor||1;
  if(b<0) return maxF;
  var best=0;
  for(var f=1; f<=maxF; f++){ if(Math.floor((f-1)/10)%bl===b) best=f; }
  return best || 1;
};

/* 부위 한글 라벨 */
G.partLabel = function(part){ return {weapon:"무기", armor:"방어구", acc:"장신구"}[part]||part; };
