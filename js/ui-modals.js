/* ui-modals.js — 모달/오버레이 (해금·비교·가격·약관·시작·로그인·아레나결과·푸시). ui.js에서 분리. */
var G = window.G;

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
G.ui.arenaResultModal = function(out){
  var win=out.res.win, sc=out.score, foe=out.foe, rw=out.reward||{coins:0,gold:0};
  var reduced=false; try{ reduced=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){}
  var myMax=Math.max(1, (G.totalStats?Math.round(G.totalStats().maxHp):out.res.meHp)||1);
  var mePct=Math.max(0,Math.min(100, Math.round(out.res.meHp/myMax*100)));
  var foePct=Math.max(0,Math.min(100, Math.round(out.res.foeHp/(foe.maxHp||1)*100)));
  var tierBanner='';
  if(out.tierChange===1) tierBanner='<div class="tier-banner up">🎖️ 승급! '+G.arena.TIERS[out.tierAfter].icon+' '+G.arena.TIERS[out.tierAfter].name+' 진입</div>';
  else if(out.tierChange===-1) tierBanner='<div class="tier-banner down">⬇️ 강등 — '+G.arena.TIERS[out.tierAfter].icon+' '+G.arena.TIERS[out.tierAfter].name+'</div>';

  var SK={}; (G.DATA.SKILLS||[]).forEach(function(s){SK[s.id]=s;});
  var logRows=(out.res.rounds||[]).map(function(r){
    var side=r.who==="me"?'<span class="r-uncommon">나</span>':'<span style="color:var(--hp)">'+esc(foe.name||"상대")+'</span>';
    if(r.stun) return '<div class="ar-log">'+side+' 💫 기절 — 행동 불가</div>';
    if(r.skill==="guard") return '<div class="ar-log">'+side+' 🪖 가시 방패 (받피↓·반사↑)</div>';
    var sk=r.skill&&SK[r.skill]?(SK[r.skill].ico+' '):'';
    var dmg=r.dodge?'<span style="color:#7fe0ff">회피!</span>':(G.ui.fmt(r.dmg)+(r.crit?' 💥':''));
    var rf=r.refl?' <span style="color:#ffd86a">↩'+G.ui.fmt(r.refl)+'</span>':'';
    return '<div class="ar-log">'+side+' '+sk+'→ '+dmg+rf+'</div>';
  }).join("");

  var ov=document.createElement("div"); ov.className="modal-overlay show";
  ov.innerHTML='<div class="modal" style="text-align:center; width:min(400px,93vw)">'+
    '<div style="font-size:2.6rem">'+(win?"🏆":"💀")+'</div>'+
    '<h2 style="color:'+(win?"var(--gold)":"var(--hp)")+'; margin:2px 0">'+(win?"승리!":"패배")+'</h2>'+
    tierBanner+
    '<div class="muted" style="margin:6px 0; display:flex; align-items:center; justify-content:center; gap:6px; flex-wrap:wrap">vs '+((G.avatar&&G.avatar.miniHTML)?G.avatar.miniHTML(foe.avatar,52):"")+' '+esc(foe.name||"도전자")+' '+G.arena.tierBadge(foe.score||1000,true)+'</div>'+
    '<div class="ar-hpwrap"><span class="muted">나</span><div class="ar-hp"><div class="ar-hp-fill me" style="width:'+(reduced?mePct:100)+'%"></div></div></div>'+
    '<div class="ar-hpwrap"><span class="muted">상대</span><div class="ar-hp"><div class="ar-hp-fill foe" style="width:'+(reduced?foePct:100)+'%"></div></div></div>'+
    '<div style="font-size:1.2rem; margin:10px 0; font-weight:800">아레나 점수 '+
      '<span class="'+(sc.delta>=0?"r-uncommon":"")+'" style="'+(sc.delta<0?"color:var(--hp)":"")+'">'+(sc.delta>=0?"+":"")+sc.delta+'</span>'+
      ' → <b class="gold">'+G.ui.fmt(sc.score)+'</b></div>'+
    '<div class="ar-reward">'+
      (rw.gold>0?'<span>🪙 +'+G.ui.fmt(rw.gold)+'</span>':'')+
      '<span>🏅 코인 +'+G.ui.fmt(rw.coins)+'</span>'+
      (win&&out.streak>1?'<span>🔥 '+out.streak+'연승</span>':'')+
    '</div>'+
    '<details class="ar-detail"><summary>전투 기록 ('+(out.res.rounds||[]).length+'턴)</summary><div class="ar-logbox">'+logRows+'</div></details>'+
    '<button class="btn primary full" style="margin-top:12px" data-modal-close>확인</button>'+
  '</div>';
  document.body.appendChild(ov);
  if(!reduced){ requestAnimationFrame(function(){ requestAnimationFrame(function(){
    var mf=ov.querySelector(".ar-hp-fill.me"), ff=ov.querySelector(".ar-hp-fill.foe");
    if(mf) mf.style.width=mePct+"%"; if(ff) ff.style.width=foePct+"%";
  }); }); }
  ov.addEventListener("click", function(e){ if(e.target.closest("[data-modal-close]")||e.target===ov) ov.remove(); });
};

