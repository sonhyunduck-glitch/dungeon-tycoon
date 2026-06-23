/* ============================================================
   전투 — 텍스트 턴제 (한 번 교전 = 플레이어 공격 → 적 반격)
   ============================================================ */
var G = window.G;
G.combat = {};

/* 층·종류에 따른 몬스터 스탯 스케일
   kind: normal / elite / mini(수문장) / full(층보스) */
function monStats(floor, kind){
  var g = Math.pow(1.115, floor-1);                 // 층당 성장
  var hpMult  = { normal:1, elite:1.8, mini:2.5, full:3.5 }[kind] || 1;
  var atkMult = { normal:1, elite:1.25, mini:1.3, full:1.35 }[kind] || 1;
  var defMult = { normal:1, elite:1.15, mini:1.3, full:1.4 }[kind] || 1;
  var goldMult= { normal:1, elite:1.4, mini:2, full:4.0 }[kind] || 1;
  var hp  = Math.round(30*g*hpMult);
  var atk = Math.round(11*g*atkMult);
  var def = Math.round(2 *g*defMult);
  var gBase = Math.round(4*Math.pow(1.1,floor-1)*goldMult);
  return { hp:hp, atk:atk, def:def, gold:[gBase, Math.round(gBase*1.6)] };
}

/* 적 1마리 인스턴스 생성 */
function makeEnemy(species, floor, dropTier, kind){
  kind=kind||"normal";
  var st=monStats(floor, kind);
  var name=species.name;
  if(kind==="elite") name="정예 "+name;
  else if(kind==="mini") name="수문장 "+name;
  return { species:species, name:name, emoji:species.emoji, kind:kind, boss:kind==="full",
           floor:floor, dropTier:dropTier||1, hp:st.hp, maxHp:st.hp, atk:st.atk, def:st.def, gold:st.gold,
           element:G.elementForFloor(floor) };   // 100층+ 속성
}

/* 다중 적 전투 시작 — entries: [{species, kind}] */
G.combat.startGroup = function(entries, floor, dropTier){
  var enemies=entries.map(function(e){ return makeEnemy(e.species, floor, dropTier, e.kind||"normal"); });
  var group=enemies.length>1;
  G.state.dungeon.run.combat = { enemies:enemies, floor:floor, dropTier:dropTier||1, group:group };
  // 쿨다운·가드·기절은 run(층) 단위로 유지 — 몬스터 처치 시 리셋하지 않음
  if(group){
    G.log("⚔️ "+entries[0].species.name+" 무리 "+enemies.length+"마리 출현!", "r-rare");
  } else {
    var c=enemies[0];
    G.log((c.boss?"👑 ":"⚔️ ")+c.name+" 출현!", c.boss?"r-legend":(c.kind==="mini"?"r-rare":""));
  }
};

/* 단일 적 (호환용) */
G.combat.start = function(species, floor, dropTier, kind){
  G.combat.startGroup([{species:species, kind:kind||"normal"}], floor, dropTier);
};

function aliveEnemies(c){ return c.enemies.filter(function(e){return e.hp>0;}); }
G.combat.target = function(){ var c=G.state.dungeon.run.combat; return c? (aliveEnemies(c)[0]||null) : null; };

