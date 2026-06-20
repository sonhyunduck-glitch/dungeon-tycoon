/* ============================================================
   인벤토리 — 추가 / 착용 / 판매(즉시) / 버리기
   ============================================================ */
var G = window.G;
G.inventory = {};

G.inventory.isFull = function(){ return G.state.inventory.length >= G.state.invMax; };

G.inventory.add = function(it){
  if(G.inventory.isFull()){
    // 가방이 가득 차면 창고로 자동 보관 (창고에 여유가 있을 때)
    if(G.state.warehouse && !G.warehouse.isFull()){
      G.state.warehouse.items.push(it);
      G.log("📦 가방이 가득 차 "+it.name+"을(를) 창고에 보관","");
      return true;
    }
    G.log("⚠️ 가방·창고가 가득 차 "+it.name+"을(를) 놓쳤다!","");
    return false;
  }
  G.state.inventory.push(it);
  return true;
};

G.inventory.remove = function(id){
  var i=G.state.inventory.findIndex(function(x){return x.id===id;});
  if(i>=0) return G.state.inventory.splice(i,1)[0];
  return null;
};

/* 착용 — 기존 장비는 가방으로 */
G.inventory.equip = function(id){
  var it=G.state.inventory.find(function(x){return x.id===id;});
  if(!it || it.type==="consumable") return;
  if(it.identified===false){ G.ui.toast("감정이 필요합니다"); return; }
  var key=it.slot;                       // slot이 곧 장비 칸 (weapon/.../ring/necklace)
  if(key==="rune"){                      // 룬: 빈 룬 슬롯 우선, 없으면 가장 약한 룬 교체
    var slots=G.DATA.RUNE_SLOTS, found=null;
    for(var r=0;r<slots.length;r++){ if(!G.state.equipment[slots[r]]){ found=slots[r]; break; } }
    if(found){ key=found; }
    else {
      var minV=Infinity, minSlot=slots[0];
      slots.forEach(function(k){ var v=G.inventory.statValue(G.state.equipment[k].stats); if(v<minV){ minV=v; minSlot=k; } });
      key=minSlot;
    }
  }
  var prev=G.state.equipment[key];
  G.inventory.remove(id);
  G.state.equipment[key]=it;
  if(prev) G.state.inventory.push(prev);
  G.log("🧷 착용: "+it.name, it.rarityCls);
};

/* 장비 해제 */
G.inventory.unequip = function(key){
  var it=G.state.equipment[key];
  if(!it) return;
  if(G.inventory.isFull()){ G.ui.toast("가방이 가득 찼습니다"); return; }
  G.state.equipment[key]=null;
  G.state.inventory.push(it);
  G.log("➖ 해제: "+it.name,"");
};

/* 즉시 판매(상점 거치지 않고 빠른 매각, 기준가의 10%) */
G.inventory.quickSell = function(id){
  var it=G.inventory.remove(id);
  if(!it) return;
  var price=Math.round((it.basePrice||0)*0.1);   // 매각가 = 기준가치의 10%
  G.state.player.gold+=price;
  G.log("💰 즉시판매: "+it.name+" → 🪙"+G.ui.fmt(price),"");
};

G.inventory.discard = function(id){
  var it=G.inventory.remove(id);
  if(it) G.log("🗑️ 버림: "+it.name,"");
};

/* 분해 → 재료 (미감정도 가능) */
G.inventory.salvage = function(id){
  var it=G.inventory.remove(id);
  if(!it) return;
  var mat=G.item.salvageYield(it);
  G.state.materials=(G.state.materials||0)+mat;
  G.log("🔨 분해: "+it.name+" → 🔩 재료 +"+mat,"");
};

