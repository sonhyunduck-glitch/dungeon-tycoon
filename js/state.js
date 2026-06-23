/* ============================================================
   전역 게임 상태 + 유틸
   ============================================================ */
var G = window.G;

G.util = {
  rand: function(min,max){ return Math.floor(Math.random()*(max-min+1))+min; },
  pick: function(arr){ return arr[Math.floor(Math.random()*arr.length)]; },
  // 가중치 선택
  weighted: function(list){
    var total=0,i; for(i=0;i<list.length;i++) total+=list[i].weight;
    var r=Math.random()*total;
    for(i=0;i<list.length;i++){ r-=list[i].weight; if(r<0) return list[i]; }
    return list[list.length-1];
  },
  uid: function(){ G.state._seq=(G.state._seq||0)+1; return "i"+G.state._seq; },
  clamp: function(v,a,b){ return Math.max(a,Math.min(b,v)); },
};

/* 신규 게임 기본 상태 */
G.newState = function(){
  return {
    _seq:0,
    nickname:null,       // 멀티: 닉네임(온라인 프로필/채팅/랭킹 표시명)
    player:{ hp:150, maxHp:150, atk:14, def:4, crit:5, gold:50 },
    equipment:{ weapon:null, helmet:null, armor:null, gloves:null, boots:null, ring:null, necklace:null },
    cape:{ owned:false, level:0, fails:0 },   // 🧥 망토(아레나 전용): 코인 구매 + 코인 강화(공격력%/체력%)
    cosmetics:{ owned:{}, shards:0, pity:{ legend:0 } },   // 🎰 외형 뽑기: 보유 스킨/외형 조각/천장
    collection:{ uniques:{}, runewords:{} },   // 🌟 고유 장비 + 🔗 룬워드 연대기(발견 기록)
    inventory:[],   // 통합 창고(가방+창고 일원화) — 종류별 칸 한계
    invCaps:{ gear:40, rune:20, unique:20 },   // 창고 종류별 용량(장비/룬/고유)
    consumables:{ potion_s:10, potionHeal:40 },  // potionHeal=보유 물약 1개당 고정 회복량(구매 시점 고정)
    potionMax:10,
    potionLevel:1,       // 물약 강화 레벨 (회복률 상승)
    battleSpeed:1,       // 자동 전투 배속 (진행도에 따라 해금)
    muted:false,         // 사운드 음소거(마스터)
    shake:true,          // 피격 시 화면 흔들림 효과
    arenaSkip:false,     // 아레나 전투화면 항상 스킵(바로 결과)
    arena:{ score:1000, wins:0, losses:0, coins:0, streak:0, bestStreak:0,   // PvP 아레나: 점수/전적/코인/연승
            daily:{ date:"", fights:0, win:0, maxStreak:0, claimed:{} } },
    avatar:"adventurer",  // 플레이어 전투 스프라이트(아바타) id
    bgmVol:0.32,         // 배경음 볼륨 0~1
    sfxVol:0.55,         // 효과음 볼륨 0~1
    orders:[], lastOrders:0,
    promo:{ tickets:1, until:0, f100:false },   // 100층 보상: f100=수령여부 (가판대 홍보 잔여 필드)
    dungeon:{ floor:1, maxFloor:1, clearedFloors:{}, stars:{}, run:null, runLoot:[], speedTier:1 }, // runLoot: 미정산 전리품(층 이동 무관 누적, 정산에서만 비움)
    market:{ listings:[], lastRefresh:0, watch:[] },
    perks:{ unlocked:{}, enabled:{} },
    skills:{ unlocked:{}, enabled:{} },
    pickup:{ common:true, uncommon:true, rare:true, epic:true, legend:true }, // 등급별 획득 여부
    log:[],
    ui:{ tab:"dungeon", stageView:null, whCat:"all", charSub:"stats", bagSort:"price",
         market:{ slot:"all", rarity:"all", opt1:"", opt2:"", pmin:0, pmax:0 } },
  };
};

G.state = G.newState();