/* 아레나 코인 상점 */
G.ui.arenaShopModal = function(){
  var a=G.arena.ensure();
  function itemRow(it){
    var afford=(a.coins||0)>=it.cost;
    return '<div class="item">'+
      '<div class="ico">'+it.ico+'</div>'+
      '<div class="info"><div class="iname">'+esc(it.name)+'</div><div class="idesc muted">'+esc(it.desc)+'</div></div>'+
      '<div class="iacts"><button class="btn sm '+(afford?'primary':'')+'" data-act="arena-buy" data-key="'+it.key+'" '+(afford?'':'disabled')+'>🏅'+it.cost+'</button></div>'+
    '</div>';
  }
  var ov=document.createElement("div"); ov.className="modal-overlay show";
  ov.innerHTML='<div class="modal" style="width:min(420px,93vw)">'+
    '<h2 style="display:flex; align-items:center; justify-content:space-between">🛒 아레나 상점 <span class="gold" style="font-size:.9rem">🏅 '+G.ui.fmt(a.coins||0)+'</span></h2>'+
    '<div class="muted" style="font-size:.72rem; margin-bottom:8px">아레나 코인으로 구매합니다. 도전 보상·일일 미션으로 코인을 모으세요.</div>'+
    '<button class="btn primary full" style="margin-bottom:10px" data-act="cape-open">🧥 망토 강화소 (아레나 전용 장비)</button>'+
    G.arena.SHOP.map(itemRow).join("")+
    '<button class="btn full" style="margin-top:12px" data-modal-close>닫기</button>'+
  '</div>';
  document.body.appendChild(ov);
  ov.addEventListener("click", function(e){ if(e.target.closest("[data-modal-close]")||e.target===ov) ov.remove(); });
};

/* ============================================================
   랭킹 뷰
   ============================================================ */
/* 가방 옵션(스탯) 필터 선택 — 다크 모달(네이티브 select 흰색 팝업 회피) */
G.ui.bagStatPickModal = function(){
  var cur=G.state.ui.bagFilterStat||"all";
  var keys=G.DATA.STAT_KEYS||Object.keys(G.DATA.STAT_META);
  function opt(k,label){ return '<button class="btn statopt'+(cur===k?' primary':'')+'" data-act="bag-filter-stat" data-key="'+k+'">'+esc(label)+(cur===k?' ✓':'')+'</button>'; }
  var grid=opt("all","전체 옵션")+keys.map(function(k){ var m=G.DATA.STAT_META[k]; return m?opt(k,m.label):''; }).join("");
  var ov=document.createElement("div"); ov.className="modal-overlay show";
  ov.innerHTML='<div class="modal" style="width:min(440px,94vw)">'+
    '<h2>🏷️ 옵션 필터</h2>'+
    '<div class="statopt-grid">'+grid+'</div>'+
    '<button class="btn full" style="margin-top:10px" data-modal-close>닫기</button>'+
  '</div>';
  document.body.appendChild(ov);
  ov.addEventListener("click", function(e){ if(e.target.closest("[data-modal-close]")||e.target===ov) ov.remove(); });
};

