/* ui-combat.js — 던전/전투 화면 렌더. ui.js에서 분리. */
var G = window.G;

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

/* 처치 타격 시: 타겟 HP바를 0으로 비움(사망 연출 중 'HP 남은 채 죽음' 방지) */
G.ui.zeroTargetHp = function(){
  var tf=document.querySelector(".target-bar .ebar-fill"); if(tf) tf.style.width="0%";
  var th=document.querySelector(".target-bar .thp"); if(th) th.textContent="0";
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
