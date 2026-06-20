-- ============================================================
-- 닉네임 중복 방지 (대소문자 무시) — Supabase SQL Editor에서 실행
-- 클라이언트 사전 체크와 별개로, 경합(동시 등록) 시 최종 방어선.
-- ⚠️ 이미 중복 닉네임 데이터가 있으면 인덱스 생성이 실패합니다 → 먼저 중복 정리.
-- ============================================================

-- 1) (선택) 현재 중복 닉네임 확인
-- select lower(nickname) ln, count(*) from public.profiles group by ln having count(*) > 1;

-- 2) (필요 시) 중복 정리 예시 — 가장 오래된 1개만 남기고 뒤 닉네임에 접미사 부여
-- update public.profiles p set nickname = p.nickname || '_' || substr(p.id::text,1,4)
-- where exists (
--   select 1 from public.profiles q
--   where lower(q.nickname)=lower(p.nickname) and q.updated_at < p.updated_at
-- );

-- 3) 대소문자 무시 유니크 인덱스
create unique index if not exists profiles_nickname_lower_unique
  on public.profiles (lower(nickname));
