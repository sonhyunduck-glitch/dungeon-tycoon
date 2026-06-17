/* ============================================================
   채팅 (오프라인 모험가 채팅)
   - 랭킹 봇 이름풀을 활용해 살아있는 듯한 잡담을 생성
   - 플레이어가 보내면 봇이 가끔 반응
   - 메시지는 메모리에만 저장(새로고침 시 새 대화)
   ============================================================ */
(function(){
  var G = window.G;
  G.chat = {};

  var AMBIENT = [
    "다들 몇 층임??",
    "방금 보스 잡았다 ㅋㅋㅋ",
    "이 미노타우로스 왜이렇게 셈;;",
    "흡혈 룬 어디서 나와요?",
    "가판대 손님이 안와ㅠㅠ 파산직전",
    "100층 속성 진짜 빡세네",
    "신규분들 환영합니다~",
    "골드 모아서 감정 돌리는 중",
    "질풍 룬 개사기임 ㄹㅇ",
    "또 죽었다 멘탈 나감",
    "전설템 떴다!! 자랑함 ㅎㅎ",
    "감정비용 너무 비싸지 않냐",
    "탑 등반 같이 하실분",
    "방어구에 가시 룬 박으니 개꿀",
    "치명타 빌드 vs 흡혈 빌드 뭐가 나음?",
    "오늘 운빨 미쳤다 룬 3개 드랍",
    "리치 보스 너무 무서워...",
    "자동전투 켜놓고 잠깐 쉬는 중",
    "200층 찍으면 배속 풀린다던데 사실?",
    "다들 화이팅!! 🔥"
  ];
  var REPLIES = [
    "오 화이팅!!","ㅇㅈ ㅋㅋ","부럽다 진짜","나도 그럼 ㅠ","굿굿 👍","ㄹㅇ?? 대박",
    "축하해요~","나는 아직 멀었네","오 정보 감사","ㅋㅋㅋㅋ","화이팅입니다","헐 신기하다"
  ];

  function rint(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rint(a.length)]; }

  // 봇 이름 풀(랭킹 시스템 재활용)
  G.chat._names = function(){
    try{ return G.ranking.pool().map(function(b){ return b.name; }); }
    catch(e){ return ["여명","사냥꾼","바람","그림자","서리","불꽃"]; }
  };

  G.chat._msgs = null;
  G.chat.init = function(){
    if(G.chat._msgs) return;
    var names=G.chat._names(), msgs=[];
    // 최근 잡담 10~12개 시드
    var n=10+rint(3);
    for(var i=0;i<n;i++){
      msgs.push({ who: pick(names), text: pick(AMBIENT), me:false });
    }
    G.chat._msgs = msgs;
  };

  G.chat.online = function(){
    // 접속자 수 느낌(랜덤이지만 큰 폭 변화 없게)
    if(!G.chat._on){ G.chat._on = 120 + rint(180); }
    return G.chat._on;
  };

  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

  G.chat.renderBody = function(){
    var body=document.getElementById("chat-body"); if(!body) return;
    body.innerHTML = G.chat._msgs.map(function(m){
      if(m.me){
        return '<div class="cmsg me"><div class="cbub me">'+esc(m.text)+'</div></div>';
      }
      return '<div class="cmsg"><div class="cwho">'+esc(m.who)+'</div><div class="cbub">'+esc(m.text)+'</div></div>';
    }).join("");
    body.scrollTop = body.scrollHeight;
  };

  G.chat.push = function(m){
    G.chat._msgs.push(m);
    if(G.chat._msgs.length>120) G.chat._msgs.splice(0, G.chat._msgs.length-120);
    G.chat.renderBody();
  };

  G.chat.send = function(text){
    text=(text||"").trim(); if(!text) return;
    // 온라인: 낙관적 표시 후 서버 전송(내 메시지는 구독에서 무시)
    if(G.net && G.net.online()){
      if(!G.net.nickname){ G.ui.toast("닉네임을 먼저 설정하세요"); return; }
      G.chat.push({ text:text, me:true });
      G.net.chatSend(text);
      return;
    }
    // 오프라인: 봇 채팅(시뮬레이션)
    G.chat.push({ text:text, me:true });
    var names=G.chat._names();
    var replies = rint(3); // 0,1,2
    for(var i=0;i<replies;i++){
      (function(d){
        setTimeout(function(){
          if(!document.getElementById("chat-body")) return; // 모달 닫히면 무시
          G.chat.push({ who: pick(names), text: pick(REPLIES), me:false });
        }, 700 + d*900 + rint(600));
      })(i);
    }
  };

  // 모달이 열려있는 동안 가끔 새 잡담이 흘러오게
  G.chat._tick = function(){
    if(!document.getElementById("chat-body")) return;
    if(Math.random()<0.5){
      var names=G.chat._names();
      G.chat.push({ who: pick(names), text: pick(AMBIENT), me:false });
    }
  };

  G.chat.open = function(){
    var on = !!(G.net && G.net.online());
    if(on){ G.chat._msgs = G.chat._msgs || []; }   // 온라인: 서버 기록으로 채움
    else { G.chat.init(); }                          // 오프라인: 봇 잡담 시드
    var ov=document.createElement("div");
    ov.className="modal-overlay show"; ov.id="chat-ov";
    ov.innerHTML=
      '<div class="modal chat-modal">'+
        '<div class="chat-head">'+
          '<span class="chat-title">💬 모험가 채팅</span>'+
          '<span class="chat-online">🟢 '+G.chat.online()+'명 접속</span>'+
          '<button class="chat-x" data-modal-close aria-label="닫기">✕</button>'+
        '</div>'+
        '<div class="chat-body" id="chat-body"></div>'+
        '<form class="chat-input" id="chat-form" autocomplete="off">'+
          '<input type="text" id="chat-text" placeholder="메시지를 입력하세요..." maxlength="120" autocomplete="off">'+
          '<button type="submit" class="btn primary chat-send">전송</button>'+
        '</form>'+
      '</div>';
    document.body.appendChild(ov);
    G.chat.renderBody();

    // 닫기 (X 버튼 또는 바깥 영역)
    ov.addEventListener("click", function(e){
      if(e.target.closest("[data-modal-close]") || e.target===ov){
        if(G.chat._timer){ clearInterval(G.chat._timer); G.chat._timer=null; }
        if(G.net && G.net.chatUnsubscribe) G.net.chatUnsubscribe();
        ov.remove();
      }
    });
    // 전송
    document.getElementById("chat-form").addEventListener("submit", function(e){
      e.preventDefault();
      var inp=document.getElementById("chat-text");
      G.chat.send(inp.value);
      inp.value=""; inp.focus();
    });

    if(on){
      // 온라인: 서버 기록 로드 + 실시간 구독
      G.net.chatHistory(40).then(function(hist){
        G.chat._msgs = hist;
        if(document.getElementById("chat-body")) G.chat.renderBody();
      });
      G.net.chatSubscribe(function(m){
        if(!document.getElementById("chat-body")) return;
        if(m.me) return;             // 내 메시지는 전송 시 낙관적으로 이미 표시
        G.chat.push(m);
      });
    } else {
      // 오프라인: 봇 잡담 흐름
      if(G.chat._timer) clearInterval(G.chat._timer);
      G.chat._timer = setInterval(G.chat._tick, 9000);
    }

    setTimeout(function(){ var i=document.getElementById("chat-text"); if(i) i.focus(); }, 80);
  };
})();
