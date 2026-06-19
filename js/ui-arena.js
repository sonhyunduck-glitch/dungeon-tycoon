/* ui-arena.js — 아레나(PvP) 탭. */
var G = window.G;

G.ui.renderArena = function(){
  var v=el("view-arena");
  G.arena.ensureDaily();
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
  var a=G.state.arena;
  var sc=G.arena.score(), tier=G.arena.tierOf(sc), prog=G.arena.tierProgress(sc), ti=G.arena.tierIndex(sc);
  var tinfo=G.arena.tierInfo(sc);
  var left=G.arena.fightsLeft();

  var head='<div class="panel"><h2>🏟️ 아레나 <span class="muted" style="font-size:.7rem">PvP · 비동기 대전</span></h2>'+
    '<div class="arena-tier">'+
      '<div class="tier-big" style="--tier:'+tier.color+'"><img class="tiericon lg" src="'+tinfo.icon+'" alt="">'+tinfo.label+' <span class="gold" style="font-weight:800">'+G.ui.fmt(sc)+'</span></div>'+
      '<div class="tier-bar"><div class="tier-fill" style="width:'+prog+'%; background:'+tier.color+'"></div></div>'+
      '<div class="muted" style="font-size:.64rem">'+(ti<G.arena.TIERS.length-1?('다음 '+G.arena.TIERS[ti+1].name+'까지 '+prog+'%'):'최고 티어 달성')+'</div>'+
    '</div>'+
    '<div class="stats">'+
      '<div><span class="k">전적</span><b><span class="r-uncommon">'+G.arena.wins()+'승</span> '+G.arena.losses()+'패</b></div>'+
      '<div><span class="k">🏅 코인</span><b class="gold">'+G.ui.fmt(G.arena.coins())+'</b></div>'+
      '<div><span class="k">🔥 연승</span><b>'+G.arena.streak()+(a.bestStreak?' <span class="muted" style="font-size:.68rem">최고'+a.bestStreak+'</span>':'')+'</b></div>'+
      (rv&&rv.me?'<div><span class="k">순위</span><b>'+rv.me.rank+'위'+(rv.total?' / '+rv.total:'')+'</b></div>':'')+
      '<div><span class="k">오늘 도전</span><b'+(left<=0?' class="r-legend"':'')+'>'+left+' / '+G.arena.MAX_DAILY+'</b></div>'+
    '</div>'+
    '<button class="btn sm gold full" style="margin-top:8px" data-act="arena-shop">🛒 아레나 상점 열기 (보유 🏅'+G.ui.fmt(G.arena.coins())+')</button>'+
  '</div>';

  // 일일 미션
  var missionRows=G.arena.MISSIONS.map(function(m){
    var p=Math.min(m.need, m.prog(a)), claimed=!!a.daily.claimed[m.key], done=p>=m.need;
    return '<div class="mission'+(claimed?' claimed':'')+'">'+
      '<div class="m-info"><div class="m-name">'+esc(m.name)+' <span class="muted">'+p+'/'+m.need+'</span></div>'+
        '<div class="m-bar"><div class="m-fill" style="width:'+Math.round(p/m.need*100)+'%"></div></div></div>'+
      '<button class="btn sm '+(done&&!claimed?'primary':'')+'" data-act="arena-claim" data-key="'+m.key+'" '+((done&&!claimed)?'':'disabled')+'>'+(claimed?'✔ 완료':'🪙'+m.reward)+'</button>'+
    '</div>';
  }).join("");
  var missionPanel='<div class="panel"><h2>📋 일일 미션 <span class="muted" style="font-size:.64rem">매일 리셋</span></h2>'+missionRows+'</div>';

  var foeCards;
  if(G.arena._loading && !foes.length){ foeCards='<div class="muted" style="padding:10px">상대를 찾는 중…</div>'; }
  else if(!foes.length){ foeCards='<div class="muted" style="padding:10px">상대가 없습니다. 새로고침해 보세요.</div>'; }
  else foeCards=foes.map(function(f,i){
    return '<div class="item">'+
      '<div class="ico">'+((G.avatar&&G.avatar.miniHTML)?G.avatar.miniHTML(f.avatar,72):"🛡️")+'</div>'+
      '<div class="info">'+
        '<div class="iname">'+esc(f.name||"도전자")+' '+G.arena.tierBadge(f.score||1000,true)+'</div>'+
        '<div class="idesc">'+G.ui.fmt(f.score||1000)+'점 · 전투력 '+G.ui.fmt(f.power||0)+' · ❤️'+G.ui.fmt(f.maxHp||0)+' ⚔️'+G.ui.fmt(f.atk||0)+' 🛡️'+G.ui.fmt(f.def||0)+
          ((f.skills&&f.skills.length)?' · '+f.skills.map(function(id){var s=G.DATA.SKILLS.filter(function(x){return x.id===id;})[0];return s?s.ico:"";}).join(""):"")+'</div>'+
      '</div>'+
      '<div class="iacts"><button class="btn primary sm" data-act="arena-fight" data-i="'+i+'" '+(left<=0?'disabled':'')+'>⚔️ 도전</button></div>'+
    '</div>';
  }).join("");

  var foePanel='<div class="panel"><h2>도전 상대'+(left<=0?' <span class="r-legend" style="font-size:.62rem">오늘 도전 소진·내일 리셋</span>':'')+'<button class="btn sm" data-act="arena-refresh" style="margin-left:auto">🔄</button></h2>'+foeCards+'</div>';

  var rankPanel='';
  if(rv){
    function row(c){ var medal=c.rank===1?"🥇":(c.rank===2?"🥈":(c.rank===3?"🥉":"#"+c.rank));
      var mn=(G.avatar&&G.avatar.miniHTML)?G.avatar.miniHTML(c.me?G.avatar.currentId():c.avatar,48):"";
      return '<div class="rank-row'+(c.me?" me":"")+'"><span class="rk">'+medal+'</span>'+mn+'<span class="rn">'+esc(c.name)+' '+G.arena.tierBadge(c.score,true)+'</span><span class="rs gold">'+G.ui.fmt(c.score)+'</span></div>'; }
    rankPanel='<div class="panel"><h2>🏆 아레나 랭킹</h2>'+
      rv.top.map(row).join("")+(rv.gap?'<div class="muted" style="text-align:center">⋯</div>':'')+rv.around.map(row).join("")+
    '</div>';
  } else { rankPanel='<div class="panel"><h2>🏆 아레나 랭킹</h2><div class="muted" style="padding:8px">불러오는 중…</div></div>'; }

  v.innerHTML = head + missionPanel + foePanel + rankPanel;
};

/* 아레나 전투 결과 모달 */
