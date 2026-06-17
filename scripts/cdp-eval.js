/* CDP로 실행 중인 WebView에 JS 평가 — 디버그용
   사용: node scripts/cdp-eval.js "<wsUrl>" "<jsExpression>" */
const wsUrl = process.argv[2];
const expr = process.argv[3];
const ws = new WebSocket(wsUrl);
ws.addEventListener("open", function(){
  ws.send(JSON.stringify({ id:1, method:"Runtime.evaluate", params:{ expression:expr, returnByValue:true, awaitPromise:true } }));
});
ws.addEventListener("message", function(e){
  var msg = JSON.parse(e.data);
  if(msg.id===1){
    console.log(JSON.stringify(msg.result && msg.result.result ? msg.result.result.value : msg.result));
    ws.close(); process.exit(0);
  }
});
ws.addEventListener("error", function(e){ console.error("WS error", e.message||String(e)); process.exit(1); });
setTimeout(function(){ console.error("timeout"); process.exit(1); }, 8000);
