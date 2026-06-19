/* ui-perks.js — 퀘스트(자동화 해금) 탭. */
var G = window.G;

G.ui.renderPerks = function(){
  var v=el("view-perks"); if(v) v.innerHTML=G.ui._perksHTML();
};

G.ui._perksHTML = function(){
  var done = G.DATA.PERKS.filter(function(d){ return G.perks.isUnlocked(d.id); }).length;
  var total = G.DATA.PERKS.length;
  var clearedTop = Math.max(0, (G.state.dungeon.maxFloor||1) - 1);  // 클리어한 최고층

  var cards=G.DATA.PERKS.map(function(d){
    var unlocked=G.perks.isUnlocked(d.id);
    var on=!!(unlocked && G.state.perks.enabled[d.id]);
    var right, statusTag;
    if(unlocked){
      statusTag=' <span class="tag r-uncommon">✅ 달성</span>'+(on?' <span class="tag">작동중</span>':'');
      right='<button class="btn sm '+(on?"primary":"")+'" data-act="perk-toggle" data-id="'+d.id+'">'+(on?"ON":"OFF")+'</button>';
    } else {
      statusTag=' <span class="tag">진행중 '+Math.min(clearedTop,d.freeFloor)+'/'+d.freeFloor+'층</span>';
      right='<span class="muted" style="font-size:.85em">🔒 잠김</span>';
    }
    var cls = on ? "item r-legend" : "item";
    return '<div class="'+cls+'"'+(on?'':' style="border-left-color:var(--glass-brd)"')+'>'+
      '<div class="ico">'+(unlocked?'📜':'🗺️')+'</div>'+
      '<div class="info">'+
        '<div class="iname">'+d.freeFloor+'층 클리어'+statusTag+'</div>'+
        '<div class="idesc">보상: '+d.ico+' <b>'+d.name+'</b> — '+d.desc+'</div>'+
      '</div>'+
      '<div class="iacts">'+right+'</div>'+
    '</div>';
  }).join("");

  // 배속 해금 퀘스트 (층 도달 시 자동 해금, 던전에서 ⏩로 전환)
  var curSpeed=G.maxSpeed();
  var speedQuests=[{floor:100,speed:2},{floor:200,speed:3},{floor:300,speed:4}];
  var sCards=speedQuests.map(function(q){
    var got=curSpeed>=q.speed;
    var tag=got?' <span class="tag r-uncommon">✅ 달성</span>'
               :' <span class="tag">진행중 '+Math.min(clearedTop,q.floor)+'/'+q.floor+'층</span>';
    var cls=got?"item r-epic":"item";
    return '<div class="'+cls+'"'+(got?'':' style="border-left-color:var(--glass-brd)"')+'>'+
      '<div class="ico">'+(got?'⏩':'🗺️')+'</div>'+
      '<div class="info">'+
        '<div class="iname">'+q.floor+'층 클리어'+tag+'</div>'+
        '<div class="idesc">보상: ⏩ <b>'+q.speed+'배속</b> — 클리어한 던전을 더 빠르게 재도전 (던전 화면의 ⏩ 버튼으로 전환)</div>'+
      '</div>'+
      '<div class="iacts"><span class="muted" style="font-size:.85em">'+(got?'사용 가능':'🔒 잠김')+'</span></div>'+
    '</div>';
  }).join("");

  return ''+
    '<div class="panel"><h2>📜 퀘스트 — 자동화 해금</h2>'+
      '<div class="muted">해당 <b>층을 클리어</b>하면 자동화 보상이 해금됩니다. 해금 후 카드의 <b>ON/OFF</b>로 켜고 끌 수 있어요. '+
      '<span class="r-uncommon">달성 '+done+'/'+total+'</span></div>'+
    '</div>'+
    '<div class="panel">'+cards+'</div>'+
    '<div class="panel"><h2>⏩ 배속 해금</h2>'+
      '<div class="muted" style="margin-bottom:8px">깊은 층을 클리어하면 전투 배속이 풀립니다. 현재 최대 <b>'+curSpeed+'배속</b></div>'+
      sCards+
    '</div>'+
    '<div class="panel"><div class="muted">💡 <b>자동 전투 + 자동 전진</b>을 함께 켜면 던전이 완전 자동으로 진행됩니다. '+
      '<b>자동 물약</b>으로 생존을, <b>자동 진열/매각</b>으로 전리품 정리를 맡기세요.</div></div>';
};

/* ============================================================
   아레나 (PvP)
   ============================================================ */