/* 🧥 망토 구매·강화 모달 */
G.ui.capeModal = function(lastResult){
  var c=G.cape.get(), a=G.arena.ensure();
  var maxed=c.level>=G.cape.LV_MAX;
  function bt(b){ if(!b||(!b.atkPct&&!b.hpPct)) return '없음'; var t=['⚔️공격력 +'+b.atkPct+'%','❤️체력 +'+b.hpPct+'%'];
    if(b.elemAtk)t.push('🔥속성공격 +'+b.elemAtk+'%'); if(b.allRes)t.push('🛡️모든저항 +'+b.allRes+'%'); return t.join(' · '); }
  var cur=G.cape.bonus(), nxt=G.cape.nextBonus(), rate=G.cape.successRate(), cost=G.cape.upCost(c.level+1);
  var resultHtml = lastResult ? (lastResult.success
      ? '<div class="cape-res ok">✨ 강화 성공! → +'+lastResult.level+'</div>'
      : '<div class="cape-res fail">💥 강화 실패 — 🏅'+lastResult.cost+' 소모 (레벨 유지)</div>') : '';
  var pity = c.owned&&!maxed ? (c.fails>0
      ? '<div class="muted" style="font-size:.68rem">연속 실패 '+c.fails+'회 · 보정 +'+(c.fails*G.cape.PITY_STEP)+'%p'+(c.fails>=G.cape.PITY_MAX?' · <b class="r-uncommon">다음 확정!</b>':'')+'</div>'
      : '<div class="muted" style="font-size:.68rem">천장: 실패할수록 확률↑ · 15연속 실패 시 확정</div>') : '';
  var inner;
  if(!c.owned){
    inner='<div class="muted" style="margin:8px 0">아레나 전용 장비. 코인으로 구매 후 강화로 키웁니다.</div>'+
      '<div class="cape-bonus">+1 효과: '+bt(nxt)+'</div>'+
      '<button class="btn primary full" style="margin-top:10px" data-act="cape-buy" '+((a.coins||0)>=G.cape.BUY_COST?'':'disabled')+'>🧥 구매 (🏅'+G.cape.BUY_COST+')</button>';
  } else if(maxed){
    inner='<div class="cape-bonus">현재 +'+c.level+': '+bt(cur)+'</div>'+
      '<div class="r-legend" style="margin-top:10px; font-weight:800">★ 최대 강화 달성 ★</div>';
  } else {
    inner='<div class="cape-bonus">현재 +'+c.level+': '+bt(cur)+'</div>'+
      '<div class="cape-next">→ +'+(c.level+1)+': '+bt(nxt)+'</div>'+
      '<div class="cape-rate">성공률 <b class="gold">'+rate+'%</b> · 비용 🏅'+cost+'</div>'+pity+
      '<button class="btn primary full" style="margin-top:10px" data-act="cape-enhance" '+((a.coins||0)>=cost?'':'disabled')+'>🔨 강화 (+'+(c.level+1)+')</button>';
  }
  var ov=document.createElement("div"); ov.className="modal-overlay show";
  ov.innerHTML='<div class="modal" style="text-align:center; width:min(380px,93vw)">'+
    '<div style="font-size:2.4rem">🧥</div>'+
    '<h2 style="margin:2px 0">망토'+(c.owned?' <span class="gold">+'+c.level+'</span>':'')+'</h2>'+
    '<div class="muted" style="font-size:.72rem">보유 🏅'+G.ui.fmt(a.coins||0)+'</div>'+
    resultHtml + inner +
    '<button class="btn full" style="margin-top:10px" data-modal-close>닫기</button>'+
  '</div>';
  document.body.appendChild(ov);
  ov.addEventListener("click", function(e){ if(e.target.closest("[data-modal-close]")||e.target===ov) ov.remove(); });
};

G.ui.TERMS_VERSION = "1";
G.ui.termsAgreed = function(){ try{ return localStorage.getItem("toweridle_terms")===G.ui.TERMS_VERSION; }catch(e){ return false; } };
G.ui.setTermsAgreed = function(){ try{ localStorage.setItem("toweridle_terms", G.ui.TERMS_VERSION); }catch(e){} };

