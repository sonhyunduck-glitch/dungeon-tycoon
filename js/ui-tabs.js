/* ui-tabs.js — 탭 화면 렌더(가방·캐릭터·상점·대장간·시장·퀘스트·아레나·랭킹·설정). ui.js에서 분리. */
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
  var head='<div class="panel"><h2>🎒 가방 <span class="muted '+(full?"r-legend":"")+'">('+inv.length+' / '+G.state.invMax+')</span></h2>'+
    '<div class="row" style="margin-bottom:8px; align-items:center">'+
      '<button class="btn sm gold" data-act="bag-upgrade">가방 확장 +1칸 🪙'+G.ui.fmt(G.inventory.bagUpgradeCost())+'</button>'+
      '<button class="btn sm" data-act="bag-sort">정렬: '+sortLabel+'</button>'+
      '<span class="muted" style="margin-left:auto">🔩 재료 <b>'+G.ui.fmt(G.state.materials||0)+'</b></span>'+
    '</div>'+
    (full?'<div class="muted r-legend" style="margin-bottom:8px">⚠️ 가방이 가득 찼습니다. 이후 전리품은 창고로 자동 보관됩니다.</div>':'')+
    '<div class="item"><div class="ico">🧪</div><div class="info"><div class="iname">체력 물약 <span class="muted">'+pot+' / '+(G.state.potionMax||20)+'</span></div><div class="idesc">개당 회복 +'+G.ui.fmt(G.state.consumables.potionHeal||G.potionHealAmount())+' (구매 시 고정)</div></div>'+
    '<div class="iacts"><button class="btn sm" data-act="use-potion" '+(pot<=0?"disabled":"")+'>사용</button></div></div></div>';

  if(inv.length===0) return head+'<div class="empty">가방이 비어 있습니다.<br>던전에서 사냥해 보세요!</div>';

  var whFull=G.warehouse.isFull();
  var sorted=inv.slice();
  if(sort==="price") sorted.sort(function(a,b){ return (b.basePrice||0)-(a.basePrice||0); });
  else if(sort==="power") sorted.sort(function(a,b){ return G.inventory.statValue(b.stats||{})-G.inventory.statValue(a.stats||{}); });
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
G.ui.renderCharacter = function(){
  var v=el("view-character");
  var s=G.totalStats(), p=G.state.player;

  var slots=Object.keys(SLOT_LABELS).map(function(k){
    var it=G.state.equipment[k];
    if(it){
      return '<div class="eqslot '+it.rarityCls+'" style="border-style:solid;border-left-width:4px">'+
        '<div class="slotlbl">'+SLOT_LABELS[k]+'</div>'+
        '<div class="iname '+it.rarityCls+'" style="font-size:.8rem">'+G.ui.icoHTML(it)+' '+esc(it.name)+'</div>'+
        '<div class="idesc">'+G.item.statText(it)+'</div>'+
        '<button class="btn sm" style="margin-top:4px" data-act="unequip" data-slot="'+k+'">해제</button>'+
      '</div>';
    }
    return '<div class="eqslot"><div class="slotlbl">'+SLOT_LABELS[k]+'</div><div class="muted">비어있음</div></div>';
  }).join("");

  // 고급(디아블로식) 옵션 — 값이 있을 때만 표시
  var adv=["critDmg","lifesteal","dodge","penet","multihit","goldFind","thorns","stunResist","elemAtk","allRes","resFire","resCold","resLight","resPoison","shopSlot","mercFind","potionBoost"]
   .filter(function(k){ return s[k]>0; })
   .map(function(k){ var m=G.DATA.STAT_META[k]; var u=(m.unit!==undefined)?m.unit:(m.pct?"%":"");
     return '<div><span class="k">'+m.label+'</span><b>'+s[k]+u+'</b></div>'; }).join("");
  var advPanel = adv ? '<div class="panel"><h2>✨ 옵션 스탯</h2><div class="stats">'+adv+'</div></div>' : '';

  // 룬 슬롯 5개
  var runeSlots=G.DATA.RUNE_SLOTS.map(function(k,i){
    var it=G.state.equipment[k];
    if(it){
      return '<div class="eqslot '+it.rarityCls+'" style="border-style:solid;border-left-width:4px">'+
        '<div class="slotlbl">룬 '+(i+1)+'</div>'+
        '<div class="iname '+it.rarityCls+'" style="font-size:.8rem">'+G.ui.icoHTML(it)+' '+esc(it.name)+'</div>'+
        '<div class="idesc">'+G.item.statText(it)+'</div>'+
        '<button class="btn sm" style="margin-top:4px" data-act="unequip" data-slot="'+k+'">해제</button>'+
      '</div>';
    }
    return '<div class="eqslot"><div class="slotlbl">룬 '+(i+1)+'</div><div class="muted">비어있음</div></div>';
  }).join("");
  var runePanel='<div class="panel"><h2>🔮 룬 슬롯 <span class="muted">'+G.DATA.RUNE_SLOTS.filter(function(k){return G.state.equipment[k];}).length+'/5</span></h2><div class="eqgrid">'+runeSlots+'</div></div>';

  var statsPanel=
    '<div class="panel"><h2>👤 스탯</h2>'+
      '<div class="stats">'+
        '<div><span class="k">전투력</span><b>'+G.ui.fmt(G.power())+'</b></div>'+
        '<div><span class="k">체력</span><b>'+G.ui.fmt(p.hp)+'/'+G.ui.fmt(s.maxHp)+'</b></div>'+
        '<div><span class="k">공격력</span><b>'+G.ui.fmt(s.atk)+'</b></div>'+
        '<div><span class="k">방어력</span><b>'+G.ui.fmt(s.def)+'</b></div>'+
        '<div><span class="k">치명타율</span><b>'+s.crit+'%</b></div>'+
        '<div><span class="k">골드</span><b style="color:var(--gold)">'+G.ui.fmt(p.gold)+'</b></div>'+
      '</div>'+
      (p.hp<s.maxHp?'<button class="btn full" style="margin-top:10px" data-act="use-potion">🧪 물약으로 회복 ('+(G.state.consumables.potion_s||0)+')</button>':'')+
    '</div>'+advPanel;

  var equipPanel='<div class="panel"><h2>🛡️ 장비</h2><div class="eqgrid">'+slots+'</div></div>';

  // 서브 탭
  var sub=G.state.ui.charSub||"stats";
  var subTabs=[["stats","📊 스탯"],["detail","📋 상세"],["equip","🛡️ 장비"],["rune","🔮 룬"],["skill","⚔️ 스킬"],["avatar","🎭 아바타"],["unlock","🔓 해금"]];
  var tabBar='<div class="subtabs">'+subTabs.map(function(t){
    return '<button class="subtab'+(sub===t[0]?" active":"")+'" data-act="char-sub" data-sub="'+t[0]+'">'+t[1]+'</button>';
  }).join("")+'</div>';

  var body = sub==="stats"?statsPanel : sub==="detail"?G.ui._statSheet() : sub==="equip"?equipPanel : sub==="rune"?runePanel : sub==="avatar"?G.ui._avatarPanel() : sub==="unlock"?G.ui._perksHTML() : G.ui._skills();
  v.innerHTML = tabBar + body;
  if(sub==="avatar"){   // 미리보기 애니메이션(잠긴 건 정적)
    v.querySelectorAll(".av-prev-inner").forEach(function(el){
      var card=el.closest(".avatar-card");
      if(card && card.classList.contains("locked")) return;
      G.avatar.animatePreview(el);
    });
  }
};

