/* ============================================================
   UI 렌더링 + 이벤트 위임
   ============================================================ */
var G = window.G;
G.ui = {};

function el(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

/* ---------- 토스트 ---------- */
G.ui._toastT=null;
G.ui.toast = function(msg){
  var t=el("toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(G.ui._toastT);
  G.ui._toastT=setTimeout(function(){ t.classList.remove("show"); }, 1800);
};

/* ---------- 이펙트 유틸 ---------- */
// 같은 애니메이션을 다시 트리거 (reflow 강제)
function retrigger(node, cls){ if(!node) return; node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

/* 데미지 플로팅 */
function floatDmgEl(node, value, crit, color){
  if(!node) return;
  var r=node.getBoundingClientRect();
  if(r.width===0 && r.height===0) return;   // 화면에 없으면 표시 안 함
  var d=document.createElement("div");
  d.className="float-up"+(crit?" crit":"");
  d.style.left=(r.left+r.width/2)+"px"; d.style.top=(r.top + r.height*0.28)+"px";   // 대상 몸통 위쪽에서 떠오름
  d.style.color=color||(crit?"#ff7a3c":"#ffe14a");
  d.textContent=(crit?"💥":"")+value;
  document.body.appendChild(d);
  setTimeout(function(){ d.remove(); }, 850);
}
G.ui.floatDmg = function(selector, value, crit, color){ floatDmgEl(document.querySelector(selector), value, crit, color); };
/* 광역 데미지: 살아있는 적들에 순서대로 표시 (dmgs[i] ↔ i번째 .arena-foe) */
G.ui.floatDmgAll = function(dmgs, crit){
  document.querySelectorAll(".arena-foe").forEach(function(f,i){
    var v=dmgs && dmgs[i]; if(v==null) return; floatDmgEl(f, v, crit);
  });
};

/* Slash1 스프라이트를 스테이지 좌표(cx,cy)에 1회 재생 */
function spawnSlash(stage, cx, cy, crit){
  var slash=document.createElement("div");
  slash.className="fx-slash-img"+(crit?" crit":"");
  slash.style.left=cx; slash.style.top=cy;
  stage.appendChild(slash);
  setTimeout(function(){ slash.remove(); }, 360);
}
function foeCenter(stage, foe){ var sr=stage.getBoundingClientRect(), er=foe.getBoundingClientRect();
  return { x:(er.left-sr.left+er.width/2)+"px", y:(er.top-sr.top+er.height/2)+"px" }; }

/* 플레이어 공격 → 적 슬래시 + 흔들림 + (치명타) 충격링 (단일 타겟) */
G.ui.attackFx = function(crit){
  var stage=el("combat-stage"); var enemy=el("enemy-emoji");
  if(stage){
    var cx="50%", cy="50%";
    if(enemy){ var c=foeCenter(stage, enemy); cx=c.x; cy=c.y; }
    spawnSlash(stage, cx, cy, crit);
    if(crit){
      var ring=document.createElement("div");
      ring.className="fx-ring"; ring.style.left=cx; ring.style.top=cy;
      stage.appendChild(ring);
      setTimeout(function(){ ring.remove(); }, 520);
    }
  }
  if(enemy){ retrigger(enemy,"hit-enemy"); retrigger(enemy,"flash-red"); }
};
/* 광역 공격 → 살아있는 모든 적에 슬래시 + 흔들림 */
G.ui.attackFxAll = function(crit){
  var stage=el("combat-stage"); if(!stage) return;
  document.querySelectorAll(".arena-foe").forEach(function(f){
    var c=foeCenter(stage, f); spawnSlash(stage, c.x, c.y, crit);
    retrigger(f, "hit-enemy");
  });
};

/* 적 반격 → 화면 진동 + 붉은 비네팅 */
G.ui.hurtFx = function(){
  retrigger(el("app"),"screen-shake");
  retrigger(el("hurt-vignette"),"on");
};

/* 승리 → 골드 플래시 */
G.ui.winFx = function(){ retrigger(el("win-flash"),"on"); };

/* 플레이어 스프라이트 애니메이션 전환 (attack/hurt/death → 끝나면 idle 복귀) */
G.ui.pcAnim = function(state){
  var s=el("pc-sprite"); if(!s) return;
  retrigger(s, state);
  if(state==="death") return;                 // 사망은 마지막 프레임 유지(forwards)
  var dur = state==="attack" ? 440 : 320;     // 끝나면 클래스 제거 → idle 루프 복귀
  setTimeout(function(){ if(s && s.classList) s.classList.remove(state); }, dur);
};

/* 스프라이트 엘리먼트의 모션 키 조회 (data-key → ENEMY_ANIMS) */
function foeAnims(s){ var k=s&&s.dataset&&s.dataset.key; return (k && G.DATA.ENEMY_ANIMS && G.DATA.ENEMY_ANIMS[k])||null; }
function isBigFoe(s){ return s && /(^|\s)es-[a-z_]+($|\s)/.test(s.className) && !/-sm(\s|$)/.test(s.className); }

/* 적 공격 모션 — 공격 프레임 있으면 프레임 재생, 없으면 돌진(lunge) */
G.ui.foeAttackAnim = function(){
  document.querySelectorAll(".arena-foe .esprite").forEach(function(s){
    if(s.classList.contains("die")) return;   // 사망 중인 적은 제외
    s.classList.remove("hurt");               // 피격 모션 중이면 공격 모션으로 전환
    var a=foeAnims(s);
    if(a && a.atk){                          // 프레임 공격 (타겟·비타겟 모두 — big/-sm 모션 CSS 보유)
      retrigger(s, "atk");
      setTimeout(function(){ if(s&&s.classList) s.classList.remove("atk"); }, 520);
    } else {                                 // 폴백: 돌진(모션 없는 종)
      retrigger(s, "foe-attack");
      setTimeout(function(){ if(s&&s.classList) s.classList.remove("foe-attack"); }, 420);
    }
  });
};

/* 적 피격 모션 — 타겟 스프라이트에 hurt 프레임(있으면) 재생 */
G.ui.foeHurtAnim = function(){
  var s=document.querySelector("#enemy-emoji .esprite"); if(!s) return;
  var a=foeAnims(s); if(!(a && a.hurt && isBigFoe(s))) return;
  retrigger(s, "hurt");
  setTimeout(function(){ if(s&&s.classList) s.classList.remove("hurt"); }, 360);
};

/* 적 사망 모션 — 타겟 스프라이트에 die 프레임 재생. 보유 시 지속시간(ms) 반환, 없으면 0 */
G.ui.foeDeathAnim = function(){
  var s=document.querySelector("#enemy-emoji .esprite"); if(!s) return 0;
  var a=foeAnims(s); if(!(a && a.die && isBigFoe(s))) return 0;
  retrigger(s, "die");
  return 720;   // die 애니메이션 길이(css 0.7s)
};

/* 방치 보상 팝업 — 카칭! 💰 */
G.ui.idlePopup = function(gold, sold){
  var ov=document.createElement("div");
  ov.className="modal-overlay show";
  ov.innerHTML=
    '<div class="modal kaching">'+
      '<div class="kaching-coin">💰</div>'+
      '<h2 style="justify-content:center">카칭!</h2>'+
      '<div class="kaching-amt">🪙 +'+G.ui.fmt(gold)+'</div>'+
      '<div class="muted">자리를 비운 동안 주변 상인과의 경쟁을 뚫고<br>손님 '+sold+'명에게 판매했습니다!</div>'+
      '<button class="btn primary full" style="margin-top:14px" data-modal-close>영수증 받기</button>'+
    '</div>';
  ov.addEventListener("click", function(e){
    if(e.target.hasAttribute("data-modal-close")) ov.remove();   // 버튼으로만 닫힘
  });
  document.body.appendChild(ov);
};

/* 통합 해금 알림 모달 — items: [{ico,name,desc,sub}] (스킬/자동화/배속 공용) */
G.ui.unlockModal = function(items){
  if(!items || !items.length) return;
  var rows=items.map(function(it){
    return '<div style="display:flex;align-items:center;gap:12px;text-align:left;padding:10px 12px;border:1px solid var(--glass-brd);border-radius:10px;margin-top:8px;background:rgba(255,255,255,.04)">'+
      '<div style="font-size:34px;flex:0 0 auto">'+G.ui.icoHTML(it)+'</div>'+
      '<div><div style="font-weight:700;font-size:15px">'+it.name+(it.sub?' <span class="muted" style="font-weight:400;font-size:12px">'+it.sub+'</span>':'')+'</div>'+
        '<div class="muted" style="font-size:12px">'+(it.desc||'')+'</div></div>'+
    '</div>';
  }).join("");
  var ov=document.createElement("div"); ov.className="modal-overlay show";
  ov.innerHTML='<div class="modal" style="text-align:center; width:min(420px,92vw)">'+
    '<div style="font-size:42px">✨</div>'+
    '<h2 style="justify-content:center">'+(items.length>1? items.length+'개 해금!' : '해금!')+'</h2>'+
    '<div class="muted">새로운 기능이 열렸습니다 <span style="opacity:.7">(확인 전까지 진행 일시정지)</span></div>'+
    rows+
    '<button class="btn primary full" style="margin-top:14px" data-modal-close>확인</button>'+
  '</div>';
  G.paused=true;   // 해금 모달이 떠 있는 동안 자동 진행 멈춤
  ov.addEventListener("click", function(e){
    if(e.target.hasAttribute("data-modal-close")){ ov.remove(); G.paused=false; }   // 확인 버튼으로만 닫힘
  });
  document.body.appendChild(ov);
};

/* 장착 비교 모달 — 교체 시 스탯 증감 + 전투력 변화 */
G.ui.compareModal = function(id){
  var it=(G.state.inventory.concat(G.state.warehouse.items)).find(function(x){return x.id===id;});
  if(!it || it.identified===false || it.type==="consumable" || !it.slot) return;

  // 교체될 슬롯 + 현재 장비
  var slot=it.slot, cur=null, slotName="";
  if(slot==="rune"){
    var empty=G.DATA.RUNE_SLOTS.filter(function(k){return !G.state.equipment[k];})[0];
    if(empty){ slot=empty; cur=null; slotName="빈 룬 슬롯"; }
    else {
      var minV=Infinity; G.DATA.RUNE_SLOTS.forEach(function(k){ var v=G.inventory.statValue(G.state.equipment[k].stats); if(v<minV){minV=v; slot=k;} });
      cur=G.state.equipment[slot]; slotName="룬(최약 교체)";
    }
  } else { cur=G.state.equipment[slot]; slotName=({weapon:"무기",helmet:"투구",armor:"갑옷",gloves:"장갑",boots:"신발",ring:"반지",necklace:"목걸이"})[slot]||slot; }

  // 스탯별 증감
  var rows=G.DATA.STAT_KEYS.map(function(k){
    var nv=(it.stats[k]||0), cv=(cur?cur.stats[k]||0:0), d=nv-cv;
    if(d===0) return "";
    var m=G.DATA.STAT_META[k], u=(m.unit!==undefined)?m.unit:(m.pct?"%":"");
    var sign=d>0?"+":"−", cls=d>0?"r-uncommon":"r-common";
    var val=m.pct?Math.abs(d):G.ui.fmt(Math.abs(d));
    return '<div class="sheet-row"><span class="k">'+m.label+'</span>'+
      '<span class="muted" style="min-width:60px">'+(m.pct?cv:G.ui.fmt(cv))+u+' → '+(m.pct?nv:G.ui.fmt(nv))+u+'</span>'+
      '<b class="'+cls+'" style="margin-left:auto">'+sign+val+u+'</b></div>';
  }).filter(Boolean).join("");
  if(!rows) rows='<div class="muted">변동 스탯이 없습니다.</div>';

  // 전투력 변화 (실제 시뮬)
  var before=G.power();
  var backup=G.state.equipment[slot]; G.state.equipment[slot]=it;
  var after=G.power();
  G.state.equipment[slot]=backup;
  var pd=after-before, pdTxt=pd>0?'<span class="r-uncommon">+'+G.ui.fmt(pd)+'</span>':(pd<0?'<span class="r-common">−'+G.ui.fmt(Math.abs(pd))+'</span>':'<span class="muted">0</span>');

  var ov=document.createElement("div"); ov.className="modal-overlay show";
  ov.innerHTML='<div class="modal" style="text-align:left; width:min(400px,92vw)">'+
    '<h2 style="justify-content:center; font-size:1.05rem">'+G.ui.icoHTML(it)+' '+esc(it.name)+'</h2>'+
    '<div class="muted" style="text-align:center; margin-bottom:8px">'+slotName+(cur?' 교체 · 현재 '+G.ui.icoHTML(cur)+' '+esc(cur.name):' 장착')+'</div>'+
    '<div class="muted" style="text-align:center; margin-bottom:8px">전투력 '+G.ui.fmt(before)+' → '+G.ui.fmt(after)+' ('+pdTxt+')</div>'+
    '<div class="sheet">'+rows+'</div>'+
    '<div class="row" style="margin-top:14px">'+
      '<button class="btn primary" style="flex:1" data-act="equip" data-id="'+it.id+'" data-modal-close>착용</button>'+
      '<button class="btn" style="flex:1" data-modal-close>닫기</button>'+
    '</div>'+
  '</div>';
  ov.addEventListener("click", function(e){
    var close=e.target.closest("[data-modal-close]");
    if(close){ ov.remove(); }   // 버튼으로만 닫힘
  });
  document.body.appendChild(ov);
};

/* 가판대 가격 설정 — 계산기 모달 (숫자 + K/M/B) */
G.ui.priceModal = function(idx){
  var slot=G.state.shop.slots[idx]; if(!slot) return;
  var base=slot.item.basePrice;
  var val=slot.price||base, fresh=true;

  var ov=document.createElement("div"); ov.className="modal-overlay show";
  var keys=[['7','7'],['8','8'],['9','9'],['del','←'],
            ['4','4'],['5','5'],['6','6'],['k','+K'],
            ['1','1'],['2','2'],['3','3'],['m','+M'],
            ['0','0'],['00','00'],['c','C'],['b','+B']];
  ov.innerHTML='<div class="modal calc-modal" style="width:min(340px,92vw)">'+
    '<h2 style="justify-content:center; font-size:1rem">'+G.ui.icoHTML(slot.item)+' '+esc(slot.item.name)+' 가격</h2>'+
    '<div class="muted" style="text-align:center; margin-bottom:6px">기준가 🪙'+G.ui.fmt(base)+' · 쌀수록 잘 팔림</div>'+
    '<div class="calc-display" id="calc-disp"></div>'+
    '<div class="row" style="gap:4px; margin:8px 0">'+
      '<button class="btn sm" data-preset="0.8">기준×0.8</button>'+
      '<button class="btn sm" data-preset="1">기준가</button>'+
      '<button class="btn sm" data-preset="1.5">기준×1.5</button>'+
    '</div>'+
    '<div class="calc-grid">'+keys.map(function(k){
      var cls=/^[a-z]/.test(k[0])?" op":"";
      return '<button class="calc-btn'+cls+'" data-calc="'+k[0]+'">'+k[1]+'</button>';
    }).join("")+'</div>'+
    '<div class="row" style="margin-top:10px">'+
      '<button class="btn primary" style="flex:1" data-calc="ok">확정</button>'+
      '<button class="btn" style="flex:1" data-modal-close>취소</button>'+
    '</div>'+
  '</div>';

  function draw(){
    el("calc-disp").innerHTML='🪙 <b>'+G.ui.fmt(val)+'</b> <span class="muted" style="font-size:.72rem">('+val.toLocaleString()+')</span>';
  }
  ov.addEventListener("click", function(e){
    if(e.target.closest("[data-modal-close]")){ ov.remove(); return; }   // 버튼으로만 닫힘
    var pre=e.target.closest("[data-preset]");
    if(pre){ val=Math.max(1, Math.round(base*parseFloat(pre.dataset.preset))); fresh=false; draw(); return; }
    var c=e.target.closest("[data-calc]"); if(!c) return;
    var k=c.dataset.calc;
    if(k==="ok"){ G.shop.setPrice(idx, Math.max(1,val)); ov.remove(); G.ui.render(); return; }
    if(/^[0-9]$/.test(k)){ val = fresh ? parseInt(k,10) : Math.min(val*10+parseInt(k,10), 1e15); fresh=false; }
    else if(k==="00"){ val = fresh ? 0 : Math.min(val*100, 1e15); fresh=false; }
    else if(k==="del"){ val=Math.floor(val/10); fresh=false; }
    else if(k==="c"){ val=0; fresh=false; }
    else if(k==="k"){ val=Math.min(val*1000, 1e15); fresh=false; }
    else if(k==="m"){ val=Math.min(val*1e6, 1e15); fresh=false; }
    else if(k==="b"){ val=Math.min(val*1e9, 1e15); fresh=false; }
    draw();
  });
  document.body.appendChild(ov);
  draw();
};

/* 회피 → 캐릭터쪽에 'MISS' 텍스트 */
G.ui.dodgeFx = function(){
  var node=el("hud-hptext"); if(!node) return;
  var r=node.getBoundingClientRect();
  var d=document.createElement("div");
  d.className="float-up"; d.style.left=(r.left+r.width/2)+"px"; d.style.top=(r.top+8)+"px";
  d.style.color="#7fe0ff"; d.textContent="회피!";
  document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 850);
};

/* ---------- HUD ---------- */
var FMT_UNITS=["","K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc"];
function fmt(n){
  n=Math.round(n);
  if(!isFinite(n)) return "∞";
  if(Math.abs(n)<10000) return n.toLocaleString();
  var i=Math.floor(Math.log10(Math.abs(n))/3);
  if(i>=FMT_UNITS.length) return n.toExponential(2);   // 초대형은 지수표기
  var v=n/Math.pow(1000,i);
  return v.toFixed(v<10?2:(v<100?1:0))+FMT_UNITS[i];
}
G.ui.fmt=fmt;
G.ui.renderHud = function(){
  var s=G.totalStats(), p=G.state.player;
  var run=G.state.dungeon.run;
  el("hud-floor").textContent=(run?run.floor:G.state.dungeon.floor)+"층";
  var pct=Math.max(0,(p.hp/s.maxHp)*100);
  el("hud-hpfill").style.width=pct+"%";
  el("hud-hptext").textContent=fmt(p.hp)+"/"+fmt(s.maxHp);
  el("hud-power").textContent=fmt(G.power());
  el("hud-gold").textContent=fmt(p.gold);
  // 하단 메뉴 가방 버튼에 보유/최대 표시
  var invBtn=document.querySelector('.nav-btn[data-tab="inventory"] b');
  if(invBtn){
    var full=G.inventory.isFull();
    invBtn.innerHTML='가방<br><span class="'+(full?"r-legend":"")+'" style="font-size:.82em; opacity:.8; font-weight:400">'+G.state.inventory.length+'/'+G.state.invMax+'</span>';
  }
};

/* ---------- 로그 ---------- */
G.ui.renderLog = function(){
  var box=el("log");
  box.innerHTML=G.state.log.slice(0,60).map(function(l){
    return '<div class="log-line '+l.cls+'">'+esc(l.msg)+'</div>';
  }).join("");
};

/* ---------- 아이템 카드 HTML ---------- */
/* 아이템 아이콘 HTML — 이미지 아이콘 있으면 <img>, 없으면 이모지(미감정은 ❓) */
G.ui.icoHTML = function(it){
  if(!it) return "❓";
  if(it.identified===false) return "❓";
  if(it.iconImg) return '<img class="icoimg" src="'+it.iconImg+'" alt="" loading="lazy">';
  return it.ico||"❓";
};
function itemCard(it, actionsHtml){
  var canCmp = it.identified!==false && it.type!=="consumable" && it.slot;
  return '<div class="item '+it.rarityCls+'">'+
    '<button class="lockbtn'+(it.locked?' on':'')+'" data-act="lock" data-id="'+it.id+'" title="'+(it.locked?'잠금 해제':'잠금(자동진열 제외)')+'">'+(it.locked?'🔒':'🔓')+'</button>'+
    '<div class="ico"'+(canCmp?' data-act="compare" data-id="'+it.id+'" style="cursor:pointer" title="장착 비교"':'')+'>'+G.ui.icoHTML(it)+'</div>'+
    '<div class="info">'+
      '<div class="iname '+it.rarityCls+'">'+esc(it.name)+' <span class="tag">'+it.rarityLabel+'</span></div>'+
      '<div class="idesc">'+G.item.statText(it)+' · 🪙'+G.ui.fmt(it.basePrice)+'</div>'+
    '</div>'+
    '<div class="iacts">'+actionsHtml+'</div>'+
  '</div>';
}

/* ============================================================
   던전 뷰
   ============================================================ */
G.ui.renderDungeon = function(){
  var v=el("view-dungeon");
  var run=G.state.dungeon.run;

  if(!run){ v.innerHTML=G.ui._stageSelect(); return; }
  if(run.dead){ v.innerHTML=G.ui._deadScreen(); return; }
  if(run.cleared){ v.innerHTML=G.ui._clearScreen(); return; }

  // 노드 막대
  var bar=run.nodes.map(function(n,i){
    var cls="node"; if(n.type==="boss") cls+=" boss";
    if(n.done) cls+=" clear";
    else if(i===run.index) cls+=" current torch-glow";
    else if(i>run.index) cls+=" locked";
    var face = n.type==="boss" ? (n.done?"✔":"■") : (n.done?"✔":(i===run.index?"▶":"□"));
    var html='<div class="'+cls+'">'+face+'</div>';
    if(i<run.nodes.length-1) html+='<div class="node-link"></div>';
    return html;
  }).join("");

  var body;
  if(run.combat){
    body=G.ui._combatBox(run.combat);
  } else if(run.event){
    body='<div class="panel"><div class="combat-enemy"><div class="emoji-big">'+
      ({gold:"🪙",potion:"🧪",gear:"🎁"}[run.event.kind]||"❓")+'</div>'+
      '<p style="margin:8px 0">'+esc(run.event.text)+'</p>'+
      '<button class="btn primary full" data-act="node-next">계속 전진 ▶</button></div></div>';
  } else {
    body='<div class="panel"><button class="btn primary full" data-act="node-next">전진 ▶</button></div>';
  }

  v.innerHTML=
    '<div class="panel dungeon-glow combat-header">'+
      '<div style="display:flex; align-items:center; gap:8px">'+
        '<h2 style="margin:0">🏰 '+run.floor+'층</h2>'+
        '<span class="muted" style="font-size:.72rem">노드 '+(run.index+1)+'/'+run.nodes.length+'</span>'+
        (G.maxSpeed()>1?'<button class="btn sm gold" style="margin-left:auto" data-act="speed-cycle">⏩ '+(G.state.battleSpeed||1)+'x</button>':'')+
      '</div>'+
      '<div class="stagebar">'+bar+'</div>'+
    '</div>'+
    body+
    (run.combat ? '' : '<button class="btn danger full" data-act="dungeon-leave">던전 나가기</button>');
};

G.ui._stageSelect = function(){
  var dn=G.state.dungeon;
  var view=dn.floor, maxF=dn.maxFloor||1;
  var floor=G.dungeon.getFloor(view);

  // 층 스테퍼 (◀ N층 ▶ + 최고층 점프)
  var stepper='<div class="row" style="align-items:center; margin-bottom:10px">'+
    '<button class="btn sm" data-act="floor-step" data-d="-10" '+(view<=1?"disabled":"")+'>«</button>'+
    '<button class="btn sm" data-act="floor-step" data-d="-1" '+(view<=1?"disabled":"")+'>◀</button>'+
    '<div style="flex:1; text-align:center; font-weight:800; font-size:1.05rem">'+view+'층 <span class="muted" style="font-weight:400">/ 최고 '+maxF+'층</span></div>'+
    '<button class="btn sm" data-act="floor-step" data-d="1" '+(view>=maxF?"disabled":"")+'>▶</button>'+
    '<button class="btn sm" data-act="floor-step" data-d="10" '+(view>=maxF?"disabled":"")+'>»</button>'+
    '<button class="btn sm gold" data-act="floor-jump">최고</button>'+
  '</div>';

  var power=G.power();
  var rec=floor.recommendPower;
  var diffCls = power>=rec ? "r-uncommon" : (power>=rec*0.7 ? "gold" : "r-legend");

  // 노드 미리보기 (□…■)
  var nodePreview=floor.nodes.map(function(n){return n.type==="boss"?"■":"□";}).join("─");
  var cleared=!!G.state.dungeon.clearedFloors[view];
  var boss=floor.nodes[floor.nodes.length-1].species;
  var stars=G.state.dungeon.stars[view]||0;
  var starStr = '★★★'.slice(0,stars)+'☆☆☆'.slice(0,3-stars);

  var card='<div class="panel dungeon-glow">'+
      '<h2>'+view+'층 '+(cleared?'<span class="tag r-uncommon">클리어</span>':'')+'<span style="color:var(--gold); margin-left:6px; font-size:.9rem">'+starStr+'</span></h2>'+
      '<div class="muted mono" style="margin-bottom:6px">'+nodePreview+'</div>'+
      '<div class="muted" style="margin-bottom:10px">최종 보스 '+boss.emoji+' <b class="r-legend">'+boss.name+'</b> · 노드 '+floor.nodes.length+'칸</div>'+
      (function(){ var fe=G.elementForFloor(view); if(!fe) return '';
        var st=G.totalStats();
        return '<div class="muted r-legend" style="margin-bottom:10px">⚠️ '+fe.emoji+' <b>'+fe.name+'</b> 속성 구간 — <b>속성공격</b>(피해 유지) + <b>'+fe.name+'저항</b>(생존) 필요'+
          ' · 현재 속성공격 '+(st.elemAtk||0)+'% / '+fe.name+'저항 '+(st[fe.res]||0)+'%</div>'; })()+
      '<button class="btn primary full" data-act="enter" data-floor="'+view+'">'+(cleared?"재도전":"입장")+'</button>'+
    '</div>';

  return '<div class="panel">'+
      '<h2>🗺️ 던전 선택</h2>'+
      stepper+
      '<div class="muted">권장 전투력 <b class="'+diffCls+'">'+G.ui.fmt(rec)+'</b> · 내 전투력 '+G.ui.fmt(power)+'</div>'+
    '</div>'+
    card;
};

G.ui._combatBox = function(c){
  var pot=G.state.consumables.potion_s||0;
  var enemies=c.enemies||[];
  var living=enemies.filter(function(e){return e.hp>0;});
  var target=living[0] || enemies[0] || {hp:0,maxHp:1,emoji:"❓",name:"?"};
  var multi=enemies.length>1;

  // 적 스프라이트(또는 이모지) — 아레나 클러스터용
  function foeSprite(e, big){
    var key=e.species && G.DATA.ENEMY_SPRITES && G.DATA.ENEMY_SPRITES[e.species.name];
    if(key) return '<div class="esprite es-'+key+(big?'':'-sm')+'" data-key="'+key+'"></div>';
    return '<div class="'+(big?'emoji-big':'emoji-mid')+'">'+(e.emoji||'❓')+'</div>';
  }

  /* ---- 아레나: 플레이어(좌) ↔ 적 무리(우) 대치 ---- */
  var p=G.state.player, ts=G.totalStats();
  var php=Math.max(0,(p.hp/ts.maxHp)*100);

  var pcSide=
    '<div class="arena-pc">'+
      '<div class="arena-sprite-holder"><div id="pc-sprite"></div><div class="arena-shadow"></div></div>'+
      '<div class="arena-hp pc"><div class="arena-hp-fill" style="width:'+php+'%"></div></div>'+
      '<div class="arena-label me">나</div>'+
    '</div>';

  // 클러스터에는 생존한 적만(최대 5마리 표시). 타겟은 크게+🎯+피격FX 대상(#enemy-emoji)
  var shown=living.slice(0,4);
  var foes=shown.map(function(e){
    var isT=(e===target);
    var fkey=e.species && G.DATA.ENEMY_SPRITES && G.DATA.ENEMY_SPRITES[e.species.name];
    var sf=fkey && G.DATA.SPRITE_FOOT && G.DATA.SPRITE_FOOT[fkey];
    var footPx=sf?Math.round(sf.r*(isT?sf.h:sf.hsm)):0;   // 발밑 그림자: 하단 투명여백만큼 위로
    return '<div class="arena-foe'+(isT?' is-target':'')+'"'+(isT?' id="enemy-emoji"':'')+'>'+
      '<div class="arena-sprite-holder foe">'+ foeSprite(e, isT) +'<div class="arena-shadow" style="bottom:'+footPx+'px"></div></div>'+
    '</div>';
  }).join("");
  var more=living.length>shown.length?'<div class="arena-more">+'+(living.length-shown.length)+'</div>':'';
  var foeSide='<div class="arena-foes">'+foes+more+'</div>';

  var arena='<div class="combat-arena" id="combat-stage">'+ pcSide + foeSide +'</div>';

  /* ---- 타겟 정보 바 ---- */
  var tpct=Math.max(0,(target.hp/target.maxHp)*100);
  var tbar='<div class="target-bar">'+
    '<div class="target-row">'+
      '<span class="tname '+(target.boss?"r-legend":"")+'">🎯 '+(target.element?target.element.emoji+' ':'')+esc(target.name)+(target.boss?" 👑":"")+
        (target.element?' <span class="muted" style="font-size:.66rem">'+target.element.name+'속성</span>':'')+
        (function(){ var ts=G.totalStats(); var em=G.combat.elemMult(ts, target, c.floor);
          if(em>1.05) return ' <span class="r-uncommon" style="font-size:.62rem">약점! ×'+em.toFixed(1)+'</span>';
          if(em<0.95) return ' <span style="color:var(--hp);font-size:.62rem">저항 ×'+em.toFixed(1)+'</span>';
          return ''; })()+'</span>'+
      '<span class="thp">'+fmt(target.hp)+' / '+fmt(target.maxHp)+'</span>'+
    '</div>'+
    '<div class="ebar"><div class="ebar-fill" style="width:'+tpct+'%"></div></div>'+
  '</div>';

  /* ---- 무리 로스터(타겟 외 생존 적 미니바) ---- */
  var roster='';
  if(multi){
    var others=living.filter(function(e){return e!==target;});
    var head='<div class="roster-head">⚔️ 무리 전투 · '+living.length+'/'+enemies.length+' 생존</div>';
    if(others.length){
      var items=others.map(function(e){
        var pc=Math.max(0,(e.hp/e.maxHp)*100);
        return '<div class="roster-item">'+
          '<div class="rname">'+(e.element?e.element.emoji:'')+esc(e.name)+'</div>'+
          '<div class="ebar mini"><div class="ebar-fill" style="width:'+pc+'%"></div></div>'+
        '</div>';
      }).join("");
      roster=head+'<div class="foe-roster">'+items+'</div>';
    } else { roster=head; }
  }

  var stage=arena+tbar+roster;

  // 스킬 쿨다운 표시
  var sd=G.state.skills||{unlocked:{},enabled:{}};
  var chips=G.DATA.SKILLS.filter(function(sk){return sd.unlocked[sk.id]&&sd.enabled[sk.id];}).map(function(sk){
    var cdv=((G.state.dungeon.run&&G.state.dungeon.run.cd)||{})[sk.id]||0;
    return '<span class="skillchip'+(cdv>0?' cd':' ready')+'">'+sk.ico+' '+esc(sk.name)+(cdv>0?' '+cdv+'턴':'')+'</span>';
  }).join("");
  var skillBar = chips ? '<div class="skillbar">'+chips+'</div>' : '';

  // 조작 버튼은 전투 영역 '위쪽'에 고정 — 적 표시 크기가 바뀌어도 위치 불변
  var actions='<div class="row combat-actions">'+
      '<button class="btn primary" style="flex:2" data-act="atk">⚔️ 공격</button>'+
      '<button class="btn" style="flex:1" data-act="potion" '+(pot<=0?"disabled":"")+'>🧪 물약('+pot+')</button>'+
      '<button class="btn danger" style="flex:1" data-act="dungeon-leave">나가기</button>'+
    '</div>';

  return '<div class="panel">'+ actions + skillBar + stage + '</div>';
};

/* 적 HP바만 즉시 갱신 — 데미지 숫자와 동시에 HP가 줄도록(지연 제거). 처치 전까지만 사용 */
G.ui.refreshFoeHp = function(){
  var run=G.state.dungeon.run; if(!run || !run.combat) return;
  var living=run.combat.enemies.filter(function(e){return e.hp>0;});
  var target=living[0]; if(!target) return;
  var tf=document.querySelector(".target-bar .ebar-fill");
  if(tf) tf.style.width=Math.max(0,(target.hp/target.maxHp)*100)+"%";
  var th=document.querySelector(".target-bar .thp");
  if(th) th.textContent=G.ui.fmt(target.hp)+" / "+G.ui.fmt(target.maxHp);
  var others=living.filter(function(e){return e!==target;});
  var bars=document.querySelectorAll(".foe-roster .roster-item .ebar-fill");
  others.forEach(function(e,i){ if(bars[i]) bars[i].style.width=Math.max(0,(e.hp/e.maxHp)*100)+"%"; });
};

/* 가벼운 전투 갱신 — 적이 죽지 않은 일반 턴엔 전체 재렌더 대신 HP바만 갱신
   (스프라이트/공격·피격 애니메이션이 재렌더로 잘리지 않게 보존) */
G.ui.refreshCombat = function(){
  var run=G.state.dungeon.run;
  if(!run || !run.combat){ G.ui.render(); return; }
  var c=run.combat, living=c.enemies.filter(function(e){return e.hp>0;});
  // 적 수가 바뀜(처치 발생) → 진영 재구성 필요 → 전체 재렌더
  if(document.querySelectorAll(".arena-foe").length !== living.length){ G.ui.render(); return; }

  var target=living[0];
  if(target){
    var tf=document.querySelector(".target-bar .ebar-fill");
    if(tf) tf.style.width=Math.max(0,(target.hp/target.maxHp)*100)+"%";
    var th=document.querySelector(".target-bar .thp");
    if(th) th.textContent=G.ui.fmt(target.hp)+" / "+G.ui.fmt(target.maxHp);
  }
  // 로스터 미니바(타겟 외 생존 적) — 순서 동일(처치 없음)
  var others=living.filter(function(e){return e!==target;});
  var bars=document.querySelectorAll(".foe-roster .roster-item .ebar-fill");
  others.forEach(function(e,i){ if(bars[i]) bars[i].style.width=Math.max(0,(e.hp/e.maxHp)*100)+"%"; });
  // 플레이어 아레나 HP바
  var p=G.state.player, ts=G.totalStats();
  var pf=document.querySelector(".arena-hp.pc .arena-hp-fill");
  if(pf) pf.style.width=Math.max(0,(p.hp/ts.maxHp)*100)+"%";
  // 스킬 쿨다운 칩 갱신(스프라이트 미포함 영역)
  var sb=document.querySelector(".skillbar");
  if(sb){
    var sd=G.state.skills||{unlocked:{},enabled:{}};
    sb.innerHTML=G.DATA.SKILLS.filter(function(sk){return sd.unlocked[sk.id]&&sd.enabled[sk.id];}).map(function(sk){
      var cdv=(run.cd||{})[sk.id]||0;
      return '<span class="skillchip'+(cdv>0?' cd':' ready')+'">'+sk.ico+' '+esc(sk.name)+(cdv>0?' '+cdv+'턴':'')+'</span>';
    }).join("");
  }
  G.ui.renderHud();
  G.ui.renderLog();
};

G.ui._deadScreen = function(){
  return '<div class="panel"><div class="combat-enemy">'+
    '<div class="emoji-big">☠️</div>'+
    '<h2 style="justify-content:center">쓰러졌습니다</h2>'+
    '<p class="muted">체력을 회복하고 다시 도전하세요.</p>'+
    '<button class="btn primary full" data-act="dungeon-leave" style="margin-top:10px">마을로 귀환</button>'+
  '</div></div>';
};

G.ui._clearScreen = function(){
  return '<div class="panel dungeon-glow"><div class="combat-enemy">'+
    '<div class="emoji-big torch-glow">🏆</div>'+
    '<h2 style="justify-content:center">스테이지 클리어!</h2>'+
    '<p class="muted">전리품을 정리하거나 다음 스테이지에 도전하세요.</p>'+
    '<button class="btn primary full" data-act="dungeon-leave" style="margin-top:10px">던전 목록으로</button>'+
  '</div></div>';
};

/* ============================================================
   인벤토리 뷰
   ============================================================ */
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
var SLOT_LABELS={ weapon:"무기", helmet:"투구", armor:"갑옷", gloves:"장갑", boots:"신발", ring:"반지", necklace:"목걸이" };
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
  var subTabs=[["stats","📊 스탯"],["detail","📋 상세"],["equip","🛡️ 장비"],["rune","🔮 룬"],["skill","⚔️ 스킬"],["unlock","🔓 해금"]];
  var tabBar='<div class="subtabs">'+subTabs.map(function(t){
    return '<button class="subtab'+(sub===t[0]?" active":"")+'" data-act="char-sub" data-sub="'+t[0]+'">'+t[1]+'</button>';
  }).join("")+'</div>';

  var body = sub==="stats"?statsPanel : sub==="detail"?G.ui._statSheet() : sub==="equip"?equipPanel : sub==="rune"?runePanel : sub==="unlock"?G.ui._perksHTML() : G.ui._skills();
  v.innerHTML = tabBar + body;
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
G.ui.pushAlert = function(msg){
  var wrap=el("push-wrap");
  if(!wrap){ wrap=document.createElement("div"); wrap.id="push-wrap"; document.body.appendChild(wrap); }
  var d=document.createElement("div"); d.className="push-alert"; d.textContent=msg;
  wrap.appendChild(d);
  setTimeout(function(){ d.classList.add("out"); setTimeout(function(){ d.remove(); }, 300); }, 4200);
};

/* ============================================================
   특성 뷰 (자동화)
   ============================================================ */
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
   랭킹 뷰
   ============================================================ */
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
  function band(c){
    var medal = c.rank===1?"🥇":(c.rank===2?"🥈":(c.rank===3?"🥉":"#"+c.rank));
    if(c.me){
      return '<div class="tower-floor me">'+
        '<div class="tf-glow"></div><div class="tf-door"></div>'+
        '<div class="tf-arrow l">◀</div><div class="tf-arrow r">▶</div>'+
        '<div class="tf-climber"></div>'+
        '<div class="tf-num">'+c.floor+'층</div>'+
        '<div class="tf-who me">'+esc(c.name)+' <span class="tag r-uncommon">'+medal+'</span></div>'+
      '</div>';
    }
    return '<div class="tower-floor'+(c.rank<=3?" elite":"")+'">'+
      '<span class="tf-lamp l"></span><span class="tf-lamp r"></span>'+
      '<div class="tf-num">'+c.floor+'층</div>'+
      '<div class="tf-who">'+medal+' '+esc(c.name)+'</div>'+
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

/* 시작 화면 (온라인 첫 실행) — 게스트로 시작 / 로그인 / 계정 만들기 선택.
   닉네임이 정해지거나(게스트·가입) 로그인으로 진행되면 resolve. */
G.ui.startScreen = function(){
  return new Promise(function(resolve){
    G.paused=true;
    var ov=document.createElement("div"); ov.className="modal-overlay show"; ov.id="start-ov";
    ov.innerHTML='<div class="modal" style="text-align:center; width:min(400px,92vw)">'+
      '<div style="font-size:2.8rem; line-height:1">🏰</div>'+
      '<h2 style="margin-top:4px">던전 &amp; 상점 타이쿤</h2>'+
      '<div class="muted" style="margin-top:4px">어서 오세요, 모험가님</div>'+
      '<button class="btn primary full" data-start="guest"  style="margin-top:18px">🎫 게스트로 시작</button>'+
      '<button class="btn full"         data-start="login"  style="margin-top:8px">🔑 로그인</button>'+
      '<button class="btn full"         data-start="signup" style="margin-top:8px">📧 계정 만들기</button>'+
      '<p class="muted" style="margin-top:14px; font-size:.78rem; line-height:1.5">게스트는 <b>이 기기에서만</b> 저장됩니다.<br>계정을 만들면 <b>다른 기기에서도 이어하기</b>가 가능해요.</p>'+
    '</div>';
    document.body.appendChild(ov);

    function toNickname(){ if(ov.parentNode) ov.remove(); G.ui.nicknameModal(resolve); }

    ov.addEventListener("click", function(e){
      var b=e.target.closest("[data-start]"); if(!b) return;
      var mode=b.dataset.start;
      if(mode==="guest"){
        toNickname();                       // 게스트 → 닉네임 설정
      } else if(mode==="login"){
        G.ui.authModal("login");            // 성공 시 페이지 새로고침(시작화면 위에 떠서, 취소 시 시작화면 유지)
      } else if(mode==="signup"){
        G.ui.authModal("signup", { onSuccess:function(){ G.net.syncProfile&&G.net.syncProfile(); toNickname(); } });
      }
    });
  });
};

/* 닉네임 입력 모달 (온라인 최초 1회) — onDone 콜백 */
G.ui.nicknameModal = function(onDone){
  G.paused=true;
  var ov=document.createElement("div"); ov.className="modal-overlay show";
  ov.innerHTML='<div class="modal" style="width:min(380px,92vw)">'+
    '<h2>👋 닉네임 설정</h2>'+
    '<div class="muted" style="margin:8px 0 12px">다른 모험가들에게 보일 이름이에요. (최대 16자)</div>'+
    '<input type="text" id="nick-input" maxlength="16" placeholder="예: 용감한모험가" '+
      'style="width:100%;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.3);border:1px solid var(--glass-brd);color:var(--text);font-size:1rem;outline:none">'+
    '<button class="btn primary full" id="nick-ok" style="margin-top:14px">시작하기</button>'+
  '</div>';
  document.body.appendChild(ov);
  var inp=ov.querySelector("#nick-input");
  setTimeout(function(){ inp.focus(); }, 60);
  function submit(){
    var v=(inp.value||"").trim();
    if(!v){ inp.focus(); return; }
    var btn=ov.querySelector("#nick-ok"); btn.disabled=true; btn.textContent="설정 중...";
    G.net.setNickname(v).then(function(){
      ov.remove(); G.paused=false;
      G.ui.render();
      if(onDone) onDone();
    });
  }
  ov.querySelector("#nick-ok").addEventListener("click", submit);
  inp.addEventListener("keydown", function(e){ if(e.key==="Enter") submit(); });
};

/* 계정 모달 — mode: "signup"(게스트→이메일 전환) | "login"(기존 계정 로그인)
   opts.onSuccess: 성공 시 기본 동작 대신 실행할 콜백(시작 화면에서 사용) */
G.ui.authModal = function(mode, opts){
  opts=opts||{};
  var isSignup = mode==="signup";
  G.paused=true;
  var ov=document.createElement("div"); ov.className="modal-overlay show";
  var inS='width:100%;padding:11px 14px;border-radius:12px;background:rgba(0,0,0,.3);border:1px solid var(--glass-brd);color:var(--text);font-size:.95rem;outline:none;margin-top:8px';
  ov.innerHTML='<div class="modal" style="width:min(380px,92vw);text-align:left">'+
    '<h2 style="text-align:center">'+(isSignup?"📧 계정 만들기":"🔑 로그인")+'</h2>'+
    '<div class="muted" style="margin:8px 0 4px;text-align:center;font-size:.85rem">'+
      (isSignup?"이메일 계정으로 전환하면 <b>다른 기기에서도 이어하기</b>가 됩니다. 지금 진행도는 그대로 유지돼요."
              :"기존 이메일 계정으로 로그인합니다.<br><span style=\"color:#ffb86a\">이 기기의 게스트 진행도는 해당 계정 진행도로 교체됩니다.</span>")+'</div>'+
    '<input id="auth-email" type="email" placeholder="이메일" autocomplete="username" style="'+inS+'">'+
    '<input id="auth-pw" type="password" placeholder="비밀번호 (6자 이상)" autocomplete="'+(isSignup?"new-password":"current-password")+'" style="'+inS+'">'+
    '<div id="auth-msg" style="color:#ff8a8a;min-height:18px;margin-top:8px;font-size:.82rem"></div>'+
    '<div class="row" style="margin-top:6px">'+
      '<button class="btn" id="auth-cancel" style="flex:1">취소</button>'+
      '<button class="btn primary" id="auth-ok" style="flex:1">'+(isSignup?"계정 만들기":"로그인")+'</button>'+
    '</div>'+
  '</div>';
  document.body.appendChild(ov);
  var emailI=ov.querySelector("#auth-email"), pwI=ov.querySelector("#auth-pw"), msg=ov.querySelector("#auth-msg");
  setTimeout(function(){ emailI.focus(); }, 60);
  function close(){ ov.remove(); G.paused=false; }
  ov.querySelector("#auth-cancel").addEventListener("click", close);
  function submit(){
    var btn=ov.querySelector("#auth-ok"); msg.textContent="";
    btn.disabled=true; btn.textContent="처리 중...";
    var done=function(r){
      if(!r.ok){ msg.textContent="⚠️ "+r.msg; btn.disabled=false; btn.textContent=isSignup?"계정 만들기":"로그인"; return; }
      if(isSignup){
        ov.remove();   // G.paused는 콜백/닉네임 흐름이 관리
        G.ui.toast(r.needConfirm?"메일 확인 후 완료됩니다 📧":"계정 생성 완료 ✅");
        if(opts.onSuccess){ opts.onSuccess(); return; }
        G.paused=false;
        G.net.syncProfile&&G.net.syncProfile();
        G.ui.render();
      } else {
        if(opts.onSuccess){ ov.remove(); opts.onSuccess(); return; }
        G.ui.toast("로그인 완료, 진행도 불러오는 중...");
        setTimeout(function(){ location.reload(); }, 500);
      }
    };
    if(isSignup) G.net.signUpEmail(emailI.value, pwI.value).then(done);
    else         G.net.loginEmail(emailI.value, pwI.value).then(done);
  }
  ov.querySelector("#auth-ok").addEventListener("click", submit);
  pwI.addEventListener("keydown", function(e){ if(e.key==="Enter") submit(); });
};

/* ============================================================
   설정 뷰
   ============================================================ */
G.ui.renderSettings = function(){
  var v=el("view-settings");
  v.innerHTML=
    '<div class="panel"><h2>⚙️ 설정</h2>'+
      '<div class="row">'+
        '<button class="btn" data-act="save">💾 저장</button>'+
        '<button class="btn" data-act="export">📤 내보내기</button>'+
        '<button class="btn" data-act="import">📥 가져오기</button>'+
        '<button class="btn danger" data-act="reset">🗑️ 초기화</button>'+
      '</div>'+
      '<div class="row" style="margin-top:10px">'+
        '<button class="btn '+(G.state.muted?"":"primary")+'" data-act="toggle-mute">'+(G.state.muted?"🔇 사운드 꺼짐":"🔊 사운드 켜짐")+'</button>'+
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
        body='<p class="muted" style="margin-top:8px">서버에 연결하지 못했습니다. 새로고침하거나 설정(js/supa_config.js)을 확인하세요.</p>';
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
    '</div>';
};

/* ---------- 현재 탭 렌더 ---------- */
G.ui.render = function(){
  G.ui.renderHud();
  var tab=G.state.ui.tab;
  if(tab==="dungeon") G.ui.renderDungeon();
  else if(tab==="inventory") G.ui.renderInventory();
  else if(tab==="character") G.ui.renderCharacter();
  else if(tab==="perks") G.ui.renderPerks();
  else if(tab==="shop") G.ui.renderShop();
  else if(tab==="vendor") G.ui.renderVendor();
  else if(tab==="ranking") G.ui.renderRanking();
  else if(tab==="settings") G.ui.renderSettings();
  G.ui.renderLog();
};

/* ---------- 탭 전환 ---------- */
G.ui.switchTab = function(tab){
  if(!el("view-"+tab)) tab="dungeon";   // 삭제된 탭(예: market) 방어
  // 던전 진행 중 다른 영역으로 이동 → 전투/탐험 종료(귀환)
  if(tab!=="dungeon" && G.state.dungeon.run){
    G.dungeon.leave();
    G.log("🚪 던전에서 나왔습니다. 진행이 종료되었습니다.","");
    G.save.save(true);
  }
  G.state.ui.tab=tab;
  document.querySelectorAll(".nav-btn").forEach(function(b){ b.classList.toggle("active", b.dataset.tab===tab); });
  document.querySelectorAll(".view").forEach(function(s){ s.classList.remove("active"); });
  el("view-"+tab).classList.add("active");
  if(tab==="shop") G.shop.settleIdle(); // 상점 진입 시 방치 정산
  G.ui.render();
};
