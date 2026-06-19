/* assets/fx/*.png 를 슬라이서 manifest에 "✨ FX" 그룹(tier:fx)으로 등록.
   FX는 행 구분 없이 전체 프레임을 순차 재생(슬라이서 FX 모드). 실행: node tools/prep_fx.js */
const fs=require("fs"), path=require("path");
const root=path.join(__dirname,"..");
const fxDir=path.join(root,"assets","fx");
const manPath=path.join(root,"tools","manifest.json");
const man=JSON.parse(fs.readFileSync(manPath,"utf8"));
const GROUP="✨ FX";
let added=0;
for(const f of fs.readdirSync(fxDir)){
  if(!/\.png$/i.test(f)) continue;
  const key="fx_"+f.replace(/\.png$/i,"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
  if(man.monsters.find(m=>m.key===key)) continue;
  man.monsters.push({ key, name:f.replace(/\.png$/i,""), tier:"fx", folder:"fx", group:GROUP,
    files:["../assets/fx/"+f] });
  added++;
}
fs.writeFileSync(manPath, JSON.stringify(man,null,2));
console.log("FX manifest 등록:", added, "개 (그룹:", GROUP+")");
