/* ui-inventory.js — 가방/창고 탭. ui-tabs.js에서 분리. 헬퍼는 ui.js 전역. */
var G = window.G;

G.ui.renderInventory = function(){
  var v=el("view-inventory");
  var sub=G.state.ui.invSub||"bag";
  var inv=G.state.inventory, wh=G.state.warehouse;
  var bagFullCls = G.inventory.isFull() ? "r-legend" : "";
  var whFullCls  = G.warehouse.isFull() ? "r-legend" : "";

  var tabs='<div class="row" style="margin-bottom:10px">'+
    '<button class="btn sm '+(sub==="bag"?"primary":"")+'" data-act="inv-sub" data-sub="bag" style="flex:1">🎒 가방 <span class="'+bagFullCls+'">'+inv.length+'/'+G.state.invMax+'</span></button>'+
    '<button class="btn sm '+(sub==="warehouse"?"primary":"")+'" data-act="inv-sub" data-sub="warehouse" style="flex:1">📦 창고 <span class="'+whFullCls+'">'+wh.items.length+'/'+G.warehouse.totalCap()+'</span></button>'+
  '</div>';

  v.innerHTML = tabs + (sub==="bag" ? G.ui._bagPanel() : G.ui._warehousePanel());
};

G.ui._bagPanel = function(){
  var inv=G.state.inventory;
  var pot=G.state.consumables.potion_s||0;
  var full=G.inventory.isFull();
  var sort=G.state.ui.bagSort||"price";
  var sortLabel={price:"가격↓", recent:"획득순", power:"가치↓", upgrade:"업그레이드↑"}[sort];
  // 필터(부위별 / 옵션별)
  var fslot=G.state.ui.bagFilterSlot||"all", fstat=G.state.ui.bagFilterStat||"all";
  // 부위 필터 — 장비 아이콘 칩(이모지 대신 실제 아이콘 이미지)
  var SLOT_ICONDIR={ weapon:"weapon_sword", helmet:"helmet", armor:"armor", gloves:"gloves", boots:"boots", ring:"ring", necklace:"necklace" };
  function slotChipInner(k){
    if(k==="all") return '<span class="chiptext">전체</span>';
    if(k==="rune") return '<img class="fico" src="assets/icon/runs/1.PNG" alt="룬">';
    var dir=SLOT_ICONDIR[k], list=G.DATA.EQUIP_ICONS&&G.DATA.EQUIP_ICONS[dir];
    if(list&&list.length) return '<img class="fico" src="assets/icon/equip/'+dir+'/'+list[0]+'" alt="">';
    return '<span class="chiptext">❔</span>';
  }
  var slotChips='<div class="slotchips">'+["all","weapon","helmet","armor","gloves","boots","ring","necklace","rune"].map(function(k){
    return '<button class="slotchip'+(fslot===k?' active':'')+'" data-act="bag-filter-slot" data-slot="'+k+'" title="'+(SLOT_LABELS[k]||(k==="rune"?"룬":"전체"))+'">'+slotChipInner(k)+'</button>';
  }).join("")+'</div>';
  // 옵션 필터 — 네이티브 select 팝업이 구형 WebView(LDPlayer)에서 흰색으로 떠서, 다크 모달 선택창 버튼으로 대체
  var statLabel = fstat==="all" ? "전체 옵션" : ((G.DATA.STAT_META[fstat]&&G.DATA.STAT_META[fstat].label)||"옵션");
  var statBtn='<button class="btn sm bagstat-btn'+(fstat!=="all"?" gold":"")+'" data-act="bag-stat-pick">🏷️ '+esc(statLabel)+' ▾</button>';
  var filtered = fslot!=="all" || fstat!=="all";
  var head='<div class="panel"><h2>🎒 가방 <span class="muted '+(full?"r-legend":"")+'">('+inv.length+' / '+G.state.invMax+')</span></h2>'+
    '<div class="row" style="margin-bottom:8px; align-items:center">'+
      '<button class="btn sm gold" data-act="bag-upgrade">가방 확장 +1칸 🪙'+G.ui.fmt(G.inventory.bagUpgradeCost())+'</button>'+
      '<button class="btn sm" data-act="bag-sort">정렬: '+sortLabel+'</button>'+
      '<span class="muted" style="margin-left:auto">🔩 재료 <b>'+G.ui.fmt(G.state.materials||0)+'</b></span>'+
    '</div>'+
    '<div class="bagfilter-wrap" style="margin-bottom:8px">'+
      slotChips +
      '<div class="row" style="margin-top:6px; align-items:center">'+ statBtn +
        (filtered?'<button class="btn sm" data-act="bag-filter-clear">초기화</button>':'')+
      '</div>'+
    '</div>'+
    (full?'<div class="muted r-legend" style="margin-bottom:8px">⚠️ 가방이 가득 찼습니다. 이후 전리품은 창고로 자동 보관됩니다.</div>':'')+
    '<div class="item"><div class="ico">🧪</div><div class="info"><div class="iname">체력 물약 <span class="muted">'+pot+' / '+(G.state.potionMax||20)+'</span></div><div class="idesc">개당 회복 +'+G.ui.fmt(G.state.consumables.potionHeal||G.potionHealAmount())+' (구매 시 고정)</div></div>'+
    '<div class="iacts"><button class="btn sm" data-act="use-potion" '+(pot<=0?"disabled":"")+'>사용</button></div></div></div>';

  if(inv.length===0) return head+'<div class="empty">가방이 비어 있습니다.<br>던전에서 사냥해 보세요!</div>';

  var whFull=G.warehouse.isFull();
  var sorted=inv.slice();
  if(sort==="price") sorted.sort(function(a,b){ return (b.basePrice||0)-(a.basePrice||0); });
  else if(sort==="power") sorted.sort(function(a,b){ return G.inventory.statValue(b.stats||{})-G.inventory.statValue(a.stats||{}); });
  else if(sort==="upgrade"){   // 착용 장비 대비 가치 차이↓ (업그레이드가 위로, 미감정은 맨 아래)
    var up=function(it){ return it.identified===false ? -1e12 : (G.inventory.compare(it)||0); };
    sorted.sort(function(a,b){ return up(b)-up(a); });
  }
  // 필터: 부위(slot) + 옵션(stat). 옵션 필터는 감정된 아이템만(미감정은 옵션 미공개)
  sorted=sorted.filter(function(it){
    if(fslot!=="all" && it.slot!==fslot) return false;
    if(fstat!=="all"){ if(it.identified===false) return false; if(!(it.stats && it.stats[fstat]>0)) return false; }
    return true;
  });
  if(!sorted.length) return head+'<div class="empty">필터 결과가 없습니다.<br><span class="muted">부위/옵션을 바꾸거나 초기화하세요.</span></div>';
  var items=sorted.map(function(it){
    // 미감정 아이템
    if(it.identified===false){
      var cost=G.item.identifyCost(it);
      return '<div class="item '+it.rarityCls+'">'+
        '<div class="ico">❓</div>'+
        '<div class="info"><div class="iname '+it.rarityCls+'">미감정 장비 <span class="tag">'+it.rarityLabel+'</span></div>'+
          '<div class="idesc">감정하면 옵션이 공개됩니다</div></div>'+
        '<div class="iacts">'+
          '<button class="btn sm primary" data-act="identify" data-id="'+it.id+'" title="감정">감정 🪙'+G.ui.fmt(cost)+'</button>'+
          '<button class="btn sm" data-act="salvage" data-id="'+it.id+'" title="분해">분해</button>'+
        '</div></div>';
    }
    // 감정된 장비 — 전투효과(공격×생존) 변화율로 추천
    var up=G.inventory.upgradeInfo(it);
    var diffTxt = !up ? '' : (up.pct>=0.5?'<span class="r-uncommon" title="전투효과">▲'+(up.pct>=200?'대폭':up.pct.toFixed(0)+'%')+'</span>':(up.pct<=-0.5?'<span class="r-common" title="전투효과">▼'+Math.abs(up.pct).toFixed(0)+'%</span>':'<span class="muted">=</span>'));
    var rc=G.item.rerollCost(it);
    var acts=
      '<button class="btn sm primary" data-act="equip" data-id="'+it.id+'">착용 '+diffTxt+'</button>'+
      '<button class="btn sm gold" data-act="list" data-id="'+it.id+'" title="가판대 진열">진열</button>'+
      '<button class="btn sm" data-act="store" data-id="'+it.id+'" '+(G.warehouse.isFullFor(it)?"disabled":"")+' title="창고 보관">보관</button>'+
      '<button class="btn sm" data-act="reroll" data-id="'+it.id+'" title="재련: 옵션 한 줄 무작위 변경 (🔩'+rc.mat+' 🪙'+G.ui.fmt(rc.gold)+')">재련</button>'+
      '<button class="btn sm" data-act="salvage" data-id="'+it.id+'" title="분해 → 재료">분해</button>'+
      '<button class="btn sm" data-act="quicksell" data-id="'+it.id+'" title="즉시 매각">매각 🪙'+G.ui.fmt(Math.round(it.basePrice*0.1))+'</button>';
    return itemCard(it, acts);
  }).join("");
  return head+'<div class="panel">'+items+'</div>';
};

