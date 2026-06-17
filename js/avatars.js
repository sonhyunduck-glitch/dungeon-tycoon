/* ============================================================
   아바타(플레이어 전투 스프라이트) 시스템 — 데이터 기반
   - 각 아바타: 시트 이미지 + 프레임 크기 + 모션(idle/attack/hurt/death) 행·프레임수
   - 슬라이서로 캐릭터 시트의 모션 프레임 범위를 잡아 아래 목록에 추가하면 옵션에 노출됨
   - 선택 시 #pc-sprite 용 CSS(애니메이션+키프레임)를 동적 주입
   ============================================================ */
(function(){
  var G = window.G;
  G.DATA = G.DATA || {};

  // 모션 = { row:행번호(0부터), frames:프레임수, dur:초 }
  G.DATA.AVATARS = [
    {
      id:"adventurer", name:"모험가", sheet:"assets/adventurer.png",
      fw:32, fh:32, scale:1.5,
      idle:{row:0,frames:13,dur:1.4}, attack:{row:4,frames:10,dur:0.42},
      hurt:{row:6,frames:4,dur:0.32}, death:{row:7,frames:7,dur:0.70}
    }
    // 슬라이서로 추가 예:
    // { id:"mage", name:"마법사", sheet:"assets/mage.png", fw:32, fh:32, scale:1.5,
    //   idle:{row:0,frames:8,dur:1.2}, attack:{row:3,frames:8,dur:0.5},
    //   hurt:{row:5,frames:4,dur:0.3}, death:{row:6,frames:6,dur:0.7} }
  ];

  G.avatar = {};
  G.avatar.get = function(id){ return G.DATA.AVATARS.filter(function(a){return a.id===id;})[0] || G.DATA.AVATARS[0]; };
  G.avatar.currentId = function(){ return (G.state && G.state.avatar) || "adventurer"; };
  G.avatar.current = function(){ return G.avatar.get(G.avatar.currentId()); };

  G.avatar.set = function(id){
    if(!G.state) return;
    G.state.avatar = id;
    if(G.save) G.save.save(true);
    G.avatar.apply();
    if(G.net && G.net.syncProfile) G.net.syncProfile();   // 프로필에도 반영(추후 표시용)
  };

  function kf(name, m, fw, fh){
    var y = -(m.row*fh);
    return "@keyframes "+name+"{from{background-position:0 "+y+"px}to{background-position:"+(-(m.frames*fw))+"px "+y+"px}}";
  }

  // 선택 아바타용 스타일을 #pc-avatar-style 에 주입(시트/크기/애니메이션/키프레임)
  G.avatar.apply = function(){
    var c=G.avatar.current(); if(!c) return;
    var css=
      '#pc-sprite{width:'+c.fw+'px;height:'+c.fh+'px;background-image:url("'+c.sheet+'");'+
        'transform:translateX(-50%) scale('+(c.scale||1.5)+');'+
        'animation:pc-idle '+c.idle.dur+'s steps('+c.idle.frames+') infinite;}'+
      '#pc-sprite.attack{animation:pc-attack '+c.attack.dur+'s steps('+c.attack.frames+') 1 forwards;}'+
      '#pc-sprite.hurt{animation:pc-hurt '+c.hurt.dur+'s steps('+c.hurt.frames+') 1;}'+
      '#pc-sprite.death{animation:pc-death '+c.death.dur+'s steps('+c.death.frames+') 1 forwards;}'+
      kf("pc-idle",c.idle,c.fw,c.fh)+kf("pc-attack",c.attack,c.fw,c.fh)+
      kf("pc-hurt",c.hurt,c.fw,c.fh)+kf("pc-death",c.death,c.fw,c.fh);
    var st=document.getElementById("pc-avatar-style");
    if(!st){ st=document.createElement("style"); st.id="pc-avatar-style"; document.head.appendChild(st); }
    st.textContent=css;
  };

  // 선택 UI용 정적 프리뷰(idle 0번 프레임). 컨테이너 크기 = fw*zoom × fh*zoom,
  // 그 안에 원본크기 요소를 transform:scale 로 확대.
  G.avatar.previewHTML = function(c, zoom){
    zoom = zoom || 2.4;
    var y = -(c.idle.row*c.fh);
    var inner='width:'+c.fw+'px;height:'+c.fh+'px;'+
      'background:url("'+c.sheet+'") 0px '+y+'px no-repeat;background-size:auto;'+
      'image-rendering:pixelated;position:absolute;left:0;top:0;'+
      'transform:scale('+zoom+');transform-origin:top left;';
    var box='position:relative;width:'+(c.fw*zoom)+'px;height:'+(c.fh*zoom)+'px;';
    return '<div style="'+box+'"><div style="'+inner+'"></div></div>';
  };
})();
