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
  var adv=["critDmg","lifesteal","dodge","penet","multihit","goldFind","thorns","stunResist","elemAtk","allRes","resFire","resCold","resLight","resPoison","potionBoost"]
   .filter(function(k){ return s[k]>0; })
   .map(function(k){ var m=G.DATA.STAT_META[k]; var u=(m.unit!==undefined)?m.unit:(m.pct?"%":"");
     return '<div><span class="k">'+m.label+'</span><b>'+s[k]+u+'</b></div>'; }).join("");
  var advPanel = adv ? '<div class="panel"><h2>✨ 옵션 스탯</h2><div class="stats">'+adv+'</div></div>' : '';

  var runePanel=G.ui._socketPanel();

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

  // 🧥 망토 전용 슬롯(아레나 코인 구매/강화)
  var capeCard=(function(){
    var c=G.cape.get();
    if(!c.owned) return '<div class="eqslot cape-slot" data-act="cape-open" style="cursor:pointer"><div class="slotlbl">🧥 망토</div><div class="muted">아레나 코인으로 구매</div></div>';
    var b=G.cape.bonus();
    return '<div class="eqslot cape-slot r-legend" data-act="cape-open" style="cursor:pointer; border-style:solid; border-left-width:4px">'+
      '<div class="slotlbl">🧥 망토 <span class="gold">+'+c.level+'</span></div>'+
      '<div class="idesc">⚔️+'+b.atkPct+'% ❤️+'+b.hpPct+'%'+(b.elemAtk?' 🔥+'+b.elemAtk+'%':'')+(b.allRes?' 🛡️+'+b.allRes+'%':'')+'</div>'+
      '<button class="btn sm primary" style="margin-top:4px" data-act="cape-open">강화</button>'+
    '</div>';
  })();
  var equipPanel='<div class="panel"><h2>🛡️ 장비</h2><div class="eqgrid">'+slots+capeCard+'</div></div>';

  // 서브 탭
  var sub=G.state.ui.charSub||"stats";
  var subTabs=[["stats","스탯"],["detail","상세"],["equip","장비"],["rune","소켓"],["skill","스킬"],["avatar","아바타"],["collection","컬렉션"],["unlock","해금"]];
  var tabBar='<div class="subtabs">'+subTabs.map(function(t){
    return '<button class="subtab'+(sub===t[0]?" active":"")+'" data-act="char-sub" data-sub="'+t[0]+'">'+t[1]+'</button>';
  }).join("")+'</div>';

  var body = sub==="stats"?statsPanel : sub==="detail"?G.ui._statSheet() : sub==="equip"?equipPanel : sub==="rune"?runePanel : sub==="avatar"?G.ui._avatarPanel() : sub==="collection"?G.ui._collectionPanel() : sub==="unlock"?G.ui._perksHTML() : G.ui._skills();
  v.innerHTML = tabBar + body;
  if(sub==="avatar"||sub==="collection"){   // 미리보기 애니메이션(잠긴 건 정적)
    v.querySelectorAll(".av-prev-inner").forEach(function(el){
      var card=el.closest(".avatar-card");
      if(card && card.classList.contains("locked")) return;
      G.avatar.animatePreview(el);
    });
  }
};

/* 룬워드 보너스 텍스트 */
G.ui.rwBonusTxt = function(w){
  return Object.keys(w.bonus||{}).map(function(k){ var m=G.DATA.STAT_META[k]; return m?(m.label+" +"+w.bonus[k]+(m.pct?"%":"")):""; }).filter(Boolean).join(" · ");
};
/* 아이템 소켓 표시 (◇ 빈칸 / 룬 아이콘) */
G.ui.socketDots = function(it){
  if(!it || !it.sockets || !it.sockets.length) return '';
  return '<span class="sockets">'+it.sockets.map(function(r){
    return r ? '<span class="sock filled" title="'+esc(r.name)+'">'+(r.iconImg?'<img src="'+r.iconImg+'">':'🔹')+'</span>'
             : '<span class="sock empty">◇</span>';
  }).join("")+'</span>';
};

/* 🔩 소켓 패널 — 소켓 장비 + 룬워드 상태 + 룬 장착 진입 */
G.ui._socketPanel = function(){
  var eq=G.state.equipment, cards=[];
  for(var k in eq){ var it=eq[k]; if(!it||!it.sockets) continue;
    var w=G.runeword.ofItem(it);
    cards.push('<div class="eqslot '+(w?"r-legend":"")+'" style="border-style:solid;border-left-width:4px">'+
      '<div class="slotlbl">'+(SLOT_LABELS[it.slot]||it.slot)+(it.type==="weapon"?' ⚔️':' 🛡️')+'</div>'+
      '<div class="iname" style="font-size:.82rem">'+G.ui.icoHTML(it)+' '+esc(it.name)+'</div>'+
      '<div style="margin:4px 0">'+G.ui.socketDots(it)+'</div>'+
      (w?'<div class="rw-active">🔗 <b class="r-legend">'+w.ico+' '+esc(w.name)+'</b><div class="idesc" style="color:var(--gold)">'+G.ui.rwBonusTxt(w)+'</div></div>':'')+
      '<button class="btn sm primary" style="margin-top:4px" data-act="socket-open" data-id="'+it.id+'">🔩 룬 장착</button>'+
    '</div>');
  }
  var runeN=(G.state.inventory||[]).filter(function(x){return x.slot==="rune";}).length;
  var body = cards.length
    ? '<div class="eqgrid">'+cards.join("")+'</div>'
    : '<div class="empty">소켓 있는 장비를 착용하세요.<br><span class="muted">소켓 베이스(접사 없는 장비)는 사냥에서 드랍됩니다.</span></div>';
  return '<div class="panel"><h2>🔩 소켓 <span class="muted" style="font-size:.66rem">보유 룬 '+runeN+'</span></h2>'+
    '<div class="muted" style="font-size:.7rem; margin-bottom:8px">룬을 장비 소켓에 박습니다. 무기=공격효과·방어구=방어효과. 소켓 수(3/4/5)에 맞는 룬 조합 = <b>룬워드</b> 발동.</div>'+
    body+'</div>';
};

