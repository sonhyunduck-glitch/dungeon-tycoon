/* ============================================================
   Twemoji 적용 — 모든 기기/OS에서 이모지를 동일한 이미지로 표시
   (구형 폰/에뮬레이터에서 신규 이모지가 □로 깨지는 문제 해결)
   - 추가된 노드만 즉시(동기) 변환 → 렌더마다 깜빡임 없음(paint 전에 처리)
   - 인터넷 필요(jsDelivr CDN). 로드 실패 시 img의 alt(원본 이모지)로 폴백.
   ============================================================ */
(function(){
  var G = window.G || (window.G = {});
  if(typeof twemoji === "undefined"){ console.info("[emoji] twemoji 미로드 — 네이티브 이모지 사용"); return; }

  // UI 기호(이모지로 바꾸면 안 되는 문자)는 텍스트로 유지
  var SKIP = { "2714":1, "2716":1, "25b6":1, "25c0":1, "25b8":1, "25c2":1 };
  // PNG(72x72): WebView에서 SVG보다 디코딩이 빠르고 캐시가 잘 돼 재렌더 깜빡임 방지
  var IMG_BASE = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/";

  var OPTS = {
    base: "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/",
    folder: "72x72",
    ext: ".png",
    className: "twemoji",
    callback: function(icon){
      if(SKIP[icon]) return false;                 // ▶ ✔ 등 UI 기호는 변환 안 함
      return IMG_BASE + icon + ".png";             // URL 직접 구성
    }
  };

  var parsing=false;
  function parseEl(el){ try{ twemoji.parse(el, OPTS); }catch(e){} }

  G.emoji = { parse: function(el){ parseEl(el||document.body); }, ready:true };

  function start(){
    parseEl(document.body);   // 초기 1회
    try{
      var mo=new MutationObserver(function(muts){
        if(parsing) return;          // twemoji가 추가한 <img> 재진입 방지
        parsing=true;
        try{
          for(var i=0;i<muts.length;i++){
            var added=muts[i].addedNodes;
            for(var j=0;j<added.length;j++){
              var n=added[j];
              if(n.nodeType===1){
                if(n.classList && n.classList.contains("twemoji")) continue;  // 이미 변환된 이미지
                parseEl(n);                                  // 추가된 요소만(전체 X)
              } else if(n.nodeType===3 && n.parentNode && n.parentNode.nodeType===1){
                parseEl(n.parentNode);                       // 추가된 텍스트노드 → 부모 변환
              }
            }
          }
        } finally { parsing=false; }
      });
      // 동기 처리(setTimeout 없음) → 변경분이 화면에 그려지기 전에 이미지로 치환 = 깜빡임 없음
      mo.observe(document.body, { childList:true, subtree:true });
    }catch(e){ console.warn("[emoji] observer 실패",e); }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
