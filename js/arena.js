/* ============================================================
   아레나 (PvP) — 비동기 자동전투 · 고도화
   - 내 캐릭터 스냅샷 vs 상대 스냅샷 시뮬레이션(스킬·속성 반영)
   - 티어/리그, 승리 보상(골드+아레나코인), 코인 상점
   - 일일 도전 한도·미션, 연승 보너스
   - 비슷한 점수 상대 자동추천(온라인: Supabase / 오프라인: 봇), ELO 점수
   ============================================================ */
(function(){
  var G = window.G;
  G.arena = { _foes:null, _rank:null, _loading:false };

  function nick(){ return (G.net&&G.net.nickname) || (G.state&&G.state.nickname) || "나"; }
  function clampStat(v,m){ return Math.min(m, v||0); }

  /* ---------- 티어/리그 ---------- */
  G.arena.TIERS = [
    { key:"bronze",    name:"브론즈",   min:0,    icon:"🥉", color:"#cd7f32" },
    { key:"silver",    name:"실버",     min:1000, icon:"🥈", color:"#c0c0c0" },
    { key:"gold",      name:"골드",     min:1200, icon:"🥇", color:"#ffcf4a" },
    { key:"platinum",  name:"플래티넘", min:1400, icon:"💠", color:"#4ad6c8" },
    { key:"diamond",   name:"다이아",   min:1600, icon:"💎", color:"#7ab8ff" },
    { key:"master",    name:"마스터",   min:1800, icon:"👑", color:"#c879ff" },
    { key:"challenger",name:"챌린저",   min:2000, icon:"🏆", color:"#ff7a3c" }
  ];
  G.arena.tierIndex = function(score){ var t=0,T=G.arena.TIERS; for(var i=0;i<T.length;i++){ if((score||0)>=T[i].min) t=i; } return t; };
  G.arena.tierOf    = function(score){ return G.arena.TIERS[G.arena.tierIndex(score)]; };
  G.arena.tierProgress = function(score){ var T=G.arena.TIERS, i=G.arena.tierIndex(score), cur=T[i], nxt=T[i+1];
    if(!nxt) return 100; return Math.max(0,Math.min(100, Math.round(((score-cur.min)/(nxt.min-cur.min))*100))); };
  // 작은 티어 배지 HTML
  G.arena.tierBadge = function(score, small){
    var t=G.arena.tierOf(score);
    return '<span class="tier-badge'+(small?" sm":"")+'" style="--tier:'+t.color+'">'+t.icon+' '+t.name+'</span>';
  };

  /* ---------- 상태 보장(구버전 세이브 마이그레이션) + 일일 ---------- */
  G.arena.MAX_DAILY = 10;
  G.arena.today = function(){ var d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); };
  G.arena.ensure = function(){
    var a = G.state.arena = G.state.arena || {};
    if(a.score==null) a.score=1000;
    if(a.wins==null) a.wins=0;
    if(a.losses==null) a.losses=0;
    if(a.coins==null) a.coins=0;
    if(a.streak==null) a.streak=0;
    if(a.bestStreak==null) a.bestStreak=0;
    if(!a.daily) a.daily={ date:G.arena.today(), fights:0, win:0, maxStreak:0, claimed:{} };
    if(a.daily.maxStreak==null) a.daily.maxStreak=0;
    if(!a.daily.claimed) a.daily.claimed={};
    return a;
  };
  G.arena.ensureDaily = function(){
    var a=G.arena.ensure();
    if(a.daily.date!==G.arena.today()) a.daily={ date:G.arena.today(), fights:0, win:0, maxStreak:0, claimed:{} };
    return a;
  };
  G.arena.fightsLeft = function(){ var a=G.arena.ensureDaily(); return Math.max(0, G.arena.MAX_DAILY - (a.daily.fights||0)); };

  /* 해금 — 100층 돌파 시 개방 */
  G.arena.UNLOCK_FLOOR = 100;
  G.arena.unlocked = function(){ return ((G.state&&G.state.dungeon&&G.state.dungeon.maxFloor)||1) >= G.arena.UNLOCK_FLOOR; };
  G.arena.syncUnlock = function(){   // checkUnlocks용 — 신규 해금만 알림(최초/구버전은 조용히 동기화)
    var a=G.arena.ensure();
    if(a.unlockSeen===undefined){ a.unlockSeen=G.arena.unlocked(); return []; }
    if(G.arena.unlocked() && !a.unlockSeen){
      a.unlockSeen=true;
      G.log("🏟️ 아레나 해금! ("+G.arena.UNLOCK_FLOOR+"층 돌파)","r-legend");
      return [{ ico:"🏟️", name:"아레나 해금", desc:"PvP 비동기 대전 · 코인/티어/망토", sub:"아레나 · "+G.arena.UNLOCK_FLOOR+"층" }];
    }
    return [];
  };

  /* ---------- 점수/전적/코인/연승 ---------- */
  G.arena.score  = function(){ return (G.state.arena&&G.state.arena.score)||1000; };
  G.arena.wins   = function(){ return (G.state.arena&&G.state.arena.wins)||0; };
  G.arena.losses = function(){ return (G.state.arena&&G.state.arena.losses)||0; };
  G.arena.coins  = function(){ return (G.arena.ensure().coins)||0; };
  G.arena.streak = function(){ return (G.arena.ensure().streak)||0; };

  /* 내 사용 가능 스킬(해금 + 활성) id 목록 */
  G.arena.mySkills = function(){
    var sk=G.state.skills; if(!sk||!sk.unlocked) return [];
    return G.DATA.SKILLS.filter(function(s){ return sk.unlocked[s.id] && sk.enabled && sk.enabled[s.id]; }).map(function(s){ return s.id; });
  };

  /* 내 전투 스냅샷 (스킬·가시·기절저항 포함) */
  G.arena.snapshot = function(){
    var s=G.totalStats();
    return {
      name: nick(), power: G.power(), score: G.arena.score(),
      avatar: (G.avatar && G.avatar.currentId) ? G.avatar.currentId() : "adventurer",
      maxHp: Math.round(s.maxHp), atk: Math.round(s.atk), def: Math.round(s.def),
      crit: clampStat(s.crit,80), critDmg: s.critDmg||0, dodge: clampStat(s.dodge,60),
      lifesteal: s.lifesteal||0, penet: s.penet||0, multihit: clampStat(s.multihit,80),
      thorns: s.thorns||0, stunResist: clampStat(s.stunResist,80),
      skills: G.arena.mySkills()
    };
  };

  /* ---------- 전투 시뮬레이션 (게임 데미지 공식 + 스킬 1v1 매핑) ---------- */
  function strike(a, d, opt){
    opt=opt||{};
    if(d.dodge>0 && Math.random()*100 < d.dodge) return { dmg:0, dodge:true };
    var critMult = 1.5 + (a.critDmg||0)/100 * (opt.execute?2:1);   // execute=치명피해 효율 2배
    var strikes = 1 + ((a.multihit && Math.random()*100 < a.multihit)?1:0);
    var total=0, crit=false;
    for(var k=0;k<strikes;k++){
      var eDef = d.def*(1-(a.penet||0)/100); if(eDef<0) eDef=0;
      var mitig = a.atk/(a.atk+eDef);
      var base = a.atk*mitig*(0.9+Math.random()*0.2)*(opt.mult||1);
      var isC = Math.random()*100 < a.crit;
      total += Math.max(1, Math.round(base*(isC?critMult:1)));
      if(isC) crit=true;
    }
    return { dmg:total, crit:crit, multi:strikes>1 };
  }

  var SKILL_BY={}; (function(){ (G.DATA.SKILLS||[]).forEach(function(s){ SKILL_BY[s.id]=s; }); })();
  function mkSide(c){
    var list=(c.skills||[]).map(function(id){ return SKILL_BY[id]; }).filter(Boolean);
    // SKILLS 정의 순서대로 시전(휩쓸기→밀치기→처형→방패)
    list.sort(function(a,b){ return G.DATA.SKILLS.indexOf(a)-G.DATA.SKILLS.indexOf(b); });
    return { c:c, hp:c.maxHp, guard:0, stunned:0, cd:{}, list:list };
  }
  function pickSkill(S){
    for(var i=0;i<S.list.length;i++){ var sk=S.list[i];
      if((S.cd[sk.id]||0)>0) continue;
      if(sk.id==="guard" && S.guard>0) continue;
      return sk;
    }
    return null;
  }
  // A가 B를 공격(한 턴). rounds에 기록.
  function turn(A, B, rounds, who){
    for(var k in A.cd){ if(A.cd[k]>0) A.cd[k]--; }            // 쿨다운 감소(자기 턴마다)
    if(A.stunned>0){ A.stunned--; rounds.push({ who:who, stun:true }); return; }
    var sk=pickSkill(A), dmg=0, crit=false, dodge=false, skId=null, refl=0;
    if(sk && sk.id==="guard"){ A.cd.guard=sk.cd; A.guard=2; rounds.push({ who:who, skill:"guard" }); return; }
    if(sk){
      A.cd[sk.id]=sk.cd; skId=sk.id;
      var r = sk.id==="cleave" ? strike(A.c,B.c,{mult:0.8})
            : sk.id==="execute" ? strike(A.c,B.c,{execute:true})
            : strike(A.c,B.c,{});                              // stun은 일반 타격 + 기절 부여
      dmg=r.dmg; crit=r.crit; dodge=!!r.dodge;
      if(sk.id==="stun" && !dodge && dmg>0){
        if(!((B.c.stunResist||0)>0 && Math.random()*100 < B.c.stunResist)) B.stunned += 1;
      }
    } else {
      var r2=strike(A.c,B.c,{}); dmg=r2.dmg; crit=r2.crit; dodge=!!r2.dodge;
    }
    if(B.guard>0 && dmg>0) dmg=Math.max(1, Math.round(dmg*0.6));   // 방어자 가드: 받피 40%↓
    if(dmg>0 && (B.c.thorns||0)>0) refl=Math.floor(dmg*(B.c.thorns)/100*(B.guard>0?2:1)); // 가시반사(가드 시 2배)
    if(B.guard>0) B.guard--;
    B.hp -= dmg;
    if(A.c.lifesteal>0 && dmg>0) A.hp=Math.min(A.c.maxHp, A.hp+Math.floor(dmg*A.c.lifesteal/100));
    if(refl>0) A.hp -= refl;
    var e={ who:who, dmg:dmg, crit:crit, dodge:dodge, skill:skId, refl:refl };
    if(who==="me") e.foeHp=Math.max(0,B.hp); else e.meHp=Math.max(0,B.hp);
    rounds.push(e);
  }

  // me 선공, 번갈아. 반환 {win, rounds, meHp, foeHp}
  G.arena.simulate = function(me, foe){
    var A=mkSide(me), B=mkSide(foe), rounds=[], i=0;
    while(A.hp>0 && B.hp>0 && i<100){
      i++;
      turn(A,B,rounds,"me");  if(B.hp<=0) break;
      turn(B,A,rounds,"foe"); if(A.hp<=0) break;
    }
    var win = B.hp<=0 ? true : (A.hp<=0 ? false : (A.hp/me.maxHp >= B.hp/foe.maxHp));
    return { win:win, rounds:rounds, meHp:Math.max(0,A.hp), foeHp:Math.max(0,B.hp) };
  };

  /* ---------- 점수 변동(ELO식) — 내 점수만 변경 ---------- */
  G.arena.applyResult = function(foeScore, win){
    var my=G.arena.score();
    var expected = 1/(1+Math.pow(10,((foeScore||1000)-my)/400));
    var delta = Math.round(32*((win?1:0)-expected));
    if(win && delta<1) delta=1; if(!win && delta>-1) delta=-1;
    var ns=Math.max(0, my+delta);
    var a=G.arena.ensure();
    a.score=ns;
    if(win) a.wins=(a.wins||0)+1; else a.losses=(a.losses||0)+1;
    if(G.net && G.net.syncArena) G.net.syncArena();   // 온라인이면 서버 반영
    return { delta:delta, score:ns };
  };

  /* ---------- 보상 (골드는 고층에서 무의미 → 아레나 코인으로 일원화) ---------- */
  G.arena.winReward = function(tierIdx, streak){ return { coins:12+tierIdx*3+Math.min(streak,10), gold:0 }; };

  /* ---------- 도전 실행 (시뮬+점수+보상+연승+일일+티어변동) ---------- */
  G.arena.challenge = function(foe){
    G.arena.ensureDaily();
    var a=G.state.arena;
    var beforeTier=G.arena.tierIndex(a.score);
    var res = G.arena.simulate(G.arena.snapshot(), foe);
    var sc = G.arena.applyResult(foe.score, res.win);
    // 연승
    if(res.win){ a.streak=(a.streak||0)+1; a.bestStreak=Math.max(a.bestStreak||0,a.streak); a.daily.maxStreak=Math.max(a.daily.maxStreak||0,a.streak); }
    else a.streak=0;
    // 일일 카운터
    a.daily.fights=(a.daily.fights||0)+1;
    if(res.win) a.daily.win=(a.daily.win||0)+1;
    // 보상
    var ti=G.arena.tierIndex(a.score);
    var reward = res.win ? G.arena.winReward(ti, a.streak) : { coins:3, gold:0 };
    a.coins=(a.coins||0)+reward.coins;
    if(reward.gold>0) G.state.player.gold+=reward.gold;
    // 티어 변동
    var afterTier=G.arena.tierIndex(a.score);
    G.arena._rank=null;   // 랭킹 캐시 무효화
    G.save.save(true);
    return { res:res, score:sc, foe:foe, reward:reward, streak:a.streak,
             tierBefore:beforeTier, tierAfter:afterTier, tierChange:(afterTier>beforeTier?1:(afterTier<beforeTier?-1:0)) };
  };

  /* ---------- 일일 미션 ---------- */
  G.arena.MISSIONS = [
    { key:"win3",    name:"오늘 3승",      need:3, reward:30, prog:function(a){ return a.daily.win||0; } },
    { key:"fight5",  name:"오늘 5회 도전", need:5, reward:20, prog:function(a){ return a.daily.fights||0; } },
    { key:"streak3", name:"3연승 달성",    need:3, reward:25, prog:function(a){ return a.daily.maxStreak||0; } }
  ];
  G.arena.claimMission = function(key){
    var a=G.arena.ensureDaily();
    var m=G.arena.MISSIONS.filter(function(x){return x.key===key;})[0]; if(!m) return false;
    if(a.daily.claimed[key]) return false;
    if(m.prog(a) < m.need) return false;
    a.daily.claimed[key]=true; a.coins=(a.coins||0)+m.reward;
    G.save.save(true); return m.reward;
  };

  /* ---------- 코인 상점 ---------- */
  G.arena.SHOP = [
    { key:"pot5",  ico:"🧪", name:"체력 물약 ×5",   cost:30, desc:"즉시 물약 5개(소지 한도 내)" },
    { key:"mat20", ico:"🔩", name:"분해 재료 ×20",  cost:40, desc:"룬 제작·재련용 재료 20개" },
    { key:"mat60", ico:"🔩", name:"분해 재료 ×60",  cost:90, desc:"재료 대량(개당 더 저렴)" }
  ];
  G.arena.buy = function(key){
    var a=G.arena.ensure();
    var item=G.arena.SHOP.filter(function(x){return x.key===key;})[0]; if(!item) return { ok:false, msg:"없는 상품" };
    if((a.coins||0) < item.cost) return { ok:false, msg:"아레나 코인이 부족합니다" };
    var ti=G.arena.tierIndex(a.score), msg=item.name+" 구매!";
    if(key==="pot5"){
      var max=G.state.potionMax||20, have=G.state.consumables.potion_s||0;
      if(have>=max) return { ok:false, msg:"물약 소지 한도입니다" };
      var add=Math.min(5, max-have), H=G.potionHealAmount(), oh=G.state.consumables.potionHeal||H;
      G.state.consumables.potionHeal=Math.round((have*oh+add*H)/(have+add));
      G.state.consumables.potion_s=have+add; msg="🧪 물약 ×"+add+" 획득";
    } else if(key==="mat20"){ G.state.materials=(G.state.materials||0)+20; msg="🔩 분해재료 +20";
    } else if(key==="mat60"){ G.state.materials=(G.state.materials||0)+60; msg="🔩 분해재료 +60"; }
    a.coins-=item.cost; G.save.save(true);
    return { ok:true, msg:msg };
  };

  /* ---------- 오프라인 봇 상대 생성(내 전투력 근처) ---------- */
  var B1=["빛나는","불꽃","그림자","강철","폭풍","서리","황금","핏빛","천둥","광폭","어둠","질풍","불멸","파멸","월광","혹한"];
  var B2=["검사","마법사","사냥꾼","기사","도적","광전사","현자","챔피언","처형자","정복자","수호자","칼날","주술사"];
  function botName(){ return B1[Math.floor(Math.random()*B1.length)]+B2[Math.floor(Math.random()*B2.length)]+(Math.floor(Math.random()*900)+100); }
  function botSkills(score){
    var ti=G.arena.tierIndex(score), out=[];
    G.DATA.SKILLS.forEach(function(s){ if(Math.random() < 0.12+ti*0.12) out.push(s.id); });   // 고티어일수록 스킬 보유↑
    return out;
  }
  function botFrom(power, score){
    var f=0.75+Math.random()*0.5;                 // 내 대비 75~125%
    var atk=Math.max(8, Math.round(14*f + power*0.06*f));
    return {
      name:botName(), power:Math.round(power*f), score:score,
      avatar:(G.avatar?G.avatar.randomId():"adventurer"),
      maxHp:Math.round((120+power*0.9)*f), atk:atk, def:Math.round(atk*0.3),
      crit:5+Math.floor(Math.random()*20), critDmg:Math.floor(Math.random()*60),
      dodge:Math.floor(Math.random()*12), lifesteal:Math.floor(Math.random()*10),
      penet:Math.floor(Math.random()*15), multihit:Math.floor(Math.random()*15),
      thorns:Math.floor(Math.random()*12), stunResist:Math.floor(Math.random()*25),
      skills:botSkills(score), bot:true
    };
  }
  G.arena.botOpponents = function(){
    var p=G.power(), my=G.arena.score(), arr=[];
    for(var i=0;i<5;i++){ arr.push(botFrom(p, Math.max(0, my + (Math.floor(Math.random()*200)-100)))); }
    return arr;
  };

  /* 상대 정규화 — 스킬/가시/기절저항 없는 레거시 스냅샷은 티어 기반으로 보강(공정성) */
  function normalizeFoe(f){
    if(!f) return f;
    if(!f.skills) f.skills=botSkills(f.score||1000);
    if(f.thorns==null) f.thorns=0;
    if(f.stunResist==null) f.stunResist=0;
    return f;
  }

  /* ---------- 상대 목록 가져오기(온라인 우선, 캐시) ---------- */
  G.arena.loadOpponents = function(force){
    if(G.arena._foes && !force) return Promise.resolve(G.arena._foes);
    function done(list){ G.arena._foes=(list||[]).map(normalizeFoe); return G.arena._foes; }
    if(G.net && G.net.online() && G.net.arenaOpponents){
      G.arena._loading=true;
      return G.net.arenaOpponents().then(function(list){
        G.arena._loading=false;
        return done(list && list.length ? list : G.arena.botOpponents());
      }).catch(function(){ G.arena._loading=false; return done(G.arena.botOpponents()); });
    }
    return Promise.resolve(done(G.arena.botOpponents()));
  };

  /* ---------- 아레나 랭킹 ---------- */
  function botRankPool(){
    var arr=[], n=80;
    for(var i=0;i<n;i++){ arr.push({ name:botName(), score: 700+Math.floor(Math.random()*1400), avatar:(G.avatar?G.avatar.randomId():"adventurer") }); }
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

  /* ============================================================
     🧥 망토 (아레나 전용) — 코인 구매 + 코인 강화(공격력%/체력%)
     강화 실패: 코인만 소모(레벨 유지) + 천장(연속 실패 +가산, N회 확정)
     ============================================================ */
  G.cape = {};
  G.cape.LV_MAX = 10;
  G.cape.BUY_COST = 50;
  G.cape.RATE = { 1:90, 2:80, 3:65, 4:50, 5:35, 6:25, 7:15, 8:9, 9:5, 10:3 };  // 목표레벨별 기본 성공률(%) — 하드코어
  G.cape.PITY_STEP = 4;    // 연속 실패 시 다음 시도 +4%p
  G.cape.PITY_MAX  = 15;   // 15연속 실패 시 다음 강화는 확정 성공
  G.cape.upCost = function(L){ return 20 + L*15; };   // L=목표레벨 도달 비용(성공/실패 공통 소모)

  G.cape.get = function(){
    var c=G.state.cape=G.state.cape||{};
    if(c.owned==null) c.owned=false; if(c.level==null) c.level=0; if(c.fails==null) c.fails=0;
    return c;
  };
  function capeBonusAt(L){ return { atkPct:L*4, hpPct:L*3, elemAtk:(L>=7?(L-6)*5:0), allRes:(L>=7?(L-6)*3:0) }; }
  G.cape.bonus = function(){ var c=G.cape.get(); return (c.owned&&c.level>0)?capeBonusAt(c.level):{atkPct:0,hpPct:0,elemAtk:0,allRes:0}; };
  G.cape.nextBonus = function(){ var c=G.cape.get(); return capeBonusAt(Math.min(G.cape.LV_MAX, c.level+1)); };
  G.cape.successRate = function(){
    var c=G.cape.get(), L=c.level+1; if(L>G.cape.LV_MAX) return 0;
    if(c.fails>=G.cape.PITY_MAX) return 100;
    return Math.min(100, (G.cape.RATE[L]||0) + c.fails*G.cape.PITY_STEP);
  };
  G.cape.buy = function(){
    var c=G.cape.get(); if(c.owned) return { ok:false, msg:"이미 보유 중입니다" };
    var a=G.arena.ensure(); if((a.coins||0)<G.cape.BUY_COST) return { ok:false, msg:"코인이 부족합니다 (🏅"+G.cape.BUY_COST+")" };
    a.coins-=G.cape.BUY_COST; c.owned=true; c.level=0; c.fails=0; G.save.save(true);
    return { ok:true, msg:"🧥 망토 획득! 강화로 키우세요" };
  };
  G.cape.enhance = function(){
    var c=G.cape.get(); if(!c.owned) return { ok:false, msg:"먼저 망토를 구매하세요" };
    if(c.level>=G.cape.LV_MAX) return { ok:false, msg:"이미 최대 강화(+"+G.cape.LV_MAX+")입니다" };
    var L=c.level+1, cost=G.cape.upCost(L), a=G.arena.ensure();
    if((a.coins||0)<cost) return { ok:false, msg:"코인이 부족합니다 (🏅"+cost+")" };
    var rate=G.cape.successRate();
    a.coins-=cost;
    var success = (c.fails>=G.cape.PITY_MAX) || (Math.random()*100 < rate);
    if(success){ c.level=L; c.fails=0; G.save.save(true); return { ok:true, success:true, level:L, cost:cost, rate:rate }; }
    c.fails=(c.fails||0)+1; G.save.save(true);
    return { ok:true, success:false, level:c.level, cost:cost, rate:rate, fails:c.fails };
  };
})();