/* 아바타 선택 패널 */
G.ui._avatarPanel = function(){
  var cur=G.avatar.currentId();
  var cards=G.DATA.AVATARS.map(function(a){
    var sel=a.id===cur, unlocked=G.avatar.unlocked(a);
    return '<div class="avatar-card'+(sel?" sel":"")+(unlocked?"":" locked")+'" data-act="avatar-pick" data-id="'+a.id+'">'+
      '<div class="avatar-prev">'+G.avatar.previewHTML(a)+'</div>'+
      '<div class="avatar-name">'+esc(a.name)+'</div>'+
      (unlocked ? (sel?'<div class="avatar-badge">선택됨</div>':'')
                : '<div class="avatar-lock">🔒 '+a.unlock+'층</div>')+
    '</div>';
  }).join("");
  return '<div class="panel"><h2>🎭 아바타</h2>'+
    '<div class="muted" style="margin-bottom:10px">전투 화면에 표시되는 내 캐릭터 외형을 선택하세요. <span class="r-uncommon">최고 도달 층</span>으로 해금됩니다.</div>'+
    '<div class="avatar-grid">'+cards+'</div>'+
    (G.DATA.AVATARS.length<=1
      ? '<div class="muted" style="margin-top:12px;font-size:.8rem;line-height:1.6">💡 더 많은 아바타는 <b>스프라이트 슬라이서</b>로 캐릭터 시트를 추가하면 늘어납니다.</div>'
      : '')+
  '</div>';
};

/* 상세 능력치 시트 — 적용된 모든 스탯 + 실제 효과 */
G.ui._statSheet = function(){
  var s=G.totalStats(), p=G.state.player, rows=[];
  function row(label, val, note){
    rows.push('<div class="sheet-row"><span class="k">'+label+'</span><b>'+val+'</b>'+(note?'<span class="sheet-note">'+note+'</span>':'')+'</div>');
  }
  rows.push('<div class="sheet-head">기본</div>');
  row('전투력', G.ui.fmt(G.power()));
  row('체력', G.ui.fmt(Math.ceil(p.hp))+' / '+G.ui.fmt(s.maxHp));
  row('공격력', G.ui.fmt(s.atk));
  row('방어력', G.ui.fmt(s.def));
  row('골드', G.ui.fmt(p.gold));

  rows.push('<div class="sheet-head">전투 옵션</div>');
  row('치명타율', s.crit+'%', '발동 확률 (상한 80%)');
  row('치명타피해', s.critDmg+'%', '치명 시 '+(1.5+s.critDmg/100).toFixed(2)+'배 (상한 150%)');
  row('생명력흡수', s.lifesteal+'%', '준 피해 흡수 (상한 25%)');
  row('회피', s.dodge+'%', '상한 60%');
  row('방어관통', s.penet+'%', '상한 75%');
  row('추가타확률', s.multihit+'%', '추가 타격 (상한 40%)');
  row('피해반사', s.thorns+'%', '반사 (상한 100%)');
  row('기절저항', s.stunResist+'%', '상한 80%');

  rows.push('<div class="sheet-head">속성 (100층+ 적용)</div>');
  (function(){ var ae=s.atkElem&&G.DATA.ELEMENTS.find(function(e){return e.key===s.atkElem;});
    var opp = ae && G.DATA.ELEMENTS.find(function(e){return e.key===G.DATA.ELEM_OPP[ae.key];});
    row('⚔️ 공격 속성', ae?(ae.emoji+ae.name):'<span class="muted">무속성</span>',
      ae?('약점 '+(opp?opp.emoji+opp.name:'')+' 몬스터에 추가피해 · 같은 속성엔 반감'):'무기/룬에 속성 부여 시 활성 (100층+)'); })();
  row('속성공격', s.elemAtk+'%', '약점 공격 시 추가피해 증폭 (상한 150%)');
  row('🛡️ 모든저항', s.allRes+'%', s.allRes>0?'아래 4저항에 각각 포함됨':'-');
  row('🔥 화염저항', s.resFire+'%', '총합 (상한 80%)');
  row('❄️ 냉기저항', s.resCold+'%', '총합 (상한 80%)');
  row('⚡ 번개저항', s.resLight+'%', '총합 (상한 80%)');
  row('☠️ 맹독저항', s.resPoison+'%', '총합 (상한 80%)');

  rows.push('<div class="sheet-head">유틸 (룬 전용)</div>');
  row('골드획득', s.goldFind+'%', '처치 골드 증가');
  row('가판대칸', '+'+s.shopSlot, '현재 '+G.shop.capacity()+'칸');
  row('손님 방문율', s.mercFind+'%', '상점 손님 방문 빈도 증가');
  row('물약회복', s.potionBoost+'%', '1회 '+G.ui.fmt(G.potionHealAmount())+' ('+G.potionHealPct()+'%)');

  return '<div class="panel"><h2>📋 상세 능력치</h2><div class="sheet">'+rows.join("")+'</div></div>';
};

