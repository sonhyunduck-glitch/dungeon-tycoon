/* ============================================================
   아바타(플레이어 전투 스프라이트) 시스템 — 데이터 기반
   - 각 아바타: 시트 이미지 + 프레임 크기 + 모션(idle/attack/hurt/death) 행·프레임수
   - 슬라이서로 캐릭터 시트의 모션 프레임 범위를 잡아 아래 목록에 추가하면 옵션에 노출됨
   - 선택 시 #pc-sprite 용 CSS(애니메이션+키프레임)를 동적 주입
   ============================================================ */
(function(){
  var G = window.G;
  G.DATA = G.DATA || {};

  // 모션 = { row:행번호(0부터), frames:프레임수, dur:초 }  (슬라이서 아바타 JSON 내보내기로 추가)
  G.DATA.AVATARS = [
    { id:"adventurer", name:"모험가", sheet:"assets/adventurer.png", fw:32, fh:32, scale:1.5,
      idle:{row:0,frames:13,dur:1.4}, attack:{row:4,frames:10,dur:0.42}, hurt:{row:6,frames:4,dur:0.32}, death:{row:7,frames:7,dur:0.70} },
    { id:"dwarf", name:"드워프", sheet:"assets/avatars/dwarf.png", fw:64, fh:32, scale:0.9,
      idle:{row:0,frames:5,dur:0.55}, attack:{row:3,frames:6,dur:0.27}, hurt:{row:6,frames:4,dur:0.32}, death:{row:7,frames:7,dur:0.7} },
    { id:"elven_warrior", name:"엘프 전사", sheet:"assets/avatars/elven_warrior.png", fw:32, fh:32, scale:1.5,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:2,frames:4,dur:0.2}, hurt:{row:3,frames:3,dur:0.24}, death:{row:4,frames:6,dur:0.6} },
    { id:"fishfolk_berserker", name:"어인 광전사", sheet:"assets/avatars/fishfolk_berserker.png", fw:96, fh:32, scale:0.9,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:4,frames:6,dur:0.27}, hurt:{row:5,frames:4,dur:0.32}, death:{row:6,frames:5,dur:0.5} },
    { id:"fishfolk_brute", name:"어인 투사", sheet:"assets/avatars/fishfolk_brute.png", fw:64, fh:64, scale:0.9,
      idle:{row:1,frames:5,dur:0.55}, attack:{row:3,frames:8,dur:0.36}, hurt:{row:4,frames:4,dur:0.32}, death:{row:5,frames:6,dur:0.6} },
    { id:"fishfolk_knight", name:"어인 기사", sheet:"assets/avatars/fishfolk_knight.png", fw:32, fh:32, scale:1.5,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:2,frames:7,dur:0.32}, hurt:{row:4,frames:4,dur:0.32}, death:{row:5,frames:4,dur:0.4} },
    { id:"fishfolk_whip", name:"어인 채찍병", sheet:"assets/avatars/fishfolk_whip.png", fw:64, fh:32, scale:0.9,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:2,frames:7,dur:0.32}, hurt:{row:3,frames:4,dur:0.32}, death:{row:4,frames:4,dur:0.4} },
    { id:"goblin_assassin", name:"고블린 암살자", sheet:"assets/avatars/goblin_assassin.png", fw:32, fh:32, scale:1.5,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:4,frames:3,dur:0.2}, hurt:{row:6,frames:4,dur:0.32}, death:{row:7,frames:7,dur:0.7} },
    { id:"lizardfolk_spearman", name:"리자드맨 창병", sheet:"assets/avatars/lizardfolk_spearman.png", fw:64, fh:64, scale:0.9,
      idle:{row:0,frames:8,dur:0.88}, attack:{row:2,frames:8,dur:0.36}, hurt:{row:3,frames:4,dur:0.32}, death:{row:4,frames:5,dur:0.5} },
    { id:"lizardfolk_warrior", name:"리자드맨 전사", sheet:"assets/avatars/lizardfolk_warrior.png", fw:64, fh:64, scale:0.9,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:2,frames:6,dur:0.27}, hurt:{row:4,frames:4,dur:0.32}, death:{row:5,frames:5,dur:0.5} },
    { id:"vengeful_spirit", name:"원혼", sheet:"assets/avatars/vengeful_spirit.png", fw:64, fh:64, scale:0.9,
      idle:{row:0,frames:6,dur:0.66}, attack:{row:1,frames:12,dur:0.54}, hurt:{row:2,frames:6,dur:0.48}, death:{row:3,frames:10,dur:1} },
    { id:"wendigo", name:"웬디고", sheet:"assets/avatars/wendigo.png", fw:64, fh:64, scale:0.9,
      idle:{row:0,frames:4,dur:0.44}, attack:{row:2,frames:8,dur:0.36}, hurt:{row:3,frames:8,dur:0.64}, death:{row:5,frames:8,dur:0.8} },
    { id:"yeti", name:"예티", sheet:"assets/avatars/yeti.png", fw:64, fh:64, scale:0.9,
      idle:{row:0,frames:7,dur:0.77}, attack:{row:2,frames:6,dur:0.27}, hurt:{row:4,frames:4,dur:0.32}, death:{row:5,frames:6,dur:0.6} }
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

  // 선택 UI용 프리뷰(컨테이너 fw*zoom × fh*zoom, 안쪽 원본크기 요소를 scale 확대).
  // 애니메이션(idle→attack 순차)은 animatePreview가 background-position을 갱신.
  G.avatar.zoomFor = function(c){ return Math.min(2.4, Math.max(1, 64/Math.max(c.fw,c.fh))); };
  G.avatar.previewHTML = function(c){
    var zoom=G.avatar.zoomFor(c);
    var y = -(c.idle.row*c.fh);
    var inner='width:'+c.fw+'px;height:'+c.fh+'px;'+
      'background:url("'+c.sheet+'") 0px '+y+'px no-repeat;background-size:auto;'+
      'image-rendering:pixelated;position:absolute;left:0;top:0;'+
      'transform:scale('+zoom+');transform-origin:top left;';
    var box='position:relative;width:'+(c.fw*zoom)+'px;height:'+(c.fh*zoom)+'px;';
    return '<div style="'+box+'"><div class="av-prev-inner" data-av="'+c.id+'" style="'+inner+'"></div></div>';
  };

  // 프리뷰 요소를 idle 프레임들 → attack 프레임들 순차 재생(루프). DOM에서 제거되면 자동 정지.
  G.avatar.animatePreview = function(el){
    var c=G.avatar.get(el.getAttribute("data-av")); if(!c) return null;
    var seq=[], i;
    for(i=0;i<c.idle.frames;i++) seq.push([i, c.idle.row]);
    for(i=0;i<(c.attack?c.attack.frames:0);i++) seq.push([i, c.attack.row]);
    if(!seq.length) seq.push([0, c.idle.row]);
    var k=0;
    var t=setInterval(function(){
      if(!el.isConnected){ clearInterval(t); return; }
      var f=seq[k%seq.length];
      el.style.backgroundPosition = (-(f[0]*c.fw))+"px "+(-(f[1]*c.fh))+"px";
      k++;
    }, 150);
    return t;
  };
})();
