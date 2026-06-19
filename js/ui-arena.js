/* ui-arena.js — 아레나(PvP) 탭. */
var G = window.G;

G.ui.renderArena = function(){
  var v=el("view-arena");
  // 상대 로드(없으면 비동기 로드 후 재렌더)
  if(!G.arena._foes && !G.arena._loading){
    G.arena.loadOpponents().then(function(){ if(G.state.ui.tab==="arena") G.ui.renderArena(); });
  }
  // 랭킹 캐시(온라인: 서버 15초 스로틀 / 오프라인: 1회 생성 후 캐시)
  if(!G.arena._rank){
    if(G.net && G.net.online()){
      var now=Date.now();
      if(!G.arena._rankFetch || now-G.arena._rankFetch>15000){
        G.arena._rankFetch=now;
        G.net.arenaRanking().then(function(rv){ G.arena._rank=rv||G.arena.localRankView(); if(G.state.ui.tab==="arena") G.ui.renderArena(); });
      }
    } else { G.arena._rank=G.arena.localRankView(); }
  }

  var me=G.arena.snapshot();
  var foes=G.arena._foes||[];
  var rv=G.arena._rank;

  var head='<div class="panel"><h2>🏟️ 아레나 <span class="muted" style="font-size:.7rem">PvP · 비동기 대전</span></h2>'+
    '<div class="stats">'+
      '<div><span class="k">아레나 점수</span><b class="gold">'+G.ui.fmt(G.arena.score())+'</b></div>'+
      '<div><span class="k">전적</span><b><span class="r-uncommon">'+G.arena.wins()+'승</span> '+G.arena.losses()+'패</b></div>'+
      '<div><span class="k">내 전투력</span><b>'+G.ui.fmt(me.power)+'</b></div>'+
      (rv&&rv.me?'<div><span class="k">아레나 순위</span><b>'+rv.me.rank+'위'+(rv.total?' / '+rv.total:'')+'</b></div>':'')+
    '</div></div>';

  var foeCards;
  if(G.arena._loading && !foes.length){ foeCards='<div class="muted" style="padding:10px">상대를 찾는 중…</div>'; }
  else if(!foes.length){ foeCards='<div class="muted" style="padding:10px">상대가 없습니다. 새로고침해 보세요.</div>'; }
  else foeCards=foes.map(function(f,i){
    return '<div class="item">'+
      '<div class="ico">'+((G.avatar&&G.avatar.miniHTML)?G.avatar.miniHTML(f.avatar,72):"🛡️")+'</div>'+
      '<div class="info">'+
        '<div class="iname">'+esc(f.name||"도전자")+' <span class="tag gold">'+G.ui.fmt(f.score||1000)+'점</span></div>'+
        '<div class="idesc">전투력 '+G.ui.fmt(f.power||0)+' · ❤️'+G.ui.fmt(f.maxHp||0)+' ⚔️'+G.ui.fmt(f.atk||0)+' 🛡️'+G.ui.fmt(f.def||0)+'</div>'+
      '</div>'+
      '<div class="iacts"><button class="btn primary sm" data-act="arena-fight" data-i="'+i+'">⚔️ 도전</button></div>'+
    '</div>';
  }).join("");

  var foePanel='<div class="panel"><h2>도전 상대 <button class="btn sm" data-act="arena-refresh" style="margin-left:auto">🔄</button></h2>'+foeCards+'</div>';

  var rankPanel='';
  if(rv){
    function row(c){ var medal=c.rank===1?"🥇":(c.rank===2?"🥈":(c.rank===3?"🥉":"#"+c.rank));
      var mn=(G.avatar&&G.avatar.miniHTML)?G.avatar.miniHTML(c.me?G.avatar.currentId():c.avatar,48):"";
      return '<div class="rank-row'+(c.me?" me":"")+'"><span class="rk">'+medal+'</span>'+mn+'<span class="rn">'+esc(c.name)+'</span><span class="rs gold">'+G.ui.fmt(c.score)+'</span></div>'; }
    rankPanel='<div class="panel"><h2>🏆 아레나 랭킹</h2>'+
      rv.top.map(row).join("")+(rv.gap?'<div class="muted" style="text-align:center">⋯</div>':'')+rv.around.map(row).join("")+
    '</div>';
  } else { rankPanel='<div class="panel"><h2>🏆 아레나 랭킹</h2><div class="muted" style="padding:8px">불러오는 중…</div></div>'; }

  v.innerHTML = head + foePanel + rankPanel;
};

/* 아레나 전투 결과 모달 */
