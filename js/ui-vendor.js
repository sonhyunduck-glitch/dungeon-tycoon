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
    '</div>'+
    G.ui._speedAdPanel();
};

/* ⏩ 배속 광고 상품 — 당일 누적 시청 횟수로 배속 단계 상승(무제한) */
G.ui._speedAdPanel = function(){
  var avail=G.ads && G.ads.available();
  var n=(G.ads && G.ads.ensure().counts.speed)||0;          // 오늘 시청 횟수
  var next=(G.ads && G.ads.speedFor)?G.ads.speedFor(n+1):{tier:2,mins:15};   // 다음 시청 시
  var leftMs=G.speedBuffLeftMs?G.speedBuffLeftMs():0, tier=G.maxSpeed();
  var status = leftMs>0
    ? '<div class="idesc r-legend">현재 ⏩ '+tier+'배속 적용 중 · 남은 '+Math.ceil(leftMs/60000)+'분</div>'
    : '<div class="idesc">광고를 보면 자동전투 속도가 빨라집니다 (평소 1배속)</div>';
  var btn = !avail
    ? '<button class="btn sm" disabled>앱에서만 가능</button>'
    : '<button class="btn sm primary" data-act="ad-speed">🎬 광고 보고 ⏩ '+next.tier+'배속 '+next.mins+'분</button>';
  return '<div class="panel"><h2>⏩ 배속 (광고)</h2>'+
    '<div class="item"><div class="ico">⏩</div>'+
      '<div class="info"><div class="iname">자동전투 배속 <span class="muted" style="font-size:.66rem">오늘 '+n+'회</span></div>'+
        '<div class="idesc">누적 시청: <b>1~3회 2배</b> · <b>4~10회 3배</b> · <b class="r-legend">11회+ 4배</b> (지속 각 15분)</div>'+
        status+
      '</div>'+
      '<div class="iacts">'+btn+'</div>'+
    '</div></div>';
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

/* 🧊 큐브 — 룬합성 | 룬워드 서브탭 */
G.ui._cubePanel = function(){
  var sub=G.state.ui.cubeSub||"fuse";
  var tabs=[["fuse","🧊 룬합성"],["word","🔗 룬워드"]];
  var bar='<div class="subtabs" style="margin-bottom:8px">'+tabs.map(function(t){
    return '<button class="subtab'+(sub===t[0]?" active":"")+'" data-act="cube-sub" data-sub="'+t[0]+'">'+t[1]+'</button>';
  }).join("")+'</div>';
  return bar + (sub==="word" ? G.ui._cubeRunewordPanel() : G.ui._cubeFusePanel());
};

/* 🔗 룬워드 제작 — 소켓템 선택 → 빈 소켓에 룬 담기 → 확정(영구) */
G.ui._cubeRunewordPanel = function(){
  var ui=G.state.ui;
  // 소켓이 있고 빈 소켓이 1개 이상인 아이템(가방+착용)
  var pool=[];
  (G.state.inventory||[]).forEach(function(it){ if(it.sockets && G.socket.openCount(it)>0) pool.push({it:it,where:"가방"}); });
  var eq=G.state.equipment||{};
  for(var k in eq){ var e=eq[k]; if(e && e.sockets && G.socket.openCount(e)>0) pool.push({it:e,where:"착용"}); }

  var sel=ui.rwItem ? (pool.filter(function(p){return p.it.id===ui.rwItem;})[0]) : null;
  if(!sel){ if(ui.rwItem){ ui.rwItem=null; ui.rwPick=[]; } }   // 선택템이 사라짐

  // ── 아이템 미선택: 목록 ──
  if(!sel){
    if(!pool.length) return '<div class="panel"><h3>🔗 룬워드 제작</h3>'+
      '<div class="empty">빈 소켓이 있는 장비가 없습니다.<br><span class="muted">사냥/겜블로 <b class="r-socket">소켓 베이스</b>를 구하세요.</span></div></div>';
    var rows=pool.map(function(p){ var it=p.it;
      return '<button data-act="rw-pick-item" data-id="'+it.id+'" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;background:rgba(255,255,255,.04);border-radius:8px;padding:8px 10px;margin-top:6px;cursor:pointer;color:inherit">'+
        '<span style="font-size:1.3rem;flex:0 0 auto">'+G.ui.icoHTML(it)+'</span>'+
        '<span style="flex:1;min-width:0">'+
          '<span class="iname '+(it.rarityCls||"")+'" style="display:block">'+esc(it.name)+' <span class="muted" style="font-size:.62rem">'+p.where+'</span></span>'+
          '<span style="display:flex;align-items:center;gap:6px;margin-top:4px">'+G.ui.socketBoxes(it)+'<span class="muted" style="font-size:.72rem">'+G.socket.openCount(it)+'칸 비어있음</span></span>'+
        '</span>'+
        '<span class="muted" style="flex:0 0 auto;font-size:.74rem">선택 ▸</span></button>';
    }).join("");
    return '<div class="panel"><h3>🔗 룬워드 제작 <span class="muted" style="font-size:.66rem">소켓템 선택</span></h3>'+
      '<div class="muted" style="font-size:.74rem;margin-bottom:8px">소켓에 룬을 담아 <b>확정</b>하면 조합이 맞는 경우 룬워드가 완성됩니다. <b class="r-common">한번 박은 룬은 뺄 수 없습니다.</b></div>'+
      rows+'</div>';
  }

  // ── 아이템 선택됨: 룬 담기 ──
  var it=sel.it, isW=(it.type==="weapon");
  var open=G.socket.openCount(it);
  var picks=(ui.rwPick||[]).map(function(rid){ return (G.state.inventory||[]).find(function(x){return x.id===rid;}); }).filter(Boolean);
  if(picks.length>open) picks=picks.slice(0,open);
  // 소켓 시각화: 기존 룬 + staged + 빈칸
  var staged=picks.slice(), socks=it.sockets.map(function(r){
    if(r) return '<span class="sock filled" title="'+esc(r.name)+'">'+(r.iconImg?'<img src="'+r.iconImg+'">':'🔹')+'</span>';
    if(staged.length){ var s=staged.shift(); return '<span class="sock filled staged" title="'+esc(s.name)+'(대기)">'+(s.iconImg?'<img src="'+s.iconImg+'">':'🔹')+'</span>'; }
    return '<span class="sock empty"></span>';
  }).join("");
  // staged 칩(탭하면 빼기)
  var chips = picks.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">'+picks.map(function(s,i){
      return '<button class="btn sm" data-act="rw-unpick" data-idx="'+i+'" title="빼기">'+(s.iconImg?'<img class="fico" src="'+s.iconImg+'" style="width:16px;height:16px;vertical-align:middle">':'🔹')+' '+esc(s.name)+' ✕</button>';
    }).join("")+'</div>' : '<div class="muted" style="font-size:.74rem;margin:8px 0">아래 룬을 탭해 소켓에 담으세요.</div>';
  // 미리보기
  var pv=G.runeword.previewWith(it, picks);
  var preview = picks.length<open
    ? '<div class="idesc muted">룬을 '+(open-picks.length)+'개 더 담으면 결과를 확인합니다.</div>'
    : (pv ? '<div class="rw-active" style="color:var(--gold)">🔗 <b class="r-legend">'+pv.ico+' '+esc(pv.name)+'</b> 완성! <span class="idesc">'+G.ui.rwBonusTxt(pv)+'</span></div>'
          : '<div class="idesc muted">조합 일치 룬워드 없음 — <span class="r-common">개별 룬 효과만</span> 적용됩니다.</div>');
  // 보유 룬(이미 담은 건 제외)
  var pickedIds={}; (ui.rwPick||[]).forEach(function(id){ pickedIds[id]=1; });
  var runes=(G.state.inventory||[]).filter(function(x){ return x.slot==="rune" && !pickedIds[x.id]; }).sort(function(a,b){return (b.rank||0)-(a.rank||0);});
  var full=picks.length>=open;
  var runeList = full ? '<div class="muted" style="font-size:.72rem">소켓을 모두 채웠습니다. 확정하세요.</div>'
    : (runes.length ? runes.map(function(r){
        return '<button class="btn full" style="text-align:left;margin-top:5px;display:flex;align-items:center;gap:8px" data-act="rw-pick-rune" data-id="'+r.id+'">'+
          (r.iconImg?'<img class="fico" src="'+r.iconImg+'">':'🔹')+'<span style="flex:1"><b class="'+r.rarityCls+'">'+esc(r.name)+'</b><br><span class="idesc">'+G.item.statText(r)+'</span></span><span class="muted" style="font-size:.7rem">담기 ▸</span></button>';
      }).join("") : '<div class="empty">보유한 룬이 없습니다.<br><span class="muted">사냥에서 룬을 획득하세요.</span></div>');

  return '<div class="panel">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+
      '<button class="btn sm" data-act="rw-pick-item" data-id="">‹ 목록</button>'+
      '<h3 style="margin:0">'+G.ui.icoHTML(it)+' '+esc(it.name)+'</h3></div>'+
    '<div class="muted" style="font-size:.72rem">'+(isW?'무기 — 룬의 ⚔️ 공격 효과':'방어구 — 룬의 🛡️ 방어 효과')+' 적용</div>'+
    '<div class="rw-socks">'+socks+'</div>'+
    chips + preview +
    '<button class="btn full '+(picks.length?"primary":"")+'" style="margin-top:8px" data-act="rw-commit" '+(picks.length?"":"disabled")+'>✅ 확정 ('+picks.length+'/'+open+' 영구 장착)</button>'+
  '</div>'+
  '<div class="panel"><div class="muted" style="font-size:.74rem;margin-bottom:4px">보유 룬</div>'+runeList+'</div>';
};

/* 🧊 룬합성 — 룬 승급(하위 3개 → 상위 1개) */
G.ui._cubeFusePanel = function(){
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
  return '<div class="panel"><h3>🧊 큐브 <span class="muted" style="font-size:.66rem">룬 승급 '+G.cube.RATIO+':1</span></h3>'+
    '<div class="muted" style="font-size:.74rem; margin-bottom:8px">같은 룬 '+G.cube.RATIO+'개를 합쳐 상위 룬으로 승급합니다. 최상위 「'+esc(top.name)+'」은 승급 불가. <b class="r-common">소켓에 박은 룬은 뺄 수 없으니</b> 승급 후 장착하세요.</div>'+
    rows+'</div>';
};

/* ============================================================
   시장 검색소 뷰 — NPC 상인 매물 검색 / 급매물 되팔이 / 키워드 알림
   ============================================================ */
