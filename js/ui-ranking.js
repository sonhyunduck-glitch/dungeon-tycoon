/* ui-ranking.js — 무한의 탑(랭킹) 탭. */
var G = window.G;

G.ui.renderRanking = function(){
  var v=el("view-ranking");
  // 온라인이면 서버 랭킹을 주기적으로 갱신(15초 스로틀, 갱신 완료 시 자동 재렌더)
  if(G.net && G.net.online()){
    var now=Date.now();
    if(!G.ranking._lastFetch || now-G.ranking._lastFetch>15000){
      G.ranking._lastFetch=now;
      G.net.refreshRanking();
    }
  }
  var vw=G.ranking.towerView();
  var CAP=5;   // 방당 표시 아바타 수(초과는 +N명)
  function mini(c){ if(!(G.avatar&&G.avatar.miniHTML)) return ""; var id=c.me?G.avatar.currentId():c.avatar; return G.avatar.miniHTML(id,40); }
  function badge(rm){ return rm.rank<=3 ? '<span class="tf-medal">'+["🥇","🥈","🥉"][rm.rank-1]+'</span>' : '<span class="tf-rk">'+rm.rank+'</span>'; }
  function avrow(rm){
    var shown=rm.members.slice(0,CAP), extra=rm.members.length-shown.length;
    var avs=shown.map(function(c){ return '<div class="tf-av'+(c.me?" me":"")+'" title="'+esc(c.name)+'">'+mini(c)+'</div>'; }).join("");
    if(extra>0) avs+='<div class="tf-more">+'+extra+'</div>';
    return '<div class="tf-avrow">'+avs+'</div>';
  }
  function label(rm){ return rm.floor+'층'+(rm.members.length>1?' <span class="tf-cnt">'+rm.members.length+'명</span>':''); }
  // 방(층) 한 칸: 파란 벽돌방 · 같은 층 유저들이 나란히 입주 · 좌측 메달/순위 · 코인 장식
  function band(rm){
    if(rm.me){
      return '<div class="tfloor me">'+
        '<div class="tf-door"></div>'+
        '<div class="tf-arrow l">◀</div><div class="tf-arrow r">▶</div>'+
        '<div class="tf-badge">'+badge(rm)+'</div>'+
        avrow(rm)+
        '<div class="tf-name me">'+label(rm)+'</div>'+
      '</div>';
    }
    return '<div class="tfloor'+(rm.rank<=3?" elite":"")+'">'+
      '<span class="tf-coin l"></span><span class="tf-coin r"></span>'+
      '<div class="tf-badge">'+badge(rm)+'</div>'+
      avrow(rm)+
      '<div class="tf-name">'+label(rm)+'</div>'+
    '</div>';
  }
  v.innerHTML=
    '<div class="panel"><h2>🏯 무한의 탑 <span class="muted" style="font-size:.7rem">랭킹 · 최고 도달 층</span></h2>'+
      '<div class="muted" style="margin-bottom:8px">내 순위 <b class="gold">'+vw.myRank+'위</b> <span style="opacity:.7">/ '+vw.total+'명 · '+vw.totalFloors+'개 층</span></div>'+
      '<div class="tower">'+
        '<div class="tower-castle"><span class="tower-flag l">🚩</span><span class="tower-crown">👑</span><span class="tower-flag r">🚩</span></div>'+
        vw.top.map(band).join("")+
        (vw.gap?'<div class="tower-gap">⋯</div>':'')+
        vw.around.map(band).join("")+
        '<div class="tower-base">⛰️ 도전자 '+vw.total+'명</div>'+
      '</div>'+
    '</div>';
};

/* ---------- 약관 ---------- */