/* 아바타 선택 패널 */
G.ui._avatarPanel = function(){
  var cur=G.avatar.currentId();
  var cards=G.DATA.AVATARS.map(function(a){
    var sel=a.id===cur, owned=G.avatar.owned(a);
    var lockLabel=(a.unlock!=null && a.unlock<9999) ? ("🔒 "+a.unlock+"층") : "🎰 뽑기";
    var b=G.avatar.statBonus(a.id), g=G.avatar.gradeOf(a);
    var statTxt='<div class="avatar-stat r-'+(["common","common","rare","epic","legend"][g]||"common")+'">⚔'+b.atkPct+'% ❤'+b.hpPct+'%</div>';
    return '<div class="avatar-card'+(sel?" sel":"")+(owned?"":" locked")+'" data-act="avatar-pick" data-id="'+a.id+'">'+
      '<div class="avatar-prev">'+G.avatar.previewHTML(a)+'</div>'+
      '<div class="avatar-name">'+esc(a.name)+'</div>'+
      statTxt+
      (owned ? (sel?'<div class="avatar-badge">선택됨</div>':'')
             : '<div class="avatar-lock">'+lockLabel+'</div>')+
    '</div>';
  }).join("");
  var cb=G.avatar.statBonus(cur);
  return '<div class="panel"><h2>🎭 아바타</h2>'+
    '<div class="muted" style="margin-bottom:10px">전투 화면 외형 + <b class="r-uncommon">장착 스탯</b>(공격%·체력%). 희귀/고층일수록 강함. 현재 <b class="gold">⚔'+cb.atkPct+'% ❤'+cb.hpPct+'%</b></div>'+
    '<div class="avatar-grid">'+cards+'</div>'+
  '</div>';
};

/* 📒 컬렉션 — 🌟 장비 연대기(고유템 도감) + 🎭 아바타 도감 */
G.ui._collectionPanel = function(){
  G.state.collection=G.state.collection||{uniques:{}};
  var disc=G.state.collection.uniques||{};
  var uniques=G.DATA.UNIQUES||[];
  var dN=uniques.filter(function(u){return disc[u.id];}).length;
  function affTxt(u){ return u.affixes.map(function(a){ var m=G.DATA.STAT_META[a.stat]; return m?(m.label+" +"+a.v+(a.pct?"%":"")):""; }).filter(Boolean).join(" · "); }
  var uList=uniques.map(function(u){
    var got=!!disc[u.id];
    var icon = got ? '<img class="icoimg" src="assets/icon/equip/'+u.iconDir+'/'+u.icon+'" alt="">' : '<span class="uniq-q">❔</span>';
    return '<div class="uniq-card'+(got?" got":" locked")+'">'+
      '<div class="uniq-ico">'+icon+'</div>'+
      '<div class="uniq-info">'+
        '<div class="uniq-name '+(got?"r-unique":"muted")+'">'+(got?esc(u.name):"??? 미발견")+'</div>'+
        '<div class="idesc muted">'+(got ? ((SLOT_LABELS[u.slot]||u.slot)+" · "+affTxt(u)) : ("발견 조건: "+u.minFloor+"층+ 보스 처치"))+'</div>'+
      '</div>'+
    '</div>';
  }).join("");
  var equipDex='<div class="panel"><h2>🗡️ 장비 연대기 <span class="muted" style="font-size:.66rem">'+dN+' / '+uniques.length+'</span></h2>'+
    '<div class="muted" style="font-size:.66rem; margin-bottom:8px">보스 처치 시 낮은 확률로 발견하는 고유 장비</div>'+uList+'</div>';

  // 🔗 룬워드 연대기(발견한 것만 공개)
  if(G.runeword&&G.runeword.recordActive) G.runeword.recordActive();   // 현재 발동 중이면 등록
  var rwDisc=(G.state.collection.runewords)||{};
  var rws=G.DATA.RUNEWORDS||[];
  var rwN=rws.filter(function(w){return rwDisc[w.id];}).length;
  function rwBonusTxt(w){ return Object.keys(w.bonus).map(function(k){ var m=G.DATA.STAT_META[k]; return m?(m.label+" +"+w.bonus[k]+(m.pct?"%":"")):""; }).filter(Boolean).join(" · "); }
  var rwList=rws.map(function(w){ var got=!!rwDisc[w.id];
    return '<div class="uniq-card'+(got?" got":" locked")+'">'+
      '<div class="uniq-ico"><span class="uniq-q">'+(got?w.ico:"❔")+'</span></div>'+
      '<div class="uniq-info">'+
        '<div class="uniq-name '+(got?"r-uncommon":"muted")+'">'+(got?esc(w.name):"??? 미발견")+'</div>'+
        '<div class="idesc muted">'+(got?rwBonusTxt(w):"룬 3개 조합으로 발견")+'</div>'+
      '</div></div>';
  }).join("");
  var rwDex='<div class="panel"><h2>🔗 룬워드 연대기 <span class="muted" style="font-size:.66rem">'+rwN+' / '+rws.length+'</span></h2>'+
    '<div class="muted" style="font-size:.66rem; margin-bottom:8px">룬 3개 조합으로 발견하는 룬워드</div>'+rwList+'</div>';

  var av=G.DATA.AVATARS||[];
  var avOwned=av.filter(function(a){return G.avatar.owned(a);}).length;
  var avList=av.map(function(a){ var owned=G.avatar.owned(a);
    return '<div class="avatar-card dex'+(owned?"":" locked")+'">'+
      '<div class="avatar-prev">'+G.avatar.previewHTML(a)+'</div>'+
      '<div class="avatar-name">'+esc(a.name)+'</div>'+(owned?'<div class="avatar-badge">보유</div>':'')+'</div>';
  }).join("");
  var avDex='<div class="panel"><h2>🎭 아바타 도감 <span class="muted" style="font-size:.66rem">'+avOwned+' / '+av.length+'</span></h2><div class="avatar-grid">'+avList+'</div></div>';
  return equipDex+rwDex+avDex;
};

