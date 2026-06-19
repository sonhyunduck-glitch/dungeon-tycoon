/* ============================================================
   던전 진행 — 스테이지 입장 / 노드 전진 / 이벤트 롤
   ============================================================ */
var G = window.G;
G.dungeon = {};

G.dungeon.getFloor = function(f){
  f = f || G.state.dungeon.floor;
  return G.DATA.FLOORS.find(function(x){return x.floor===f;});
};

/* 층 잠금 여부: 이전 층을 클리어해야 열림 (1층은 항상) */
G.dungeon.isUnlocked = function(floorNum){
  if(floorNum<=1) return true;
  return !!G.state.dungeon.clearedFloors[floorNum-1];
};

/* 층 입장 → run 생성 */
G.dungeon.enter = function(floorNum){
  floorNum = parseInt(floorNum,10);
  var fl=G.dungeon.getFloor(floorNum);
  if(!fl || !G.dungeon.isUnlocked(floorNum)) return;
  G.state.dungeon.run = {
    floor: fl.floor,
    dropTier: fl.dropTier,
    pool: fl.pool,
    nodes: fl.nodes.map(function(n){ return { type:n.type, species:n.species, kind:n.kind, done:false }; }),
    index: 0,
    combat: null,
    dead: false,
    cleared: false,
    event: null,
    lowHp: 1,           // 별점용 최저 체력 비율
    cd:{}, guard:0, playerStun:0,   // 스킬 쿨다운·상태: 층 단위 유지(몬스터 처치 시 리셋 안 됨)
  };
  G.log("🚪 "+fl.floor+"층 진입","");
  G.dungeon.resolveNode();
};

/* 현재 노드 이벤트 결정 (전투면 combat 시작, 아니면 event 세팅) */
G.dungeon.resolveNode = function(){
  var run=G.state.dungeon.run;
  if(!run) return;
  var node=run.nodes[run.index];
  run.event=null;

  if(node.type==="boss"){
    G.combat.start(node.species, run.floor, run.dropTier, node.kind);
    return;
  }
  // normal: 전투 95% + 이벤트 5%(골드/회복제/장비)
  var r=Math.random()*100;
  function pick(){ return G.util.pick(run.pool); }
  var allowSwarm = run.floor >= 10;   // 10층부터 1:다(무리) 전투 등장
  if(r<50){ // 단일 전투
    G.combat.start(pick(), run.floor, run.dropTier, "normal");
  } else if(r<80){ // 무리 전투 (1:다) — 10층 미만은 단일로 대체
    if(allowSwarm){
      var n=G.util.rand(2,3), entries=[];
      for(var z=0;z<n;z++) entries.push({ species:pick(), kind:"normal" });
      G.combat.startGroup(entries, run.floor, run.dropTier);
    } else {
      G.combat.start(pick(), run.floor, run.dropTier, "normal");
    }
  } else if(r<95){ // 정예 (10층부터 드물게 정예 무리)
    if(allowSwarm && Math.random()<0.4){
      G.combat.startGroup([{species:pick(),kind:"elite"},{species:pick(),kind:"normal"},{species:pick(),kind:"normal"}], run.floor, run.dropTier+1);
    } else {
      G.combat.start(pick(), run.floor, run.dropTier+1, "elite");
    }
  } else { // 이벤트 5% — 골드 / 체력 회복제 / 장비 (균등)
    var er=Math.floor(Math.random()*3);
    if(er===0){ // 골드 획득
      var gold=Math.round(G.util.rand(5,12)*run.floor);
      G.state.player.gold+=gold;
      run.event={ kind:"gold", text:"🪙 골드 +"+G.ui.fmt(gold)+" 획득!" };
      G.log("💰 이벤트: 골드 🪙+"+G.ui.fmt(gold),"r-uncommon");
    } else if(er===1){ // 체력 회복제 획득
      if(!G.state.consumables) G.state.consumables={};
      var max=G.state.potionMax||20, have=G.state.consumables.potion_s||0;
      var qty=Math.min(G.util.rand(1,2), Math.max(0, max-have));
      if(qty>0){
        var H=G.potionHealAmount(), oldHeal=G.state.consumables.potionHeal||H;
        G.state.consumables.potionHeal=Math.round((have*oldHeal+qty*H)/(have+qty));
        G.state.consumables.potion_s=have+qty;
        run.event={ kind:"potion", text:"🧪 체력 회복제 +"+qty+" 획득!" };
        G.log("🧪 이벤트: 체력 회복제 +"+qty+"개","r-uncommon");
      } else { // 한도 가득 → 골드로 대체
        var g2=Math.round(G.util.rand(3,8)*run.floor);
        G.state.player.gold+=g2;
        run.event={ kind:"gold", text:"🧪 회복제 한도 — 대신 골드 +"+G.ui.fmt(g2) };
        G.log("🧪 회복제 소지 한도 — 골드 🪙+"+G.ui.fmt(g2),"");
      }
    } else { // 장비 획득
      var drop=G.item.generate(run.dropTier, run.floor);
      G.perks.routeLoot(drop);
      run.event={ kind:"gear", text:"🎁 장비 획득: "+drop.name };
      G.log("🎁 이벤트: 장비 「"+drop.name+"」 획득", drop.rarityCls||"r-uncommon");
    }
  }
};

