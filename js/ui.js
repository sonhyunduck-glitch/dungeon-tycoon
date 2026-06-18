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
function foeAnims(s){ var k=s&&s.dataset&&s.dataset.key; return (k && G.DATA.ENEMY_ANIMS && G.DATA.ENEMY_ANIMS[k])||null; }
function isBigFoe(s){ return s && /(^|\s)es-[a-z_]+($|\s)/.test(s.className) && !/-sm(\s|$)/.test(s.className); }

/* 적 공격 모션 — 공격 프레임 있으면 프레임 재생, 없으면 돌진(lunge) */
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
var SLOT_LABELS={ weapon:"무기", helmet:"투구", armor:"갑옷", gloves:"장갑", boots:"신발", ring:"반지", necklace:"목걸이" };
G.ui.render = function(){
  G.ui.renderHud();
  var tab=G.state.ui.tab;
  if(tab==="dungeon") G.ui.renderDungeon();
  else if(tab==="inventory") G.ui.renderInventory();
  else if(tab==="character") G.ui.renderCharacter();
  else if(tab==="perks") G.ui.renderPerks();
  else if(tab==="shop") G.ui.renderShop();
  else if(tab==="vendor") G.ui.renderVendor();
  else if(tab==="arena") G.ui.renderArena();
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