/* 🎰 외형 뽑기 패널 */
G.ui._gachaPanel = function(){
  G.gacha.ensure();
  var coins=G.arena.coins(), shards=G.gacha.shards(), pool=G.gacha.pool();
  var ownedN=pool.filter(function(a){return G.gacha.isOwned(a);}).length;
  var head='<div class="panel"><h2>🎰 외형 뽑기 <span class="muted" style="font-size:.66rem">코스메틱 · 무스탯</span></h2>'+
    '<div class="stats">'+
      '<div><span class="k">🏅 아레나 코인</span><b class="gold">'+G.ui.fmt(coins)+'</b></div>'+
      '<div><span class="k">🧩 외형 조각</span><b>'+G.ui.fmt(shards)+'</b></div>'+
      '<div><span class="k">보유</span><b>'+ownedN+' / '+pool.length+'</b></div>'+
    '</div>'+
    '<div class="row" style="margin-top:8px">'+
      '<button class="btn primary" style="flex:1" data-act="gacha-pull" data-n="1" '+(coins<G.gacha.COST?"disabled":"")+'>단일 🏅'+G.gacha.COST+'</button>'+
      '<button class="btn gold" style="flex:1" data-act="gacha-pull" data-n="10" '+(coins<G.gacha.COST10?"disabled":"")+'>10연차 🏅'+G.gacha.COST10+'</button>'+
    '</div>'+
    (G.ads && G.ads.available() ? '<button class="btn full" style="margin-top:6px" data-act="ad-gacha">🎬 광고 보고 무료 뽑기 (오늘 '+G.ads.left("gacha")+'회)</button>' : '')+
    '<div class="muted" style="font-size:.64rem; margin-top:6px">10연차=영웅↑ 보장 · '+G.gacha.LEGEND_PITY+'연차 전설 천장 · 중복→조각</div>'+
  '</div>';
  if(!pool.length) return head+'<div class="empty">뽑기 풀이 비어 있습니다.</div>';
  var dex='';
  G.gacha.RARITY.slice().reverse().forEach(function(rd){
    var list=G.gacha.poolByRarity(rd.key); if(!list.length) return;
    var on=list.filter(function(a){return G.gacha.isOwned(a);}).length;
    dex+='<div class="panel"><h3 class="'+rd.cls+'">'+rd.label+' <span class="muted" style="font-size:.62rem">'+on+'/'+list.length+'</span></h3><div class="avatar-grid">'+
      list.map(function(a){ var owned=G.gacha.isOwned(a), ex=G.gacha.EXCHANGE[rd.key];
        return '<div class="avatar-card dex '+rd.cls+(owned?"":" locked")+'">'+
          '<div class="avatar-prev">'+G.avatar.previewHTML(a)+'</div>'+
          '<div class="avatar-name">'+esc(a.name)+'</div>'+
          (owned?'<div class="avatar-badge">보유</div>'
                :'<button class="btn sm" data-act="gacha-exchange" data-id="'+a.id+'" '+(shards<ex?"disabled":"")+'>🧩'+ex+'</button>')+
        '</div>';
      }).join("")+'</div></div>';
  });
  return head+dex;
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
