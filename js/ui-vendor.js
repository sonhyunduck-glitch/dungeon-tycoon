/* ui-vendor.js — 상점/대장간 탭. */
var G = window.G;

G.ui.renderVendor = function(){
  var v=el("view-vendor");
  var sub=G.state.ui.vendorSub||"potion";
  var subTabs=[["potion","🧪 물약"],["gamble","🎲 겜블"],["cube","🧊 큐브"],["gacha","🎰 아바타뽑기"]];
  var tabBar='<div class="subtabs">'+subTabs.map(function(t){
    return '<button class="subtab'+(sub===t[0]?" active":"")+'" data-act="vendor-sub" data-sub="'+t[0]+'">'+t[1]+'</button>';
  }).join("")+'</div>';
  var body = sub==="potion" ? G.ui._potionShop() : sub==="gamble" ? G.ui._gamble() : sub==="cube" ? G.ui._cubePanel() : G.ui._gachaPanel();
  v.innerHTML = tabBar + body;
  if(sub==="gacha"){   // 도감 미리보기 애니메이션(잠긴 건 정적)
    v.querySelectorAll(".av-prev-inner").forEach(function(el){
      var card=el.closest(".avatar-card"); if(card && card.classList.contains("locked")) return;
      G.avatar.animatePreview(el);
    });
  }
};

/* 소모품(물약) 탭 */
G.ui._potionShop = function(){
  var pot=G.state.consumables.potion_s||0;
  var max=G.state.potionMax||20;
  var price=G.potionPrice(); // 회복 HP당 1골드
  var gold=G.state.player.gold;
  var full=pot>=max;
  var can1=!full && gold>=price;
  var maxQty=Math.max(0, Math.min(max-pot, Math.floor(gold/Math.max(1,price))));
  var canMax=!full && maxQty>0;
  var potCls = full?"r-legend":"muted";
  // 전체 회복 — 즉시 풀회복(회복 HP당 1골드). 부활 후 10%→100% 복구를 한 번에.
  var st=G.totalStats(), hp=G.state.player.hp, missing=Math.max(0, st.maxHp-hp);
  var healCost=missing, canHeal=missing>0 && gold>=healCost;
  var hpPct=Math.round(hp/Math.max(1,st.maxHp)*100);
  return '<div class="panel theme-shop"><h2>🧪 물약 상점</h2>'+
      '<div class="muted">보유 골드 🪙'+G.ui.fmt(gold)+'</div>'+
    '</div>'+
    '<div class="panel">'+
      '<div class="item"><div class="ico">❤️</div>'+
        '<div class="info">'+
          '<div class="iname">전체 회복 <span class="'+(missing>0?"r-uncommon":"r-legend")+'">'+G.ui.fmt(hp)+' / '+G.ui.fmt(st.maxHp)+' ('+hpPct+'%)</span></div>'+
          '<div class="idesc">'+(missing>0
              ? '즉시 체력을 가득 채웁니다 · 🪙'+G.ui.fmt(healCost)+' <span class="muted">(회복 HP당 1골드)</span>'
              : '<span class="r-legend">체력이 가득 찼습니다</span>')+'</div>'+
        '</div>'+
        '<div class="iacts">'+
          '<button class="btn sm primary" data-act="heal-full" '+(canHeal?"":"disabled")+'>❤️ 전체 회복</button>'+
        '</div>'+
      '</div>'+
      '<div class="item"><div class="ico">🧪</div>'+
        '<div class="info">'+
          '<div class="iname">체력 물약 <span class="'+potCls+'">'+pot+' / '+max+'</span></div>'+
          '<div class="idesc">구매 시 회복 +'+G.ui.fmt(G.potionHealAmount())+' (최대체력 '+G.potionHealPct()+'%) · 개당 🪙'+G.ui.fmt(price)+(full?' · <span class="r-legend">소지 한도</span>':'')+'<br>보유 물약 회복 +'+G.ui.fmt(G.state.consumables.potionHeal||0)+'</div>'+
        '</div>'+
        '<div class="iacts">'+
          '<button class="btn sm primary" data-act="buy-potion" data-qty="1" '+(can1?"":"disabled")+'>+1</button>'+
          '<button class="btn sm gold" data-act="buy-potion" data-qty="max" '+(canMax?"":"disabled")+'>MAX ×'+maxQty+' 🪙'+G.ui.fmt(price*maxQty)+'</button>'+
        '</div>'+
      '</div>'+
      '<div class="muted" style="margin-top:8px">💡 전체 회복은 즉시 풀회복(부활·소모전 후 편리), 물약은 전투 중 사용분 비축용. 둘 다 회복 HP당 1골드.</div>'+
    '</div>';
};

