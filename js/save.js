/* ============================================================
   저장 / 불러오기 (localStorage + 텍스트 코드)
   ============================================================ */
var G = window.G;
G.save = {};
G.save.KEY = "dungeon_tycoon_save_v1";

G.save.save = function(silent){
  try{
    G.state._savedAt = Date.now();   // 세이브 시각(클라우드 권위 비교용 — 더 최신 쪽 채택)
    localStorage.setItem(G.save.KEY, JSON.stringify(G.state));
    if(G.net && G.net.queueSave) G.net.queueSave();   // 온라인이면 클라우드에도 동기화(디바운스)
    if(!silent) G.ui.toast("저장 완료 💾");
    return true;
  }catch(e){ G.ui.toast("저장 실패: "+e.message); return false; }
};

G.save.load = function(){
  try{
    var raw=localStorage.getItem(G.save.KEY);
    if(!raw) return false;
    var data=JSON.parse(raw);
    // 진행 중 던전 run은 복원하지 않음(안전하게 마을에서 시작)
    if(data.dungeon) data.dungeon.run=null;
    if(!data.perks) data.perks={ unlocked:{}, enabled:{} }; // 구버전 호환
    if(!data.skills) data.skills={ unlocked:{}, enabled:{} };
    if(!data.promo) data.promo={ tickets:0, until:0, f100:(data.dungeon&&(data.dungeon.maxFloor||1)>=100) };  // 구버전: 이미 100층+면 보상 수령처리(소급지급 없음)
    if(data.promo.f100===undefined) data.promo.f100=((data.dungeon&&data.dungeon.maxFloor)||1)>=100;
    if(!data.pickup) data.pickup={ common:true, uncommon:true, rare:true, epic:true, legend:true };
    if(!data.potionMax || data.potionMax>10) data.potionMax=10;
    if(data.consumables && data.consumables.potionHeal===undefined) data.consumables.potionHeal=40;
    if(data.potionLevel===undefined) data.potionLevel=1;
    if(!data.battleSpeed) data.battleSpeed=1;
    if(data.shake===undefined) data.shake=true;
    if(!data.arena) data.arena={ score:1000, wins:0, losses:0 };
    if(!data.avatar) data.avatar="adventurer";
    if(!data.orders) data.orders=[];
    if(data.materials!==undefined) delete data.materials;   // 분해 시스템 폐지
    if(data.monMats) delete data.monMats;                   // 보스재료 폐지
    if(data.stamina) delete data.stamina;   // 행동력 시스템 제거 — 구버전 세이브 잔여 필드 정리
    if(!data.cosmetics) data.cosmetics={ owned:{}, shards:0, pity:{ legend:0 } };   // 외형 뽑기
    if(!data.collection) data.collection={ uniques:{}, runewords:{} };   // 고유 장비 + 룬워드 연대기
    if(data.collection && !data.collection.runewords) data.collection.runewords={};
    if(data.dungeon && !data.dungeon.stars) data.dungeon.stars={};
    if(data.shop) delete data.shop;   // 가판대 폐지 — 구버전 잔여 제거
    if(!data.market) data.market={ listings:[], lastRefresh:0, watch:[] };
    if(data.ui && !data.ui.market) data.ui.market={ slot:"all", rarity:"all", opt1:"", opt2:"", pmin:0, pmax:0 };
    if(data.dungeon && !data.dungeon.maxFloor) data.dungeon.maxFloor=data.dungeon.floor||1;
    // 구버전 장신구(acc 통합슬롯) → 반지/목걸이 분리
    var fixAcc=function(it){ if(it && it.slot==="acc"){
      it.slot=(it.ico==="📿"||/목걸이/.test(it.name||""))?"necklace":"ring"; } return it; };
    if(data.equipment){
      var eq=data.equipment;
      if(eq.ring===undefined && eq.necklace===undefined){
        eq.ring=null; eq.necklace=null;
        [eq.acc1, eq.acc2].forEach(function(it){
          if(!it) return; fixAcc(it);
          if(!eq[it.slot]) eq[it.slot]=it;
          else (data.inventory=data.inventory||[]).push(it);
        });
        delete eq.acc1; delete eq.acc2;
      }
    }
    (data.inventory||[]).forEach(fixAcc);
    // 구버전(스테이지형) → 층형 변환: "f-3" 클리어 = f층 클리어
    if(data.dungeon && !data.dungeon.clearedFloors){
      data.dungeon.clearedFloors={};
      var cs=data.dungeon.clearedStages||{};
      Object.keys(cs).forEach(function(k){
        if(/-3$/.test(k)){ data.dungeon.clearedFloors[parseInt(k,10)]=true; }
      });
      delete data.dungeon.clearedStages;
    }
    if(!data.ui) data.ui={ tab:"dungeon" };
    if(!data.ui.charSub) data.ui.charSub="stats";
    if(data.ui.tab==="market") data.ui.tab="dungeon";   // 삭제된 시장 탭
    if(!data.ui.bagSort) data.ui.bagSort="price";
    G.state=data;
    return true;
  }catch(e){ console.warn("load fail",e); return false; }
};

G.save.reset = function(){
  localStorage.removeItem(G.save.KEY);
  G.state=G.newState();
  G.ui.switchTab("dungeon");
  G.ui.toast("새 게임 시작");
};

G.save.exportCode = function(){
  try{ return btoa(unescape(encodeURIComponent(JSON.stringify(G.state)))); }
  catch(e){ return ""; }
};

G.save.importCode = function(code){
  try{
    var data=JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if(data.dungeon) data.dungeon.run=null;
    // localStorage에 넣고 load() 경유 → 구버전 코드도 마이그레이션 전부 적용(신규 필드 누락/크래시 방지)
    localStorage.setItem(G.save.KEY, JSON.stringify(data));
    if(!G.save.load()) throw new Error("load fail");
    G.ui.switchTab("dungeon");
    G.ui.toast("불러오기 완료 📥");
    return true;
  }catch(e){ G.ui.toast("잘못된 코드입니다"); return false; }
};