/* 노드 완료 처리 후 다음으로 (전투 승리/이벤트 확인 시 호출) */
G.dungeon.advance = function(){
  var run=G.state.dungeon.run;
  if(!run || run.combat) return; // 전투 중엔 불가
  run.nodes[run.index].done=true;

  // 마지막 노드(층 보스)였으면 층 클리어
  if(run.index >= run.nodes.length-1){
    G.dungeon.clearFloor();
    return;
  }
  run.index++;
  G.dungeon.resolveNode();
};

G.dungeon.clearFloor = function(){
  var run=G.state.dungeon.run;
  var fl=G.dungeon.getFloor(run.floor);
  var first = !G.state.dungeon.clearedFloors[run.floor];
  G.state.dungeon.clearedFloors[run.floor]=true;
  run.cleared=true;

  var gold=Math.round(fl.gold*0.5);   // 층 클리어 골드 50%↓
  G.state.player.gold += gold;
  G.log("🏆 "+run.floor+"층 클리어! 🪙+"+G.ui.fmt(gold), "r-legend");

  // 별점: 적 1마리당 평균 처치 턴 (빠를수록 별 많음, "3턴 이내=3성")
  var avg = (run.turns||0) / Math.max(1, run.kills||0);
  var stars = avg<=3 ? 3 : (avg<=6 ? 2 : 1);
  var prev = G.state.dungeon.stars[run.floor]||0;
  if(stars>prev){ G.state.dungeon.stars[run.floor]=stars; }
  run.stars=stars;
  if(stars>=3 && prev<3) G.log("⭐⭐⭐ 완벽 클리어(평균 "+avg.toFixed(1)+"턴)! "+run.floor+"층","r-legend");

  // 다음 층 해금
  var next=G.dungeon.getFloor(run.floor+1);
  if(next){
    G.state.dungeon.maxFloor=Math.max(G.state.dungeon.maxFloor||1, next.floor);
    G.state.dungeon.floor=next.floor;  // 새 층으로 뷰 이동
    if(first) G.log("✨ "+next.floor+"층이 해금되었습니다!","r-legend");
  } else {
    G.log("👑 최종 "+G.DATA.MAX_FLOOR+"층을 정복했습니다! 당신은 전설입니다.","r-legend");
  }
  G.checkUnlocks();   // 자동화·스킬·배속 통합 해금 + 모달 알림
};

/* 던전 나가기 (run 종료) */
G.dungeon.leave = function(){
  G.state.dungeon.run=null;
};
