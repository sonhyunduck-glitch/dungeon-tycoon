/* ui-inventory.js — 통합 창고 탭(가방+창고 일원화). ui-tabs.js에서 분리. 헬퍼는 ui.js 전역. */
var G = window.G;

G.ui.renderInventory = function(){
  el("view-inventory").innerHTML = G.ui._storePanel();
};

/* 통합 창고: 종류 탭(전체/장비/룬/고유) + 부위·옵션 필터 + 종류별 칸 확장 */
G.ui._storePanel = function(){
  var inv=G.state.inventory;
  var pot=G.state.consumables.potion_s||0;
  var cat=G.state.ui.whCat||"all";
  if(cat!=="all" && !G.inventory.CATS.some(function(c){return c.key===cat;})) cat="all";
  var sort=G.state.ui.bagSort||"price";
  var sortLabel={price:"가격↓", recent:"획득순", power:"가치↓", upgrade:"업그레이드↑"}[sort];
  var fslot=G.state.ui.bagFilterSlot||"all", fstat=G.state.ui.bagFilterStat||"all";

  // 종류 탭(전체/장비/룬/고유) — 사용량 표시
  function catChip(key,label){
    var n, cap;
    if(key==="all"){ n=inv.length; cap=G.inventory.totalCap(); }
    else { n=G.inventory.countOf(key); cap=G.inventory.cap(key); }
    var cls=(key!=="all"&&n>=cap)?"r-legend":"muted";
    return '<button class="btn sm '+(cat===key?"primary":"")+'" data-act="wh-cat" data-cat="'+key+'" style="flex:1">'+label+' <span class="'+cls+'">'+n+'/'+cap+'</span></button>';
  }
  var catTabs='<div class="row" style="gap:5px;margin-bottom:8px">'+
    catChip("all","전체")+catChip("gear","⚔️")+catChip("rune","🔮")+catChip("unique","🌟")+'</div>';

  // 부위 필터 — 장비 아이콘 칩
  var SLOT_ICONDIR={ weapon:"weapon_sword", helmet:"helmet", armor:"armor", gloves:"gloves", boots:"boots", ring:"ring", necklace:"necklace" };
  function slotChipInner(k){
    if(k==="all") return '<span class="chiptext">전체</span>';
    if(k==="rune") return '<img class="fico" src="assets/icon/runs/1.jpg" alt="룬">';
    var dir=SLOT_ICONDIR[k], list=G.DATA.EQUIP_ICONS&&G.DATA.EQUIP_ICONS[dir];
    if(list&&list.length) return '<img class="fico" src="assets/icon/equip/'+dir+'/'+list[0]+'" alt="">';
    return '<span class="chiptext">❔</span>';
  }
  var slotChips='<div class="slotchips">'+["all","weapon","helmet","armor","gloves","boots","ring","necklace","rune"].map(function(k){
    return '<button class="slotchip'+(fslot===k?' active':'')+'" data-act="bag-filter-slot" data-slot="'+k+'" title="'+(SLOT_LABELS[k]||(k==="rune"?"룬":"전체"))+'">'+slotChipInner(k)+'</button>';
  }).join("")+'</div>';
  // 옵션 필터
  var statLabel = fstat==="all" ? "전체 옵션" : ((G.DATA.STAT_META[fstat]&&G.DATA.STAT_META[fstat].label)||"옵션");
  var statBtn='<button class="btn sm bagstat-btn'+(fstat!=="all"?" gold":"")+'" data-act="bag-stat-pick">🏷️ '+esc(statLabel)+' ▾</button>';
  var filtered = fslot!=="all" || fstat!=="all";
  // 활성 종류 칸 확장 버튼(전체일 땐 안내)
  var expandBtn = (cat!=="all")
    ? '<button class="btn sm gold" data-act="cap-upgrade" data-cat="'+cat+'">'+G.inventory.catLabel(cat)+' +10칸 🪙'+G.ui.fmt(G.inventory.capUpgradeCost(cat))+'</button>'
    : '<span class="muted" style="font-size:.7rem">종류 탭에서 칸 확장</span>';
  var catFull = (cat!=="all" && G.inventory.isFull(cat));

  var head='<div class="panel"><h2>📦 창고 <span class="muted">('+inv.length+' / '+G.inventory.totalCap()+')</span></h2>'+
    catTabs+
    '<div class="row" style="margin-bottom:8px; align-items:center">'+ expandBtn +
      '<button class="btn sm" data-act="bag-sort">정렬: '+sortLabel+'</button>'+
    '</div>'+
    '<div class="bagfilter-wrap" style="margin-bottom:8px">'+
      slotChips +
      '<div class="row" style="margin-top:6px; align-items:center">'+ statBtn +
        (filtered?'<button class="btn sm" data-act="bag-filter-clear">초기화</button>':'')+
      '</div>'+
    '</div>'+
    (catFull?'<div class="muted r-legend" style="margin-bottom:8px">⚠️ '+G.inventory.catLabel(cat)+' 칸이 가득 찼습니다. 정리하거나 칸을 확장하세요.</div>':'')+
    '<div class="item"><div class="ico">🧪</div><div class="info"><div class="iname">체력 물약 <span class="muted">'+pot+' / '+(G.state.potionMax||20)+'</span></div><div class="idesc">개당 회복 +'+G.ui.fmt(G.state.consumables.potionHeal||G.potionHealAmount())+' (구매 시 고정)</div></div>'+
    '<div class="iacts"><button class="btn sm" data-act="use-potion" '+(pot<=0?"disabled":"")+'>사용</button></div></div></div>';

  if(inv.length===0) return head+'<div class="empty">창고가 비어 있습니다.<br>던전에서 사냥해 보세요!</div>';

  var sorted=inv.slice();
  if(sort==="price") sorted.sort(function(a,b){ return (b.basePrice||0)-(a.basePrice||0); });
  else if(sort==="power") sorted.sort(function(a,b){ return G.inventory.statValue(b.stats||{})-G.inventory.statValue(a.stats||{}); });
  else if(sort==="upgrade"){   // 착용 장비 대비 가치 차이↓ (업그레이드가 위로, 미감정은 맨 아래)
    var up=function(it){ return it.identified===false ? -1e12 : (G.inventory.compare(it)||0); };
    sorted.sort(function(a,b){ return up(b)-up(a); });
  }
  // 필터: 종류(cat) + 부위(slot) + 옵션(stat). 옵션 필터는 감정된 아이템만(미감정은 옵션 미공개)
  sorted=sorted.filter(function(it){
    if(cat!=="all" && G.inventory.catOf(it)!==cat) return false;
    if(fslot!=="all" && it.slot!==fslot) return false;
    if(fstat!=="all"){ if(it.identified===false) return false; if(!(it.stats && it.stats[fstat]>0)) return false; }
    return true;
  });
  if(!sorted.length) return head+'<div class="empty">조건에 맞는 항목이 없습니다.<br><span class="muted">종류/부위/옵션을 바꾸거나 초기화하세요.</span></div>';
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
        '</div></div>';
    }
    var sellBtn='<button class="btn sm" data-act="quicksell" data-id="'+it.id+'" title="즉시 매각">매각 🪙'+G.ui.fmt(G.item.sellPrice(it))+'</button>';
    // 룬 — 소켓 전용(착용/재련 없음)
    if(it.slot==="rune"){
      var eff=it.wpn?('⚔️'+Object.keys(it.wpn).map(function(k){var m=G.DATA.STAT_META[k];return m?(m.label+"+"+it.wpn[k]+(m.pct?"%":"")):"";}).join(" ")+' · 🛡️'+Object.keys(it.arm||{}).map(function(k){var m=G.DATA.STAT_META[k];return m?(m.label+"+"+it.arm[k]+(m.pct?"%":"")):"";}).join(" ")):'';
      return '<div class="item '+it.rarityCls+'"><div class="ico">'+G.ui.icoHTML(it)+'</div>'+
        '<div class="info"><div class="iname '+it.rarityCls+'">'+esc(it.name)+' <span class="tag">룬</span></div><div class="idesc">'+eff+'</div></div>'+
        '<div class="iacts">'+sellBtn+'</div></div>';
    }
    // 소켓 베이스 — 착용 + 🔩소켓
    if(it.socketBase){
      var upS=G.inventory.upgradeInfo(it);
      var dS = !upS ? '' : (upS.pct>=0.5?'<span class="r-uncommon">▲'+(upS.pct>=200?'대폭':upS.pct.toFixed(0)+'%')+'</span>':'');
      var fc=it.sockets.filter(function(s){return s;}).length;
      var actsS=
        '<button class="btn sm primary" data-act="equip" data-id="'+it.id+'">착용 '+dS+'</button>'+
        '<span class="muted" style="font-size:.66rem;align-self:center" title="룬 장착은 🧊큐브 → 🔗룬워드 탭에서">🔩 '+fc+'/'+it.sockets.length+'</span>'+
        sellBtn;
      return itemCard(it, actsS);
    }
    // 감정된 장비 — 전투효과(공격×생존) 변화율로 추천
    var up=G.inventory.upgradeInfo(it);
    var diffTxt = !up ? '' : (up.pct>=0.5?'<span class="r-uncommon" title="전투효과">▲'+(up.pct>=200?'대폭':up.pct.toFixed(0)+'%')+'</span>':(up.pct<=-0.5?'<span class="r-common" title="전투효과">▼'+Math.abs(up.pct).toFixed(0)+'%</span>':'<span class="muted">=</span>'));
    var acts=
      '<button class="btn sm primary" data-act="equip" data-id="'+it.id+'">착용 '+diffTxt+'</button>'+
      sellBtn;
    return itemCard(it, acts);
  }).join("");
  return head+'<div class="panel">'+items+'</div>';
};

/* ============================================================
   캐릭터 뷰
   ============================================================ */
