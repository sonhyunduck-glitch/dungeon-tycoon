/* ui.js(1596줄)를 기능별 4파일로 분리. 동작 불변 — G.ui.* 를 이름 기준 이동,
   공용 헬퍼/디스패처는 ui.js(core)에 잔류(전역이라 다른 파일에서 런타임 접근 가능).
   분류 안 된 이름은 자동으로 core 잔류(유실 방지). 실행: node tools/split_ui.js */
const fs=require("fs"), path=require("path");
const root=path.join(__dirname,"..");
const src=path.join(root,"js","ui.js");
const lines=fs.readFileSync(src,"utf8").split(/\r?\n/);

const FX=["floatDmg","floatDmgAll","attackFx","attackFxAll","hurtFx","winFx","pcAnim","foeAttackAnim","foeHurtAnim","foeDeathAnim","dodgeFx","idlePopup"];
const MODALS=["unlockModal","compareModal","priceModal","pushAlert","TERMS_VERSION","termsAgreed","setTermsAgreed","TERMS_HTML","termsModal","startScreen","nicknameModal","authModal","arenaResultModal"];
const COMBAT=["renderDungeon","_stageSelect","_combatBox","refreshFoeHp","refreshCombat","_deadScreen","_clearScreen"];
const TABS=["renderInventory","_bagPanel","_warehousePanel","renderCharacter","_avatarPanel","_statSheet","_skills","renderShop","_guestbook","_orders","renderVendor","_forge","renderMarket","renderPerks","_perksHTML","renderArena","renderRanking","renderSettings"];
function bucketOf(name){
  if(FX.indexOf(name)>=0) return "fx";
  if(MODALS.indexOf(name)>=0) return "modals";
  if(COMBAT.indexOf(name)>=0) return "combat";
  if(TABS.indexOf(name)>=0) return "tabs";
  return "core";
}
const START=/^(?:G\.ui\.([A-Za-z_$][\w$]*)|function\s+([A-Za-z_$][\w$]*)|var\s+([A-Za-z_$][\w$]*)|const\s+([A-Za-z_$][\w$]*))/;

// 유닛 분해: unit-start 라인에서 시작, 다음 unit-start 전까지가 한 유닛
const units=[]; let cur=null;
for(const ln of lines){
  const m=ln.match(START);
  if(m){
    const name=m[1]||m[2]||m[3]||m[4];
    cur={name:name, bucket:bucketOf(name), lines:[ln]};
    units.push(cur);
  } else {
    if(cur) cur.lines.push(ln); else { cur={name:"__head",bucket:"core",lines:[ln]}; units.push(cur); }
  }
}

const out={core:[],fx:[],modals:[],combat:[],tabs:[]};
for(const u of units) out[u.bucket].push(u.lines.join("\n"));

const HEADER={
  fx:"/* ui-fx.js — 전투 이펙트·애니메이션·팝업 (ui.js에서 분리). 공용 헬퍼는 ui.js 전역. */",
  modals:"/* ui-modals.js — 모달/오버레이 (해금·비교·가격·약관·시작·로그인·아레나결과·푸시). ui.js에서 분리. */",
  combat:"/* ui-combat.js — 던전/전투 화면 렌더. ui.js에서 분리. */",
  tabs:"/* ui-tabs.js — 탭 화면 렌더(가방·캐릭터·상점·대장간·시장·퀘스트·아레나·랭킹·설정). ui.js에서 분리. */"
};

fs.writeFileSync(src, out.core.join("\n")+"\n", "utf8");
for(const b of ["fx","modals","combat","tabs"]){
  fs.writeFileSync(path.join(root,"js","ui-"+b+".js"),
    HEADER[b]+"\nvar G = window.G;\n\n"+out[b].join("\n")+"\n", "utf8");
}

function cnt(s){ return s.split("\n").length; }
console.log("core(ui.js):", cnt(out.core.join("\n")),
  "| fx:", cnt(out.fx.join("\n")), "| modals:", cnt(out.modals.join("\n")),
  "| combat:", cnt(out.combat.join("\n")), "| tabs:", cnt(out.tabs.join("\n")));
console.log("core 잔류 유닛:", units.filter(u=>u.bucket==="core").map(u=>u.name).join(", "));
