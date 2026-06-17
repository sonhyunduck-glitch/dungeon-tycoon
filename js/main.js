/* ============================================================
   진입점 — 초기화, 이벤트 위임, 자동저장, 상점 틱
   ============================================================ */
(function(){
  var G = window.G;

  /* ---------- 전투/전진 (수동·자동 공용) ---------- */
  var animBusy=false;   // 사망/승리/패배 연출 진행 중 — 다음 공격(자동·수동) 차단
  function doAttack(){
    var run=G.state.dungeon.run;
    if(!run || !run.combat) return;
    if(animBusy || G.paused) return;   // 연출 중·해금 모달 일시정지 중엔 공격 안 함
    var preTarget=run.combat.enemies.filter(function(e){return e.hp>0;})[0];  // 공격 전 타겟
    var res=G.combat.attack();
    var targetDied=!!(preTarget && preTarget.hp<=0);
    var hits=res.hits||[];
    var eh=null, ph=null;
    for(var i=0;i<hits.length;i++){ if(hits[i].target==="enemy") eh=hits[i]; else ph=hits[i]; }

    var sp=Math.max(1, G.state.battleSpeed||1);   // 배속에 맞춰 연출 지연 단축
    // 0) 즉시: 플레이어 공격 모션 + 공격 효과음
    G.ui.pcAnim("attack");
    if(G.audio) G.audio.play("sword");
    // 1) 즉시: 적 피격 슬래시 + 피격 모션(타겟 생존 시)
    if(eh){
      if(eh.aoe){ G.ui.attackFxAll(eh.crit); G.ui.floatDmgAll(eh.dmgs, eh.crit); G.ui.refreshFoeHp(); }   // 광역: 모든 적에 FX/데미지
      else { G.ui.attackFx(eh.crit); G.ui.floatDmg("#enemy-emoji", eh.value, eh.crit); if(!targetDied){ G.ui.refreshFoeHp(); G.ui.foeHurtAnim(); } }
    }
    // 2) 살짝 뒤: 적 반격 → 적 전원 공격 모션 + 화면 진동 + 플레이어 피격 모션 (회피 시엔 진동 없이 표시)
    if(ph){ setTimeout(function(){
      G.ui.foeAttackAnim();   // 적 공격 모션(프레임 or 돌진)
      if(ph.dodge){ G.ui.dodgeFx(); }
      else { G.ui.hurtFx(); G.ui.pcAnim("hurt"); G.ui.floatDmg("#pc-sprite", ph.value, false, "#ff6a6a"); }
    }, 170/sp); }
    // HUD 숫자(체력/골드)는 즉시 갱신
    G.ui.renderHud();

    // 처치 후 다음 몬스터 등장까지 추가 지연(배속에 따라 단축, 최소 250ms)
    var nextGap=Math.round(Math.max(250, 600/sp));
    // 3) 결과 처리 (슬래시 보여준 뒤 본문 렌더)
    if(res.over && res.win){
      animBusy=true;
      var ddw=G.ui.foeDeathAnim();   // 마지막 적 사망 모션(있으면)
      setTimeout(function(){ G.dungeon.advance(); G.ui.render(); animBusy=false; }, Math.max(360/sp, ddw)+nextGap);
    } else if(res.over && res.dead){
      animBusy=true;
      G.ui.pcAnim("death");   // 사망 모션(7프레임 .7s) 재생 후 사망 화면으로
      setTimeout(function(){ G.ui.render(); G.save.save(true); animBusy=false; }, 820);
    } else if(targetDied){
      // 타겟 처치(전투 계속): 사망 연출 + 다음 몬스터 등장 지연만큼 잠금
      animBusy=true;
      var dd=G.ui.foeDeathAnim();
      setTimeout(function(){ G.ui.refreshCombat(); animBusy=false; }, Math.max(220/sp, dd)+nextGap);
    } else {
      // 일반 턴: 스프라이트/애니메이션 보존을 위해 HP바만 갱신
      setTimeout(function(){ G.ui.refreshCombat(); }, 220/sp);
    }
  }
  function doAdvance(){ G.dungeon.advance(); G.ui.render(); }

  /* ---------- 액션 핸들러 ---------- */
  var actions = {
    /* 던전 */
    "floor-step": function(d){
      var dn=G.state.dungeon;
      dn.floor = Math.max(1, Math.min(dn.maxFloor||1, dn.floor + parseInt(d.d,10)));
      G.ui.render();
    },
    "floor-jump": function(){ G.state.dungeon.floor=G.state.dungeon.maxFloor||1; G.ui.render(); },
    "enter": function(d){ G.dungeon.enter(d.floor); G.ui.render(); },
    "node-next": doAdvance,
    "dungeon-leave": function(){ G.dungeon.leave(); G.ui.render(); G.save.save(true); },
    "speed-cycle": function(){ var m=G.maxSpeed(); var s=(G.state.battleSpeed||1)+1; if(s>m)s=1; G.state.battleSpeed=s; G.ui.render(); },

    "atk": doAttack,
    "potion": function(){ if(G.combat.usePotion()) G.ui.render(); },
    "use-potion": function(){ if(G.combat.usePotion()) G.ui.render(); },

    /* 인벤토리 / 창고 */
    "inv-sub": function(d){ G.state.ui.invSub=d.sub; G.ui.render(); },
    "bag-sort": function(){ var o={price:"power",power:"recent",recent:"price"}; G.state.ui.bagSort=o[G.state.ui.bagSort||"price"]; G.ui.render(); },
    "compare": function(d){ G.ui.compareModal(d.id); },
    "lock": function(d){
      var it=G.state.inventory.concat(G.state.warehouse.items).find(function(x){return x.id===d.id;});
      if(it){ it.locked=!it.locked; G.ui.render(); }
    },
    "equip": function(d){ G.inventory.equip(d.id); G.ui.render(); },
    "quicksell": function(d){ G.inventory.quickSell(d.id); G.ui.render(); },
    "list": function(d){ G.shop.list(d.id); G.ui.render(); },
    "bag-upgrade": function(){ G.inventory.upgradeBag(); G.ui.render(); },
    "identify": function(d){ G.item.identify(d.id); G.ui.render(); },
    "salvage": function(d){ G.inventory.salvage(d.id); G.ui.render(); },
    "reroll": function(d){ G.item.reroll(d.id); G.ui.render(); },
    "store": function(d){ G.warehouse.store(d.id); G.ui.render(); },
    "retrieve": function(d){ G.warehouse.retrieve(d.id); G.ui.render(); },
    "wh-sell": function(d){ G.warehouse.sell(d.id); G.ui.render(); },
    "wh-upgrade": function(){ G.warehouse.upgrade(); G.ui.render(); },

    /* 캐릭터 */
    "char-sub": function(d){ G.state.ui.charSub=d.sub; G.ui.render(); },
    "unequip": function(d){ G.inventory.unequip(d.slot); G.ui.render(); },

    /* 퀘스트(자동화) */
    "perk-toggle": function(d){ G.perks.toggle(d.id); G.ui.render(); },

    /* 채팅 */
    "open-chat": function(){ G.chat.open(); },

    /* 멀티: 닉네임 변경 */
    "change-nick": function(){ G.ui.nicknameModal(function(){ G.net.syncProfile(); G.net.refreshRanking&&G.net.refreshRanking(); }); },

    /* 멀티: 계정(게스트→이메일 전환 / 로그인 / 로그아웃) */
    "acct-signup": function(){ G.ui.authModal("signup"); },
    "acct-login":  function(){ G.ui.authModal("login"); },
    "view-terms":  function(){ G.ui.termsModal(); },

    /* 화면 흔들림 ON/OFF */
    "toggle-shake": function(){ G.state.shake = (G.state.shake===false); G.save.save(true); G.ui.render(); },

    /* 아레나(PvP) */
    "arena-refresh": function(){ G.arena._foes=null; G.ui.renderArena(); },
    "arena-fight": function(d){
      var foes=G.arena._foes||[]; var foe=foes[parseInt(d.i,10)]; if(!foe) return;
      var out=G.arena.challenge(foe);
      G.ui.arenaResultModal(out);
      G.arena._foes=null;          // 다음 상대 새로 추천
      G.ui.renderArena();
    },
    "acct-logout": function(){
      if(!confirm("로그아웃하면 다시 게스트로 전환됩니다. 진행도는 계정에 저장되어 있어 재로그인하면 복구됩니다.\n로그아웃할까요?")) return;
      G.net.logout().then(function(){ location.reload(); });
    },

    /* 스킬 (해금은 층 도달 시 자동) */
    "skill-toggle": function(d){ G.combat.skillToggle(d.id); G.ui.render(); },

    /* 상점 */
    "unlist": function(d){ G.shop.unlist(parseInt(d.idx,10)); G.ui.render(); },
    "price-edit": function(d){ G.ui.priceModal(parseInt(d.idx,10)); },
    "buy-potion": function(d){
      var qty=parseInt(d.qty,10)||1;
      var max=G.state.potionMax||20;
      var have=G.state.consumables.potion_s||0;
      if(have>=max){ G.ui.toast("물약은 최대 "+max+"개까지 소지할 수 있습니다"); return; }
      qty=Math.min(qty, max-have);                 // 한도 초과분은 잘라냄
      var H=G.potionHealAmount();                   // 구매 시점 회복량(=개당 가격)
      var cost=H*qty;
      if(G.state.player.gold<cost){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(cost)+")"); return; }
      G.state.player.gold-=cost;
      // 보유 물약 회복량 = 가중평균 (싸게 산 물약은 싸게 회복 → 익스플로잇 방지)
      var oldHeal=G.state.consumables.potionHeal||H;
      G.state.consumables.potionHeal=Math.round((have*oldHeal + qty*H)/(have+qty));
      G.state.consumables.potion_s=have+qty;
      G.log("🧪 체력 물약 ×"+qty+" 구매 (개당 회복 "+G.ui.fmt(H)+" · 🪙"+G.ui.fmt(cost)+")","r-uncommon");
      G.ui.render();
    },

    /* 대장간 / 주문 / 워프 */
    "craft": function(d){ G.forge.craft(d.boss, d.part); G.ui.render(); },
    "craft-rune": function(d){ G.forge.craftRune(d.rune); G.ui.render(); },
    "order-fulfill": function(d){ G.orders.fulfill(d.id); G.ui.render(); },
    "warp": function(d){
      var f=parseInt(d.floor,10)||1;
      G.state.dungeon.floor=Math.max(1, Math.min(G.state.dungeon.maxFloor||1, f));
      G.ui.switchTab("dungeon");
      G.ui.toast(G.state.dungeon.floor+"층으로 이동");
    },

    "pickup-toggle": function(d){ G.state.pickup[d.rar]=!(G.state.pickup[d.rar]!==false); G.ui.render(); },

    /* 설정 */
    "promote": function(){ if(G.shop.promote()) G.ui.render(); },
    "toggle-mute": function(){ G.audio.toggleMute(); G.ui.render(); },
    "save": function(){ G.save.save(); },
    "reset": function(){ if(confirm("정말 모든 진행을 초기화할까요?")) G.save.reset(); },
    "export": function(){
      var code=G.save.exportCode();
      if(navigator.clipboard) navigator.clipboard.writeText(code);
      prompt("아래 코드를 복사해 보관하세요 (자동 복사 시도됨):", code);
    },
    "import": function(){
      var code=prompt("저장 코드를 붙여넣으세요:");
      if(code) G.save.importCode(code);
    },
  };

  /* ---------- 클릭 위임 ---------- */
  document.addEventListener("click", function(e){
    // 탭
    var nav=e.target.closest(".nav-btn");
    if(nav){ G.ui.switchTab(nav.dataset.tab); return; }
    // 액션
    var btn=e.target.closest("[data-act]");
    if(!btn || btn.tagName==="INPUT") return;
    var act=btn.dataset.act;
    if(actions[act]){ e.preventDefault(); actions[act](btn.dataset); }
  });

  /* ---------- 볼륨 슬라이더 (BGM / 효과음 개별) ---------- */
  document.addEventListener("input", function(e){
    var s=e.target.closest("[data-vol]"); if(!s) return;
    var which=s.dataset.vol, v=(parseInt(s.value,10)||0)/100;
    G.audio.setVol(which, v);
    var lbl=document.getElementById(which+"vol-lbl"); if(lbl) lbl.textContent=Math.round(v*100)+"%";
  });
  document.addEventListener("change", function(e){
    var s=e.target.closest('[data-vol="sfx"]'); if(!s) return;
    if(G.audio) G.audio.play("sword");   // 효과음 볼륨 조절 후 미리듣기
  });

  /* ---------- 상점 손님 실시간 틱 (15초마다) ---------- */
  setInterval(function(){
    var sold=false;
    // 손님 방문 시도(손님 방문율 옵션 + 홍보 배수만큼 더 자주)
    var attempts=Math.round(G.state.shop.level * (1 + Math.floor((G.totalStats().mercFind||0)/20)) * G.shop.promoMult());
    for(var i=0;i<attempts;i++){ if(G.shop.visitTick()) sold=true; }
    G.state.shop.lastVisit=Date.now();
    var stocked=G.shop.autoStock();   // 팔려서 빈 자리를 가방템으로 보충
    if(sold||stocked){ G.ui.renderHud(); if(G.state.ui.tab==="shop") G.ui.renderShop(); }
  }, 15000);

  /* ---------- 홍보 카운트다운(가판대 탭에서 1초마다) ---------- */
  setInterval(function(){
    if(G.state.ui.tab!=="shop") return;
    var t=document.getElementById("promo-timer");
    if(G.shop.promoActive()){
      if(t){ var ms=G.shop.promoLeftMs(), m=Math.floor(ms/60000), s=Math.floor(ms/1000)%60;
        t.textContent=m+":"+("0"+s).slice(-2); }
      else G.ui.renderShop();   // 비활성 배너 → 활성으로 전환
    } else if(t){ G.ui.renderShop(); }   // 만료 → 비활성 배너로 갱신
  }, 1000);

  /* ---------- 자동화 루프 (특성) — 배속에 따라 간격 단축 ---------- */
  function autoStep(){
    if(G.paused) return;   // 해금 모달 등으로 일시정지 중엔 진행 멈춤
    G.shop.autoStock();   // 사냥 중에도 빈 가판대를 가방템으로 계속 채움
    var run=G.state.dungeon.run;
    if(run){
      if(run.cleared){
        if(G.perks.isOn("auto_next")){
          var nf=(run.floor < G.DATA.MAX_FLOOR && G.dungeon.isUnlocked(run.floor+1)) ? run.floor+1 : run.floor;
          G.dungeon.leave(); G.dungeon.enter(nf); G.ui.render();
        }
      } else if(!run.dead){
        if(run.combat){ if(G.perks.isOn("auto_battle")) doAttack(); }
        else { if(G.perks.isOn("auto_advance")) doAdvance(); }
      }
    }
  }
  function autoLoop(){
    autoStep();
    var sp=Math.max(1, G.state.battleSpeed||1);
    setTimeout(autoLoop, Math.round(650/sp));   // 1x=650ms, 2x≈325, 3x≈217, 4x≈163
  }
  setTimeout(autoLoop, 650);

  /* ---------- 자동 저장 (30초) + 종료 시 ---------- */
  setInterval(function(){ G.save.save(true); }, 30000);
  window.addEventListener("beforeunload", function(){ G.save.save(true); });

  /* ---------- 회전 시 재렌더(레이아웃은 CSS, 내용 갱신만) ---------- */
  window.matchMedia("(orientation:landscape)").addEventListener("change", function(){ G.ui.render(); });

  /* ---------- 부팅 ---------- */
  async function boot(){
    var loaded=G.save.load();
    if(G.audio){ G.audio.init(); G.audio.startBgm(); G.audio.armAutostart(); }   // 음소거 아니면 즉시 재생 시도 + (차단 시)첫 상호작용 폴백
    G.checkUnlocks();   // 자동화·스킬·배속 동기화(구버전 세이브 호환) — 신규 해금 시 모달
    G.ui.switchTab(G.state.ui.tab || "dungeon");   // 로컬 상태로 즉시 표시

    // ---------- 멀티플레이(Supabase) 동기화 ----------
    var usedCloud=false;
    try{
      await G.net.init();
      if(G.net.online()){
        if(!G.net.nickname){
          await G.ui.startScreen();   // 첫 실행: 게스트로 시작 / 로그인 / 계정 만들기 선택 → 닉네임
        }
        if(G.net.nickname && !G.state.nickname) G.state.nickname=G.net.nickname;
        var cloud=await G.net.pullSave();
        if(cloud && cloud.data){
          // 클라우드 진행도를 권위로 사용(다른 기기 이어하기)
          localStorage.setItem(G.save.KEY, JSON.stringify(cloud.data));
          G.save.load();   // 마이그레이션 재적용
          if(G.net.nickname) G.state.nickname=G.net.nickname;
          G.checkUnlocks(); usedCloud=true;
          G.ui.toast("☁️ 클라우드 진행도를 불러왔어요");
        } else {
          await G.net.pushSave(G.state);   // 첫 로그인: 로컬 → 클라우드 업로드
        }
        await G.net.syncProfile();
        G.ui.switchTab(G.state.ui.tab || "dungeon");
      }
    }catch(e){ console.warn("[boot] 멀티 동기화 실패",e); }

    // ---------- 방치 정산(최종 상태 기준) ----------
    if(loaded||usedCloud){
      G.stamina.regen();
      var idle=G.shop.settleIdle();
      G.log("🌙 돌아오신 걸 환영합니다.","");
      if(idle.gold>0){ setTimeout(function(){ G.ui.idlePopup(idle.gold, idle.sold); }, 450); }
    } else {
      G.log("⚔️ 모험을 시작합니다! 던전으로 향하세요.","r-uncommon");
    }
  }
  boot();
})();