/* 전사 스킬 패널 (해금/토글, 우선순위 표시) */
G.ui._skills = function(){
  var sd=G.state.skills||{unlocked:{},enabled:{}};
  var rows=G.DATA.SKILLS.map(function(sk,i){
    var unlocked=!!sd.unlocked[sk.id], on=!!(unlocked&&sd.enabled[sk.id]);
    var right;
    if(unlocked) right='<button class="btn sm '+(on?"primary":"")+'" data-act="skill-toggle" data-id="'+sk.id+'">'+(on?"ON":"OFF")+'</button>';
    else right='<span class="tag muted">🔒 '+sk.req+'층 도달 시 해금</span>';
    return '<div class="item'+(on?" r-legend":"")+'"'+(on?'':' style="border-left-color:var(--glass-brd)"')+'>'+
      '<div class="ico">'+sk.ico+'</div>'+
      '<div class="info">'+
        '<div class="iname">'+(on?'<span class="muted">#'+(i+1)+'</span> ':'')+sk.name+' <span class="muted" style="font-weight:400">쿨'+sk.cd+'턴</span>'+(on?' <span class="tag r-uncommon">사용중</span>':'')+'</div>'+
        '<div class="idesc">'+sk.desc+'</div>'+
      '</div>'+
      '<div class="iacts">'+right+'</div>'+
    '</div>';
  }).join("");
  return '<div class="panel"><h2>⚔️ 스킬 <span class="muted">전투 중 위 순서(#)대로 자동 시전</span></h2>'+rows+
    '<div class="muted" style="margin-top:6px">💡 ON으로 켠 스킬이 쿨타임마다 우선순위 순으로 자동 발동됩니다. 휩쓸기는 무리(2마리+)에서만 시전.</div></div>';
};

/* ============================================================
   가판대 뷰 (유저가 운영하는 판매대)
   ============================================================ */
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
      '<div class="stall-foot">가격표를 눌러 값을 정하세요. 손님은 <b>쌀수록 잘 삽니다</b>. 진열은 가방 탭의 [진열] 버튼으로.</div>'+
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
    '<div class="muted" style="margin-top:6px">조건을 충족하는 가방 속 아이템이 자동 납품됩니다. (#옵션 클릭 → 사냥터 워프, 대장간으로 맞춤 제작)</div></div>';
};

/* ============================================================
   상점 뷰 (NPC 상점 — 물약 등 소모품 구매)
   ============================================================ */
G.ui.renderVendor = function(){
  var v=el("view-vendor");
  var pot=G.state.consumables.potion_s||0;
  var max=G.state.potionMax||20;
  var price=G.potionPrice(); // 회복 HP당 1골드
  var gold=G.state.player.gold;
  var full=pot>=max;
  var can1=!full && gold>=price, can10=!full && gold>=price;
  var potCls = full?"r-legend":"muted";

  v.innerHTML=
    '<div class="panel theme-shop"><h2>🏬 상점</h2>'+
      '<div class="muted">소모품을 구매하는 곳입니다. 보유 골드 🪙'+G.ui.fmt(gold)+'</div>'+
    '</div>'+
    '<div class="panel"><h3>소모품</h3>'+
      '<div class="item"><div class="ico">🧪</div>'+
        '<div class="info">'+
          '<div class="iname">체력 물약 <span class="'+potCls+'">'+pot+' / '+max+'</span></div>'+
          '<div class="idesc">구매 시 회복 +'+G.ui.fmt(G.potionHealAmount())+' (최대체력 '+G.potionHealPct()+'%) · 개당 🪙'+G.ui.fmt(price)+(full?' · <span class="r-legend">소지 한도</span>':'')+'<br>보유 물약 회복 +'+G.ui.fmt(G.state.consumables.potionHeal||0)+'</div>'+
        '</div>'+
        '<div class="iacts">'+
          '<button class="btn sm primary" data-act="buy-potion" data-qty="1" '+(can1?"":"disabled")+'>+1</button>'+
          '<button class="btn sm gold" data-act="buy-potion" data-qty="10" '+(can10?"":"disabled")+'>+10 🪙'+G.ui.fmt(price*10)+'</button>'+
        '</div>'+
      '</div>'+
      '<div class="muted" style="margin-top:8px">💡 가격은 회복량과 동일(회복 HP당 1골드). 최대 '+max+'개 소지. (특성 「자동 물약」 추천)</div>'+
    '</div>'+
    G.ui._forge();
};

