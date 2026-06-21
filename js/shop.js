/* ============================================================
   상점 타이쿤 — 진열 / 가격설정 / 손님(방치) 판매 / 확장
   ============================================================ */
var G = window.G;
G.shop = {};

G.shop.slotCount = function(){ return G.state.shop.slots.length; };

/* 가판대 칸 = 기본 5 + 장비/룬의 가판대칸 옵션 합 */
G.shop.capacity = function(){ return 5 + (G.totalStats().shopSlot||0); };
G.shop.ensureCapacity = function(){
  var cap=G.shop.capacity();
  while(G.state.shop.slots.length<cap) G.state.shop.slots.push(null);
};

/* 아이템 객체를 빈 진열대에 직접 배치 (성공 시 true) */
G.shop.placeItem = function(it){
  G.shop.ensureCapacity();
  var slots=G.state.shop.slots;
  var idx=slots.indexOf(null);
  if(idx<0) return false;
  slots[idx]={ item:it, price:it.basePrice }; // 기본 권장가 = 기준가
  return true;
};

/* 자동 진열 보충 — 빈 가판대 칸을 가방의 '착용보다 못한 감정템'으로 채움 */
G.shop.autoStock = function(){
  if(!G.perks.isOn("auto_list")) return 0;
  var slots=G.state.shop.slots, filled=0;
  for(var i=0;i<slots.length;i++){
    if(slots[i]) continue;
    var idx=-1, found=null;
    for(var j=0;j<G.state.inventory.length;j++){
      var it=G.state.inventory[j];
      if(it.identified===false || it.type==="consumable" || it.locked) continue;   // 잠긴 아이템 제외
      var diff=G.inventory.compare(it);
      if(diff!==null && diff<=0){ found=it; idx=j; break; }   // 착용보다 못한 것만
    }
    if(!found) break;   // 더 올릴 게 없음
    G.state.inventory.splice(idx,1);
    slots[i]={ item:found, price:found.basePrice };
    G.log("🛒 자동 진열: "+found.name+" (🪙"+G.ui.fmt(found.basePrice)+")", found.rarityCls);
    filled++;
  }
  return filled;
};

/* 인벤토리 → 진열대 등록 */
G.shop.list = function(invId){
  var it=G.state.inventory.find(function(x){return x.id===invId;});
  if(!it) return;
  if(it.identified===false){ G.ui.toast("감정 후 진열할 수 있습니다"); return; }
  if(G.state.shop.slots.indexOf(null)<0){ G.ui.toast("가판대가 가득 찼습니다"); return; }
  G.inventory.remove(invId);
  G.shop.placeItem(it);
  G.log("🛒 진열: "+it.name+" (권장가 🪙"+G.ui.fmt(it.basePrice)+")", it.rarityCls);
};

/* 아이템의 대표 옵션 라벨 (퍼센트 옵션 우선) */
function topOptLabel(item){
  var keys=G.DATA.STAT_KEYS, i;
  for(i=0;i<keys.length;i++){ if(item.stats[keys[i]] && G.DATA.STAT_META[keys[i]].pct) return G.DATA.STAT_META[keys[i]].label; }
  for(i=0;i<keys.length;i++){ if(item.stats[keys[i]]) return G.DATA.STAT_META[keys[i]].label; }
  return "옵션";
}
/* 방명록 기록 (구매 NPC 위트 댓글) */
function addGuest(npc, item, price){
  var gb=G.state.shop.guestbook || (G.state.shop.guestbook=[]);
  var floor=G.state.dungeon.maxFloor||1;
  var comment=G.util.pick(G.DATA.GUEST_COMMENTS)
    .replace(/\{floor\}/g, floor)
    .replace(/\{opt\}/g, topOptLabel(item))
    .replace(/\{item\}/g, item.name);
  gb.unshift({
    npc:npc.name, emoji:npc.emoji,
    item:item.name, rarityCls:item.rarityCls, price:price, comment:comment,
  });
  if(gb.length>30) gb.pop();
}

