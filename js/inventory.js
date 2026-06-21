/* ============================================================
   인벤토리 — 추가 / 착용 / 판매(즉시) / 버리기
   ============================================================ */
var G = window.G;
G.inventory = {};

/* ── 창고(통합 저장소) 용량 — 종류별 칸(장비/룬/고유) ── */
G.inventory.CATS = [
  { key:"gear",   label:"⚔️ 장비", def:40 },
  { key:"rune",   label:"🔮 룬",   def:20 },
  { key:"unique", label:"🌟 고유", def:20 },
];
G.inventory.catOf = function(it){
  if(!it) return "gear";
  if(it.slot==="rune" || it.type==="rune") return "rune";
  if(it.rarity==="unique") return "unique";
  return "gear";
};
G.inventory.catLabel = function(cat){ var c=G.inventory.CATS.find(function(x){return x.key===cat;}); return c?c.label:cat; };
function invCapsOf(){
  if(!G.state.invCaps){ G.state.invCaps={}; G.inventory.CATS.forEach(function(c){ G.state.invCaps[c.key]=c.def; }); }   // 구버전 마이그레이션
  return G.state.invCaps;
}
G.inventory.cap     = function(cat){ return invCapsOf()[cat] || 0; };
G.inventory.countOf = function(cat){ return G.state.inventory.filter(function(it){ return G.inventory.catOf(it)===cat; }).length; };
G.inventory.totalCap= function(){ return G.inventory.CATS.reduce(function(s,c){ return s+G.inventory.cap(c.key); },0); };
/* 인자 있으면 해당 종류, 없으면 모든 종류가 가득일 때 true */
G.inventory.isFull = function(cat){
  if(cat) return G.inventory.countOf(cat) >= G.inventory.cap(cat);
  return G.inventory.CATS.every(function(c){ return G.inventory.countOf(c.key) >= G.inventory.cap(c.key); });
};
G.inventory.isFullFor = function(it){ return G.inventory.isFull(G.inventory.catOf(it)); };

G.inventory.add = function(it){
  if(G.inventory.isFullFor(it)){
    G.log("⚠️ "+G.inventory.catLabel(G.inventory.catOf(it))+" 창고가 가득 차 "+it.name+"을(를) 놓쳤다!","");
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
  if(G.inventory.isFullFor(it)){ G.ui.toast(G.inventory.catLabel(G.inventory.catOf(it))+" 창고가 가득 찼습니다"); return; }
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

/* 장착 슬롯 결정 (룬은 빈칸 우선, 꽉차면 가장 약한 룬칸) */
function targetSlot(it){
  if(it.slot!=="rune") return it.slot;
  var slots=G.DATA.RUNE_SLOTS, V=G.inventory.statValue;
  for(var i=0;i<slots.length;i++){ if(!G.state.equipment[slots[i]]) return slots[i]; }
  var minV=Infinity, ms=slots[0];
  slots.forEach(function(k){ var v=V(G.state.equipment[k].stats); if(v<minV){minV=v; ms=k;} });
  return ms;
}
/* 전투효과 변화량 — 아이템을 실제 장착했다고 가정하고 totalStats 재계산(캡·룬워드·균형 반영).
   반환 {delta, pct, cur}. 미감정은 null. */
G.inventory.upgradeInfo = function(it){
  if(!it || it.identified===false || !G.combat || !G.combat.effPower) return null;
  var eq=G.state.equipment, key=targetSlot(it);
  var cur=G.combat.effPower(G.totalStats());
  var prev=eq[key]; eq[key]=it;                       // 임시 장착
  var after=G.combat.effPower(G.totalStats());
  eq[key]=prev;                                       // 복원
  var delta=after-cur;
  return { delta:delta, pct:(cur>0?(after/cur-1)*100:0), cur:cur };
};
/* 비교: 착용 대비 전투효과 차이(정렬·▲▼용). 단순합 폴백 유지. */
G.inventory.compare = function(it){
  var u=G.inventory.upgradeInfo(it);
  if(u) return Math.round(u.delta);
  // 폴백(전투모듈 없을 때): 단순 가치합
  var V=G.inventory.statValue, cur=G.state.equipment[it.slot];
  return V(it.stats||{}) - (cur?V(cur.stats):0);
};

/* 창고 종류별 칸 확장 (+10칸, 확장할수록 비용 증가) */
G.inventory.capUpgradeCost = function(cat){ return G.inventory.cap(cat||"gear") * 15; };
G.inventory.upgradeCap = function(cat){
  cat=cat||"gear";
  var cost=G.inventory.capUpgradeCost(cat);
  if(G.state.player.gold<cost){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(cost)+")"); return; }
  G.state.player.gold-=cost; invCapsOf()[cat]+=10;
  G.log("📦 "+G.inventory.catLabel(cat)+" 칸 확장! 최대 "+invCapsOf()[cat]+"칸","r-uncommon");
};

/* 창고 즉시 매각(기준가의 10%) — quickSell 별칭 */
G.warehouse = { sell:function(id){ G.inventory.quickSell(id); } };
