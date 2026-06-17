/* ============================================================
   특성(자동화 기능) — 해금 / 토글 / 전리품 라우팅
   ============================================================ */
var G = window.G;
G.perks = {};

G.perks.def = function(id){ return G.DATA.PERKS.find(function(p){return p.id===id;}); };
G.perks.isUnlocked = function(id){ return !!(G.state.perks && G.state.perks.unlocked[id]); };
G.perks.isOn = function(id){ return G.perks.isUnlocked(id) && !!G.state.perks.enabled[id]; };

G.perks.meetsReq = function(id){
  var d=G.perks.def(id); if(!d || !d.req) return true;
  if(d.req.floor && (G.state.dungeon.maxFloor||1) < d.req.floor) return false;
  return true;
};

G.perks.unlock = function(id){
  var d=G.perks.def(id);
  if(!d || G.perks.isUnlocked(id)) return;
  if(!G.perks.meetsReq(id)){ G.ui.toast(d.req.floor+"층을 먼저 해금하세요"); return; }
  if(G.state.player.gold < d.cost){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(d.cost)+")"); return; }
  G.state.player.gold -= d.cost;
  G.state.perks.unlocked[id]=true;
  G.state.perks.enabled[id]=true; // 해금 시 기본 ON
  G.log("✨ 특성 해금: "+d.name, "r-legend");
};

/* 층 클리어 보상 해금: freeFloor 층을 클리어했으면 무료 해금 */
G.perks.syncFree = function(){
  if(!G.state.perks) return [];
  var fresh=[];
  G.DATA.PERKS.forEach(function(d){
    if(d.freeFloor && !G.state.perks.unlocked[d.id] && G.state.dungeon.clearedFloors[d.freeFloor]){
      G.state.perks.unlocked[d.id]=true;
      G.state.perks.enabled[d.id]=true;
      G.log("✨ "+d.freeFloor+"층 클리어 보상 — 특성 「"+d.name+"」 해금!","r-legend");
      fresh.push({ ico:d.ico, name:d.name, desc:d.desc, sub:"자동화 · "+d.freeFloor+"층" });
    }
  });
  return fresh;
};

G.perks.toggle = function(id){
  if(!G.perks.isUnlocked(id)) return;
  G.state.perks.enabled[id]=!G.state.perks.enabled[id];
  G.log((G.state.perks.enabled[id]?"🔛 ":"⭕ ")+G.perks.def(id).name+(G.state.perks.enabled[id]?" 켜짐":" 꺼짐"),"");
};

/* 전리품 처리: 등급필터 → 자동진열 → 가방 순으로 라우팅 */
G.perks.routeLoot = function(it){
  // 등급별 획득 필터: 꺼진 등급은 줍지 않음(폐기)
  if(G.state.pickup && G.state.pickup[it.rarity]===false){ return; }
  // 자동 진열 — 착용 장비보다 못한(같거나 낮은) 감정템만 진열, 빈 진열대 있을 때
  if(G.perks.isOn("auto_list") && it.identified!==false && it.type!=="consumable"){
    var diff=G.inventory.compare(it);   // >0 = 착용보다 좋음(업그레이드) → 가방에 남김
    if(diff!==null && diff<=0 && G.shop.placeItem(it)){
      G.log("🛒 자동 진열: "+it.name+" (🪙"+G.ui.fmt(it.basePrice)+")", it.rarityCls);
      return;
    }
  }
  // 기본: 가방
  if(G.inventory.add(it)){
    G.log("🎁 획득: ["+it.rarityLabel+"] "+it.name, it.rarityCls);
  }
};