/* 대장간 — 확정 제작 */
G.ui._forge = function(){
  var mm=G.state.monMats||{};
  var owned=G.DATA.BOSS_SPECIES.filter(function(b){return (mm[b.name]||0)>0;});
  var gold=G.forge.goldCost();
  var rows;
  if(!owned.length){
    rows='<div class="muted">층보스를 처치하면 고유 재료를 얻습니다. 재료로 특정 옵션이 100% 붙은 장비를 제작하세요.</div>';
  } else {
    rows=owned.map(function(b){
      var cnt=mm[b.name]||0, enough=cnt>=G.forge.MAT_COST;
      var lbl=G.DATA.STAT_META[b.gstat].label, wf=G.dungeon.floorForStat(b.gstat);
      return '<div class="item" style="border-left-color:var(--torch)">'+
        '<div class="ico">🧩</div>'+
        '<div class="info">'+
          '<div class="iname">'+esc(b.mat)+' <span class="muted">'+cnt+' / '+G.forge.MAT_COST+'</span></div>'+
          '<div class="idesc">보장 옵션 <span class="warp" data-act="warp" data-floor="'+wf+'">#'+lbl+'</span> · 비용 🪙'+G.ui.fmt(gold)+'</div>'+
          '<div class="iacts" style="margin-top:5px">'+
            ['weapon','armor','acc'].map(function(p){
              return '<button class="btn sm '+(enough?"primary":"")+'" data-act="craft" data-boss="'+esc(b.name)+'" data-part="'+p+'" '+(enough?"":"disabled")+'>'+G.partLabel(p)+'</button>';
            }).join("")+
          '</div>'+
        '</div>'+
      '</div>';
    }).join("");
  }
  // 룬 제작 섹션
  var mats=G.state.materials||0, rgold=G.forge.runeGoldCost(), rcost=G.forge.runeMatCost();
  var runeBtns=G.DATA.RUNE_BASES.filter(function(b){return b.craft;}).map(function(b){
    var ok = mats>=rcost && G.state.player.gold>=rgold;
    return '<button class="btn sm '+(ok?"primary":"")+'" data-act="craft-rune" data-rune="'+esc(b.base)+'" '+(ok?"":"disabled")+
      ' title="'+esc(b.base)+' ('+G.DATA.STAT_META[b.main].label+')">'+b.ico+' '+esc(b.base.replace("의 룬",""))+'</button>';
  }).join("");
  var runePanel='<div class="panel"><h3>🔮 룬 제작</h3>'+
    '<div class="muted" style="margin-bottom:7px">🔩 재료 <b>'+mats+'</b> · 룬 1개 = 🔩'+rcost+' + 🪙'+G.ui.fmt(rgold)+'</div>'+
    '<div class="row">'+runeBtns+'</div>'+
    '<div class="muted" style="margin-top:7px">🔩 재료는 <b>아이템 분해</b>로 얻습니다. 층이 오를수록 룬 베이스가 강해져 재료 비용도 늘어납니다. (활력·황금·가시 룬은 사냥 드롭)</div></div>';

  return '<div class="panel"><h3>🔨 대장간 — 확정 제작</h3>'+rows+'</div>'+runePanel;
};

/* ============================================================
   시장 검색소 뷰 — NPC 상인 매물 검색 / 급매물 되팔이 / 키워드 알림
   ============================================================ */
