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
      else { G.ui.attackFx(eh.crit); G.ui.floatDmg("#enemy-emoji", eh.value, eh.crit); if(!targetDied){ G.ui.refreshFoeHp(); G.ui.foeHurtAnim(); } else { G.ui.zeroTargetHp(); } }
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
    var nextGap=Math.round(Math.max(180, 500/sp));
    // 3) 결과 처리 (슬래시 보여준 뒤 본문 렌더)
    if(res.over && res.win){
      animBusy=true;
      var ddw=G.ui.foeDeathAnim();   // 마지막 적 사망 모션(있으면)
      setTimeout(function(){
        G.dungeon.advance();
        var run2=G.state.dungeon.run;
        // 자동사냥(auto_next) 중 층 클리어 → 완료화면 깜빡임 없이 바로 다음 층 입장
        if(run2 && run2.cleared && G.perks.isOn("auto_next")){
          var nf=(run2.floor < G.DATA.MAX_FLOOR && G.dungeon.isUnlocked(run2.floor+1)) ? run2.floor+1 : run2.floor;
          G.dungeon.leave(); G.dungeon.enter(nf); G.ui.render();
          G.ui.sceneEnter(G.state.dungeon.run, function(){ animBusy=false; });
        } else {
          G.ui.render();
          // 다음 노드로 전진(배경 스크롤)→적 워크인 동안 animBusy 유지, 완료 시 해제
          G.ui.sceneEnter(run2, function(){ animBusy=false; });
        }
      }, Math.round(Math.max(360, ddw)/sp)+nextGap);
    } else if(res.over && res.dead){
      animBusy=true;
      G.ui.pcAnim("death");   // 사망 모션(7프레임 .7s) 재생 후 사망 화면으로
      setTimeout(function(){ G.ui.render(); G.save.save(true); animBusy=false;
        if(G.loot && G.loot.pending() && G.ui.settleModal) G.ui.settleModal();   // 사망 시 정산화면 자동(휴대 ½)
      }, 820);
    } else if(targetDied){
      // 타겟 처치(전투 계속): 사망 연출 시간도 배속에 비례해 단축(고배속에서 빠르게)
      animBusy=true;
      var dd=G.ui.foeDeathAnim();
      setTimeout(function(){ G.ui.refreshCombat(); animBusy=false; }, Math.round(Math.max(220, dd)/sp)+nextGap);
    } else {
      // 일반 턴: 스프라이트/애니메이션 보존을 위해 HP바만 갱신
      setTimeout(function(){ G.ui.refreshCombat(); }, 220/sp);
    }
  }
  function doAdvance(){
    if(animBusy || G.paused) return;        // 씬 이동 중엔 중복 전진 금지
    animBusy=true;
    G.dungeon.advance(); G.ui.render();
    G.ui.sceneEnter(G.state.dungeon.run, function(){ animBusy=false; });
  }

  /* ---------- 액션 핸들러 ---------- */
  var actions = {
    /* 던전 */
    "floor-step": function(d){
      var dn=G.state.dungeon;
      dn.floor = Math.max(1, Math.min(dn.maxFloor||1, dn.floor + parseInt(d.d,10)));
      G.ui.render();
    },
    "floor-jump": function(){ G.state.dungeon.floor=G.state.dungeon.maxFloor||1; G.ui.render(); },
    "enter": function(d){ G.dungeon.enter(d.floor); G.ui.render(); animBusy=true; G.ui.sceneEnter(G.state.dungeon.run, function(){ animBusy=false; }); },
    "node-next": doAdvance,
    "dungeon-leave": function(){ G.dungeon.requestLeave(); },
    "settle-open": function(){ if(G.ui.settleModal) G.ui.settleModal(); },
    "speed-cycle": function(){ var m=G.maxSpeed(); var s=(G.state.battleSpeed||1)+1; if(s>m)s=1; G.state.battleSpeed=s; G.ui.render(); },

    "atk": doAttack,
    "potion": function(){ if(animBusy) return; if(G.combat.usePotion()) G.ui.render(); },
    "use-potion": function(){ if(animBusy) return; if(G.combat.usePotion()) G.ui.render(); },

    /* 창고(통합) */
    "wh-cat": function(d){ G.state.ui.whCat=d.cat; G.ui.renderInventory(); },
    "bag-sort": function(){ var o={price:"power",power:"recent",recent:"upgrade",upgrade:"price"}; G.state.ui.bagSort=o[G.state.ui.bagSort||"price"]; G.ui.render(); },
    "bag-filter-slot": function(d){ G.state.ui.bagFilterSlot=d.slot||d.value; G.ui.renderInventory(); },
    "bag-stat-pick": function(){ G.ui.bagStatPickModal(); },
    "socket-open": function(d){ G.ui.socketModal(d.id); },
    "equip-detail": function(d){ G.ui.equipDetailModal(d.slot); },
    "bag-filter-stat": function(d){ G.state.ui.bagFilterStat=d.key||d.value; var ov=document.querySelector(".modal-overlay.show"); if(ov) ov.remove(); G.ui.renderInventory(); },
    "bag-filter-clear": function(){ G.state.ui.bagFilterSlot="all"; G.state.ui.bagFilterStat="all"; G.ui.renderInventory(); },
    "compare": function(d){ G.ui.compareModal(d.id); },
    "lock": function(d){
      var it=G.state.inventory.find(function(x){return x.id===d.id;});
      if(it){ it.locked=!it.locked; G.ui.render(); }
    },
    "equip": function(d){
      var was=(G.runeword&&G.runeword.active&&G.runeword.active()||{}).id;
      G.inventory.equip(d.id);
      var now=G.runeword&&G.runeword.recordActive&&G.runeword.recordActive();
      if(now && now.id!==was){ G.ui.toast("🔗 룬워드 발동: "+now.ico+" "+now.name+"!"); G.save.save(true); }
      G.ui.render();
    },
    "quicksell": function(d){ G.inventory.quickSell(d.id); G.ui.render(); },
    "cap-upgrade": function(d){ G.inventory.upgradeCap(d&&d.cat); G.ui.render(); },
    "identify": function(d){ G.item.identify(d.id); G.ui.render(); },
    "reroll": function(d){ G.item.reroll(d.id); G.ui.render(); },
    "gamble-buy": function(d){ if(G.gamble.buy(d.part)){ if(G.save)G.save.save(true); } G.ui.render(); },

    /* 캐릭터 */
    "char-sub": function(d){ G.state.ui.charSub=d.sub; G.ui.render(); },
    "col-sub": function(d){ G.state.ui.colSub=d.sub; G.ui.renderCharacter(); },
    "unequip": function(d){ G.inventory.unequip(d.slot); G.ui.render(); },
    "avatar-pick": function(d){ G.avatar.set(d.id); G.ui.render(); },

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
    "toggle-glow": function(){ G.state.glow = (G.state.glow===false); if(G.glow) G.glow.apply(); G.save.save(true); G.ui.render(); },
    "ad-coin": function(){ if(G.ads) G.ads.rewardCoin(); },
    "ad-gacha": function(){ if(G.ads) G.ads.rewardGacha(); },
    "ad-speed": function(){ if(G.ads) G.ads.rewardSpeed(); },

    /* 아레나(PvP) */
    "arena-refresh": function(){ G.arena._foes=null; G.ui.renderArena(); },
    "arena-fight": function(d){
      if(G.arena.fightsLeft()<=0){ G.ui.toast("오늘 도전을 모두 사용했습니다 (내일 리셋)"); return; }
      var foes=G.arena._foes||[]; var foe=foes[parseInt(d.i,10)]; if(!foe) return;
      var out=G.arena.challenge(foe);
      G.arena._foes=null;          // 다음 상대 새로 추천
      // '항상 스킵'을 켰을 때만 바로 결과(전투화면은 reduced-motion에서도 정상 동작 → 자동 스킵 안 함)
      if(G.state.arenaSkip){ G.ui.arenaResultModal(out); G.ui.renderArena(); }
      else { G.ui.arenaBattle(out, function(){ G.ui.arenaResultModal(out); G.ui.renderArena(); }); }
    },
    "arena-shop": function(){ G.ui.arenaShopModal(); },
    "arena-buy": function(d){
      var r=G.arena.buy(d.key);
      G.ui.toast(r.msg);
      var ov=document.querySelector(".modal-overlay.show"); if(ov) ov.remove();   // 모달 갱신(코인 잔액 반영)
      G.ui.arenaShopModal();
      if(G.state.ui.tab==="arena") G.ui.renderArena();
    },
    "arena-claim": function(d){
      var rw=G.arena.claimMission(d.key);
      if(rw) G.ui.toast("미션 완료! 🏅 +"+rw); else G.ui.toast("아직 달성하지 못했습니다");
      G.ui.renderArena();
    },
    "vendor-sub": function(d){ G.state.ui.vendorSub=d.sub; G.ui.render(); },
    /* 🎰 외형 뽑기 */
    "gacha-pull": function(d){
      var r=G.gacha.pull(parseInt(d.n,10)||1);
      if(!r.ok){ G.ui.toast(r.msg); return; }
      G.ui.gachaResultModal(r.results);
      G.ui.render();
    },
    "gacha-exchange": function(d){
      var r=G.gacha.exchange(d.id);
      G.ui.toast(r.ok ? ("✨ "+r.name+" 획득!") : r.msg);
      G.ui.render();
    },
    /* 🧥 망토 */
    "cape-open": function(){ G.ui.capeModal(); },
    "cape-buy": function(){
      var r=G.cape.buy(); G.ui.toast(r.msg);
      var ov=document.querySelector(".modal-overlay.show"); if(ov) ov.remove();
      G.ui.capeModal(); G.ui.render();
    },
    "cape-enhance": function(){
      var r=G.cape.enhance();
      if(!r.ok){ G.ui.toast(r.msg); return; }
      var ov=document.querySelector(".modal-overlay.show"); if(ov) ov.remove();
      G.ui.capeModal(r);        // 결과 피드백(성공/실패) 표시
      G.ui.render();            // 스탯/HUD 갱신
    },
    "apply-update": function(){ location.reload(); },
    "net-retry": function(){
      G.ui.toast("재연결 중...");
      G.net.init().then(function(ok){
        if(ok){ G.net.syncProfile(); G.ui.toast("🟢 연결됨"); }
        else G.ui.toast("연결 실패 — 잠시 후 다시 시도");
        G.ui.render();
      });
    },
    "acct-logout": function(){
      if(!confirm("로그아웃하면 다시 게스트로 전환됩니다. 진행도는 계정에 저장되어 있어 재로그인하면 복구됩니다.\n로그아웃할까요?")) return;
      G.net.logout().then(function(){ location.reload(); });
    },

    /* 스킬 (해금은 층 도달 시 자동) */
    "skill-toggle": function(d){ G.combat.skillToggle(d.id); G.ui.render(); },

    /* 상점(물약 등 NPC 판매) */
    "buy-potion": function(d){
      var max=G.state.potionMax||20;
      var have=G.state.consumables.potion_s||0;
      if(have>=max){ G.ui.toast("물약은 최대 "+max+"개까지 소지할 수 있습니다"); return; }
      var H=G.potionHealAmount();                   // 구매 시점 회복량(=개당 가격)
      var room=max-have;
      var qty;
      if(d.qty==="max"){                            // 골드가 허용하는 최대치(소지 한도 내)
        qty=Math.min(room, Math.floor((G.state.player.gold||0)/Math.max(1,H)));
        if(qty<=0){ G.ui.toast("골드가 부족합니다 (개당 🪙"+G.ui.fmt(H)+")"); return; }
      } else {
        qty=Math.min(parseInt(d.qty,10)||1, room);  // 한도 초과분은 잘라냄
      }
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
    "heal-full": function(){                            // 즉시 풀회복 (회복 HP당 1골드)
      var s=G.totalStats(), p=G.state.player;
      var missing=Math.max(0, s.maxHp - p.hp);
      if(missing<=0){ G.ui.toast("이미 체력이 가득합니다"); return; }
      var cost=missing;
      if((p.gold||0)<cost){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(cost)+")"); return; }
      p.gold-=cost; p.hp=s.maxHp;
      G.log("❤️ 전체 회복 (체력 +"+G.ui.fmt(missing)+" · 🪙"+G.ui.fmt(cost)+")","log-heal");
      if(G.save) G.save.save(true);
      G.ui.render();
    },

    /* 대장간 / 주문 / 워프 */
    "cube-upgrade": function(d){ if(G.cube.upgrade(parseInt(d.rank,10))){ if(G.save)G.save.save(true); } G.ui.render(); },
    "order-fulfill": function(d){ G.orders.fulfill(d.id); G.ui.render(); },
    "warp": function(d){
      var f=parseInt(d.floor,10)||1;
      G.state.dungeon.floor=Math.max(1, Math.min(G.state.dungeon.maxFloor||1, f));
      G.ui.switchTab("dungeon");
      G.ui.toast(G.state.dungeon.floor+"층으로 이동");
    },

    "pickup-toggle": function(d){ G.state.pickup[d.rar]=!(G.state.pickup[d.rar]!==false); G.ui.render(); },

    /* 설정 */
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
  // 자원을 즉시 차감하는 액션(더블클릭 이중 차감 방지 대상)
  var SPEND_ACTIONS={ "arena-fight":1, "gacha-pull":1, "gacha-exchange":1, "cape-enhance":1, "cape-buy":1, "arena-buy":1, "heal-full":1 };
  var _spendGuard={};
  document.addEventListener("click", function(e){
    // 탭
    var nav=e.target.closest(".nav-btn");
    if(nav){ G.ui.switchTab(nav.dataset.tab); return; }
    // 액션
    var btn=e.target.closest("[data-act]");
    if(!btn || btn.tagName==="INPUT" || btn.tagName==="SELECT") return;   // select은 change로 처리
    var act=btn.dataset.act;
    if(actions[act]){
      e.preventDefault();
      // 자원 소비 액션 더블클릭 가드(같은 액션 500ms 내 재발화 차단 → 이중 차감 방지)
      if(SPEND_ACTIONS[act]){
        var now=Date.now();
        if(_spendGuard[act] && now-_spendGuard[act]<500) return;
        _spendGuard[act]=now;
      }
      actions[act](btn.dataset);
    }
  });

  /* ---------- 볼륨 슬라이더 (BGM / 효과음 개별) ---------- */
  document.addEventListener("input", function(e){
    var s=e.target.closest("[data-vol]"); if(!s) return;
    var which=s.dataset.vol, v=(parseInt(s.value,10)||0)/100;
    G.audio.setVol(which, v);
    var lbl=document.getElementById(which+"vol-lbl"); if(lbl) lbl.textContent=Math.round(v*100)+"%";
  });
  document.addEventListener("change", function(e){
    var sel=e.target.closest('select[data-act]');           // 필터 등 select 액션
    if(sel){ var a=sel.dataset.act; if(actions[a]) actions[a]({ value:sel.value }); return; }
    var s=e.target.closest('[data-vol="sfx"]'); if(!s) return;
    if(G.audio) G.audio.play("sword");   // 효과음 볼륨 조절 후 미리듣기
  });

  /* ---------- 자동화 루프 (특성) — 배속에 따라 간격 단축 ---------- */
  function autoStep(){
    if(G.paused || document.hidden) return;   // 일시정지/백그라운드(화면 꺼짐·앱 전환) 시 진행·연산 멈춤(배터리 절감)
    if((G.state.battleSpeed||1)>G.maxSpeed()){ G.state.battleSpeed=G.maxSpeed(); }   // 배속 버프 만료 시 1x로 복귀
    var run=G.state.dungeon.run;
    if(run){
      if(run.cleared){
        if(G.perks.isOn("auto_next")){
          if(animBusy) return;   // 씬 이동/연출 중엔 다음 층 진입 보류
          var nf=(run.floor < G.DATA.MAX_FLOOR && G.dungeon.isUnlocked(run.floor+1)) ? run.floor+1 : run.floor;
          G.dungeon.leave(); G.dungeon.enter(nf); G.ui.render();
          animBusy=true; G.ui.sceneEnter(G.state.dungeon.run, function(){ animBusy=false; });
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
    var delay = document.hidden ? 2000 : Math.round(650/sp);   // 백그라운드는 깨우기 최소화
    setTimeout(autoLoop, delay);   // 1x=650ms, 2x≈325, 3x≈217, 4x≈163
  }
  setTimeout(autoLoop, 650);

  /* ---------- 백그라운드(화면 꺼짐·앱 전환) 시 오디오 정지 → 배터리/발열 절감 ---------- */
  document.addEventListener("visibilitychange", function(){
    if(G.audio && G.audio.ctx){
      try{ if(document.hidden) G.audio.ctx.suspend(); else if(!(G.state && G.state.muted)) G.audio.ctx.resume(); }catch(e){}
    }
    if(document.hidden){ try{ G.save.save(true); if(G.net&&G.net.flushSave) G.net.flushSave(); }catch(e){} }  // 백그라운드 전환 시 즉시 저장+클라우드 flush(모바일 종료 대비)
    if(!document.hidden) checkVersion();   // 앱 복귀 시 새 버전 확인
  });

  /* ---------- 라이브 업데이트: version.json 감지 → 선택 배너 / 강제 업데이트 ----------
     version.json = { build:정수 빌드번호, min:정수 최소요구빌드 }
       내 빌드 < min       → 닫을 수 없는 강제 업데이트 화면(구버전 차단)
       서버 빌드 > 내 빌드   → 선택 업데이트 배너 */
  var myBuild=null;
  function softBanner(){
    if(document.getElementById("update-banner")||document.getElementById("force-update")) return;
    var b=document.createElement("div"); b.id="update-banner"; b.className="update-banner";
    b.innerHTML='🔄 새 버전이 있어요 <button class="btn sm primary" data-act="apply-update">업데이트</button>';
    document.body.appendChild(b);
  }
  function forceUpdate(){
    if(document.getElementById("force-update")) return;
    G.paused=true;
    var sb=document.getElementById("update-banner"); if(sb) sb.remove();
    var ov=document.createElement("div"); ov.id="force-update"; ov.className="force-update";
    ov.innerHTML='<div class="fu-box"><div style="font-size:2.6rem">🔄</div>'+
      '<h2 style="justify-content:center">업데이트가 필요합니다</h2>'+
      '<div class="muted" style="margin:6px 0 4px">새로운 버전이 출시되었습니다.<br>계속하려면 업데이트하세요.</div>'+
      '<button class="btn primary full" style="margin-top:14px" data-act="apply-update">지금 업데이트</button></div>';
    document.body.appendChild(ov);
  }
  function checkVersion(){
    fetch("version.json?t="+Date.now(), {cache:"no-store"})
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(j){
        if(!j || typeof j.build!=="number") return;     // 번들 모드 등 파일 없으면 무시
        if(myBuild===null) myBuild=j.build;             // 최초: 내 빌드 기록
        if(typeof j.min==="number" && myBuild < j.min){ forceUpdate(); return; }  // 구버전 차단
        if(j.build > myBuild) softBanner();             // 선택 업데이트
      }).catch(function(){});
  }
  checkVersion();
  setInterval(checkVersion, 180000);   // 3분마다 확인

  /* ---------- 자동 저장 (30초) + 종료 시 ---------- */
  setInterval(function(){ G.save.save(true); }, 30000);
  window.addEventListener("beforeunload", function(){ G.save.save(true); if(G.net&&G.net.flushSave) G.net.flushSave(); });

  /* ---------- 회전 시 재렌더(레이아웃은 CSS, 내용 갱신만) ---------- */
  window.matchMedia("(orientation:landscape)").addEventListener("change", function(){ G.ui.render(); });

  /* ---------- 부팅 ---------- */
  async function boot(){
    var loaded=G.save.load();
    if(G.avatar) G.avatar.apply();   // 선택 아바타 스프라이트 적용
    if(G.audio){ G.audio.init(); G.audio.startBgm(); G.audio.armAutostart(); }   // 음소거 아니면 즉시 재생 시도 + (차단 시)첫 상호작용 폴백
    if(G.ads && G.ads.init) G.ads.init();   // AdMob 보상형 초기화(네이티브에서만)
    G.checkUnlocks();   // 자동화·스킬·배속 동기화(구버전 세이브 호환) — 신규 해금 시 모달

    // ---------- 멀티플레이(Supabase) 로그인 + 클라우드 불러오기 (시작 화면 뒤에서 진행) ----------
    var usedCloud=false;
    var netReady = (async function(){
      try{
        await G.net.init();
        if(G.net.online()){
          if(G.net.nickname && !G.state.nickname) G.state.nickname=G.net.nickname;
          var cloud=await G.net.pullSave();
          if(cloud.status==="found"){
            var localAt=(G.state&&G.state._savedAt)||0;
            if(cloud.at > localAt){            // 클라우드가 더 최신 → 채택(다른 기기 이어하기)
              localStorage.setItem(G.save.KEY, JSON.stringify(cloud.data));
              G.save.load();
              if(G.net.nickname) G.state.nickname=G.net.nickname;
              G.checkUnlocks(); usedCloud=true;
            } else {                            // 로컬이 더 최신(또는 동일) → 로컬 보존 + 클라우드에 올림(소실 방지)
              G.net.pushSave(G.state);
            }
          }
          // status==="error"면 아무것도 안 함(오프라인/일시오류로 멀쩡한 진행 덮어쓰기 방지)
        }
      }catch(e){ console.warn("[boot] 멀티 동기화 실패",e); }
    })();

    // ---------- 시작 화면을 즉시 표시(게임 화면이 먼저 보이지 않도록) ----------
    try{ await G.ui.startScreen(netReady); }catch(e){}

    // ---------- 시작 후 동기화(닉네임 확정 / 첫 업로드) ----------
    if(G.net.online()){
      try{
        if(!usedCloud){
          var c2=await G.net.pullSave();
          if(c2.status==="empty") await G.net.pushSave(G.state);   // 진짜 데이터 없을 때만 첫 업로드(오류 시엔 절대 push 안 함)
        }
        await G.net.syncProfile();
      }catch(e){}
    }
    G.ui.switchTab(G.state.ui.tab || "dungeon");

    if(loaded||usedCloud){
      G.log("🌙 돌아오신 걸 환영합니다.","");
    } else {
      G.log("⚔️ 모험을 시작합니다! 던전으로 향하세요.","r-uncommon");
    }
  }
  boot();
})();
