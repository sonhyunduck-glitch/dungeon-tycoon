/* ============================================================
   아레나 (PvP) — 비동기 자동전투
   - 내 캐릭터 스냅샷 vs 상대 스냅샷 시뮬레이션
   - 비슷한 점수 상대 자동추천(온라인: Supabase / 오프라인: 봇)
   - 승패로 아레나 점수 변동(ELO식), 전용 랭킹
   ============================================================ */
(function(){
  var G = window.G;
  G.arena = { _foes:null, _rank:null, _loading:false };

  function nick(){ return (G.net&&G.net.nickname) || (G.state&&G.state.nickname) || "나"; }
  function clampStat(v,m){ return Math.min(m, v||0); }

  /* 내 전투 스냅샷 */
  G.arena.snapshot = function(){
    var s=G.totalStats();
    return {
      name: nick(), power: G.power(), score: G.arena.score(),
      avatar: (G.avatar && G.avatar.currentId) ? G.avatar.currentId() : "adventurer",
      maxHp: Math.round(s.maxHp), atk: Math.round(s.atk), def: Math.round(s.def),
      crit: clampStat(s.crit,80), critDmg: s.critDmg||0, dodge: clampStat(s.dodge,60),
      lifesteal: s.lifesteal||0, penet: s.penet||0, multihit: clampStat(s.multihit,80)
    };
  };

  /* 점수/전적 */
  G.arena.score  = function(){ return (G.state.arena&&G.state.arena.score)||1000; };
  G.arena.wins   = function(){ return (G.state.arena&&G.state.arena.wins)||0; };
  G.arena.losses = function(){ return (G.state.arena&&G.state.arena.losses)||0; };

  /* ---------- 전투 시뮬레이션 (게임 데미지 공식과 동일) ---------- */
  function strike(a, d){
    if(d.dodge>0 && Math.random()*100 < d.dodge) return { dmg:0, dodge:true };
    var critMult = 1.5 + (a.critDmg||0)/100;
    var strikes = 1 + ((a.multihit && Math.random()*100 < a.multihit)?1:0);
    var total=0, crit=false;
    for(var k=0;k<strikes;k++){
      var eDef = d.def*(1-(a.penet||0)/100); if(eDef<0) eDef=0;
      var mitig = a.atk/(a.atk+eDef);
      var base = a.atk*mitig*(0.9+Math.random()*0.2);
      var isC = Math.random()*100 < a.crit;
      total += Math.max(1, Math.round(base*(isC?critMult:1)));
      if(isC) crit=true;
    }
    return { dmg:total, crit:crit, multi:strikes>1 };
  }

  // me 선공, 번갈아 공격. 반환 {win, rounds, meHp, foeHp}
  G.arena.simulate = function(me, foe){
    var mh=me.maxHp, fh=foe.maxHp, rounds=[], i=0;
    while(mh>0 && fh>0 && i<100){
      i++;
      var a=strike(me, foe); fh-=a.dmg;
      if(me.lifesteal>0 && a.dmg>0) mh=Math.min(me.maxHp, mh+Math.floor(a.dmg*me.lifesteal/100));
      rounds.push({ who:"me", dmg:a.dmg, crit:a.crit, dodge:a.dodge, foeHp:Math.max(0,fh) });
      if(fh<=0) break;
      var b=strike(foe, me); mh-=b.dmg;
      if(foe.lifesteal>0 && b.dmg>0) fh=Math.min(foe.maxHp, fh+Math.floor(b.dmg*foe.lifesteal/100));
      rounds.push({ who:"foe", dmg:b.dmg, crit:b.crit, dodge:b.dodge, meHp:Math.max(0,mh) });
    }
    var win = fh<=0 ? true : (mh<=0 ? false : (mh/me.maxHp >= fh/foe.maxHp));
    return { win:win, rounds:rounds, meHp:Math.max(0,mh), foeHp:Math.max(0,fh) };
  };

  /* ---------- 점수 변동(ELO식) — 내 점수만 변경 ---------- */
  G.arena.applyResult = function(foeScore, win){
    var my=G.arena.score();
    var expected = 1/(1+Math.pow(10,((foeScore||1000)-my)/400));
    var delta = Math.round(32*((win?1:0)-expected));
    if(win && delta<1) delta=1; if(!win && delta>-1) delta=-1;
    var ns=Math.max(0, my+delta);
    if(!G.state.arena) G.state.arena={ score:1000, wins:0, losses:0 };
    G.state.arena.score=ns;
    if(win) G.state.arena.wins=(G.state.arena.wins||0)+1; else G.state.arena.losses=(G.state.arena.losses||0)+1;
    G.save.save(true);
    if(G.net && G.net.syncArena) G.net.syncArena();   // 온라인이면 서버 반영
    return { delta:delta, score:ns };
  };

  /* ---------- 도전 실행 ---------- */
  G.arena.challenge = function(foe){
    var res = G.arena.simulate(G.arena.snapshot(), foe);
    var sc = G.arena.applyResult(foe.score, res.win);
    G.arena._rank=null;   // 랭킹 캐시 무효화(점수 바뀜)
    return { res:res, score:sc, foe:foe };
  };

  /* ---------- 오프라인 봇 상대 생성(내 전투력 근처) ---------- */
  var B1=["빛나는","불꽃","그림자","강철","폭풍","서리","황금","핏빛","천둥","광폭","어둠","질풍","불멸","파멸","월광","혹한"];
  var B2=["검사","마법사","사냥꾼","기사","도적","광전사","현자","챔피언","처형자","정복자","수호자","칼날","주술사"];
  function botName(){ return B1[Math.floor(Math.random()*B1.length)]+B2[Math.floor(Math.random()*B2.length)]+(Math.floor(Math.random()*900)+100); }
  function botFrom(power, score){
    var f=0.75+Math.random()*0.5;                 // 내 대비 75~125%
    var atk=Math.max(8, Math.round(14*f + power*0.06*f));
    return {
      name:botName(), power:Math.round(power*f), score:score,
      avatar:(G.avatar?G.avatar.randomId():"adventurer"),
      maxHp:Math.round((120+power*0.9)*f), atk:atk, def:Math.round(atk*0.3),
      crit:5+Math.floor(Math.random()*20), critDmg:Math.floor(Math.random()*60),
      dodge:Math.floor(Math.random()*12), lifesteal:Math.floor(Math.random()*10),
      penet:Math.floor(Math.random()*15), multihit:Math.floor(Math.random()*15), bot:true
    };
  }
  G.arena.botOpponents = function(){
    var p=G.power(), my=G.arena.score(), arr=[];
    for(var i=0;i<5;i++){ arr.push(botFrom(p, my + (Math.floor(Math.random()*200)-100))); }
    return arr;
  };

  /* ---------- 상대 목록 가져오기(온라인 우선, 캐시) ---------- */
  G.arena.loadOpponents = function(force){
    if(G.arena._foes && !force) return Promise.resolve(G.arena._foes);
    if(G.net && G.net.online() && G.net.arenaOpponents){
      G.arena._loading=true;
      return G.net.arenaOpponents().then(function(list){
        G.arena._loading=false;
        if(list && list.length){ G.arena._foes=list; }
        else { G.arena._foes=G.arena.botOpponents(); }   // 아직 상대 없으면 봇
        return G.arena._foes;
      }).catch(function(){ G.arena._loading=false; G.arena._foes=G.arena.botOpponents(); return G.arena._foes; });
    }
    G.arena._foes=G.arena.botOpponents();
    return Promise.resolve(G.arena._foes);
  };

  /* ---------- 아레나 랭킹 ---------- */
  // 오프라인: 시드 봇 + 나
  function botRankPool(){
    var arr=[], n=80;
    for(var i=0;i<n;i++){ arr.push({ name:botName(), score: 700+Math.floor(Math.random()*900), avatar:(G.avatar?G.avatar.randomId():"adventurer") }); }
    return arr;
  }
  G.arena.localRankView = function(){
    var list=botRankPool(); list.push({ name:nick(), score:G.arena.score(), me:true, avatar:(G.avatar?G.avatar.currentId():"adventurer") });
    list.sort(function(a,b){ if(b.score!==a.score) return b.score-a.score; if(a.me) return -1; if(b.me) return 1; return 0; });
    for(var i=0;i<list.length;i++) list[i].rank=i+1;
    var meIdx=list.findIndex(function(x){return x.me;});
    var start=meIdx<=7?3:meIdx-5; start=Math.max(3,start);
    return { total:list.length, me:list[meIdx], top:list.slice(0,3), around:list.slice(start,start+10), gap:start>3 };
  };
})();