G.ui.renderMarket = function(){
  var v=el("view-market");
  G.market.ensureFresh();
  var f=G.state.ui.market, st=G.state.market;

  function optOpts(sel){
    return '<option value="">옵션 전체</option>'+G.DATA.STAT_KEYS.map(function(k){
      return '<option value="'+k+'" '+(sel===k?"selected":"")+'>'+G.DATA.STAT_META[k].label+'</option>';
    }).join("");
  }
  var partSel='<select class="msel" data-mk="slot">'+
    [['all','부위 전체'],['weapon','무기'],['armor','방어구'],['acc','장신구']].map(function(o){
      return '<option value="'+o[0]+'" '+(f.slot===o[0]?"selected":"")+'>'+o[1]+'</option>';}).join("")+'</select>';
  var raritySel='<select class="msel" data-mk="rarity">'+
    [['all','등급 전체'],['uncommon','고급 이상'],['rare','희귀 이상'],['epic','영웅 이상'],['legend','전설']].map(function(o){
      return '<option value="'+o[0]+'" '+(f.rarity===o[0]?"selected":"")+'>'+o[1]+'</option>';}).join("")+'</select>';

  var minRank={all:0,uncommon:1,rare:2,epic:3,legend:4}[f.rarity]||0;
  var results=(st.listings||[]).filter(function(l){
    if(f.slot!=="all" && l.item.type!==f.slot) return false;
    if(G.market.rank(l.item.rarity) < minRank) return false;
    if(f.opt1 && !l.item.stats[f.opt1]) return false;
    if(f.opt2 && !l.item.stats[f.opt2]) return false;
    if(f.pmin>0 && l.price<f.pmin) return false;
    if(f.pmax>0 && l.price>f.pmax) return false;
    return true;
  });

  var rows = results.length ? results.map(function(l){
    var tag=G.market.priceTag(l);
    var afford=G.state.player.gold>=l.price;
    var diff=G.inventory.compare(l.item);
    var cmp = diff>0 ? '<span class="r-uncommon">착용 대비 ▲'+G.ui.fmt(Math.round(diff))+'</span>'
            : (diff<0 ? '<span class="r-common">착용 대비 ▼'+G.ui.fmt(Math.round(Math.abs(diff)))+'</span>'
            : '<span class="muted">착용과 동급</span>');
    return '<div class="shelf-slot '+l.item.rarityCls+'" style="border-left-width:4px; flex-wrap:wrap">'+
      '<div class="info" style="flex:1 1 100%">'+
        '<div class="iname '+l.item.rarityCls+'" style="font-size:.84rem">'+esc(l.item.name)+' <span class="muted" style="font-weight:400">— '+esc(l.merchant)+'</span></div>'+
        '<div class="idesc">'+G.item.statText(l.item)+'</div>'+
        '<div class="idesc"><span class="'+tag.cls+'">'+tag.label+'</span> · '+cmp+'</div>'+
      '</div>'+
      '<div style="display:flex; align-items:center; gap:8px; margin-top:6px; width:100%">'+
        '<b class="gold" style="flex:1">🪙 '+G.ui.fmt(l.price)+'</b>'+
        '<button class="btn sm primary" data-act="market-buy" data-id="'+l.id+'" '+(afford?"":"disabled")+'>즉시 구매</button>'+
      '</div>'+
    '</div>';
  }).join("") : '<div class="empty">조건에 맞는 매물이 없습니다.</div>';

  var watchChips=G.DATA.STAT_KEYS.filter(function(k){return G.DATA.STAT_META[k].pct;}).map(function(k){
    var on=(st.watch||[]).indexOf(k)>=0;
    return '<button class="btn sm '+(on?"gold":"")+'" data-act="market-watch" data-kw="'+k+'">'+(on?"★ ":"")+G.DATA.STAT_META[k].label+'</button>';
  }).join("");

  var mins=Math.max(0, Math.ceil((G.market.REFRESH_MS-(Date.now()-(st.lastRefresh||0)))/60000));
  v.innerHTML=
    '<div class="panel"><h2>📊 시장 검색소 <span class="muted">매물 '+st.listings.length+'개 · 갱신 ~'+mins+'분</span></h2>'+
      '<div class="row" style="gap:6px">'+partSel+raritySel+'</div>'+
      '<div class="row" style="gap:6px; margin-top:6px">'+
        '<select class="msel" data-mk="opt1">'+optOpts(f.opt1)+'</select>'+
        '<select class="msel" data-mk="opt2">'+optOpts(f.opt2)+'</select>'+
      '</div>'+
      '<div class="row" style="gap:6px; margin-top:6px; align-items:center">'+
        '<input class="price-input" style="width:84px" type="number" min="0" placeholder="최소" value="'+(f.pmin||"")+'" data-mk="pmin">'+
        '<span class="muted">~</span>'+
        '<input class="price-input" style="width:84px" type="number" min="0" placeholder="최대" value="'+(f.pmax||"")+'" data-mk="pmax">'+
      '</div>'+
      '<div class="muted" style="margin-top:6px">💡 급매물을 사서 가판대에 시세로 되팔면 차익을 남길 수 있습니다.</div>'+
    '</div>'+
    '<div class="panel"><h3>🔔 관심 키워드 (신규 매물 알림)</h3><div class="row" style="gap:5px">'+watchChips+'</div></div>'+
    '<div class="panel"><h3>🛒 매물 ('+results.length+')</h3><div class="shelf">'+rows+'</div></div>';
};

/* 우측 상단 푸시 알림 */
G.ui.renderPerks = function(){
  var v=el("view-perks"); if(v) v.innerHTML=G.ui._perksHTML();
};

