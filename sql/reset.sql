-- ============================================================
-- 던전 & 상점 타이쿤 — 기존 프로젝트 "완전 초기화" + 게임 스키마 생성
-- ⚠️ 되돌릴 수 없습니다! public 스키마의 모든 테이블/함수 삭제 +
--    기존 로그인 사용자(auth.users) 전부 삭제 후, 게임 테이블을 새로 만듭니다.
-- 사용법: Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 Run
--        (실행 후, 익명 로그인 활성화: Authentication > Providers > Anonymous > Enable)
-- ============================================================

-- ---------- 0) 기존 로그인 사용자 전부 삭제 ----------
delete from auth.users;

-- ---------- 1) public 스키마 통째로 초기화 ----------
drop schema if exists public cascade;
create schema public;

-- 기본 권한 복구 (Supabase 표준)
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables    in schema public to postgres, anon, authenticated, service_role;
grant all on all routines  in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on tables    to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on routines  to postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to postgres, anon, authenticated, service_role;

-- ============================================================
-- 2) 게임 테이블
-- ============================================================

-- 프로필 (닉네임 + 랭킹용 최고 도달 층)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text not null,
  floor      int  not null default 1,
  updated_at timestamptz not null default now()
);

-- 클라우드 세이브 (게임 상태 jsonb)
create table public.saves (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- 전역 채팅
create table public.messages (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  nickname   text not null,
  text       text not null,
  created_at timestamptz not null default now()
);
create index messages_created_idx on public.messages(created_at desc);

-- ============================================================
-- 3) RLS (행 수준 보안)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.saves    enable row level security;
alter table public.messages enable row level security;

-- 프로필: 누구나 읽기(랭킹), 본인만 쓰기
create policy "profiles_read"   on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- 세이브: 본인 것만
create policy "saves_read"   on public.saves for select using (auth.uid() = user_id);
create policy "saves_insert" on public.saves for insert with check (auth.uid() = user_id);
create policy "saves_update" on public.saves for update using (auth.uid() = user_id);

-- 채팅: 누구나 읽기, 본인 이름으로만 작성
create policy "messages_read"   on public.messages for select using (true);
create policy "messages_insert" on public.messages for insert with check (auth.uid() = user_id);

-- ============================================================
-- 4) 실시간 (채팅 INSERT 구독)
--    drop schema 로 publication 멤버십이 사라지므로 다시 추가
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- 5) 내 순위 계산 RPC
-- ============================================================
create or replace function public.my_rank(my_floor int)
returns int language sql stable as $$
  select count(*) + 1 from public.profiles where floor > my_floor;
$$;

-- 완료! 이제 js/supa_config.js 에 URL/anon 키를 넣고 http로 실행하세요.
