/* ============================================================
   랭킹 — 실제 유저(Supabase) 기준, 최고 도달 층. 게임은 항상 온라인.
   net.refreshRanking()이 G.ranking.remoteView를 채우고, 서버 응답 전엔 나만 표시.
   ============================================================ */
(function(){
  var G = window.G;
  G.ranking = {};

  // 온라인 랭킹 캐시(있으면 view()/towerView()가 우선 사용) — net.refreshRanking()이 채움
  G.ranking.remoteView = null;

  // 내 표시명 (닉네임 우선)
  G.ranking.myName = function(){
    return (G.net&&G.net.nickname) || (G.state&&G.state.nickname) || "나";
  };

  // 폴백 보드: 서버 응답 전엔 나 혼자. (응답 도착 시 remoteView로 대체)
  G.ranking.board = function(){
    return [{ name:G.ranking.myName(), floor:(G.state.dungeon.maxFloor||1), me:true, rank:1, avatar:(G.avatar?G.avatar.currentId():"adventurer") }];
  };

  // 표시용: 상위 3 + 내 주변 10 (온라인이면 서버 캐시 우선)
  G.ranking.view = function(){
    if(G.ranking.remoteView) return G.ranking.remoteView;
    var list=G.ranking.board();
    return { total:list.length, me:list[0], top:list, around:[], gap:false };
  };

  // 탑 표시용: 같은 층은 한 방(room)에 모음. 방=층, 방 안에 여러 명 입주.
  // 온라인=서버가 준 top+around 행을 층별 그룹화, 서버 응답 전엔 나 혼자.
  G.ranking.towerView = function(){
    var people, total;
    if(G.ranking.remoteView){
      var rv=G.ranking.remoteView, seen={}; people=[];
      (rv.top||[]).concat(rv.around||[]).forEach(function(c){ if(c&&!seen[c.rank]){ seen[c.rank]=1; people.push(c); } });
      total=rv.total||people.length;
    } else {
      people=G.ranking.board(); total=people.length;
    }
    // 층별 그룹 (people는 층 내림차순·순위 오름차순 정렬돼 있음)
    var rooms=[], idx={};
    people.forEach(function(c){
      var k=c.floor;
      if(idx[k]==null){ idx[k]=rooms.length; rooms.push({ floor:c.floor, members:[], me:false }); }
      var room=rooms[idx[k]];
      room.members.push(c);
      if(c.me) room.me=true;
    });
    rooms.sort(function(a,b){ return b.floor-a.floor; });                 // 층 내림차순(안전)
    rooms.forEach(function(r,i){
      r.rank=i+1;                                                          // 방 순위(=높은 층일수록 상위)
      r.members.sort(function(a,b){ if(a.me)return -1; if(b.me)return 1; return (a.rank||0)-(b.rank||0); });
    });
    var meIdx=rooms.findIndex(function(r){return r.me;});
    if(meIdx<0) meIdx=rooms.length-1;
    var meRoom=rooms[meIdx];
    var mePerson=meRoom&&meRoom.members.filter(function(m){return m.me;})[0];
    var myRank=mePerson?mePerson.rank:total;
    // 윈도우: 상위 3개 방 + 내 방 주변
    var top=rooms.slice(0,3), start, gap;
    if(meIdx<=6){ start=3; gap=false; } else { start=meIdx-4; gap=true; }
    start=Math.max(3, start);
    var around=rooms.slice(start, start+9);
    return { total:total, totalFloors:rooms.length, myRank:myRank, top:top, around:around, gap:gap, meRoom:meRoom };
  };
})();
