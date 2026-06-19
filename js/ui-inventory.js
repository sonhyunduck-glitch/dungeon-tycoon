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
    '<button class="btn sm '+(sub==="warehouse"?"primary":"")+'" data-act="inv-sub" data-sub="warehouse" style="flex:1">📦 창고 <span class="'+whFullCls+'">'+wh.items.length+'/'+wh.max+'</span></button>'+
  '</div>';

  v.innerHTML = tabs + (sub==="bag" ? G.ui._bagPanel() : G.ui._warehousePanel());
};

G.ui._bagPanel = function(){
  var inv=G.state.inventory;
  var pot=G.state.consumables.potion_s||0;
  var full=G.inventory.isFull();
  var sort=G.state.ui.bagSort||"price";
  var sortLabel={price:"가격↓", recent:"획득순", power:"가치↓"}[sort];
  // 필터(부위별 / 옵션별)
  var fslot=G.state.ui.bagFilterSlot||"all", fstat=G.state.ui.bagFilterStat||"all";
  var slotOpts=[["all","전체 부위"],["weapon","🗡️ 무기"],["helmet","🪖 투구"],["armor","🛡️ 갑옷"],["gloves","🧤 장갑"],["boots","🥾 신발"],["ring","💍 반지"],["necklace","📿 목걸이"],["rune","🔮 룬"]];
  var slotSel='<select class="bagfilter" data-act="bag-filter-slot">'+slotOpts.map(function(o){return '<option value="'+o[0]+'"'+(fslot===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join("")+'</select>';
  var statKeys=G.DATA.STAT_KEYS||Object.keys(G.DATA.STAT_META);
  var statSel='<select class="bagfilter" data-act="bag-filter-stat"><option value="all"'+(fstat==="all"?' selected':'')+'>전체 옵션</option>'+
    statKeys.map(function(k){ var m=G.DATA.STAT_META[k]; return m?'<option value="'+k+'"'+(fstat===k?' selected':'')+'>'+m.label+'</option>':''; }).join("")+'</select>';
  var filtered = fslot!=="all" || fstat!=="all";
  var head='<div class="panel"><h2>🎒 가방 <span class="muted '+(full?"r-legend":"")+'">('+inv.length+' / '+G.state.invMax+')</span></h2>'+
    '<div class="row" style="margin-bottom:8px; align-items:center">'+
      '<button class="btn sm gold" data-act="bag-upgrade">가방 확장 +1칸 🪙'+G.ui.fmt(G.inventory.bagUpgradeCost())+'</button>'+
      '<button class="btn sm" data-act="bag-sort">정렬: '+sortLabel+'</button>'+
      '<span class="muted" style="margin-left:auto">🔩 재료 <b>'+G.ui.fmt(G.state.materials||0)+'</b></span>'+
    '</div>'+
    '<div class="row bagfilter-row" style="margin-bottom:8px; align-items:center">'+
      '<span class="muted" style="font-size:.72rem">필터</span>'+ slotSel + statSel +
      (filtered?'<button class="btn sm" data-act="bag-filter-clear">초기화</button>':'')+
    '</div>'+
    (full?'<div class="muted r-legend" style="margin-bottom:8px">⚠️ 가방이 가득 찼습니다. 이후 전리품은 창고로 자동 보관됩니다.</div>':'')+
    '<div class="item"><div class="ico">🧪</div><div class="info"><div class="iname">체력 물약 <span class="muted">'+pot+' / '+(G.state.potionMax||20)+'</span></div><div class="idesc">개당 회복 +'+G.ui.fmt(G.state.consumables.potionHeal||G.potionHealAmount())+' (구매 시 고정)</div></div>'+
    '<div class="iacts"><button class="btn sm" data-act="use-potion" '+(pot<=0?"disabled":"")+'>사용</button></div></div></div>';

  if(inv.length===0) return head+'<div class="empty">가방이 비어 있습니다.<br>던전에서 사냥해 보세요!</div>';

  var whFull=G.warehouse.isFull();
  var sorted=inv.slice();
  if(sort==="price") sorted.sort(function(a,b){ return (b.basePrice||0)-(a.basePrice||0); });
  else if(sort==="power") sorted.sort(function(a,b){ return G.inventory.statValue(b.stats||{})-G.inventory.statValue(a.stats||{}); });
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
    // 감정된 장비
    var diff=G.inventory.compare(it);
    var diffTxt = diff===null ? '' : (diff>0?'<span class="r-uncommon">▲'+G.ui.fmt(Math.round(diff))+'</span>':(diff<0?'<span class="r-common">▼'+G.ui.fmt(Math.round(Math.abs(diff)))+'</span>':'<span class="muted">=</span>'));
    var rc=G.item.rerollCost(it);
    var acts=
      '<button class="btn sm primary" data-act="equip" data-id="'+it.id+'">착용 '+diffTxt+'</button>'+
      '<button class="btn sm gold" data-act="list" data-id="'+it.id+'" title="가판대 진열">진열</button>'+
      '<button class="btn sm" data-act="store" data-id="'+it.id+'" '+(whFull?"disabled":"")+' title="창고 보관">보관</button>'+
      '<button class="btn sm" data-act="reroll" data-id="'+it.id+'" title="재련: 옵션 한 줄 무작위 변경 (🔩'+rc.mat+' 🪙'+G.ui.fmt(rc.gold)+')">재련</button>'+
      '<button class="btn sm" data-act="salvage" data-id="'+it.id+'" title="분해 → 재료">분해</button>'+
      '<button class="btn sm" data-act="quicksell" data-id="'+it.id+'" title="즉시 매각">매각 🪙'+G.ui.fmt(Math.round(it.basePrice*0.1))+'</button>';
    return itemCard(it, acts);
  }).join("");
  return head+'<div class="panel">'+items+'</div>';
};

G.ui._warehousePanel = function(){
  var wh=G.state.warehouse;
  var full=G.warehouse.isFull();
  var head='<div class="panel"><h2>📦 창고 <span class="muted '+(full?"r-legend":"")+'">('+wh.items.length+' / '+wh.max+')</span></h2>'+
    '<div class="muted">던전 전리품을 보관하는 공간입니다. 가방이 차면 이곳에 자동 보관됩니다.</div>'+
    '<div class="row" style="margin-top:8px"><button class="btn sm gold" data-act="wh-upgrade">창고 확장 +10칸 🪙'+G.warehouse.upgradeCost()+'</button></div></div>';

  if(wh.items.length===0) return head+'<div class="empty">창고가 비어 있습니다.</div>';

  var bagFull=G.inventory.isFull();
  var items=wh.items.map(function(it){
    var acts=
      '<button class="btn sm primary" data-act="retrieve" data-id="'+it.id+'" '+(bagFull?"disabled":"")+'>🎒 꺼내기</button>'+
      '<button class="btn sm" data-act="wh-sell" data-id="'+it.id+'">매각 🪙'+G.ui.fmt(Math.round(it.basePrice*0.1))+'</button>';
    return itemCard(it, acts);
  }).join("");
  return head+'<div class="panel">'+items+'</div>';
};

/* ============================================================
   캐릭터 뷰
   ============================================================ */
