/* cha 캐릭터 시트를 아바타 작업용으로 준비:
   - D:\ai\elten\cha\*.png → assets/avatars/<key>.png 복사
   - tools/manifest.json 에 "🧑 캐릭터(아바타)" 그룹으로 추가(슬라이서 드롭다운 노출)
   실행: node tools/prep_avatars.js  (프로젝트 루트에서) */
const fs=require("fs"), path=require("path");
const SRC="D:\\ai\\elten\\cha";
const root=path.join(__dirname,"..");
const outDir=path.join(root,"assets","avatars");
fs.mkdirSync(outDir,{recursive:true});

// 파일 → {key,name}  (키는 몬스터와 충돌 없게: 'goblin'은 몬스터가 점유 → goblin_grunt)
const MAP=[
  ["Dwarf Sprite Sheet 1.3v.png","dwarf","드워프"],
  ["Elven Warrior Sprite Sheet.png","elven_warrior","엘프 전사"],
  ["Fishfolk Berserker Sprite Sheet.png","fishfolk_berserker","어인 광전사"],
  ["Fishfolk Brute Sprite Sheet.png","fishfolk_brute","어인 투사"],
  ["Fishfolk Knight Sprite Sheet.png","fishfolk_knight","어인 기사"],
  ["Fishfolk Whip Sprite Sheet.png","fishfolk_whip","어인 채찍병"],
  ["Goblin Assassin Sprite Sheet.png","goblin_assassin","고블린 암살자"],
  ["Goblin Boar Rider Sprite Sheet.png","goblin_boar_rider","고블린 멧돼지 기수"],
  ["Goblin Sprite Sheet.png","goblin_grunt","고블린 병사"],
  ["Lizardfolk Spearman Sprite Sheet.png","lizardfolk_spearman","리자드맨 창병"],
  ["Lizardfolk Warrior Sprite Sheet.png","lizardfolk_warrior","리자드맨 전사"],
  ["Vengeful Spirit Sprite Sheet.png","vengeful_spirit","원혼"],
  ["Wendigo Sprite Sheet.png","wendigo","웬디고"],
  ["Yeti Sprite Sheet.png","yeti","예티"]
];

const manPath=path.join(root,"tools","manifest.json");
const man=JSON.parse(fs.readFileSync(manPath,"utf8"));
const GROUP="🧑 캐릭터(아바타)";
let copied=0, added=0;
for(const [file,key,name] of MAP){
  const s=path.join(SRC,file);
  if(!fs.existsSync(s)){ console.warn("없음:",file); continue; }
  fs.copyFileSync(s, path.join(outDir,key+".png")); copied++;
  if(!man.monsters.find(m=>m.key===key)){
    man.monsters.push({ key, name, tier:"avatar", folder:"cha", group:GROUP,
      files:["../assets/avatars/"+key+".png"] });
    added++;
  }
}
fs.writeFileSync(manPath, JSON.stringify(man,null,2));
console.log("복사 "+copied+"개 → assets/avatars/, manifest 추가 "+added+"개 (그룹: "+GROUP+")");
