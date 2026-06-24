/* ============================================================
   광고(AdMob 보상형) — @capacitor-community/admob 네이티브 플러그인 래퍼
   - 보상형만 사용(아레나 코인 / 무료 뽑기). 네이티브(APK)에서만 동작, 웹은 자동 비활성.
   - 현재 광고 ID는 Google 공식 '테스트' ID. 출시 전 실제 ID로 교체.
   ============================================================ */
(function(){
  var G = window.G;
  G.ads = {};

  // 보상형 광고단위 ID — TEST_MODE로 안전하게 전환(본인 기기에서 실광고 클릭=정지 위험 방지)
  G.ads.REWARD_ID_TEST = "ca-app-pub-3940256099942544/5224354917";   // Google 공식 테스트
  G.ads.REWARD_ID_REAL = "ca-app-pub-5609592289457564/9426627553";   // 실제 보상형(탑아이들)
  G.ads.TEST_MODE = false;  // 프로덕션 출시: 실광고 ID 사용. ⚠️ 본인 기기에서 실광고 클릭 금지(계정 정지 위험). 개발 검증 시 임시로 true 로.
  G.ads.rewardId = function(){ return this.TEST_MODE ? this.REWARD_ID_TEST : this.REWARD_ID_REAL; };
  G.ads.CAP = { coin:5, gacha:2, speed:999 };   // 일일 시청 한도. 배속은 사실상 무제한(구글 보상광고 일일 고정한도 없음)
  // 배속: 당일 누적 시청 횟수로 단계 상승 (1~3회 2배 / 4~10회 3배 / 11회+ 4배), 단계별 지속시간 차등
  G.ads.SPEED_TIERS = [ { upTo:3, tier:2, mins:15 }, { upTo:10, tier:3, mins:15 }, { upTo:20, tier:4, mins:15 } ];
  G.ads.speedFor = function(n){ var T=G.ads.SPEED_TIERS; for(var i=0;i<T.length;i++){ if(n<=T[i].upTo) return T[i]; } return T[T.length-1]; };
  G.ads.COIN_REWARD = 30;                 // 코인 보상량
  G.ads._busy = false;

  function plugin(){
    return (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.AdMob) || null;
  }
  // 네이티브(APK)에서 플러그인 있을 때만 사용 가능 — 웹/브라우저는 false
  G.ads.available = function(){
    return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform() && plugin());
  };

  G.ads.ensure = function(){
    var a=G.state.ads = G.state.ads || {};
    var today=new Date().toISOString().slice(0,10);
    if(a.date!==today){ a.date=today; a.counts={}; }
    if(!a.counts) a.counts={};
    return a;
  };
  G.ads.left = function(key){ var a=G.ads.ensure(); return Math.max(0, (G.ads.CAP[key]||0) - (a.counts[key]||0)); };
  G.ads.canWatch = function(key){ return G.ads.available() && G.ads.left(key)>0; };
  G.ads._tick = function(key){ var a=G.ads.ensure(); a.counts[key]=(a.counts[key]||0)+1; if(G.save) G.save.save(true); };

  G.ads.init = function(){
    if(!G.ads.available()) return;
    try{ plugin().initialize({ initializeForTesting:true }); }catch(e){ console.warn("[ads] init",e); }
  };

  /* 보상형 1회 시청 → 끝까지 보면 onReward() 실행. key=일일한도 분류 */
  G.ads.reward = function(key, onReward){
    if(!G.ads.available()){ if(G.ui) G.ui.toast("앱에서만 이용할 수 있어요"); return; }
    if(G.ads.left(key)<=0){ if(G.ui) G.ui.toast("오늘 광고 보상을 모두 받았어요 (내일 리셋)"); return; }
    if(G.ads._busy) return; G.ads._busy=true;
    var AdMob=plugin(), done=false, handles=[];
    function cleanup(){ handles.forEach(function(h){ try{ h&&h.remove&&h.remove(); }catch(e){} }); handles=[]; G.ads._busy=false; }
    function fail(msg){ if(done) return; done=true; cleanup(); if(G.ui) G.ui.toast(msg||"광고를 표시할 수 없어요"); }
    function grant(){ if(done) return; done=true; cleanup(); G.ads._tick(key); try{ onReward(); }catch(e){} if(G.ui&&G.ui.render) G.ui.render(); }
    function on(ev, cb){ try{ var r=AdMob.addListener(ev, cb); Promise.resolve(r).then(function(h){ handles.push(h); }); }catch(e){} }
    on("onRewardedVideoAdReward", grant);
    on("onRewardedVideoAdDismissed", function(){ if(!done) fail("끝까지 시청해야 보상을 받아요"); });
    on("onRewardedVideoAdFailedToLoad", function(){ fail("광고 불러오기 실패"); });
    on("onRewardedVideoAdFailedToShow", function(){ fail("광고 표시 실패"); });
    try{
      AdMob.prepareRewardVideoAd({ adId: G.ads.rewardId() })
        .then(function(){ return AdMob.showRewardVideoAd(); })
        .catch(function(){ fail(); });
    }catch(e){ fail(); }
  };

  /* 게임 연동 보상 */
  G.ads.rewardCoin = function(){
    G.ads.reward("coin", function(){
      G.arena.ensure(); G.state.arena.coins=(G.state.arena.coins||0)+G.ads.COIN_REWARD;
      if(G.log) G.log("🎬 광고 보상: 아레나 코인 +"+G.ads.COIN_REWARD,"r-uncommon");
      if(G.ui) G.ui.toast("🏅 아레나 코인 +"+G.ads.COIN_REWARD);
    });
  };
  G.ads.rewardSpeed = function(){
    G.ads.reward("speed", function(){
      var n=(G.ads.ensure().counts.speed)||0;   // tick 후 당일 누적 시청 횟수
      var s=G.ads.speedFor(n), tier=s.tier, mins=s.mins;
      var now=Date.now(), until=now+mins*60000;
      var b=G.state.speedBuff || { tier:1, until:0 };
      if(b.until<=now){ b={ tier:tier, until:until }; }            // 만료 → 새 버프
      else { b.until=Math.max(b.until,until); if(tier>b.tier) b.tier=tier; }   // 진행중 → 시간연장·상위우선
      G.state.speedBuff=b; G.state.battleSpeed=b.tier;             // 즉시 적용
      if(G.log) G.log("🎬 광고 보상: ⏩ "+tier+"배속 "+mins+"분! (오늘 "+n+"회)","r-legend");
      if(G.ui) G.ui.toast("⏩ "+tier+"배속 "+mins+"분 적용!");
    });
  };
  G.ads.rewardGacha = function(){
    G.ads.reward("gacha", function(){
      if(!(G.gacha && G.gacha.pullOne)){ return; }
      var r=G.gacha.pullOne(false);
      if(G.save) G.save.save(true);
      if(r && G.ui && G.ui.gachaResultModal) G.ui.gachaResultModal([r]);
      else if(G.ui) G.ui.toast("🎰 무료 뽑기 완료");
    });
  };
})();