/* 진열 회수 → 가방 */
G.shop.unlist = function(slotIdx){
  var slot=G.state.shop.slots[slotIdx];
  if(!slot) return;
  if(G.inventory.isFullFor(slot.item)){ G.ui.toast(G.inventory.catLabel(G.inventory.catOf(slot.item))+" 창고가 가득 찼습니다"); return; }
  G.state.inventory.push(slot.item);
  G.state.shop.slots[slotIdx]=null;
  G.log("↩️ 진열 회수: "+slot.item.name,"");
};

G.shop.setPrice = function(slotIdx, price){
  var slot=G.state.shop.slots[slotIdx];
  if(!slot) return;
  slot.price=Math.max(1, Math.floor(price)||1);
};

/* 손님 구매 판정: 가격이 기준가 대비 쌀수록 구매확률↑
   기준가 이하 → 거의 구매 / 기준가의 2배 → 거의 안 삼 */
function buyChance(slot){
  var ratio = slot.price / slot.item.basePrice; // 1.0 = 기준가
  // 기본가 이하 → 잘 팔림(0.9). 초과분 10%마다 0.15씩 감소 → 점점 안 팔림
  // 1.0→0.9, 1.1→0.75, 1.2→0.6, 1.3→0.45, 1.4→0.3, 1.5→0.15, 1.6+→거의 0
  var c = (ratio<=1.0) ? 0.9 : (0.9 - (ratio-1.0)*1.5);
  if(G.shop.promoActive()) c += 0.12;   // 홍보 중 구매율↑
  return G.util.clamp(c, 0.02, 0.97);
}

/* ---------- 가판대 홍보 (이용권 소비 → 일정 시간 손님 ×N + 구매율↑) ---------- */
G.shop.PROMO_DURATION = 30*60*1000;   // 이용권 1장 = 30분(실시간, 방치 포함)
G.shop.PROMO_MULT = 3;                // 홍보 중 손님 방문 배수
G.shop.promoActive = function(){ return ((G.state.promo&&G.state.promo.until)||0) > Date.now(); };
G.shop.promoLeftMs = function(){ return Math.max(0, ((G.state.promo&&G.state.promo.until)||0) - Date.now()); };
G.shop.promoMult = function(){ return G.shop.promoActive() ? G.shop.PROMO_MULT : 1; };
/* 마일스톤 보상(이용권) — checkUnlocks에서 호출. 신규 지급분을 모달용 배열로 반환 */
G.shop.grantMilestones = function(){
  if(!G.state.promo) G.state.promo={tickets:0, until:0, f100:false};
  var fresh=[];
  if((G.state.dungeon.maxFloor||1) >= 100 && !G.state.promo.f100){
    G.state.promo.f100=true;
    G.state.promo.tickets=(G.state.promo.tickets||0)+1;
    G.log("🎫 첫 100층 달성! 가판대 홍보 이용권 +1","r-legend");
    fresh.push({ ico:"🎫", name:"홍보 이용권 +1", desc:"첫 100층 달성 보상 — 가판대에서 사용", sub:"보상" });
  }
  return fresh;
};
G.shop.promote = function(){
  if(!G.state.promo) G.state.promo={tickets:0, until:0};
  if((G.state.promo.tickets||0) <= 0){ G.ui.toast("홍보 이용권이 없습니다 🎫"); return false; }
  G.state.promo.tickets--;
  var now=Date.now();
  G.state.promo.until = Math.max(now, G.state.promo.until||0) + G.shop.PROMO_DURATION;   // 연장(스택)
  G.log("📣 가판대 홍보 시작! 30분간 손님 ×"+G.shop.PROMO_MULT+" · 구매율↑","r-legend");
  return true;
};

