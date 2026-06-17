/* ============================================================
   대장간(확정 제작) + NPC 맞춤 주문(의뢰) + 워프 타겟
   ============================================================ */
var G = window.G;

/* ---------- 대장간 ---------- */
G.forge = {};
G.forge.MAT_COST = 8;
G.forge.goldCost = function(){
  var lvl=G.state.dungeon.maxFloor||1;
  return Math.round(200 * Math.pow(1.08, lvl-1));
};
G.forge.craft = function(bossName, part){
  var boss=G.DATA.BOSS_SPECIES.find(function(b){return b.name===bossName;});
  if(!boss) return;
  var have=(G.state.monMats||{})[bossName]||0;
  if(have < G.forge.MAT_COST){ G.ui.toast(boss.mat+"이(가) 부족합니다 ("+have+"/"+G.forge.MAT_COST+")"); return; }
  var gold=G.forge.goldCost();
  if(G.state.player.gold < gold){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(gold)+")"); return; }
  if(G.inventory.isFull() && G.warehouse.isFull()){ G.ui.toast("가방·창고가 가득 찼습니다"); return; }

  G.state.monMats[bossName]-=G.forge.MAT_COST;
  G.state.player.gold-=gold;

  var it=G.item.generate(3, G.state.dungeon.maxFloor||1, part); // 희귀급 기반
  G.item.forceAffix(it, boss.gstat);   // 보장 옵션 100% 장착
  it.identified=true;
  G.inventory.add(it);
  G.log("🔨 제작 완성: ["+it.rarityLabel+"] "+it.name+" — "+G.DATA.STAT_META[boss.gstat].label+" 보장!", it.rarityCls);
};

/* ---------- 룬 제작 (🔩 재료 + 골드) — 공격·수호·치명·파멸·흡혈·관통·질풍 ----------
   🔩 재료는 아이템 분해(salvage)로 획득. 층이 오를수록 룬 베이스가 강해지므로 재료 비용도 증가 */
G.forge.RUNE_MAT_BASE = 4;
G.forge.runeMatCost = function(){
  var lvl=G.state.dungeon.maxFloor||1;
  return G.forge.RUNE_MAT_BASE + Math.floor((lvl-1)/10)*2;   // 10층 구간마다 +2 (1~10층:4, 100층:22, 1000층:202)
};
G.forge.runeGoldCost = function(){
  var lvl=G.state.dungeon.maxFloor||1;
  return Math.round(150 * Math.pow(1.07, lvl-1));
};
G.forge.craftRune = function(baseName){
  var base=G.DATA.RUNE_BASES.find(function(b){return b.base===baseName && b.craft;});
  if(!base) return;
  var matCost=G.forge.runeMatCost(), gold=G.forge.runeGoldCost();
  if((G.state.materials||0) < matCost){ G.ui.toast("🔩 재료가 부족합니다 ("+(G.state.materials||0)+"/"+matCost+")"); return; }
  if(G.state.player.gold < gold){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(gold)+")"); return; }
  if(G.inventory.isFull() && G.warehouse.isFull()){ G.ui.toast("가방·창고가 가득 찼습니다"); return; }
  G.state.materials -= matCost;
  G.state.player.gold -= gold;
  var it=G.item.generateRune(3, G.state.dungeon.maxFloor||1, baseName);
  it.identified=true;
  G.inventory.add(it);
  G.log("🔨 룬 제작 완성: ["+it.rarityLabel+"] "+it.name+" ("+G.DATA.STAT_META[base.main].label+")", it.rarityCls);
};

/* ---------- NPC 맞춤 주문 ---------- */
G.orders = {};
G.orders.MAX = 3;
G.orders.refresh = function(){
  var lvl=G.state.dungeon.maxFloor||1;
  var parts=["weapon","armor","acc"];
  var statPool=G.DATA.STAT_KEYS.filter(function(k){return G.DATA.STAT_META[k].pct;});
  var arr=[];
  for(var i=0;i<G.orders.MAX;i++){
    var part=G.util.pick(parts);
    var stat=G.util.pick(statPool);
    var af=G.DATA.AFFIXES.find(function(a){return a.stat===stat;});
    var minVal=G.util.rand(af.min, Math.round((af.min+af.max)/2));
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
  G.state.materials = (G.state.materials||0) + 3;
  G.log("📋 주문 납품! "+order.npc+"에게 "+match.name+" 전달 → 🪙+"+G.ui.fmt(order.reward)+" · 🔩+3","r-legend");
  G.state.orders.splice(oi,1);
  // 빈 자리 보충
  while(G.state.orders.length < G.orders.MAX){
    var lvl=G.state.dungeon.maxFloor||1;
    var parts=["weapon","armor","acc"], statPool=G.DATA.STAT_KEYS.filter(function(k){return G.DATA.STAT_META[k].pct;});
    var part=G.util.pick(parts), stat=G.util.pick(statPool);
    var af=G.DATA.AFFIXES.find(function(a){return a.stat===stat;});
    var npc=G.util.pick(G.DATA.NPCS);
    G.state.orders.push({ id:G.util.uid(), npc:npc.name, emoji:npc.emoji, part:part, stat:stat,
      minVal:G.util.rand(af.min, Math.round((af.min+af.max)/2)),
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
