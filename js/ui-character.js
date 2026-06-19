/* ui-character.js — 캐릭터 탭(스탯/장비/룬/스킬/아바타/해금 서브탭). */
var G = window.G;

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
