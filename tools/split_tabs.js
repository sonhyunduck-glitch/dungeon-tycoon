/* ui-tabs.js를 탭별 파일로 분리(동작 불변, 이름 기준). 헬퍼는 ui.js 전역.
   실행: node tools/split_tabs.js */
const fs=require("fs"), path=require("path");
const root=path.join(__dirname,"..");
const src=path.join(root,"js","ui-tabs.js");
const lines=fs.readFileSync(src,"utf8").split(/\r?\n/);

const MAP={
  renderInventory:"inventory", _bagPanel:"inventory", _warehousePanel:"inventory",
  renderCharacter:"character", _avatarPanel:"character", _statSheet:"character", _skills:"character",
  renderShop:"shop", _guestbook:"shop", _orders:"shop",
  renderVendor:"vendor", _forge:"vendor",
  renderPerks:"perks", _perksHTML:"perks",
  renderArena:"arena",
  renderRanking:"ranking"
  // 그 외(renderMarket·renderSettings 등) → "tabs"(잔여 ui-tabs.js)
};
const HEADER={
  inventory:"/* ui-inventory.js — 가방/창고 탭. ui-tabs.js에서 분리. 헬퍼는 ui.js 전역. */",
  character:"/* ui-character.js — 캐릭터 탭(스탯/장비/룬/스킬/아바타/해금 서브탭). */",
  shop:"/* ui-shop.js — 가판대(상점) 탭. */",
  vendor:"/* ui-vendor.js — 상점/대장간 탭. */",
  perks:"/* ui-perks.js — 퀘스트(자동화 해금) 탭. */",
  arena:"/* ui-arena.js — 아레나(PvP) 탭. */",
  ranking:"/* ui-ranking.js — 무한의 탑(랭킹) 탭. */"
};
const START=/^(?:G\.ui\.([A-Za-z_$][\w$]*)|function\s+([A-Za-z_$][\w$]*)|var\s+([A-Za-z_$][\w$]*)|const\s+([A-Za-z_$][\w$]*))/;

const units=[]; let cur=null;
for(const ln of lines){
  const m=ln.match(START);
  if(m){ const name=m[1]||m[2]||m[3]||m[4]; cur={name,bucket:(MAP[name]||"tabs"),lines:[ln]}; units.push(cur); }
  else { if(cur) cur.lines.push(ln); else { cur={name:"__head",bucket:"tabs",lines:[ln]}; units.push(cur); } }
}
const out={tabs:[],inventory:[],character:[],shop:[],vendor:[],perks:[],arena:[],ranking:[]};
for(const u of units) out[u.bucket].push(u.lines.join("\n"));

fs.writeFileSync(src, out.tabs.join("\n")+"\n", "utf8");
for(const b of Object.keys(HEADER)){
  fs.writeFileSync(path.join(root,"js","ui-"+b+".js"), HEADER[b]+"\nvar G = window.G;\n\n"+out[b].join("\n")+"\n","utf8");
}
function c(s){ return s.split("\n").length; }
console.log("tabs(잔여):",c(out.tabs.join("\n")),"inv:",c(out.inventory.join("\n")),"char:",c(out.character.join("\n")),"shop:",c(out.shop.join("\n")),"vendor:",c(out.vendor.join("\n")),"perks:",c(out.perks.join("\n")),"arena:",c(out.arena.join("\n")),"rank:",c(out.ranking.join("\n")));
console.log("tabs 잔여:", units.filter(u=>u.bucket==="tabs").map(u=>u.name).join(", "));
