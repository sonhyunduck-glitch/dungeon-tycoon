# 멀티플레이 설정 가이드 (Supabase)

이 게임은 **키가 없으면 오프라인**(봇 채팅·봇 랭킹·로컬 세이브)으로,
**키를 넣으면 온라인**(실시간 채팅·실제 랭킹·클라우드 세이브)으로 자동 전환됩니다.

> ⚠️ 온라인은 **http**로 실행해야 합니다. `file://`로 열면 동작하지 않습니다. (프리뷰/로컬 서버 사용)

## 1. Supabase 프로젝트 만들기
1. https://supabase.com 가입 → **New project** 생성 (무료 플랜 OK)
2. 프로젝트가 준비될 때까지 대기

## 2. 익명 로그인 켜기
- 대시보드 **Authentication → Providers → Anonymous → Enable**

## 3. 테이블/보안 생성
- **새 프로젝트**: 대시보드 **SQL Editor** → `sql/schema.sql` 붙여넣기 → **Run**
- **기존 프로젝트 재사용(완전 초기화)**: `sql/reset.sql` 붙여넣기 → **Run**
  - ⚠️ public 스키마의 모든 테이블/함수 + 기존 로그인 사용자(auth.users)를 전부 삭제하고 게임 테이블을 새로 만듭니다. **되돌릴 수 없음.**
- 둘 다 profiles(랭킹) · saves(클라우드 세이브) · messages(채팅) + RLS + 실시간 + my_rank RPC를 설정합니다.

## 4. 접속 키 입력
- 대시보드 **Project Settings → API** 에서
  - **Project URL**
  - **anon public** 키
- `js/supa_config.js` 를 열어 채워넣기:
  ```js
  window.SUPA = {
    url: "https://xxxxxxxx.supabase.co",
    anonKey: "eyJhbGciOi...."
  };
  ```

## 5. 실행
- 로컬 서버(프리뷰)로 `index.html` 열기 → 새로고침
- 최초 1회 **닉네임 입력** 창이 뜸 → 이후 채팅/랭킹에 표시
- 설정 탭에서 `🌐 멀티플레이 🟢 온라인` 확인

## 동작 요약
| 기능 | 오프라인(키 없음) | 온라인(키 있음) |
|---|---|---|
| 채팅 | 봇 잡담 시뮬레이션 | 실시간 전역 채팅(Realtime) |
| 랭킹 탑 | 시드 봇 400명 | 실제 플레이어 profiles |
| 세이브 | localStorage | localStorage + 클라우드(saves) 동기화 |
| 로그인 | 없음("나") | 익명 로그인 + 닉네임 |

## 참고(코드 위치)
- 네트워크 레이어: `js/net.js` (`G.net.*`)
- 설정: `js/supa_config.js`
- 스키마: `sql/schema.sql`
- 채팅 온/오프 분기: `js/chat.js`
- 랭킹 서버 캐시: `js/ranking.js` (`remoteView`) + `js/net.js` (`refreshRanking`)
- 클라우드 세이브 훅: `js/save.js` → `G.net.queueSave`, 부팅 동기화: `js/main.js` `boot()`