/* 파생 스탯: 기본 스탯 + 장비 전체 합산 (디아블로식 옵션 포함) */
G.totalStats = function(){
  var p=G.state.player, eq=G.state.equipment;
  // 기본값
  var s={ atk:p.atk, def:p.def, crit:p.crit,
          critDmg:0, lifesteal:0, dodge:0, penet:0, multihit:0, goldFind:0,
          thorns:0, stunResist:0, elemAtk:0, resFire:0, resCold:0, resLight:0, resPoison:0, allRes:0,
          shopSlot:0, mercFind:0, potionBoost:0, hpBonus:0 };
  for(var key in eq){ var it=eq[key]; if(!it||!it.stats) continue;
    s.atk        += it.stats.atk        ||0;
    s.def        += it.stats.def        ||0;
    s.crit       += it.stats.crit       ||0;
    s.critDmg    += it.stats.critDmg    ||0;
    s.lifesteal  += it.stats.lifesteal  ||0;
    s.dodge      += it.stats.dodge      ||0;
    s.penet      += it.stats.penet      ||0;
    s.multihit   += it.stats.multihit   ||0;
    s.goldFind   += it.stats.goldFind   ||0;
    s.thorns     += it.stats.thorns     ||0;
    s.stunResist += it.stats.stunResist ||0;
    s.elemAtk    += it.stats.elemAtk    ||0;
    s.resFire    += it.stats.resFire    ||0;
    s.resCold    += it.stats.resCold    ||0;
    s.resLight   += it.stats.resLight   ||0;
    s.resPoison  += it.stats.resPoison  ||0;
    s.allRes     += it.stats.allRes     ||0;
    s.shopSlot   += it.stats.shopSlot   ||0;
    s.mercFind   += it.stats.mercFind   ||0;
    s.potionBoost+= it.stats.potionBoost||0;
    s.hpBonus    += it.stats.hp         ||0;
    // 🔩 소켓 룬: 무기면 wpn 효과, 그 외(방어구/장신구)면 arm 효과
    if(it.sockets){ var _isW=(it.type==="weapon");
      for(var _si=0;_si<it.sockets.length;_si++){ var _r=it.sockets[_si]; if(!_r) continue;
        var _eff=_isW?_r.wpn:_r.arm; if(!_eff) continue;
        for(var _ek in _eff){ if(_ek==="hp") s.hpBonus+=_eff[_ek]; else s[_ek]=(s[_ek]||0)+_eff[_ek]; }
      }
    }
  }
  // 🧥 망토 보너스: 속성공격/올레지는 캡 적용 전에 합산(공격력%·체력%는 캡 이후 마지막에 적용)
  var _cb = (G.cape && G.cape.bonus) ? G.cape.bonus() : null;
  if(_cb){ s.elemAtk += _cb.elemAtk||0; s.allRes += _cb.allRes||0; }
  // 🔗 룬워드 보너스(% 보조, 부위별 여러 개 가능) — 캡 적용 전에 합산
  var _rwl = (G.runeword && G.runeword.activeList) ? G.runeword.activeList() : [];
  _rwl.forEach(function(w){ var b=w.bonus||{}; for(var _rk in b){ if(_rk==="hp") s.hpBonus+=b[_rk]; else s[_rk]=(s[_rk]||0)+b[_rk]; } });
  // 상한(% 스탯 누적으로 전투가 무력화되는 것 방지 → 예측 가능한 수치)
  s.crit       = Math.min(s.crit, 80);
  s.critDmg    = Math.min(s.critDmg, 150);
  s.lifesteal  = Math.min(s.lifesteal, 25);
  s.dodge      = Math.min(s.dodge, 60);
  s.penet      = Math.min(s.penet, 75);
  s.multihit   = Math.min(s.multihit, 40);
  s.thorns     = Math.min(s.thorns, 100);
  s.stunResist = Math.min(s.stunResist, 80);
  s.elemAtk    = Math.min(s.elemAtk, 150);
  // 모든저항(올레지)을 각 속성저항에 합산 후 캡
  s.resFire    = Math.min(s.resFire   + s.allRes, 80);
  s.resCold    = Math.min(s.resCold   + s.allRes, 80);
  s.resLight   = Math.min(s.resLight  + s.allRes, 80);
  s.resPoison  = Math.min(s.resPoison + s.allRes, 80);
  // 공격 속성(100층+ 디아블로식): 무기 우선, 없으면 장착 룬에서
  s.atkElem = (eq.weapon && eq.weapon.attackElem) || null;
  // 🧥 망토 + 🎭 장착 아바타 공격력%/체력% (캡 없는 atk와 최종 maxHp에 곱연산)
  var _av = (G.avatar && G.avatar.statBonus) ? G.avatar.statBonus() : null;
  var _atkPct = ((_cb&&_cb.atkPct)||0) + ((_av&&_av.atkPct)||0);
  var _hpPct  = ((_cb&&_cb.hpPct)||0)  + ((_av&&_av.hpPct)||0);
  if(_atkPct) s.atk = Math.round(s.atk * (1 + _atkPct/100));
  s.maxHp = Math.round((p.maxHp + s.hpBonus) * (1 + _hpPct/100));
  return s;
};

/* 물약 회복: 최대 체력 비례 (기본 10% + 물약회복 옵션%, 상한 50% → 풀회복 방지)
   고층에서도 유효. 초반엔 최소 40 보장. */
G.POTION_BASE_PCT = 10;
G.POTION_MAX_PCT  = 50;
G.potionHealPct = function(){ return Math.min(G.POTION_MAX_PCT, Math.round((G.POTION_BASE_PCT + (G.totalStats().potionBoost||0))*10)/10); };
G.potionHealAmount = function(){
  var t=G.totalStats();
  var pct=Math.min(G.POTION_MAX_PCT, G.POTION_BASE_PCT + (t.potionBoost||0));
  return Math.max(40, Math.round(t.maxHp * pct/100));
};
/* 물약 가격 = 회복 HP당 1골드 (회복량과 동일) */
G.potionPrice = function(){ return G.potionHealAmount(); };

/* 최대 배속 — 해금 없이 항상 4배속까지 */
G.maxSpeed = function(){ return 4; };

G.power = function(){
  var s=G.totalStats();
  return Math.round(s.atk*2 + s.def*1.5 + s.maxHp*0.25
    + s.crit*1.5 + s.critDmg*0.5 + s.lifesteal*2 + s.dodge*2 + s.penet*1 + s.multihit*2
    + s.goldFind*0.3 + s.thorns*1 + s.stunResist*0.3 + s.elemAtk*1
    + (s.resFire+s.resCold+s.resLight+s.resPoison)*0.4);
};

/* 로그 추가 */
G.log = function(msg, cls){
  G.state.log.unshift({ msg:msg, cls:cls||"" });
  if(G.state.log.length>120) G.state.log.pop();
  if(G.ui && G.ui.renderLog) G.ui.renderLog();
};
