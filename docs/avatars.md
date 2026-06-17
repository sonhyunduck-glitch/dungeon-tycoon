# 아바타(플레이어 스프라이트) 추가 가이드

전투 화면의 내 캐릭터(`#pc-sprite`)는 **아바타**로 교체할 수 있습니다.
선택 UI: **캐릭터 탭 → 🎭 아바타**. 아바타 목록은 `js/avatars.js`의 `G.DATA.AVATARS` 배열로 관리됩니다.

## 새 아바타 추가 순서

### 1. 캐릭터 시트 준비
- 32×32(또는 임의 크기) 프레임이 격자로 배열된 PNG 스프라이트 시트
- 행(row)별로 모션이 나뉜 형식 권장 (adventurer.png: 0행 idle, 4행 attack, 6행 hurt, 7행 death)
- PNG를 `assets/` 에 저장 (예: `assets/mage.png`)

### 2. 스프라이트 슬라이서로 프레임 범위 확인
- `tools/slicer.html` 을 열어 시트를 로드
- 칸수(열×행) 또는 px로 그리드를 맞추고, 각 모션이 **몇 행에서 시작해 몇 프레임**인지 미리보기로 확인
  - idle / attack / hurt / death 각각의 `row`(행 번호, 0부터)와 `frames`(프레임 수)

### 3. `js/avatars.js` 에 등록
`G.DATA.AVATARS` 배열에 항목 추가:
```js
{
  id:"mage", name:"마법사", sheet:"assets/mage.png",
  fw:32, fh:32, scale:1.5,            // 프레임 가로/세로(px), 표시 배율
  idle:{row:0,frames:8,dur:1.2},      // dur = 한 사이클 초
  attack:{row:3,frames:8,dur:0.5},
  hurt:{row:5,frames:4,dur:0.3},
  death:{row:6,frames:6,dur:0.7}
}
```
- `row`: 모션이 있는 행(0부터). `frames`: 그 행에서 사용할 프레임 수. `dur`: 재생 시간(초).
- 저장 후 새로고침하면 **캐릭터 → 아바타** 목록에 자동으로 나타납니다.

## 동작 원리
- 선택 시 `G.avatar.apply()` 가 `#pc-avatar-style` 에 해당 아바타용 CSS(애니메이션 + 키프레임)를 동적 주입합니다.
- 선택값은 `G.state.avatar` 에 저장되어 클라우드 세이브로 보존됩니다.
- 모든 아바타가 같은 프레임 형식일 필요는 없습니다(항목마다 row/frames/크기 지정).
