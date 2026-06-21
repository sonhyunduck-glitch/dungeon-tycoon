/* ============================================================
   시장 경쟁 타이쿤 — NPC 상인 매물 / 검색 / 급매물 되팔이 / 키워드 알림
   ============================================================ */
var G = window.G;
G.market = {};
G.market.REFRESH_MS = 300000;  // 5분마다 매물 갱신

/* 가격 태그 (시세=basePrice 대비) */
G.market.priceTag = function(listing){
  var r = listing.price / listing.item.basePrice;
  if(r<=0.7)  return { label:"🔥 급매물! 시세 대비 "+Math.round((1-r)*100)+"% 저렴", cls:"r-uncommon", hot:true };
  if(r<=1.15) return { label:"시세 적정", cls:"muted", hot:false };
  if(r<=1.6)  return { label:"다소 비쌈", cls:"gold", hot:false };
  return { label:"바가지 위험", cls:"r-legend", hot:false };
};

/* 매물 새로 생성 */
G.market.refresh = function(){
  var st=G.state.market;
  var lvl=Math.max(1, G.state.dungeon.maxFloor||1);
  var tier=Math.min(4, 1+Math.floor(lvl/10));
  var listings=[];
  for(var i=0;i<14;i++){
    var it=G.item.generate(tier, Math.max(1, lvl - G.util.rand(0,4)));
    it.identified=true;                         // 시장 매물은 감정 완료 상태
    var roll=Math.random(), mult;
    if(roll<0.18)      mult=0.5 + Math.random()*0.18;  // 급매물
    else if(roll<0.72) mult=0.9 + Math.random()*0.45;  // 적정
    else               mult=1.3 + Math.random()*0.7;   // 비쌈
    listings.push({
      id:G.util.uid(), merchant:G.util.pick(G.DATA.MERCHANTS),
      item:it, price:Math.max(1, Math.round(it.basePrice*mult)),
    });
  }
  st.listings=listings;
  st.lastRefresh=Date.now();
  G.market.checkWatch(listings);
};

/* 필요 시 갱신 (탭 진입/부팅) */
G.market.ensureFresh = function(){
  var st=G.state.market;
  if(!st.listings || !st.listings.length || (Date.now()-(st.lastRefresh||0)) > G.market.REFRESH_MS){
    G.market.refresh();
  }
};

/* 즉시 구매 → 가방(가득 시 창고) */
G.market.buy = function(id){
  var st=G.state.market;
  var i=st.listings.findIndex(function(l){return l.id===id;});
  if(i<0) return;
  var l=st.listings[i];
  if(G.state.player.gold < l.price){ G.ui.toast("골드가 부족합니다 (🪙"+G.ui.fmt(l.price)+")"); return; }
  if(G.inventory.isFull()){ G.ui.toast("창고가 가득 찼습니다"); return; }
  G.state.player.gold -= l.price;
  G.inventory.add(l.item);
  st.listings.splice(i,1);
  var tag=G.market.priceTag(l);
  G.log("🛍️ ["+l.merchant+"] "+l.item.name+" 구매 🪙-"+G.ui.fmt(l.price)+(tag.hot?" (급매물 득템!)":""), l.item.rarityCls);
};

/* 관심 키워드 토글 (옵션 stat 키) */
G.market.toggleWatch = function(kw){
  var st=G.state.market; st.watch=st.watch||[];
  var i=st.watch.indexOf(kw);
  if(i>=0) st.watch.splice(i,1); else st.watch.push(kw);
};
/* 매물 중 관심 키워드 매칭 시 푸시 알림 */
G.market.checkWatch = function(listings){
  var kws=G.state.market.watch||[]; if(!kws.length) return;
  var hits=0;
  for(var i=0;i<listings.length && hits<3;i++){
    for(var j=0;j<kws.length;j++){
      var kw=kws[j];
      if(listings[i].item.stats[kw]){
        G.ui.pushAlert("📢 관심 매물! "+G.DATA.STAT_META[kw].label+" — "+listings[i].item.name);
        hits++; break;
      }
    }
  }
};

/* 등급 순위 (필터용) */
G.market.rank = function(r){ return {common:0,uncommon:1,rare:2,epic:3,legend:4}[r]||0; };

/* 부위 매핑 (weapon/armor/acc) */
G.market.partOf = function(it){ return it.type; }; // weapon/armor/acc