/* 적 처치 처리: 골드·드롭·룬·킬수 */
function killEnemy(e){
  var run=G.state.dungeon.run;
  e.hp=0; run.kills=(run.kills||0)+1;
  var gf=G.totalStats().goldFind||0;
  var gold=Math.round(G.util.rand(e.gold[0], e.gold[1])*(1+gf/100)*0.5);   // 처치 골드 50%↓
  G.state.player.gold+=gold;
  G.log("✅ "+e.name+" 처치! 🪙+"+G.ui.fmt(gold), "r-uncommon");
  var dropChance={ full:1, mini:0.55, elite:0.4, normal:0.18 }[e.kind]||0.18;
  if(Math.random()<dropChance){ var bonus=e.kind==="full"?2:(e.kind==="mini"?1:0); G.perks.routeLoot(G.item.generate(e.dropTier+bonus, e.floor)); }
  if(Math.random()<G.item.runeDropChance(e.kind, e.floor)){ G.perks.routeLoot(G.item.generateRune(e.dropTier, e.floor)); }
  // 🌟 고유 장비 — 보스(full) 처치 시 낮은 확률로 발견(연대기 도감)
  if(e.kind==="full" && G.DATA.UNIQUES){
    var elig=G.DATA.UNIQUES.filter(function(u){ return (u.minFloor||1)<=e.floor; });
    if(elig.length && Math.random()<0.06){
      var uq=elig[Math.floor(Math.random()*elig.length)];
      G.perks.routeLoot(G.item.generateUnique(uq, e.floor));
      G.log("🌟 고유 장비 발견 — "+uq.name+"!", "r-legend");
    }
  }
}
function finishWin(){ G.state.dungeon.run.combat=null; return { over:true, win:true }; }

/* 데미지 공식 — 방어 비례 경감 (지수 스케일에서도 난이도 일정)
   데미지 = 공격 × 공격/(공격+유효방어). penPct=방어관통%, critMult=치명배율 */
function dmg(atk, def, critRate, critMult, penPct){
  var eDef = def * (1 - (penPct||0)/100);
  if(eDef<0) eDef=0;
  var mitig = atk/(atk+eDef);
  var base = atk*mitig*(0.9+Math.random()*0.2);
  var crit = Math.random()*100 < critRate;
  return { value: Math.max(1, Math.round(base*(crit?(critMult||1.5):1))), crit:crit };
}

/* 공격 속성 배수(100층+ 디아블로식): 플레이어 공격속성 vs 몬스터 속성
   같은 속성=저항(0.5), 상극=약점(1.6×, 속성공격으로 증폭), 그 외=무난(1.0), 무속성=1.0 */
G.combat.elemMult = function(s, tgt, floor){
  if((floor||0) < 100 || !s.atkElem || !tgt || !tgt.element) return 1;
  var pe=s.atkElem, me=tgt.element.key;
  if(pe===me) return 0.5;                                                       // 저항
  if(G.DATA.ELEM_OPP[me]===pe) return Math.min(3, 1.6*(1+(s.elemAtk||0)/100));  // 약점
  return 1;                                                                     // 무난
};

/* 전투효과 점수 — 공격종합 × 생존종합(곱연산 → 균형 자동 반영). 아이템 추천/정산 판정용.
   s=G.totalStats() 결과(캡·룬워드·망토·아바타 모두 반영). 적 비의존 근사치. */
G.combat.effPower = function(s){
  if(!s) return 1;
  var critMult = 1.5 + (s.critDmg||0)/100;
  var off = (s.atk||1)
    * (1 + (s.crit||0)/100*(critMult-1))     // 치명 기대값
    * (1 + (s.multihit||0)/100)              // 추가타
    * (1 + (s.penet||0)/200)                 // 관통(근사)
    * (1 + (s.elemAtk||0)/300);              // 속성(상황적 → 약하게)
  var avgRes = ((s.resFire||0)+(s.resCold||0)+(s.resLight||0)+(s.resPoison||0))/4;
  var surv = (s.maxHp||1)
    * (1 + (s.def||0)/60)                     // 방어 경감(근사)
    * (100/Math.max(40, 100-(s.dodge||0)))   // 회피
    * (1 + avgRes/150)                        // 저항
    * (1 + (s.lifesteal||0)/100*0.5);         // 흡혈 지속
  return Math.sqrt(Math.max(1, off*surv));    // 기하평균 성격 → 한 축만 키우면 효율 체감
};

