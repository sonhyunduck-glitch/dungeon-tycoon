/* ============================================================
   랭킹 — 시드 기반 가상 경쟁자(봇) + 내 캐릭터, 최고 도달 층 기준
   (오프라인: 봇 풀은 시드로 고정 생성. 추후 서버 연동 시 board()만 교체)
   ============================================================ */
(function(){
  var G = window.G;
  G.ranking = {};

  // 결정적 PRNG (시드 고정 → 매번 같은 봇 풀)
  function rng(seed){ return function(){ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; }; }

  var FIRST=["빛나는","불꽃","그림자","강철","폭풍","서리","황금","핏빛","천둥","고요한","광폭","신성한",
             "어둠","질풍","용맹한","냉혹한","불멸","파멸","수호","무명","비전","월광","작열","혹한","태초"];
  var SECOND=["검사","마법사","사냥꾼","기사","도적","광전사","현자","용병","방랑자","챔피언",
              "약탈자","수호자","처형자","추적자","정복자","술사","파수꾼","해결사","칼날","주술사"];

  var BOT_COUNT = 400;

  // 봇 풀(고정). floor = r^3*999 (대부분 저층, 소수 고층 — 피라미드)
  G.ranking.pool = function(){
    var r=rng(20260617), arr=[];
    for(var i=0;i<BOT_COUNT;i++){
      var f=Math.max(1, Math.min(1000, Math.round(Math.pow(r(),3)*999)+1));
      var nm=FIRST[Math.floor(r()*FIRST.length)]+SECOND[Math.floor(r()*SECOND.length)]+(Math.floor(r()*9000)+1000);
      arr.push({ name:nm, floor:f, bot:true, avatar:(G.avatar?G.avatar.randomId(r):"adventurer") });
    }
    return arr;
  };

  // 온라인 랭킹 캐시(있으면 view()가 우선 사용) — net.refreshRanking()이 채움
  G.ranking.remoteView = null;

  // 내 표시명 (닉네임 우선)
  G.ranking.myName = function(){
    return (G.net&&G.net.nickname) || (G.state&&G.state.nickname) || "나";
  };

  // 전체 보드(봇 + 나) — 층 내림차순, 동률이면 내가 우선
  G.ranking.board = function(){
    var list=G.ranking.pool().slice();
    list.push({ name:G.ranking.myName(), floor:(G.state.dungeon.maxFloor||1), me:true, avatar:(G.avatar?G.avatar.currentId():"adventurer") });
    list.sort(function(a,b){
      if(b.floor!==a.floor) return b.floor-a.floor;
      if(a.me) return -1; if(b.me) return 1;          // 동률 시 내가 위
      return 0;
    });
    for(var i=0;i<list.length;i++) list[i].rank=i+1;
    return list;
  };

  // 표시용: 상위 3 + 내 주변 10 (온라인이면 서버 캐시 우선)
  G.ranking.view = function(){
    if(G.ranking.remoteView) return G.ranking.remoteView;
    var list=G.ranking.board();
    var meIdx=list.findIndex(function(x){return x.me;});
    var top=list.slice(0,3);
    var start, gap;
    if(meIdx<=7){ start=3; gap=false; }     // 상위권이면 top3 바로 뒤 이어서
    else { start=meIdx-5; gap=true; }        // 그 외엔 내 주변 10 (위 5·나·아래 4)
    start=Math.max(3, start);
    var around=list.slice(start, start+10);
    return { total:list.length, me:list[meIdx], top:top, around:around, gap:gap };
  };
})();
