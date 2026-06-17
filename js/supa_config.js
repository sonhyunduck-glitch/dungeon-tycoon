/* ============================================================
   Supabase 접속 설정
   ------------------------------------------------------------
   멀티플레이(채팅·랭킹·클라우드 세이브)를 켜려면 아래 두 값을 채우세요.
   Supabase 대시보드 > Project Settings > API 에서 확인:
     - URL        : Project URL
     - anonKey    : Project API keys > anon  public
   값이 비어 있으면 게임은 기존처럼 오프라인(봇 채팅/봇 랭킹)으로 동작합니다.
   ※ http로 실행해야 합니다 (file:// 에서는 동작하지 않음).
   ============================================================ */
window.SUPA = {
  url: "https://afojkrhzyuekxqmfppyn.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmb2prcmh6eXVla3hxbWZwcHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE5MDgsImV4cCI6MjA5NDk4NzkwOH0.9up3krqSCNTUHpzvvF9h2U0Li522rpk_e4FZNAjNqoU"
};