/* 스탯 종합 가치 (전투력 가중치와 동일) */
G.inventory.statValue = function(s){
  s=s||{};
  return (s.atk||0)*2 + (s.def||0)*1.5 + (s.hp||0)*0.25
    + (s.crit||0)*1.5 + (s.critDmg||0)*0.5 + (s.lifesteal||0)*2 + (s.dodge||0)*2
    + (s.penet||0) + (s.multihit||0)*2 + (s.goldFind||0)*0.3 + (s.thorns||0) + (s.stunResist||0)*0.3
    + (s.elemAtk||0)*1 + ((s.resFire||0)+(s.resCold||0)+(s.resLight||0)+(s.resPoison||0))*0.4 + (s.allRes||0)*1.6
    + (s.shopSlot||0)*15 + (s.mercFind||0)*0.5 + (s.potionBoost||0)*0.5;
};

/* 비교: 착용 대비 가치 차이 (룬은 빈슬롯이면 순증, 꽉차면 가장 약한 룬 대비) */
G.inventory.compare = function(it){
  var V=G.inventory.statValue;
  if(it.type==="rune"){
    var slots=G.DATA.RUNE_SLOTS;
    var hasEmpty=slots.some(function(k){return !G.state.equipment[k];});
    if(hasEmpty) return V(it.stats);                // 빈 칸 → 순수 증가
    var weakest=Math.min.apply(null, slots.map(function(k){return V(G.state.equipment[k].stats);}));
    return V(it.stats) - weakest;                   // 가장 약한 룬과 비교
  }
  var cur = G.state.equipment[it.slot];
  return V(it.stats) - (cur?V(cur.stats):0);
};

/* 가방 확장 (업그레이드 1회당 +1칸, 확장할수록 비용 급증) */
G.inventory.bagUpgradeCost = function(){ return Math.round(500 * Math.pow(1.4, Math.max(0, G.state.invMax-20))); };
G.inventory.upgradeBag = function(){
  var cost=G.inventory.bagUpgradeCost();
  if(G.state.player.gold<cost){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(cost)+")"); return; }
  G.state.player.gold-=cost; G.state.invMax+=1;
  G.log("🎒 가방 확장! 최대 "+G.state.invMax+"칸","r-uncommon");
};

/* ============================================================
   창고 — 보관 / 꺼내기 / 매각 / 확장
   ============================================================ */
G.warehouse = {};
G.warehouse.isFull = function(){ return G.state.warehouse.items.length >= G.state.warehouse.max; };

/* 가방 → 창고 */
G.warehouse.store = function(id){
  if(G.warehouse.isFull()){ G.ui.toast("창고가 가득 찼습니다"); return; }
  var it=G.inventory.remove(id); if(!it) return;
  G.state.warehouse.items.push(it);
  G.log("📦 창고 보관: "+it.name, it.rarityCls);
};

/* 창고 → 가방 */
G.warehouse.retrieve = function(id){
  if(G.inventory.isFull()){ G.ui.toast("가방이 가득 찼습니다"); return; }
  var i=G.state.warehouse.items.findIndex(function(x){return x.id===id;});
  if(i<0) return;
  var it=G.state.warehouse.items.splice(i,1)[0];
  G.state.inventory.push(it);
  G.log("🎒 창고에서 꺼냄: "+it.name, it.rarityCls);
};

/* 창고에서 즉시 매각 (기준가 50%) */
G.warehouse.sell = function(id){
  var i=G.state.warehouse.items.findIndex(function(x){return x.id===id;});
  if(i<0) return;
  var it=G.state.warehouse.items.splice(i,1)[0];
  var price=Math.round(it.basePrice*0.1);   // 매각가 = 기준가치의 10%
  G.state.player.gold+=price;
  G.log("💰 창고 매각: "+it.name+" → 🪙"+G.ui.fmt(price),"");
};

/* 창고 확장 (+10칸) */
G.warehouse.upgradeCost = function(){ return G.state.warehouse.max * 15; };
G.warehouse.upgrade = function(){
  var cost=G.warehouse.upgradeCost();
  if(G.state.player.gold<cost){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(cost)+")"); return; }
  G.state.player.gold-=cost; G.state.warehouse.max+=10;
  G.log("📦 창고 확장! 최대 "+G.state.warehouse.max+"칸","r-uncommon");
};
