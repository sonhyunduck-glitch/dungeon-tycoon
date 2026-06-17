/* www/ 빌드 — Capacitor가 앱에 내장할 웹 자산만 복사.
   런타임에 필요한 것: index.html + css/ + js/ + assets/
   (tools/, sql/, docs/, *.md 등 개발용은 제외) */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "www");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// 런타임에 안 쓰는 아이콘 소스(앱 아이콘 생성용)는 번들 제외
const EXCLUDE = new Set(["192.png", "96.png", "store.png"]);
fs.copyFileSync(path.join(root, "index.html"), path.join(out, "index.html"));
for (const dir of ["css", "js", "assets"]) {
  fs.cpSync(path.join(root, dir), path.join(out, dir), {
    recursive: true,
    filter: function(s){ return !EXCLUDE.has(path.basename(s)); }
  });
}

// 용량 합산
function size(p){ let s=0; for(const e of fs.readdirSync(p,{withFileTypes:true})){ const fp=path.join(p,e.name); s += e.isDirectory()?size(fp):fs.statSync(fp).size; } return s; }
console.log("www 빌드 완료 →", out, "(", (size(out)/1048576).toFixed(1), "MB )");
