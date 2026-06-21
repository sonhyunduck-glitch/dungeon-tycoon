/* ui-shop.js — 가판대(상점) 탭. */
var G = window.G;

G.ui.renderShop = function(){
  var v=el("view-shop");
  G.shop.ensureCapacity();
  G.shop.autoStock();   // 진입 시 빈 자리 보충
  var sh=G.state.shop;
  var used=sh.slots.filter(Boolean).length;

  var slots=sh.slots.map(function(slot,i){
    if(!slot){ return '<div class="stall-slot empty">＋<br><span>빈 자리</span></div>'; }
    var it=slot.item;
    var ratio=slot.price/it.basePrice;
    var hint = ratio<=1?'<span class="r-uncommon">잘 팔림</span>':(ratio<=1.3?'<span class="gold">보통</span>':(ratio<=1.5?'<span style="color:var(--hp)">비쌈</span>':'<span style="color:var(--hp)">거의 안 팔림</span>'));
    return '<div class="stall-slot '+it.rarityCls+'">'+
      '<div class="stall-ico">'+G.ui.icoHTML(it)+'</div>'+
      '<div class="stall-name '+it.rarityCls+'">'+esc(it.name)+'</div>'+
      '<div class="stall-opt">'+G.item.statText(it)+'</div>'+
      '<div class="stall-hint">기준 🪙'+G.ui.fmt(it.basePrice)+' · '+hint+'</div>'+
      '<button class="pricetag" data-act="price-edit" data-idx="'+i+'" title="가격 설정">🪙 '+G.ui.fmt(slot.price)+'</button>'+
      '<button class="btn sm stall-recall" data-act="unlist" data-idx="'+i+'">회수</button>'+
    '</div>';
  }).join("");

  v.innerHTML=
    '<div class="stall">'+
      '<div class="stall-awning"></div>'+
      '<div class="stall-board">'+
        '<div class="stall-title">🛒 내 가판대</div>'+
        '<div class="stall-meta">💰 누적매출 <b class="gold">'+G.ui.fmt(sh.earnings)+'</b> · 진열 '+used+'/'+sh.slots.length+'칸</div>'+
      '</div>'+
      (function(){
        var promo=G.state.promo||{tickets:0,until:0}, active=G.shop.promoActive();
        var ms=G.shop.promoLeftMs(), m=Math.floor(ms/60000), sec=Math.floor(ms/1000)%60;
        var tk=promo.tickets||0, dis=tk>0?"":"disabled";
        return '<div class="stall-promo'+(active?" on":"")+'">'+
          (active
            ? '📣 <b>홍보 중</b> · 손님 ×'+G.shop.PROMO_MULT+' · 남은 <b id="promo-timer">'+m+':'+("0"+sec).slice(-2)+'</b>'
              + '<button class="btn sm" style="margin-left:auto" data-act="promote" '+dis+'>연장 🎫'+tk+'</button>'
            : '📣 가판대 홍보 <span class="muted" style="font-weight:400">30분 손님×'+G.shop.PROMO_MULT+'·구매율↑</span>'
              + '<button class="btn sm gold" style="margin-left:auto" data-act="promote" '+dis+'>홍보하기 🎫'+tk+'</button>'
          )+'</div>';
      })()+
      '<div class="stall-counter">'+slots+'</div>'+
      '<div class="stall-foot">가격표를 눌러 값을 정하세요. 손님은 <b>쌀수록 잘 삽니다</b>. 진열은 창고 탭의 [진열] 버튼으로.</div>'+
    '</div>';
};

/* 손님 방명록 */
G.ui._guestbook = function(){
  var gb=G.state.shop.guestbook||[];
  if(gb.length===0) return '<div class="panel"><h3>📖 손님 방명록</h3><div class="muted">아직 손님이 없습니다. 가판대에 물건을 올려보세요!</div></div>';
  var rows=gb.slice(0,12).map(function(g){
    return '<div class="item" style="border-left-color:var(--glass-brd)">'+
      '<div class="ico">'+g.emoji+'</div>'+
      '<div class="info">'+
        '<div class="iname" style="font-size:.82rem">'+esc(g.npc)+' <span class="muted" style="font-weight:400">— '+esc(g.comment)+'</span></div>'+
        '<div class="idesc"><span class="'+g.rarityCls+'">'+esc(g.item)+'</span> 🪙'+G.ui.fmt(g.price)+'</div>'+
      '</div>'+
    '</div>';
  }).join("");
  return '<div class="panel"><h3>📖 손님 방명록</h3>'+rows+'</div>';
};

/* NPC 맞춤 주문 (의뢰) */
G.ui._orders = function(){
  G.orders.ensure();
  var rows=(G.state.orders||[]).map(function(o){
    var lbl=G.DATA.STAT_META[o.stat].label, wf=G.dungeon.floorForStat(o.stat);
    var can=G.state.inventory.some(function(it){return G.orders.match(o,it);});
    return '<div class="item" style="border-left-color:var(--glass-brd)">'+
      '<div class="ico">'+o.emoji+'</div>'+
      '<div class="info">'+
        '<div class="iname" style="font-size:.82rem">'+esc(o.npc)+'의 주문</div>'+
        '<div class="idesc">'+G.partLabel(o.part)+' · <span class="warp" data-act="warp" data-floor="'+wf+'">#'+lbl+'</span> '+o.minVal+(G.DATA.STAT_META[o.stat].pct?"%":"")+'+ 이상 · 보상 🪙'+G.ui.fmt(o.reward)+'</div>'+
      '</div>'+
      '<div class="iacts"><button class="btn sm '+(can?"primary":"")+'" data-act="order-fulfill" data-id="'+o.id+'" '+(can?"":"disabled")+'>납품</button></div>'+
    '</div>';
  }).join("");
  return '<div class="panel"><h3>📋 NPC 맞춤 주문</h3>'+rows+
    '<div class="muted" style="margin-top:6px">조건을 충족하는 창고 속 아이템이 자동 납품됩니다. (#옵션 클릭 → 사냥터 워프, 대장간으로 맞춤 제작)</div></div>';
};

/* ============================================================
   상점 뷰 (NPC 상점 — 물약 등 소모품 구매)
   ============================================================ */
