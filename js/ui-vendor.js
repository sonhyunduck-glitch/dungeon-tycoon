/* ui-vendor.js — 상점/대장간 탭. */
var G = window.G;

G.ui.renderVendor = function(){
  var v=el("view-vendor");
  var pot=G.state.consumables.potion_s||0;
  var max=G.state.potionMax||20;
  var price=G.potionPrice(); // 회복 HP당 1골드
  var gold=G.state.player.gold;
  var full=pot>=max;
  var can1=!full && gold>=price, can10=!full && gold>=price;
  var potCls = full?"r-legend":"muted";

  v.innerHTML=
    '<div class="panel theme-shop"><h2>🏬 상점</h2>'+
      '<div class="muted">소모품을 구매하는 곳입니다. 보유 골드 🪙'+G.ui.fmt(gold)+'</div>'+
    '</div>'+
    '<div class="panel"><h3>소모품</h3>'+
      '<div class="item"><div class="ico">🧪</div>'+
        '<div class="info">'+
          '<div class="iname">체력 물약 <span class="'+potCls+'">'+pot+' / '+max+'</span></div>'+
          '<div class="idesc">구매 시 회복 +'+G.ui.fmt(G.potionHealAmount())+' (최대체력 '+G.potionHealPct()+'%) · 개당 🪙'+G.ui.fmt(price)+(full?' · <span class="r-legend">소지 한도</span>':'')+'<br>보유 물약 회복 +'+G.ui.fmt(G.state.consumables.potionHeal||0)+'</div>'+
        '</div>'+
        '<div class="iacts">'+
          '<button class="btn sm primary" data-act="buy-potion" data-qty="1" '+(can1?"":"disabled")+'>+1</button>'+
          '<button class="btn sm gold" data-act="buy-potion" data-qty="10" '+(can10?"":"disabled")+'>+10 🪙'+G.ui.fmt(price*10)+'</button>'+
        '</div>'+
      '</div>'+
      '<div class="muted" style="margin-top:8px">💡 가격은 회복량과 동일(회복 HP당 1골드). 최대 '+max+'개 소지. (특성 「자동 물약」 추천)</div>'+
    '</div>'+
    G.ui._forge();
};

/* 대장간 — 확정 제작 */
G.ui._forge = function(){
  var mm=G.state.monMats||{};
  var owned=G.DATA.BOSS_SPECIES.filter(function(b){return (mm[b.name]||0)>0;});
  var gold=G.forge.goldCost();
  var rows;
  if(!owned.length){
    rows='<div class="muted">층보스를 처치하면 고유 재료를 얻습니다. 재료로 특정 옵션이 100% 붙은 장비를 제작하세요.</div>';
  } else {
    rows=owned.map(function(b){
      var cnt=mm[b.name]||0, enough=cnt>=G.forge.MAT_COST;
      var lbl=G.DATA.STAT_META[b.gstat].label, wf=G.dungeon.floorForStat(b.gstat);
      return '<div class="item" style="border-left-color:var(--torch)">'+
        '<div class="ico">🧩</div>'+
        '<div class="info">'+
          '<div class="iname">'+esc(b.mat)+' <span class="muted">'+cnt+' / '+G.forge.MAT_COST+'</span></div>'+
          '<div class="idesc">보장 옵션 <span class="warp" data-act="warp" data-floor="'+wf+'">#'+lbl+'</span> · 비용 🪙'+G.ui.fmt(gold)+'</div>'+
          '<div class="iacts" style="margin-top:5px">'+
            ['weapon','armor','acc'].map(function(p){
              return '<button class="btn sm '+(enough?"primary":"")+'" data-act="craft" data-boss="'+esc(b.name)+'" data-part="'+p+'" '+(enough?"":"disabled")+'>'+G.partLabel(p)+'</button>';
            }).join("")+
          '</div>'+
        '</div>'+
      '</div>';
    }).join("");
  }
  // 룬 제작 섹션
  var mats=G.state.materials||0, rgold=G.forge.runeGoldCost(), rcost=G.forge.runeMatCost();
  var runeBtns=G.DATA.RUNE_BASES.filter(function(b){return b.craft;}).map(function(b){
    var ok = mats>=rcost && G.state.player.gold>=rgold;
    return '<button class="btn sm '+(ok?"primary":"")+'" data-act="craft-rune" data-rune="'+esc(b.base)+'" '+(ok?"":"disabled")+
      ' title="'+esc(b.base)+' ('+G.DATA.STAT_META[b.main].label+')">'+b.ico+' '+esc(b.base.replace("의 룬",""))+'</button>';
  }).join("");
  var runePanel='<div class="panel"><h3>🔮 룬 제작</h3>'+
    '<div class="muted" style="margin-bottom:7px">🔩 재료 <b>'+mats+'</b> · 룬 1개 = 🔩'+rcost+' + 🪙'+G.ui.fmt(rgold)+'</div>'+
    '<div class="row">'+runeBtns+'</div>'+
    '<div class="muted" style="margin-top:7px">🔩 재료는 <b>아이템 분해</b>로 얻습니다. 층이 오를수록 룬 베이스가 강해져 재료 비용도 늘어납니다. (활력·황금·가시 룬은 사냥 드롭)</div></div>';

  return '<div class="panel"><h3>🔨 대장간 — 확정 제작</h3>'+rows+'</div>'+runePanel;
};

/* ============================================================
   시장 검색소 뷰 — NPC 상인 매물 검색 / 급매물 되팔이 / 키워드 알림
   ============================================================ */