/* 손님 한 명 방문 시뮬레이션 (틱마다 호출) → 판매 시 판매가, 아니면 0
   silent=true면 로그 생략(방치 정산용) */
G.shop.visitTick = function(silent){
  var slots=G.state.shop.slots.filter(function(s){return s;});
  if(slots.length===0) return 0;
  var slot=G.util.pick(slots);
  if(Math.random() < buyChance(slot)){
    var idx=G.state.shop.slots.indexOf(slot);
    var npc=G.util.pick(G.DATA.NPCS);
    G.state.player.gold += slot.price;
    G.state.shop.earnings += slot.price;
    addGuest(npc, slot.item, slot.price);
    G.state.shop.slots[idx]=null;
    if(!silent) G.log(npc.emoji+" "+npc.name+"이(가) "+slot.item.name+" 구매! 🪙+"+G.ui.fmt(slot.price),"r-uncommon");
    return slot.price;
  }
  // 손님 빼앗기: 너무 비싸면 손님이 다른 상인에게 이동
  if(!silent && slot.price > slot.item.basePrice*1.4 && Math.random()<0.25){
    var h=G.util.pick(G.DATA.NPCS), m=G.util.pick(G.DATA.MERCHANTS);
    G.log("📢 시장 알림: "+h.name+"이(가) 가격에 실망하여 "+m+"에게 이동했습니다.","");
  }
  return 0;
};

/* 방치 정산: 마지막 방문 이후 경과시간만큼 손님 시도 → {sold, gold} */
G.shop.settleIdle = function(){
  var now=Date.now();
  var idleStart=(G.state.shop.lastVisit||now);   // 방치 시작 시각(갱신 전)
  var elapsed=(now - idleStart)/1000;
  G.state.shop.lastVisit=now;
  if(elapsed<5) return {sold:0, gold:0};
  var mercMult = 1 + (G.totalStats().mercFind||0)/100;   // 손님 방문율 옵션 → 손님 더 많이
  // 방치 구간 중 홍보 활성 시간만큼 손님 배수 가중
  var promoUntil=(G.state.promo&&G.state.promo.until)||0;
  var activeSec = promoUntil>idleStart ? Math.max(0, Math.min(now, promoUntil)-idleStart)/1000 : 0;
  activeSec = Math.min(activeSec, elapsed);
  var weighted = (elapsed - activeSec) + activeSec*G.shop.PROMO_MULT;   // 홍보 구간 ×배수
  var ticks=(weighted/15) * G.state.shop.level * mercMult;
  ticks=Math.min(Math.floor(ticks), 500); // 과도 방지 캡
  var sold=0, gold=0;
  for(var i=0;i<ticks;i++){ var p=G.shop.visitTick(true); if(p>0){ sold++; gold+=p; } }
  if(sold>0) G.log("⏳ 자리를 비운 사이 손님 "+sold+"명이 다녀갔습니다. 🪙+"+G.ui.fmt(gold),"r-uncommon");
  return {sold:sold, gold:gold};
};

/* 진열대 확장 (골드 소비) */
G.shop.expandCost = function(){ return G.state.shop.slots.length * 150; };
G.shop.expand = function(){
  var cost=G.shop.expandCost();
  if(G.state.player.gold<cost){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(cost)+")"); return; }
  G.state.player.gold-=cost;
  G.state.shop.slots.push(null);
  G.log("🏗️ 진열대 확장! (슬롯 "+G.state.shop.slots.length+"개)","r-uncommon");
};

/* 상점 등급업: 손님 빈도(틱 가속)↑ */
G.shop.levelCost = function(){ return G.state.shop.level * 400; };
G.shop.levelUp = function(){
  var cost=G.shop.levelCost();
  if(G.state.player.gold<cost){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(cost)+")"); return; }
  G.state.player.gold-=cost;
  G.state.shop.level++;
  G.log("⭐ 상점 등급 "+G.state.shop.level+"! 손님이 더 자주 옵니다.","r-legend");
};
