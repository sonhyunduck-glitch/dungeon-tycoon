-- ============================================================
-- 던전 & 상점 타이쿤 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.
-- (익명 로그인도 켜야 함: Authentication > Providers > Anonymous > Enable)
-- ============================================================

-- ---------- 프로필 (닉네임 + 랭킹용 최고 도달 층) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text not null,
  floor      int  not null default 1,
  updated_at timestamptz not null default now()
);

-- ---------- 클라우드 세이브 (게임 상태 통째로 jsonb) ----------
create table if not exists public.saves (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- 전역 채팅 ----------
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  nickname   text not null,
  text       text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_created_idx on public.messages(created_at desc);

-- ============================================================
-- RLS (행 수준 보안)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.saves    enable row level security;
alter table public.messages enable row level security;

-- 프로필: 누구나 읽기(랭킹), 본인만 쓰기
drop policy if exists "profiles_read"   on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_read"   on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- 세이브: 본인 것만 읽기/쓰기
drop policy if exists "saves_read"   on public.saves;
drop policy if exists "saves_insert" on public.saves;
drop policy if exists "saves_update" on public.saves;
create policy "saves_read"   on public.saves for select using (auth.uid() = user_id);
create policy "saves_insert" on public.saves for insert with check (auth.uid() = user_id);
create policy "saves_update" on public.saves for update using (auth.uid() = user_id);

-- 채팅: 누구나 읽기, 로그인 사용자 본인 이름으로만 작성
drop policy if exists "messages_read"   on public.messages;
drop policy if exists "messages_insert" on public.messages;
create policy "messages_read"   on public.messages for select using (true);
create policy "messages_insert" on public.messages for insert with check (auth.uid() = user_id);

-- ============================================================
-- 실시간 (채팅 INSERT 구독)
-- ============================================================
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- 내 순위 계산용 RPC (선택) — 정확한 순위
-- ============================================================
create or replace function public.my_rank(my_floor int)
returns int language sql stable as $$
  select count(*) + 1 from public.profiles where floor > my_floor;
$$;
