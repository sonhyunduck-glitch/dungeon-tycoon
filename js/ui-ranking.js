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
  var vw=G.ranking.view();
  function mini(c){ if(!(G.avatar&&G.avatar.miniHTML)) return ""; var id=c.me?G.avatar.currentId():c.avatar; return G.avatar.miniHTML(id,45); }
  function band(c){
    var medal = c.rank===1?"🥇":(c.rank===2?"🥈":(c.rank===3?"🥉":"#"+c.rank));
    if(c.me){
      return '<div class="tower-floor me">'+
        '<div class="tf-glow"></div><div class="tf-door"></div>'+
        '<div class="tf-arrow l">◀</div><div class="tf-arrow r">▶</div>'+
        '<div class="tf-climber"></div>'+
        '<div class="tf-num">'+c.floor+'층</div>'+
        '<div class="tf-who me">'+mini(c)+' '+esc(c.name)+' <span class="tag r-uncommon">'+medal+'</span></div>'+
      '</div>';
    }
    return '<div class="tower-floor'+(c.rank<=3?" elite":"")+'">'+
      '<span class="tf-lamp l"></span><span class="tf-lamp r"></span>'+
      '<div class="tf-num">'+c.floor+'층</div>'+
      '<div class="tf-who">'+medal+' '+mini(c)+' '+esc(c.name)+'</div>'+
    '</div>';
  }
  v.innerHTML=
    '<div class="panel"><h2>🏯 무한의 탑 <span class="muted" style="font-size:.7rem">랭킹 · 최고 도달 층</span></h2>'+
      '<div class="muted" style="margin-bottom:8px">내 순위 <b class="gold">'+vw.me.rank+'위</b> <span style="opacity:.7">/ '+vw.total+'명</span></div>'+
      '<div class="tower">'+
        '<div class="tower-spire">👑</div><div class="tower-roof"></div>'+
        '<div class="tower-body">'+
          vw.top.map(band).join("")+
          (vw.gap?'<div class="tower-gap">⋯</div>':'')+
          vw.around.map(band).join("")+
        '</div>'+
        '<div class="tower-base">⛰️ 도전자 '+vw.total+'명</div>'+
      '</div>'+
    '</div>';
};

/* ---------- 약관 ---------- */