G.ui.TERMS_HTML =
  '<h3 style="color:var(--gold);margin:14px 0 6px">제1조 (서비스)</h3>'+
  '<p>‘탑아이들’(이하 “게임”)은 무료로 제공되는 텍스트 기반 웹게임입니다. 운영자는 사정에 따라 서비스 내용을 변경하거나 중단할 수 있습니다.</p>'+
  '<h3 style="color:var(--gold);margin:14px 0 6px">제2조 (계정)</h3>'+
  '<p>이용자는 게스트(익명) 또는 이메일 계정으로 게임을 이용합니다. 닉네임, 게임 진행 데이터, 채팅 내용은 서버에 저장됩니다. 게스트 진행도는 해당 기기에서만 유지되며, 브라우저 데이터 삭제 시 복구되지 않을 수 있습니다.</p>'+
  '<h3 style="color:var(--gold);margin:14px 0 6px">제3조 (이용자의 의무)</h3>'+
  '<p>이용자는 다음 행위를 해서는 안 됩니다.</p>'+
  '<ul style="margin:4px 0 0 18px;line-height:1.7">'+
    '<li>욕설·비방·혐오 표현 등 타인에게 불쾌감을 주는 채팅</li>'+
    '<li>비정상적인 방법으로 게임 데이터를 조작하는 행위</li>'+
    '<li>서비스 운영을 방해하거나 서버에 과도한 부하를 유발하는 행위</li>'+
  '</ul>'+
  '<h3 style="color:var(--gold);margin:14px 0 6px">제4조 (게시물 책임)</h3>'+
  '<p>채팅 등 이용자가 작성한 내용에 대한 책임은 작성자 본인에게 있으며, 운영자는 부적절한 게시물을 사전 통지 없이 삭제할 수 있습니다.</p>'+
  '<h3 style="color:var(--gold);margin:14px 0 6px">제5조 (면책)</h3>'+
  '<p>본 게임은 무료로 제공되며, 운영자는 게임 데이터의 손실, 서비스 중단·오류로 인한 손해에 대해 법령이 허용하는 범위에서 책임을 지지 않습니다.</p>'+
  '<h2 style="color:var(--gold);margin:20px 0 6px;font-size:1.15rem">개인정보 처리방침</h2>'+
  '<p><b>수집 항목</b>: 닉네임, 계정 식별자(익명/계정 ID), 계정 생성 시 이메일, 게임 진행 데이터, 채팅 메시지.</p>'+
  '<p><b>이용 목적</b>: 게임 진행 저장, 랭킹 제공, 채팅 기능 제공, 계정 인증.</p>'+
  '<p><b>보관 및 처리</b>: 데이터는 클라우드 서비스(Supabase)에 저장되며, 서비스 제공 기간 동안 보관됩니다. 그 외 제3자에게 제공하지 않습니다.</p>'+
  '<p><b>이용자 권리</b>: 이용자는 본인 데이터의 삭제를 요청할 수 있습니다.</p>'+
  '<p class="muted" style="margin-top:12px;font-size:.78rem">※ 본 약관은 기본 양식이며, 실제 서비스 운영 시 관련 법령에 맞게 보완이 필요할 수 있습니다.</p>';

G.ui.termsModal = function(){
  var ov=document.createElement("div"); ov.className="modal-overlay show"; ov.style.zIndex="300";
  ov.innerHTML='<div class="modal" style="width:min(440px,94vw); text-align:left; max-height:80vh; display:flex; flex-direction:column">'+
    '<h2 style="text-align:center; flex:0 0 auto">📜 이용약관 및 개인정보 처리방침</h2>'+
    '<div style="flex:1; overflow-y:auto; margin-top:10px; font-size:.86rem; line-height:1.6">'+G.ui.TERMS_HTML+'</div>'+
    '<button class="btn primary full" data-modal-close style="margin-top:12px; flex:0 0 auto">닫기</button>'+
  '</div>';
  document.body.appendChild(ov);
  ov.addEventListener("click", function(e){ if(e.target.closest("[data-modal-close]")||e.target===ov) ov.remove(); });
};