/* 스킬 사용 가능 여부(해금+ON) — 쿨다운은 run(층) 단위 */
function skillReady(c, sk){
  var run=G.state.dungeon.run;
  return G.state.skills && G.state.skills.unlocked[sk.id] && G.state.skills.enabled[sk.id] && ((run.cd||{})[sk.id]||0)<=0;
}
/* 우선순위(배열 순)대로 시전할 스킬 1개 선택 */
function pickSkill(c){
  var run=G.state.dungeon.run;
  for(var i=0;i<G.DATA.SKILLS.length;i++){
    var sk=G.DATA.SKILLS[i];
    if(!skillReady(c, sk)) continue;
    if(sk.id==="cleave" && aliveEnemies(c).length<2) continue; // 광역은 2마리 이상일 때
    if(sk.id==="guard" && run.guard>0) continue;               // 가드 중복 방지
    return sk;
  }
  return null;
}
/* 기본 공격(맨 앞 적, 추가타) */
function basicAttack(c, s, p, hits, critMult){
  var tgt=aliveEnemies(c)[0]; if(!tgt) return;
  var elemMult=G.combat.elemMult(s, tgt, c.floor);
  var strikes=1+((s.multihit && Math.random()*100<s.multihit)?1:0);
  var total=0, crit=false;
  for(var k=0;k<strikes && tgt.hp>0;k++){ var d=dmg(s.atk,tgt.def,s.crit,critMult,s.penet); var v=Math.max(1,Math.round(d.value*elemMult)); tgt.hp-=v; total+=v; if(d.crit)crit=true; }
  hits.push({target:"enemy", value:total, crit:crit});
  if(strikes>1) G.log("⚡ 추가타!", "log-skill");
  G.log((crit?"💥 치명타! ":"")+"→ "+tgt.name+"에게 "+G.ui.fmt(total)+" 피해", crit?"log-crit":"");
  lifestealHeal(s, p, total);
  if(tgt.hp<=0) killEnemy(tgt);
}
function lifestealHeal(s, p, dealt){
  if(s.lifesteal>0){ var h=Math.floor(dealt*s.lifesteal/100); if(h>0){ p.hp=Math.min(s.maxHp,p.hp+h); G.log("🩸 생명력 흡수 +"+G.ui.fmt(h),"log-heal"); } }
}
/* 스킬 시전 */
function applySkill(sk, c, s, p, hits, critMult){
  var tgt=aliveEnemies(c)[0];
  if(sk.id==="cleave"){
    var alive=aliveEnemies(c), total=0, crit=false, dmgs=[];
    alive.forEach(function(e){ var em=G.combat.elemMult(s,e,c.floor); var d=dmg(Math.round(s.atk*0.8), e.def, s.crit, critMult, s.penet); var v=Math.max(1,Math.round(d.value*em)); e.hp-=v; total+=v; dmgs.push(v); if(d.crit)crit=true; });
    hits.push({target:"enemy", value:total, crit:crit, aoe:true, dmgs:dmgs});
    G.log("🌀 휩쓸기! 적 전체에게 "+G.ui.fmt(total)+" 광역 피해", "log-skill");
    lifestealHeal(s, p, total);
    alive.forEach(function(e){ if(e.hp<=0) killEnemy(e); });
  } else if(sk.id==="execute"){
    var emx=G.combat.elemMult(s,tgt,c.floor);
    var cm=1.5+(s.critDmg*2||0)/100;
    var d=dmg(Math.round(s.atk*1.4), tgt.def, s.crit, cm, s.penet); d.value=Math.max(1,Math.round(d.value*emx));
    tgt.hp-=d.value; hits.push({target:"enemy", value:d.value, crit:d.crit});
    G.log("🗡️ 필사의 일격! "+tgt.name+"에게 "+G.ui.fmt(d.value)+(d.crit?" 💥치명":"")+" 피해","log-skill");
    lifestealHeal(s, p, d.value);
    if(tgt.hp<=0) killEnemy(tgt);
  } else if(sk.id==="stun"){
    var emy=G.combat.elemMult(s,tgt,c.floor);
    var d2=dmg(s.atk, tgt.def, s.crit, critMult, s.penet); d2.value=Math.max(1,Math.round(d2.value*emy));
    tgt.hp-=d2.value; hits.push({target:"enemy", value:d2.value, crit:d2.crit});
    if(tgt.hp>0){ tgt.stun=(tgt.stun||0)+1; G.log("🛡️ 방패 밀치기! "+tgt.name+" 기절 + "+G.ui.fmt(d2.value)+" 피해","log-skill"); }
    else G.log("🛡️ 방패 밀치기로 "+tgt.name+" 처치!","log-skill");
    lifestealHeal(s, p, d2.value);
    if(tgt.hp<=0) killEnemy(tgt);
  } else if(sk.id==="guard"){
    G.state.dungeon.run.guard=2; hits.push({target:"enemy", value:0});
    G.log("🪖 가시 방패! 2턴간 받는 피해 40%↓ · 피해반사 2배","log-skill");
  }
}

