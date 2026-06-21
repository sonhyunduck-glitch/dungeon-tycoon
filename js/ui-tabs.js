/* ui-tabs.js — 탭 화면 렌더(가방·캐릭터·상점·대장간·시장·퀘스트·아레나·랭킹·설정). ui.js에서 분리. */
var G = window.G;

G.ui.renderMarket = function(){
  var v=el("view-market");
  G.market.ensureFresh();
  var f=G.state.ui.market, st=G.state.market;

  function optOpts(sel){
    return '<option value="">옵션 전체</option>'+G.DATA.STAT_KEYS.map(function(k){
      return '<option value="'+k+'" '+(sel===k?"selected":"")+'>'+G.DATA.STAT_META[k].label+'</option>';
    }).join("");
  }
  var partSel='<select class="msel" data-mk="slot">'+
    [['all','부위 전체'],['weapon','무기'],['armor','방어구'],['acc','장신구']].map(function(o){
      return '<option value="'+o[0]+'" '+(f.slot===o[0]?"selected":"")+'>'+o[1]+'</option>';}).join("")+'</select>';
  var raritySel='<select class="msel" data-mk="rarity">'+
    [['all','등급 전체'],['uncommon','고급 이상'],['rare','희귀 이상'],['epic','영웅 이상'],['legend','전설']].map(function(o){
      return '<option value="'+o[0]+'" '+(f.rarity===o[0]?"selected":"")+'>'+o[1]+'</option>';}).join("")+'</select>';

  var minRank={all:0,uncommon:1,rare:2,epic:3,legend:4}[f.rarity]||0;
  var results=(st.listings||[]).filter(function(l){
    if(f.slot!=="all" && l.item.type!==f.slot) return false;
    if(G.market.rank(l.item.rarity) < minRank) return false;
    if(f.opt1 && !l.item.stats[f.opt1]) return false;
    if(f.opt2 && !l.item.stats[f.opt2]) return false;
    if(f.pmin>0 && l.price<f.pmin) return false;
    if(f.pmax>0 && l.price>f.pmax) return false;
    return true;
  });

  var rows = results.length ? results.map(function(l){
    var tag=G.market.priceTag(l);
    var afford=G.state.player.gold>=l.price;
    var diff=G.inventory.compare(l.item);
    var cmp = diff>0 ? '<span class="r-uncommon">착용 대비 ▲'+G.ui.fmt(Math.round(diff))+'</span>'
            : (diff<0 ? '<span class="r-common">착용 대비 ▼'+G.ui.fmt(Math.round(Math.abs(diff)))+'</span>'
            : '<span class="muted">착용과 동급</span>');
    return '<div class="shelf-slot '+l.item.rarityCls+'" style="border-left-width:4px; flex-wrap:wrap">'+
      '<div class="info" style="flex:1 1 100%">'+
        '<div class="iname '+l.item.rarityCls+'" style="font-size:.84rem">'+esc(l.item.name)+' <span class="muted" style="font-weight:400">— '+esc(l.merchant)+'</span></div>'+
        '<div class="idesc">'+G.item.statText(l.item)+'</div>'+
        '<div class="idesc"><span class="'+tag.cls+'">'+tag.label+'</span> · '+cmp+'</div>'+
      '</div>'+
      '<div style="display:flex; align-items:center; gap:8px; margin-top:6px; width:100%">'+
        '<b class="gold" style="flex:1">🪙 '+G.ui.fmt(l.price)+'</b>'+
        '<button class="btn sm primary" data-act="market-buy" data-id="'+l.id+'" '+(afford?"":"disabled")+'>즉시 구매</button>'+
      '</div>'+
    '</div>';
  }).join("") : '<div class="empty">조건에 맞는 매물이 없습니다.</div>';

  var watchChips=G.DATA.STAT_KEYS.filter(function(k){return G.DATA.STAT_META[k].pct;}).map(function(k){
    var on=(st.watch||[]).indexOf(k)>=0;
    return '<button class="btn sm '+(on?"gold":"")+'" data-act="market-watch" data-kw="'+k+'">'+(on?"★ ":"")+G.DATA.STAT_META[k].label+'</button>';
  }).join("");

  var mins=Math.max(0, Math.ceil((G.market.REFRESH_MS-(Date.now()-(st.lastRefresh||0)))/60000));
  v.innerHTML=
    '<div class="panel"><h2>📊 시장 검색소 <span class="muted">매물 '+st.listings.length+'개 · 갱신 ~'+mins+'분</span></h2>'+
      '<div class="row" style="gap:6px">'+partSel+raritySel+'</div>'+
      '<div class="row" style="gap:6px; margin-top:6px">'+
        '<select class="msel" data-mk="opt1">'+optOpts(f.opt1)+'</select>'+
        '<select class="msel" data-mk="opt2">'+optOpts(f.opt2)+'</select>'+
      '</div>'+
      '<div class="row" style="gap:6px; margin-top:6px; align-items:center">'+
        '<input class="price-input" style="width:84px" type="number" min="0" placeholder="최소" value="'+(f.pmin||"")+'" data-mk="pmin">'+
        '<span class="muted">~</span>'+
        '<input class="price-input" style="width:84px" type="number" min="0" placeholder="최대" value="'+(f.pmax||"")+'" data-mk="pmax">'+
      '</div>'+
      '<div class="muted" style="margin-top:6px">💡 급매물을 사서 가판대에 시세로 되팔면 차익을 남길 수 있습니다.</div>'+
    '</div>'+
    '<div class="panel"><h3>🔔 관심 키워드 (신규 매물 알림)</h3><div class="row" style="gap:5px">'+watchChips+'</div></div>'+
    '<div class="panel"><h3>🛒 매물 ('+results.length+')</h3><div class="shelf">'+rows+'</div></div>';
};

