/* ui-fx.js — 전투 이펙트·애니메이션·팝업 (ui.js에서 분리). 공용 헬퍼는 ui.js 전역. */
var G = window.G;

G.ui.floatDmg = function(selector, value, crit, color){ floatDmgEl(document.querySelector(selector), value, crit, color); };
/* 광역 데미지: 살아있는 적들에 순서대로 표시 (dmgs[i] ↔ i번째 .arena-foe) */
G.ui.floatDmgAll = function(dmgs, crit){
  document.querySelectorAll(".arena-foe").forEach(function(f,i){
    var v=dmgs && dmgs[i]; if(v==null) return; floatDmgEl(f, v, crit);
  });
};

/* Slash1 스프라이트를 스테이지 좌표(cx,cy)에 1회 재생 */
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

/* 적 반격 → 화면 진동(설정으로 ON/OFF) + 붉은 비네팅 */
G.ui.hurtFx = function(){
  if(!G.state || G.state.shake!==false) retrigger(el("app"),"screen-shake");
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

/* ============================================================
   사이드스크롤 이동 연출 — 전진(배경 스크롤) + 적 걸어 들어오기
   모두 콜백 기반 + transitionend + 타임아웃 폴백(1회만 발화). 이동 구간은 main.js가 animBusy로 잠금.
   ============================================================ */
function _once(fn){ var d=false; return function(){ if(d) return; d=true; fn(); }; }
function _sp(){ return Math.max(1, (G.state&&G.state.battleSpeed)||1); }
function _reduced(){ try{ return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } }
// 비행/부유 몹 — walk 프레임이 없어도 날아 들어오게(idle 날갯짓째 등속 이동). 지상몹은 제자리 페이드(미끄럼=순간이동처럼 보임 방지)
var FLY_KEYS={ bat:1,wasp:1,giant_fly:1,dragonfly:1,wisp:1,harpy:1,eye:1,flying_eye_monster:1,flying_brain_monster:1,
  drake:1,wyvern:1,ghost:1,banshee:1,beholder:1,vargouille:1,fairy:1,faerie_dragon:1,owl:1,parrot:1,raven:1,vulture:1,
  pidgeon_sprite:1,winged_kobold:1,angel:1,archangel:1,fallen_angel:1,succubus:1,gargoyle:1,quasit:1,imp:1,cacodaemon:1,
  intellect_devourer:1,vengeful_spirit:1,attic_whisperer:1 };

/* 플레이어 걷기 토글 — 진짜 walk 프레임 보유 시 #pc-sprite.walk, 없으면 idle 유지(별도 처리 없음) */
G.ui.pcWalk = function(on){
  if(!(G.avatar && G.avatar.hasWalk && G.avatar.hasWalk())) return;   // walk 없는 아바타는 idle 그대로
  var s=el("pc-sprite"); if(!s) return;
  if(on) s.classList.add("walk"); else s.classList.remove("walk");
};

/* 전진: 바닥 그리드를 좌측으로 스크롤(transform), 플레이어 걷기. 완료 후 그리드 0 리셋(40px 배수라 무회귀) */
G.ui.advanceWorld = function(cb){
  cb=cb||function(){};
  var grid=document.querySelector(".arena-bg-grid");
  if(_reduced()){ cb(); return; }   // 모션 최소화: 전진 연출 생략(즉시 진행)
  G.ui.pcWalk(true);
  var fin=_once(function(){
    G.ui.pcWalk(false);
    if(grid){ grid.style.transition="none"; grid.style.setProperty("--gscroll","0px"); void grid.offsetWidth; grid.style.transition=""; grid.style.transitionDuration=""; }
    cb();
  });
  if(!grid){ setTimeout(fin, Math.max(140,420/_sp())); return; }
  var ms=Math.max(160, 600/_sp());
  grid.style.transitionDuration=(ms/1000)+"s";
  grid.style.setProperty("--gscroll","-176px");   // 44px 타일 ×4 = 심리스, 더 또렷한 좌측 이동
  var t=setTimeout(fin, ms+140);
  grid.addEventListener("transitionend", function te(){ grid.removeEventListener("transitionend",te); clearTimeout(t); fin(); }, {once:true});
};

/* 적 등장:
   - 걷기 프레임 보유 적: 우측 화면밖 → 0 으로 '등속(linear)'·충분히 길게 이동(walk 사이클이 보이게) = 진짜 걸어옴
   - 걷기 없는 적: 미끄러뜨리지 않고 제자리 페이드 인(idle 글라이딩=순간이동 슬라이드 방지)
   완료 시 인라인 스타일 정리. transitionend + 타임아웃 폴백(1회 가드). */
G.ui.foeWalkIn = function(cb){
  cb=cb||function(){};
  var foes=document.querySelectorAll(".arena-foe");
  if(!foes.length){ cb(); return; }
  // 모션 최소화(접근성/배터리): 애니메이션 없이 제자리에 즉시 배치(화면밖 잔류 방지)
  if(_reduced()){ foes.forEach(function(f){ f.style.transition="none"; f.style.transform=""; f.style.opacity="1"; }); cb(); return; }
  G.ui.pcWalk(true);   // 몬스터가 우측→좌측으로 걸어오는 동안 유저 캐릭터도 제자리 걷기
  var sp=_sp();
  var walkMs=Math.max(280, 950/sp), fadeMs=Math.max(120, 300/sp), startX=190;
  var fin=_once(function(){ G.ui.pcWalk(false); cb(); }), pending=foes.length;
  foes.forEach(function(f,i){
    var es=f.querySelector(".esprite");
    var hasW=!!(es && foeAnims(es) && foeAnims(es).walk);
    var fly=!hasW && !!(es && es.dataset && FLY_KEYS[es.dataset.key]);   // 비행 몹: walk 없어도 날아 들어옴
    f.style.willChange="transform,opacity";
    var done=_once(function(){
      if(hasW&&es) es.classList.remove("walk");
      f.style.willChange=""; f.style.transition=""; f.style.transitionDuration=""; f.style.transform=""; f.style.opacity="";
      if(--pending<=0) fin();
    });
    if(hasW){
      f.style.transition="none"; f.style.opacity="1"; f.style.transform="translateX("+startX+"px)";
      es.classList.add("walk");
      void f.offsetWidth;
      setTimeout(function(){
        f.style.transition="transform "+(walkMs/1000)+"s linear";   // 등속 = 걷는 속도감
        f.style.transform="translateX(0)";
        var t=setTimeout(done, walkMs+160);
        f.addEventListener("transitionend", function te(){ f.removeEventListener("transitionend",te); clearTimeout(t); done(); }, {once:true});
      }, Math.round(i*130/sp));
    } else if(fly){
      // 비행: idle(날갯짓)째 우측→좌측 등속 이동 = 날아 들어옴
      f.style.transition="none"; f.style.opacity="1"; f.style.transform="translateX("+startX+"px)";
      void f.offsetWidth;
      setTimeout(function(){
        f.style.transition="transform "+(walkMs/1000)+"s linear";
        f.style.transform="translateX(0)";
        var t=setTimeout(done, walkMs+160);
        f.addEventListener("transitionend", function te(){ f.removeEventListener("transitionend",te); clearTimeout(t); done(); }, {once:true});
      }, Math.round(i*130/sp));
    } else {
      f.style.transition="none"; f.style.transform="translateX(0)"; f.style.opacity="0";
      void f.offsetWidth;
      setTimeout(function(){
        f.style.transition="opacity "+(fadeMs/1000)+"s linear";
        f.style.opacity="1";
        var t=setTimeout(done, fadeMs+120);
        f.addEventListener("transitionend", function te(){ f.removeEventListener("transitionend",te); clearTimeout(t); done(); }, {once:true});
      }, Math.round(i*70/sp));
    }
  });
};

/* 씬 진입 컨트롤러 — 새 노드: 전투면 전진→적 워크인, 이벤트/빈 노드면 전진만. 비전투/종료면 즉시 cb.
   (win-branch·doAdvance·enter 공용. targetDied 경로는 이걸 호출하지 않음 → 잔존 적 재워크인 없음) */
G.ui.sceneEnter = function(run, cb){
  cb=cb||function(){};
  if(!run || run.dead || run.cleared){ cb(); return; }
  if(run.combat){
    document.querySelectorAll(".arena-foe").forEach(function(f){ f.style.transition="none"; f.style.opacity="0"; f.style.transform=""; });  // 전진 중 적 숨김(opacity, 플래시/점프 방지)
    G.ui.advanceWorld(function(){ G.ui.foeWalkIn(cb); });
  } else {
    G.ui.advanceWorld(cb);
  }
};

/* 스프라이트 엘리먼트의 모션 키 조회 (data-key → ENEMY_ANIMS) */
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
G.ui.dodgeFx = function(){
  var node=el("hud-hptext"); if(!node) return;
  var r=node.getBoundingClientRect();
  var d=document.createElement("div");
  d.className="float-up"; d.style.left=(r.left+r.width/2)+"px"; d.style.top=(r.top+8)+"px";
  d.style.color="#7fe0ff"; d.textContent="회피!";
  document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 850);
};

/* ---------- HUD ---------- */