/* 🎲 겜블 — 부위 선택 → 골드로 랜덤 아이템 구매(즉시 감정) */
G.ui._gamble = function(){
  var lvl=G.gamble.level(), gold=G.state.player.gold;
  var rows=G.gamble.PARTS.map(function(p){
    var cost=G.gamble.cost(p.key), ok=gold>=cost;
    return '<div class="item">'+
      '<div class="ico">'+p.ico+'</div>'+
      '<div class="info"><div class="iname">'+p.label+'</div>'+
        '<div class="idesc">'+lvl+'층 수준 랜덤 장비 · 즉시 감정</div></div>'+
      '<div class="iacts"><button class="btn sm '+(ok?"primary":"")+'" data-act="gamble-buy" data-part="'+p.key+'" '+(ok?"":"disabled")+'>🪙'+G.ui.fmt(cost)+'</button></div>'+
    '</div>';
  }).join("");
  return '<div class="panel"><h3>🎲 겜블 <span class="muted" style="font-size:.66rem">현재 '+lvl+'층 기준</span></h3>'+
    '<div class="muted" style="font-size:.74rem; margin-bottom:8px">골드로 랜덤 장비를 구매합니다. 등급·소켓은 사냥 드랍과 동일 확률, <b class="r-unique">낮은 확률로 고유</b>도! (환불 불가)</div>'+
    rows+'</div>'+
    '<div class="panel"><div class="muted" style="font-size:.78rem">🔮 룬은 사냥 드랍으로 획득해 <b>장비 소켓</b>에 장착합니다. (창고 🔮 탭 → 소켓 장착)</div></div>';
};

/* 🧊 호라드릭 큐브 — 룬 승급(하위 3개 → 상위 1개) */
G.ui._cubePanel = function(){
  var R=G.DATA.RUNES;
  var rows=R.filter(function(r){return r.rank<R.length;}).map(function(r){
    var cnt=G.cube.count(r.rank), ok=cnt>=G.cube.RATIO, next=R[r.rank];
    return '<div class="item'+(ok?" r-uncommon":"")+'" '+(ok?'':'style="opacity:.6"')+'>'+
      '<div class="ico">'+(r.iconImg?'<img class="icoimg" src="'+r.iconImg+'">':'🔹')+'</div>'+
      '<div class="info"><div class="iname">'+esc(r.name)+' <span class="muted">×'+cnt+'</span> → <b class="'+G.item.runeRarity(next.rank).cls+'">'+esc(next.name)+'</b></div>'+
        '<div class="idesc">'+G.cube.RATIO+'개 → 1개 승급</div></div>'+
      '<div class="iacts"><button class="btn sm '+(ok?"primary":"")+'" data-act="cube-upgrade" data-rank="'+r.rank+'" '+(ok?"":"disabled")+'>승급</button></div>'+
    '</div>';
  }).join("");
  var top=R[R.length-1];
  return '<div class="panel"><h3>🧊 호라드릭 큐브 <span class="muted" style="font-size:.66rem">룬 승급 '+G.cube.RATIO+':1</span></h3>'+
    '<div class="muted" style="font-size:.74rem; margin-bottom:8px">같은 룬 '+G.cube.RATIO+'개를 합쳐 상위 룬으로 승급합니다. 최상위 「'+esc(top.name)+'」은 승급 불가. <b class="r-common">소켓에 박은 룬은 뺄 수 없으니</b> 승급 후 장착하세요.</div>'+
    rows+'</div>';
};

/* ============================================================
   시장 검색소 뷰 — NPC 상인 매물 검색 / 급매물 되팔이 / 키워드 알림
   ============================================================ */
