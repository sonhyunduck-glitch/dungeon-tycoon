/* Elthen Asset Pack의 미등록 몬스터 시트를 tools/sheets/<key>/ 로 복사하고
   manifest.json에 "종류별 그룹"으로 등록한다. (행 분할/모션 지정은 슬라이서에서 수동)
   실행: node tools/prep_monsters.js */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const PACK = "D:/ai/elten/elthen Asset Pack(11월8일)";
const manPath = path.join(__dirname, "manifest.json");
const man = JSON.parse(fs.readFileSync(manPath, "utf8"));
const sheetsDir = path.join(__dirname, "sheets");

const addedFolders = new Set(man.monsters.map(m => m.folder));
const addedKeys = new Set(man.monsters.map(m => m.key));

// 비-몬스터(소품/타일/시스템/상점 등) 제외
const SKIP = /Table|Tileset|Tile$|Stations?|Bench|Collectibles|Objects|^.*Pack$|Assets$|Totems|Forge Sprite|Portal|Vehicle|RC Car|Turret|Clef|Card Creation|Pixel Artist|Animations$|Townsfolk|Peasants|Merchants|Vendors|Villager|Inn Keeper|Old (Man|Lady)|Kids|Royal Family|Royal Guard|RoyalArcher|Squire|Builder|Miner|Farmer|Fisherman|Blacksmith|Mechanic|Courier|Executioner|Dancer|Bard|Jester|Alchemist|Archaeologist|Scientists?|Cops|Space Cadet|Christmas|Training Dummy|Guardian Scroll|Medium Cactus|^타일$|^식물형|Project SUS/i;

function slug(s) { return s.toLowerCase().replace(/sprite sheet.*$/i, "").trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }

function groupOf(name) {
  const n = name.toLowerCase();
  if (/dragon|drake|wyvern|hatchling|basilisk|naga|lizard|kobold|salamander|faerie dragon/.test(n)) return "🐉 용·파충류";
  if (/skeleton|skeletal|zombie|ghost|ghoul|lich|mummy|vampire|banshee|wraith|death|shadow|undead|necro|flameskull|spirit|wisp|cloaker|akaname|attic/.test(n)) return "💀 언데드·영혼";
  if (/element|elem|ifrit|golem|construct|guardian|geonid|arcane|shield guardian|dwarven guardian/.test(n)) return "🔥 정령·골렘";
  if (/demon|devil|imp|succubus|caco|hell|fiend|maw|warlock|cultist|nothic|horror|abyssal|genie|vargouille|glutmon|intellect|brain|flesh/.test(n)) return "👹 악마·이계";
  if (/giant|ogre|troll|cyclops|minotaur|terminotaur|umber|gorilla|titan|hulk|owlbear|beast|froghemoth|forest guardian|mushroom|fungal/.test(n)) return "🧌 거인·괴수";
  if (/orc|goblin|bandit|pirate|gnoll|bugbear|ratfolk|fishfolk|bullywug|infantry|gladiator|barbarian|knight|^mage|rogue|paladin|ninja|warrior|archer|hunter|shaman|assassin|thief|anubis|homunculus|centaur|naga|korred|brownie|quickling|fairy|pyromancer|priestess|plague|mad professor|adventurer/.test(n)) return "🗡️ 인간형·종족";
  if (/wolf|bear|boar|cat|dog|fox|deer|cow|bull|horse|pig|chicken|rooster|owl|raven|bat|rat|snake|cobra|spider|scorpion|crab|fish|octopus|jelly|wasp|fly|beetle|bug|squirrel|hedgehog|porcupine|penguin|turtle|armadillo|skunk|raccoon|parrot|pidgeon|pigeon|vulture|worm|snail|dragonfly|ladybug|scarab|molerat|compsognathus|jackalope|hermit|crustacean|monster snail|thunder beast|hell critter|robotic|drone|bot|alien/.test(n)) return "🐺 야수·동물";
  return "✦ 기타·특수";
}

let added = 0, copied = 0, byGroup = {};

function emit(name, folderLabel, pngs) {
  const key = slug(name);
  if (!key || addedKeys.has(key)) return;          // 중복 제거
  addedKeys.add(key);
  const dst = path.join(sheetsDir, key);
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  const files = [];
  for (const p of pngs) {
    const base = path.basename(p);
    const out = path.join(dst, base);
    if (!fs.existsSync(out)) { fs.copyFileSync(p, out); copied++; }
    files.push("sheets/" + key + "/" + base);
  }
  const g = groupOf(name);
  man.monsters.push({ key, name, tier: "normal", folder: folderLabel, group: g, files });
  byGroup[g] = (byGroup[g] || 0) + 1;
  added++;
}

// 폴더를 순회: 직접 PNG가 있으면 한 몬스터, 없고 하위폴더만 있으면 재귀(카테고리 폴더)
function walk(dir, label, depth) {
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  const pngs = entries.filter(e => e.isFile() && /\.png$/i.test(e.name)).map(e => path.join(dir, e.name));
  const subs = entries.filter(e => e.isDirectory());
  if (pngs.length) emit(label, label, pngs);
  if (subs.length && depth < 2) for (const s of subs) {
    if (SKIP.test(s.name)) continue;
    walk(path.join(dir, s.name), s.name, depth + 1);
  }
}

for (const d of fs.readdirSync(PACK, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  if (addedFolders.has(d.name)) continue;   // 이미 등록(영문 폴더명 기준)
  if (SKIP.test(d.name)) continue;
  walk(path.join(PACK, d.name), d.name, 0);
}

fs.writeFileSync(manPath, JSON.stringify(man, null, 2));
console.log("신규 몬스터 등록:", added, "종 | 복사한 PNG:", copied, "개 | 총 manifest:", man.monsters.length);
console.log("그룹별:");
Object.keys(byGroup).sort().forEach(g => console.log("  " + g + ": " + byGroup[g]));