/* 한 턴 진행. 반환: {over, win, dead, hits} — 1:다 + 스킬 자동 시전 */
G.combat.attack = function(){
  var run=G.state.dungeon.run, c=run.combat, s=G.totalStats(), p=G.state.player;
  if(!c) return {over:true, hits:[]};
  var hits=[];
  var critMult = 1.5 + (s.critDmg||0)/100;
  run.turns=(run.turns||0)+1;
  run.cd=run.cd||{}; for(var key in run.cd){ if(run.cd[key]>0) run.cd[key]--; }   // 쿨다운 감소(층 단위)
  if(run.guard===undefined) run.guard=0; if(run.playerStun===undefined) run.playerStun=0;

  // 속성 구간(100층+): 공격은 속성타입 vs 몬스터 약점/저항으로 대상별 계산(elemMult), 방어는 아래
  var elemFloor = (c.floor||run.floor) >= 100;

  if(!aliveEnemies(c)[0]){ var rw0=finishWin(); rw0.hits=hits; return rw0; }

  // 플레이어 행동: 기절이면 스킵, 아니면 스킬 우선 → 없으면 기본공격
  if(run.playerStun>0){
    run.playerStun--; hits.push({target:"enemy", value:0});
    G.log("😵 기절! 이번 턴 행동 불가","log-crit");
  } else {
    var sk=pickSkill(c);
    if(sk){ applySkill(sk, c, s, p, hits, critMult); run.cd[sk.id]=sk.cd; }
    else { basicAttack(c, s, p, hits, critMult); }
  }

  if(aliveEnemies(c).length===0){ var rw=finishWin(); rw.hits=hits; return rw; }

  // 살아있는 모든 적이 반격 (가드/기절 적용)
  var incoming=0, anyHit=false, alive=aliveEnemies(c);
  for(var i=0;i<alive.length;i++){
    var e=alive[i];
    if(e.stun>0){ e.stun--; G.log("💫 "+e.name+" 기절 상태 — 공격 불가","log-heal"); continue; }
    if(s.dodge>0 && Math.random()*100 < s.dodge){ G.log("💨 회피! "+e.name+"의 공격을 피했다","log-heal"); anyHit=true; continue; }
    var ed=dmg(e.atk, s.def, 0, 1, 0).value;
    if(run.guard>0) ed=Math.max(1, Math.round(ed*0.6));
    // 속성 추가 피해(100층+): 몬스터 속성에 맞는 저항으로 경감
    if(elemFloor && e.element){
      var resist=Math.min(80, s[e.element.res]||0);
      ed += Math.round(ed * 0.5 * (1 - resist/100));
    }
    p.hp-=ed; incoming+=ed; anyHit=true;
    G.log("← "+e.name+"의 공격, "+G.ui.fmt(ed)+" 피해","");
    // 피해 반사 (가드 중 2배)
    if(s.thorns>0 && ed>0){
      var refl=Math.floor(ed * s.thorns/100 * (run.guard>0?2:1));
      if(refl>0){ e.hp-=refl; G.log("🌵 피해 반사 → "+e.name+"에게 "+G.ui.fmt(refl),"log-skill"); if(e.hp<=0) killEnemy(e); }
    }
    // 정예·보스는 플레이어 기절 시도(기절저항으로 경감)
    if(e.kind!=="normal" && Math.random()*100 < 12*(1-(s.stunResist||0)/100)){
      run.playerStun=1; G.log("⚡ "+e.name+"의 강타! 기절했다","log-crit");
    }
    if(p.hp<=0){ p.hp=0; hits.push({target:"player", value:incoming}); var rl=G.combat._lose(); rl.hits=hits; return rl; }
  }
  hits.push({ target:"player", value:incoming, dodge:!anyHit });
  if(run.guard>0) run.guard--;

  if(aliveEnemies(c).length===0){ var rw2=finishWin(); rw2.hits=hits; return rw2; }

  if(G.perks.isOn("auto_potion")){
    if(p.hp < s.maxHp*0.35 && (G.state.consumables.potion_s||0)>0){ G.combat.usePotion(); }
  }
  return {over:false, hits:hits};
};

