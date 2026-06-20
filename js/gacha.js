/* ============================================================
   외형 뽑기(가챠) — 아레나 코인으로 코스메틱(무스탯) 아바타 스킨 획득
   - 희귀도 가중 롤 + 전설 천장(소프트피티) + 10연 영웅↑ 보장
   - 중복 → 외형 조각 환원, 조각으로 원하는 스킨 직접 교환
   - 보유는 state.cosmetics(클라우드 세이브 자동 포함). 풀 = AVATARS 중 rarity 지정 항목(데이터 주도)
   ============================================================ */
(function(){
  var G = window.G;
  G.gacha = {};

  G.gacha.RARITY = [
    { key:"common", label:"일반", cls:"r-common",   weight:60, shard:5,   color:"#9aa0ad" },
    { key:"rare",   label:"희귀", cls:"r-rare",     weight:28, shard:15,  color:"#5aa0ff" },
    { key:"epic",   label:"영웅", cls:"r-epic",     weight:9,  shard:40,  color:"#c08bff" },
    { key:"legend", label:"전설", cls:"r-legend",   weight:3,  shard:100, color:"#ff7a3c" }
  ];
  G.gacha.rdef = function(key){ return G.gacha.RARITY.filter(function(r){return r.key===key;})[0] || G.gacha.RARITY[0]; };

  G.gacha.COST = 80;          // 단일 뽑기(🏅)
  G.gacha.COST10 = 720;       // 10연차(10% 할인)
  G.gacha.LEGEND_PITY = 90;   // 누적 천장: N연차 시 전설 확정
  G.gacha.SOFT = 80;          // 소프트 피티 시작
  G.gacha.EXCHANGE = { common:20, rare:60, epic:120, legend:200 };   // 조각 교환 비용

  G.gacha.ensure = function(){
    var c=G.state.cosmetics=G.state.cosmetics||{};
    if(!c.owned) c.owned={};
    if(c.shards==null) c.shards=0;
    if(!c.pity) c.pity={legend:0};
    if(c.pity.legend==null) c.pity.legend=0;
    return c;
  };
  G.gacha.shards = function(){ return G.gacha.ensure().shards||0; };

  /* 희귀도: AVATARS 항목의 rarity(신규 스킨이 직접 지정) 우선, 없으면 기존 12종 맵 폴백 */
  G.gacha.RARITY_MAP = {
    dwarf:"common", fishfolk_whip:"common", lizardfolk_spearman:"common",
    fishfolk_berserker:"rare", goblin_assassin:"rare", lizardfolk_warrior:"rare", fishfolk_brute:"rare",
    fishfolk_knight:"epic", yeti:"epic", wendigo:"epic",
    elven_warrior:"legend", vengeful_spirit:"legend"
  };
  G.gacha.rarityOf = function(a){ return (a&&a.rarity) || (a&&G.gacha.RARITY_MAP[a.id]) || null; };

  /* 풀: 희귀도가 정해진 항목(데이터 주도). 기본 모험가 제외 */
  G.gacha.pool = function(){ return (G.DATA.AVATARS||[]).filter(function(a){ return G.gacha.rarityOf(a) && a.id!=="adventurer"; }); };
  G.gacha.poolByRarity = function(r){ return G.gacha.pool().filter(function(a){ return G.gacha.rarityOf(a)===r; }); };

  function pickRarityKey(rs){ var t=0,i; for(i=0;i<rs.length;i++) t+=rs[i].w; var x=Math.random()*t;
    for(i=0;i<rs.length;i++){ x-=rs[i].w; if(x<0) return rs[i].key; } return rs[rs.length-1].key; }

  function rollRarity(forceMinEpic){
    var c=G.gacha.ensure();
    c.pity.legend++;
    if(c.pity.legend>=G.gacha.LEGEND_PITY){ c.pity.legend=0; return "legend"; }   // 하드 천장
    var rs=G.gacha.RARITY.map(function(r){ return { key:r.key, w:r.weight }; });
    if(c.pity.legend>=G.gacha.SOFT){ var ex=(c.pity.legend-G.gacha.SOFT+1)*6;     // 소프트 피티: 전설 가중↑
      rs.forEach(function(r){ if(r.key==="legend") r.w+=ex; }); }
    if(forceMinEpic) rs=rs.filter(function(r){ return r.key==="epic"||r.key==="legend"; });   // 10연 보장 슬롯
    var key=pickRarityKey(rs);
    if(key==="legend") c.pity.legend=0;
    return key;
  }

  /* 보유 여부: 가챠 보유 ∥ 층 해금 */
  G.gacha.isOwned = function(a){
    var c=G.gacha.ensure();
    if(c.owned[a.id]) return true;
    return (a.unlock!=null) && G.avatar && G.avatar.unlocked && G.avatar.unlocked(a);
  };

  G.gacha.pullOne = function(forceMinEpic){
    var c=G.gacha.ensure();
    var rk=rollRarity(forceMinEpic);
    var poolR=G.gacha.poolByRarity(rk);
    if(!poolR.length) poolR=G.gacha.pool();          // 해당 희귀도 풀 없으면 전체에서
    if(!poolR.length) return null;
    // 미보유 우선: 같은 희귀도에 안 가진 스킨이 있으면 그 중에서만 추첨(천장/확정의 'NEW' 체감 보장)
    var unowned=poolR.filter(function(s){ return !G.gacha.isOwned(s); });
    var pickFrom = unowned.length ? unowned : poolR;
    var skin=pickFrom[Math.floor(Math.random()*pickFrom.length)];
    var sr=G.gacha.rarityOf(skin), rd=G.gacha.rdef(sr);
    if(G.gacha.isOwned(skin)){ c.shards+=rd.shard; return { skin:skin, rarity:sr, dupe:true, shards:rd.shard }; }
    c.owned[skin.id]=true; return { skin:skin, rarity:sr, dupe:false };
  };

  G.gacha.cost = function(n){ return n===10 ? G.gacha.COST10 : G.gacha.COST*(n||1); };

  G.gacha.pull = function(n){
    n=n||1;
    if(!G.gacha.pool().length) return { ok:false, msg:"뽑기 풀이 비어 있습니다" };
    var cost=G.gacha.cost(n);
    G.arena.ensure();
    if((G.state.arena.coins||0) < cost) return { ok:false, msg:"아레나 코인이 부족합니다 (🏅"+cost+")" };
    G.state.arena.coins -= cost;
    var results=[];
    for(var i=0;i<n;i++){
      var forceEpic = (n===10 && i===n-1 && !results.some(function(r){return r && (r.rarity==="epic"||r.rarity==="legend");}));
      var r=G.gacha.pullOne(forceEpic); if(r) results.push(r);
    }
    if(G.save) G.save.save(true);
    return { ok:true, results:results, cost:cost };
  };

  /* 조각 교환 — 미보유 스킨을 조각으로 직접 획득 */
  G.gacha.exchange = function(id){
    var c=G.gacha.ensure(), a=G.avatar.get(id), sr=G.gacha.rarityOf(a);
    if(!a || !sr) return { ok:false, msg:"교환할 수 없는 항목" };
    if(G.gacha.isOwned(a)) return { ok:false, msg:"이미 보유 중입니다" };
    var cost=G.gacha.EXCHANGE[sr]||100;
    if((c.shards||0) < cost) return { ok:false, msg:"외형 조각이 부족합니다 ("+cost+")" };
    c.shards-=cost; c.owned[id]=true; if(G.save) G.save.save(true);
    return { ok:true, name:a.name, rarity:sr };
  };
})();