G.ui._perksHTML = function(){
  var done = G.DATA.PERKS.filter(function(d){ return G.perks.isUnlocked(d.id); }).length;
  var total = G.DATA.PERKS.length;
  var clearedTop = Math.max(0, (G.state.dungeon.maxFloor||1) - 1);  // 클리어한 최고층

  var cards=G.DATA.PERKS.map(function(d){
    var unlocked=G.perks.isUnlocked(d.id);
    var on=!!(unlocked && G.state.perks.enabled[d.id]);
    var right, statusTag;
    if(unlocked){
      statusTag=' <span class="tag r-uncommon">✅ 달성</span>'+(on?' <span class="tag">작동중</span>':'');
      right='<button class="btn sm '+(on?"primary":"")+'" data-act="perk-toggle" data-id="'+d.id+'">'+(on?"ON":"OFF")+'</button>';
    } else {
      statusTag=' <span class="tag">진행중 '+Math.min(clearedTop,d.freeFloor)+'/'+d.freeFloor+'층</span>';
      right='<span class="muted" style="font-size:.85em">🔒 잠김</span>';
    }
    var cls = on ? "item r-legend" : "item";
    return '<div class="'+cls+'"'+(on?'':' style="border-left-color:var(--glass-brd)"')+'>'+
      '<div class="ico">'+(unlocked?'📜':'🗺️')+'</div>'+
      '<div class="info">'+
        '<div class="iname">'+d.freeFloor+'층 클리어'+statusTag+'</div>'+
        '<div class="idesc">보상: '+d.ico+' <b>'+d.name+'</b> — '+d.desc+'</div>'+
      '</div>'+
      '<div class="iacts">'+right+'</div>'+
    '</div>';
  }).join("");

  // 배속 해금 퀘스트 (층 도달 시 자동 해금, 던전에서 ⏩로 전환)
  var curSpeed=G.maxSpeed();
  var speedQuests=[{floor:100,speed:2},{floor:200,speed:3},{floor:300,speed:4}];
  var sCards=speedQuests.map(function(q){
    var got=curSpeed>=q.speed;
    var tag=got?' <span class="tag r-uncommon">✅ 달성</span>'
               :' <span class="tag">진행중 '+Math.min(clearedTop,q.floor)+'/'+q.floor+'층</span>';
    var cls=got?"item r-epic":"item";
    return '<div class="'+cls+'"'+(got?'':' style="border-left-color:var(--glass-brd)"')+'>'+
      '<div class="ico">'+(got?'⏩':'🗺️')+'</div>'+
      '<div class="info">'+
        '<div class="iname">'+q.floor+'층 클리어'+tag+'</div>'+
        '<div class="idesc">보상: ⏩ <b>'+q.speed+'배속</b> — 클리어한 던전을 더 빠르게 재도전 (던전 화면의 ⏩ 버튼으로 전환)</div>'+
      '</div>'+
      '<div class="iacts"><span class="muted" style="font-size:.85em">'+(got?'사용 가능':'🔒 잠김')+'</span></div>'+
    '</div>';
  }).join("");

  return ''+
    '<div class="panel"><h2>📜 퀘스트 — 자동화 해금</h2>'+
      '<div class="muted">해당 <b>층을 클리어</b>하면 자동화 보상이 해금됩니다. 해금 후 카드의 <b>ON/OFF</b>로 켜고 끌 수 있어요. '+
      '<span class="r-uncommon">달성 '+done+'/'+total+'</span></div>'+
    '</div>'+
    '<div class="panel">'+cards+'</div>'+
    '<div class="panel"><h2>⏩ 배속 해금</h2>'+
      '<div class="muted" style="margin-bottom:8px">깊은 층을 클리어하면 전투 배속이 풀립니다. 현재 최대 <b>'+curSpeed+'배속</b></div>'+
      sCards+
    '</div>'+
    '<div class="panel"><div class="muted">💡 <b>자동 전투 + 자동 전진</b>을 함께 켜면 던전이 완전 자동으로 진행됩니다. '+
      '<b>자동 물약</b>으로 생존을, <b>자동 진열/매각</b>으로 전리품 정리를 맡기세요.</div></div>';
};

/* ============================================================
   아레나 (PvP)
   ============================================================ */
G.ui.renderArena = function(){
  var v=el("view-arena");
  // 상대 로드(없으면 비동기 로드 후 재렌더)
  if(!G.arena._foes && !G.arena._loading){
    G.arena.loadOpponents().then(function(){ if(G.state.ui.tab==="arena") G.ui.renderArena(); });
  }
  // 랭킹 캐시(온라인: 서버 15초 스로틀 / 오프라인: 1회 생성 후 캐시)
  if(!G.arena._rank){
    if(G.net && G.net.online()){
      var now=Date.now();
      if(!G.arena._rankFetch || now-G.arena._rankFetch>15000){
        G.arena._rankFetch=now;
        G.net.arenaRanking().then(function(rv){ G.arena._rank=rv||G.arena.localRankView(); if(G.state.ui.tab==="arena") G.ui.renderArena(); });
      }
    } else { G.arena._rank=G.arena.localRankView(); }
  }

  var me=G.arena.snapshot();
  var foes=G.arena._foes||[];
  var rv=G.arena._rank;

  var head='<div class="panel"><h2>🏟️ 아레나 <span class="muted" style="font-size:.7rem">PvP · 비동기 대전</span></h2>'+
    '<div class="stats">'+
      '<div><span class="k">아레나 점수</span><b class="gold">'+G.ui.fmt(G.arena.score())+'</b></div>'+
      '<div><span class="k">전적</span><b><span class="r-uncommon">'+G.arena.wins()+'승</span> '+G.arena.losses()+'패</b></div>'+
      '<div><span class="k">내 전투력</span><b>'+G.ui.fmt(me.power)+'</b></div>'+
      (rv&&rv.me?'<div><span class="k">아레나 순위</span><b>'+rv.me.rank+'위'+(rv.total?' / '+rv.total:'')+'</b></div>':'')+
    '</div></div>';

  var foeCards;
  if(G.arena._loading && !foes.length){ foeCards='<div class="muted" style="padding:10px">상대를 찾는 중…</div>'; }
  else if(!foes.length){ foeCards='<div class="muted" style="padding:10px">상대가 없습니다. 새로고침해 보세요.</div>'; }
  else foeCards=foes.map(function(f,i){
    return '<div class="item">'+
      '<div class="ico">'+((G.avatar&&G.avatar.miniHTML)?G.avatar.miniHTML(f.avatar,72):"🛡️")+'</div>'+
      '<div class="info">'+
        '<div class="iname">'+esc(f.name||"도전자")+' <span class="tag gold">'+G.ui.fmt(f.score||1000)+'점</span></div>'+
        '<div class="idesc">전투력 '+G.ui.fmt(f.power||0)+' · ❤️'+G.ui.fmt(f.maxHp||0)+' ⚔️'+G.ui.fmt(f.atk||0)+' 🛡️'+G.ui.fmt(f.def||0)+'</div>'+
      '</div>'+
      '<div class="iacts"><button class="btn primary sm" data-act="arena-fight" data-i="'+i+'">⚔️ 도전</button></div>'+
    '</div>';
  }).join("");

  var foePanel='<div class="panel"><h2>도전 상대 <button class="btn sm" data-act="arena-refresh" style="margin-left:auto">🔄</button></h2>'+foeCards+'</div>';

  var rankPanel='';
  if(rv){
    function row(c){ var medal=c.rank===1?"🥇":(c.rank===2?"🥈":(c.rank===3?"🥉":"#"+c.rank));
      var mn=(G.avatar&&G.avatar.miniHTML)?G.avatar.miniHTML(c.me?G.avatar.currentId():c.avatar,48):"";
      return '<div class="rank-row'+(c.me?" me":"")+'"><span class="rk">'+medal+'</span>'+mn+'<span class="rn">'+esc(c.name)+'</span><span class="rs gold">'+G.ui.fmt(c.score)+'</span></div>'; }
    rankPanel='<div class="panel"><h2>🏆 아레나 랭킹</h2>'+
      rv.top.map(row).join("")+(rv.gap?'<div class="muted" style="text-align:center">⋯</div>':'')+rv.around.map(row).join("")+
    '</div>';
  } else { rankPanel='<div class="panel"><h2>🏆 아레나 랭킹</h2><div class="muted" style="padding:8px">불러오는 중…</div></div>'; }

  v.innerHTML = head + foePanel + rankPanel;
};