/* 스킬 해금: 도달 층수(req)에 따라 자동 (골드 X). boot/clearFloor에서 호출 */
G.combat.syncSkills = function(){
  if(!G.state.skills) G.state.skills={unlocked:{},enabled:{}};
  var f=G.state.dungeon.maxFloor||1;
  var fresh=[];
  G.DATA.SKILLS.forEach(function(sk){
    if(!G.state.skills.unlocked[sk.id] && f>=sk.req){
      G.state.skills.unlocked[sk.id]=true;
      if(G.state.skills.enabled[sk.id]===undefined) G.state.skills.enabled[sk.id]=true;
      G.log("✨ 스킬 해금: "+sk.name+" ("+sk.req+"층 도달)","r-legend");
      fresh.push({ ico:sk.ico, name:sk.name, desc:sk.desc, sub:"스킬 · "+sk.req+"층" });
    }
  });
  return fresh;
};

/* 배속은 해금 없이 처음부터 1~4배속 사용 가능(해금 로직 제거) */
G.combat.syncSpeed = function(){ return []; };

/* 스킬+자동화 통합 해금 체크 → 한 모달로 알림 */
G.checkUnlocks = function(){
  var items=[]
    .concat(G.perks.syncFree()||[])
    .concat(G.combat.syncSkills()||[])
    .concat((G.avatar&&G.avatar.syncUnlocks&&G.avatar.syncUnlocks())||[])
    .concat((G.arena&&G.arena.syncUnlock&&G.arena.syncUnlock())||[]);
  if(items.length && G.ui && G.ui.unlockModal) G.ui.unlockModal(items);
  return items;
};
G.combat.skillToggle = function(id){
  if(!G.state.skills.unlocked[id]) return;
  G.state.skills.enabled[id]=!G.state.skills.enabled[id];
};

G.combat._lose = function(){
  var run=G.state.dungeon.run;
  // 캐주얼: 전리품·골드 안전. 부활 시 체력은 최대치의 10%로 회복(나머지는 물약/시간으로)
  G.log("🛡️ 쓰러졌지만 전리품은 모두 안전합니다. 체력 10%로 마을 귀환!", "r-uncommon");
  run.combat=null;
  run.dead=true;
  G.state.player.hp = Math.max(1, Math.round(G.totalStats().maxHp * 0.10));
  return { over:true, win:false, dead:true };
};

/* 포션 사용 (전투 중/밖 공용) */
G.combat.usePotion = function(){
  if((G.state.consumables.potion_s||0)<=0){ G.ui.toast("물약이 없습니다"); return false; }
  var s=G.totalStats(), p=G.state.player;
  if(p.hp>=s.maxHp){ G.ui.toast("이미 체력이 가득합니다"); return false; }
  G.state.consumables.potion_s--;
  var per=G.state.consumables.potionHeal||G.potionHealAmount();   // 구매 시 고정된 회복량
  var heal=Math.min(per, s.maxHp-p.hp);
  p.hp+=heal;
  G.log("🧪 물약 사용, 체력 +"+G.ui.fmt(heal),"log-heal");
  return true;
};