/* 메인 시작 화면 — 재접속마다 가장 먼저 표시(배경 즉시, 버튼은 netReady 후).
   복귀(닉네임 있음): "게임 시작" / 신규(온라인·닉네임 없음): 게스트·로그인·가입 */
G.ui.startScreen = function(netReady){
  return new Promise(function(resolve){
    G.paused=true;
    var ov=document.createElement("div"); ov.className="start-screen"; ov.id="start-ov";
    ov.innerHTML='<div class="start-frame" style="background-image:url(assets/topidle.png)">'+
      '<div class="start-bottom" id="start-bottom"><div class="muted" style="text-align:center;padding:14px">불러오는 중…</div></div>'+
    '</div>';
    document.body.appendChild(ov);

    function toNickname(){ if(ov.parentNode) ov.remove(); G.ui.nicknameModal(resolve); }

    var built=false;
    function buildButtons(){
      if(built) return; built=true;
      var bottom=document.getElementById("start-bottom"); if(!bottom) return;
      var online = !!(G.net && G.net.online());
      var nick = (G.net && G.net.nickname) || (G.state && G.state.nickname) || "";
      var returning = !!nick || !online;
      var agreed=G.ui.termsAgreed();
      if(returning){
        bottom.innerHTML=
          '<div class="muted" style="text-align:center; font-size:.92rem">환영합니다'+(nick?', <b class="gold">'+esc(nick)+'</b> 님':'')+'</div>'+
          '<button class="btn primary full" data-start="continue">게임 시작 ▶</button>'+
          (online && G.net.isGuest && G.net.isGuest()
            ? '<button class="btn full" data-start="signup">📧 계정 만들기(다른 기기 이어하기)</button>' : '');
      } else {
        bottom.innerHTML=
          '<label id="terms-row" style="display:flex; align-items:center; gap:8px; justify-content:center; font-size:.85rem; cursor:pointer">'+
            '<input type="checkbox" id="terms-chk"'+(agreed?" checked":"")+' style="width:17px;height:17px;cursor:pointer">'+
            '<span><b data-act="view-terms" style="color:var(--torch); text-decoration:underline; cursor:pointer">이용약관·개인정보 처리방침</b>에 동의합니다</span>'+
          '</label>'+
          '<button class="btn primary full" data-start="guest">🎫 게스트로 시작</button>'+
          '<button class="btn full"         data-start="login">🔑 로그인</button>'+
          '<button class="btn full"         data-start="signup">📧 계정 만들기</button>'+
          '<p class="muted" style="text-align:center; font-size:.78rem; line-height:1.5; margin:2px 0 0">게스트는 <b>이 기기에서만</b> 저장됩니다.<br>계정을 만들면 <b>다른 기기에서도 이어하기</b>가 가능해요.</p>';
        var chk=bottom.querySelector("#terms-chk");
        if(chk){
          var startBtns=[].slice.call(bottom.querySelectorAll("[data-start]"));
          var syncBtns=function(){ startBtns.forEach(function(b){ b.disabled=!chk.checked; b.style.opacity=chk.checked?"":".45"; }); };
          syncBtns(); chk.addEventListener("change", syncBtns);
        }
      }
    }
    // netReady 완료 후 버튼 렌더(+ 6초 백업)
    Promise.resolve(netReady).then(buildButtons, buildButtons);
    setTimeout(buildButtons, 6000);

    ov.addEventListener("click", function(e){
      if(e.target.closest('[data-act="view-terms"]')){ e.preventDefault(); e.stopPropagation(); G.ui.termsModal(); return; }
      var b=e.target.closest("[data-start]"); if(!b) return;
      var mode=b.dataset.start;
      if(mode==="continue"){ G.paused=false; if(ov.parentNode) ov.remove(); resolve(); return; }
      var chk=ov.querySelector("#terms-chk");
      if(chk && !chk.checked){ G.ui.toast("약관에 동의해 주세요"); return; }
      if(chk) G.ui.setTermsAgreed();
      if(mode==="guest"){ toNickname(); }
      else if(mode==="login"){ G.ui.authModal("login"); }
      else if(mode==="signup"){ G.ui.authModal("signup", { onSuccess:function(){ G.net.syncProfile&&G.net.syncProfile(); toNickname(); } }); }
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
