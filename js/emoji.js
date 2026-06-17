/* ============================================================
   Twemoji 적용 — 모든 기기/OS에서 이모지를 동일한 이미지로 표시
   (구형 폰/에뮬레이터에서 신규 이모지가 □로 깨지는 문제 해결)
   - DOM에 추가되는 이모지를 자동으로 <img>로 치환 (MutationObserver)
   - 인터넷 필요(jsDelivr CDN). 로드 실패 시 img의 alt(원본 이모지)로 폴백.
   ============================================================ */
(function(){
  var G = window.G || (window.G = {});
  if(typeof twemoji === "undefined"){ console.info("[emoji] twemoji 미로드 — 네이티브 이모지 사용"); return; }

  var OPTS = {
    base: "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/",
    folder: "svg",
    ext: ".svg",
    className: "twemoji"
  };

  var pending=false, parsing=false;
  function run(){
    pending=false; parsing=true;
    try{ twemoji.parse(document.body, OPTS); }
    catch(e){ /* noop */ }
    finally{ parsing=false; }
  }
  function schedule(){
    if(pending||parsing) return;
    pending=true; setTimeout(run, 50);   // 버스트(전투 렌더 등) 합치기
  }

  G.emoji = {
    parse: function(el){ if(el){ try{ twemoji.parse(el, OPTS); }catch(e){} } else schedule(); },
    ready:true
  };

  function start(){
    run();   // 초기 1회
    try{
      var mo=new MutationObserver(function(){ if(!parsing) schedule(); });
      mo.observe(document.body, { childList:true, subtree:true });   // 텍스트/요소 추가 시에만(스타일·클래스 변경 무시)
    }catch(e){ console.warn("[emoji] observer 실패",e); }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