G.ui._warehousePanel = function(){
  var wh=G.state.warehouse;
  var cat=G.state.ui.whCat||"gear";
  if(!G.warehouse.CATS.some(function(c){return c.key===cat;})) cat="gear";
  // 종류 칩(장비/룬/고유) — 각 칸 사용량 표시
  var chips=G.warehouse.CATS.map(function(c){
    var n=G.warehouse.countOf(c.key), cap=G.warehouse.cap(c.key);
    return '<button class="btn sm '+(cat===c.key?"primary":"")+'" data-act="wh-cat" data-cat="'+c.key+'" style="flex:1">'+c.label+
      ' <span class="'+(n>=cap?"r-legend":"muted")+'">'+n+'/'+cap+'</span></button>';
  }).join("");
  var head='<div class="panel"><h2>📦 창고</h2>'+
    '<div class="muted" style="font-size:.74rem">종류별로 칸이 나뉩니다. 가방이 차면 해당 종류 칸에 자동 보관됩니다.</div>'+
    '<div class="row" style="margin-top:8px;gap:5px">'+chips+'</div>'+
    '<div class="row" style="margin-top:8px"><button class="btn sm gold" data-act="wh-upgrade" data-cat="'+cat+'">'+
      G.warehouse.catLabel(cat)+' 칸 +10 🪙'+G.ui.fmt(G.warehouse.upgradeCost(cat))+'</button></div></div>';

  var items=wh.items.filter(function(it){ return G.warehouse.catOf(it)===cat; });
  if(items.length===0) return head+'<div class="empty">이 종류의 창고가 비어 있습니다.</div>';

  var bagFull=G.inventory.isFull();
  var rows=items.map(function(it){
    var acts=
      '<button class="btn sm primary" data-act="retrieve" data-id="'+it.id+'" '+(bagFull?"disabled":"")+'>🎒 꺼내기</button>'+
      '<button class="btn sm" data-act="wh-sell" data-id="'+it.id+'">매각 🪙'+G.ui.fmt(Math.round(it.basePrice*0.1))+'</button>';
    return itemCard(it, acts);
  }).join("");
  return head+'<div class="panel">'+rows+'</div>';
};

/* ============================================================
   캐릭터 뷰
   ============================================================ */