/* 아레나 전투 결과 모달 */
G.ui.renderRanking = function(){
  var v=el("view-ranking");
  // 온라인이면 서버 랭킹을 주기적으로 갱신(15초 스로틀, 갱신 완료 시 자동 재렌더)
  if(G.net && G.net.online()){
    var now=Date.now();
    if(!G.ranking._lastFetch || now-G.ranking._lastFetch>15000){
      G.ranking._lastFetch=now;
      G.net.refreshRanking();
    }
  }
  var vw=G.ranking.view();
  function mini(c){ if(!(G.avatar&&G.avatar.miniHTML)) return ""; var id=c.me?G.avatar.currentId():c.avatar; return G.avatar.miniHTML(id,45); }
  function band(c){
    var medal = c.rank===1?"🥇":(c.rank===2?"🥈":(c.rank===3?"🥉":"#"+c.rank));
    if(c.me){
      return '<div class="tower-floor me">'+
        '<div class="tf-glow"></div><div class="tf-door"></div>'+
        '<div class="tf-arrow l">◀</div><div class="tf-arrow r">▶</div>'+
        '<div class="tf-climber"></div>'+
        '<div class="tf-num">'+c.floor+'층</div>'+
        '<div class="tf-who me">'+mini(c)+' '+esc(c.name)+' <span class="tag r-uncommon">'+medal+'</span></div>'+
      '</div>';
    }
    return '<div class="tower-floor'+(c.rank<=3?" elite":"")+'">'+
      '<span class="tf-lamp l"></span><span class="tf-lamp r"></span>'+
      '<div class="tf-num">'+c.floor+'층</div>'+
      '<div class="tf-who">'+medal+' '+mini(c)+' '+esc(c.name)+'</div>'+
    '</div>';
  }
  v.innerHTML=
    '<div class="panel"><h2>🏯 무한의 탑 <span class="muted" style="font-size:.7rem">랭킹 · 최고 도달 층</span></h2>'+
      '<div class="muted" style="margin-bottom:8px">내 순위 <b class="gold">'+vw.me.rank+'위</b> <span style="opacity:.7">/ '+vw.total+'명</span></div>'+
      '<div class="tower">'+
        '<div class="tower-spire">👑</div><div class="tower-roof"></div>'+
        '<div class="tower-body">'+
          vw.top.map(band).join("")+
          (vw.gap?'<div class="tower-gap">⋯</div>':'')+
          vw.around.map(band).join("")+
        '</div>'+
        '<div class="tower-base">⛰️ 도전자 '+vw.total+'명</div>'+
      '</div>'+
    '</div>';
};