/* 우측 상단 푸시 알림 */
G.ui.renderSettings = function(){
  var v=el("view-settings");
  v.innerHTML=
    '<div class="panel"><h2>⚙️ 설정</h2>'+
      '<div class="row">'+
        '<button class="btn '+(G.state.muted?"":"primary")+'" data-act="toggle-mute">'+(G.state.muted?"🔇 사운드 꺼짐":"🔊 사운드 켜짐")+'</button>'+
        '<button class="btn '+(G.state.shake===false?"":"primary")+'" data-act="toggle-shake">'+(G.state.shake===false?"📴 화면흔들림 꺼짐":"📳 화면흔들림 켜짐")+'</button>'+
        '<button class="btn '+(G.state.glow===false?"":"primary")+'" data-act="toggle-glow">'+(G.state.glow===false?"🌑 컬렉션 글로우 꺼짐":"✨ 컬렉션 글로우 켜짐")+'</button>'+
      '</div>'+
      (function(){ if(!G.glow) return ""; var t=G.glow.tier(), d=G.glow.DEF[t];
        return '<div class="muted" style="margin-top:8px; font-size:.72rem">🗡️ 장비 연대기 '+G.glow.discovered()+' / '+G.glow.total()+
          ' → 글로우 '+(t? ('<b class="r-unique">'+d.name+'</b> (티어 '+t+'/5)') : '없음 (20% 발견 시 시작)')+'</div>';
      })()+
      (function(){
        var bv=Math.round((G.state.bgmVol!=null?G.state.bgmVol:0.32)*100);
        var sv=Math.round((G.state.sfxVol!=null?G.state.sfxVol:0.55)*100);
        var dim=G.state.muted?' style="opacity:.45"':'';
        return '<div'+dim+' id="vol-controls">'+
          '<div class="row" style="align-items:center; gap:8px; margin-top:12px">'+
            '<span style="width:84px">🎵 배경음</span>'+
            '<input type="range" min="0" max="100" value="'+bv+'" data-vol="bgm" style="flex:1">'+
            '<span class="muted" id="bgmvol-lbl" style="width:42px; text-align:right">'+bv+'%</span>'+
          '</div>'+
          '<div class="row" style="align-items:center; gap:8px; margin-top:6px">'+
            '<span style="width:84px">⚔️ 효과음</span>'+
            '<input type="range" min="0" max="100" value="'+sv+'" data-vol="sfx" style="flex:1">'+
            '<span class="muted" id="sfxvol-lbl" style="width:42px; text-align:right">'+sv+'%</span>'+
          '</div>'+
        '</div>';
      })()+
      '<p class="muted" style="margin-top:10px">진행 상황은 자동 저장됩니다. 방치 중에도 상점에서 손님이 물건을 구매합니다.</p>'+
    '</div>'+
    (function(){
      var on=G.net && G.net.online();
      var conf=G.net && G.net.configured();
      var status, body;
      if(on){
        status='<span class="r-uncommon">🟢 온라인</span>';
        var guest=G.net.isGuest();
        var acct;
        if(guest){
          acct='<div class="row" style="align-items:center; gap:8px; margin-top:10px">'+
                 '<span style="width:84px">계정</span>'+
                 '<b style="flex:1">🎫 게스트</b>'+
               '</div>'+
               '<p class="muted" style="margin:6px 0 8px; color:#ffb86a">⚠️ 게스트는 <b>이 기기에서만</b> 이어집니다. 브라우저 데이터를 지우거나 다른 기기로 가면 진행도를 잃습니다.</p>'+
               '<div class="row">'+
                 '<button class="btn primary" data-act="acct-signup" style="flex:1">📧 계정 만들기(이어하기)</button>'+
                 '<button class="btn" data-act="acct-login" style="flex:1">🔑 로그인</button>'+
               '</div>';
        } else {
          acct='<div class="row" style="align-items:center; gap:8px; margin-top:10px">'+
                 '<span style="width:84px">계정</span>'+
                 '<b style="flex:1; word-break:break-all">📧 '+esc(G.net.email||"")+'</b>'+
                 '<button class="btn sm" data-act="acct-logout">로그아웃</button>'+
               '</div>'+
               '<p class="muted" style="margin-top:6px">✅ 어느 기기에서나 이 계정으로 로그인하면 이어집니다.</p>';
        }
        body='<div class="row" style="align-items:center; gap:8px; margin-top:8px">'+
               '<span style="width:84px">닉네임</span>'+
               '<b class="gold" style="flex:1">'+esc(G.net.nickname||"미설정")+'</b>'+
               '<button class="btn sm" data-act="change-nick">변경</button>'+
             '</div>'+
             acct+
             '<p class="muted" style="margin-top:8px">채팅·랭킹·세이브가 클라우드에 동기화됩니다 ☁️</p>';
      } else if(conf){
        status='<span class="muted">🟡 연결 중/실패</span>';
        body='<p class="muted" style="margin-top:8px">서버에 연결하지 못했습니다.</p>'+
             '<div class="row" style="margin-top:8px"><button class="btn primary" data-act="net-retry">🔄 재연결</button></div>';
      } else {
        status='<span class="muted">⚪ 오프라인</span>';
        body='<p class="muted" style="margin-top:8px">멀티플레이(채팅·랭킹·클라우드 세이브)를 켜려면 <b>js/supa_config.js</b>에 Supabase 주소와 키를 입력하세요.</p>';
      }
      return '<div class="panel"><h2>🌐 멀티플레이 '+status+'</h2>'+body+'</div>';
    })()+
    '<div class="panel"><h2>🎯 획득 필터</h2>'+
      '<div class="muted" style="margin-bottom:8px">끈 등급은 던전에서 줍지 않습니다(폐기).</div>'+
      '<div class="row">'+
        G.DATA.RARITY.map(function(rar){
          var on=G.state.pickup[rar.key]!==false;
          return '<button class="btn sm" data-act="pickup-toggle" data-rar="'+rar.key+'" style="'+(on?'':'opacity:.4; text-decoration:line-through')+'">'+
            '<b class="'+rar.cls+'">'+rar.label+'</b> '+(on?'<span class="r-uncommon">획득</span>':'<span class="muted">폐기</span>')+'</button>';
        }).join("")+
      '</div>'+
    '</div>'+
    '<div class="panel"><h2>ℹ️ 도움말</h2>'+
      '<p class="muted" style="line-height:1.7">'+
        '1. <b>던전</b>에서 스테이지(□─□─■)를 골라 전진하며 사냥<br>'+
        '2. <b>창고</b>에서 아이템을 <b>착용</b>하거나 <b>진열</b><br>'+
        '3. <b>상점</b>에서 가격을 정하면 손님이 구매<br>'+
        '4. 골드로 장비를 모으고 상점을 키워 더 깊은 층 도전!'+
      '</p>'+
      '<p style="margin-top:10px"><b data-act="view-terms" style="color:var(--torch); text-decoration:underline; cursor:pointer">📜 이용약관 및 개인정보 처리방침</b></p>'+
    '</div>';
};

/* ---------- 현재 탭 렌더 ---------- */