/* ---------- 약관 ---------- */
G.ui.renderSettings = function(){
  var v=el("view-settings");
  v.innerHTML=
    '<div class="panel"><h2>⚙️ 설정</h2>'+
      '<div class="row">'+
        '<button class="btn '+(G.state.muted?"":"primary")+'" data-act="toggle-mute">'+(G.state.muted?"🔇 사운드 꺼짐":"🔊 사운드 켜짐")+'</button>'+
        '<button class="btn '+(G.state.shake===false?"":"primary")+'" data-act="toggle-shake">'+(G.state.shake===false?"📴 화면흔들림 꺼짐":"📳 화면흔들림 켜짐")+'</button>'+
      '</div>'+
      (function(){
        var bv=Math.round((G.state.bgmVol!=null?G.state.bgmVol:0.32)*100);
        var sv=Math.round((G.state.sfxVol!=null?G.state.sfxVol:0.55)*100);
        var dim=G.state.muted?' style="opacity:.45"':'';
        return '<div'+dim+' id="vol-controls">'+
          '<div class="row" style="align-items:center; gap:8px; margin-top:12px">'+
            '<span style="width:84px">🎵 배경음</span>'+
            '<input type="range" min="0" max="100" value="'+bv+'" data-vol="bgm" style="flex:1">'+
            '<span class="muted" id="bgmvol-lbl" style="width:42px; text-align:right">'+bv+'%</span>'+
          '</div>'+
          '<div class="row" style="align-items:center; gap:8px; margin-top:6px">'+
            '<span style="width:84px">⚔️ 효과음</span>'+
            '<input type="range" min="0" max="100" value="'+sv+'" data-vol="sfx" style="flex:1">'+
            '<span class="muted" id="sfxvol-lbl" style="width:42px; text-align:right">'+sv+'%</span>'+
          '</div>'+
        '</div>';
      })()+
      '<p class="muted" style="margin-top:10px">진행 상황은 자동 저장됩니다. 방치 중에도 상점에서 손님이 물건을 구매합니다.</p>'+
    '</div>'+
    (function(){
      var on=G.net && G.net.online();
      var conf=G.net && G.net.configured();
      var status, body;
      if(on){
        status='<span class="r-uncommon">🟢 온라인</span>';
        var guest=G.net.isGuest();
        var acct;
        if(guest){
          acct='<div class="row" style="align-items:center; gap:8px; margin-top:10px">'+
                 '<span style="width:84px">계정</span>'+
                 '<b style="flex:1">🎫 게스트</b>'+
               '</div>'+
               '<p class="muted" style="margin:6px 0 8px; color:#ffb86a">⚠️ 게스트는 <b>이 기기에서만</b> 이어집니다. 브라우저 데이터를 지우거나 다른 기기로 가면 진행도를 잃습니다.</p>'+
               '<div class="row">'+
                 '<button class="btn primary" data-act="acct-signup" style="flex:1">📧 계정 만들기(이어하기)</button>'+
                 '<button class="btn" data-act="acct-login" style="flex:1">🔑 로그인</button>'+
               '</div>';
        } else {
          acct='<div class="row" style="align-items:center; gap:8px; margin-top:10px">'+
                 '<span style="width:84px">계정</span>'+
                 '<b style="flex:1; word-break:break-all">📧 '+esc(G.net.email||"")+'</b>'+
                 '<button class="btn sm" data-act="acct-logout">로그아웃</button>'+
               '</div>'+
               '<p class="muted" style="margin-top:6px">✅ 어느 기기에서나 이 계정으로 로그인하면 이어집니다.</p>';
        }
        body='<div class="row" style="align-items:center; gap:8px; margin-top:8px">'+
               '<span style="width:84px">닉네임</span>'+
               '<b class="gold" style="flex:1">'+esc(G.net.nickname||"미설정")+'</b>'+
               '<button class="btn sm" data-act="change-nick">변경</button>'+
             '</div>'+
             acct+
             '<p class="muted" style="margin-top:8px">채팅·랭킹·세이브가 클라우드에 동기화됩니다 ☁️</p>';
      } else if(conf){
        status='<span class="muted">🟡 연결 중/실패</span>';
        body='<p class="muted" style="margin-top:8px">서버에 연결하지 못했습니다.</p>'+
             '<div class="row" style="margin-top:8px"><button class="btn primary" data-act="net-retry">🔄 재연결</button></div>';
      } else {
        status='<span class="muted">⚪ 오프라인</span>';
        body='<p class="muted" style="margin-top:8px">멀티플레이(채팅·랭킹·클라우드 세이브)를 켜려면 <b>js/supa_config.js</b>에 Supabase 주소와 키를 입력하세요.</p>';
      }
      return '<div class="panel"><h2>🌐 멀티플레이 '+status+'</h2>'+body+'</div>';
    })()+
    '<div class="panel"><h2>🎯 획득 필터</h2>'+
      '<div class="muted" style="margin-bottom:8px">끈 등급은 던전에서 줍지 않습니다(폐기).</div>'+
      '<div class="row">'+
        G.DATA.RARITY.map(function(rar){
          var on=G.state.pickup[rar.key]!==false;
          return '<button class="btn sm" data-act="pickup-toggle" data-rar="'+rar.key+'" style="'+(on?'':'opacity:.4; text-decoration:line-through')+'">'+
            '<b class="'+rar.cls+'">'+rar.label+'</b> '+(on?'<span class="r-uncommon">획득</span>':'<span class="muted">폐기</span>')+'</button>';
        }).join("")+
      '</div>'+
    '</div>'+
    '<div class="panel"><h2>ℹ️ 도움말</h2>'+
      '<p class="muted" style="line-height:1.7">'+
        '1. <b>던전</b>에서 스테이지(□─□─■)를 골라 전진하며 사냥<br>'+
        '2. <b>가방</b>에서 아이템을 <b>착용</b>하거나 <b>진열</b><br>'+
        '3. <b>상점</b>에서 가격을 정하면 손님이 구매<br>'+
        '4. 골드로 장비를 모으고 상점을 키워 더 깊은 층 도전!'+
      '</p>'+
      '<p style="margin-top:10px"><b data-act="view-terms" style="color:var(--torch); text-decoration:underline; cursor:pointer">📜 이용약관 및 개인정보 처리방침</b></p>'+
    '</div>';
};

/* ---------- 현재 탭 렌더 ---------- */
