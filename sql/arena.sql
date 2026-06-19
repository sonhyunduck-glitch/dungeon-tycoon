-- ============================================================
-- 아레나(PvP) — profiles 확장 + 매칭 RPC
-- 기존 프로젝트에 적용: Supabase SQL Editor에 붙여넣고 Run
-- ============================================================

alter table public.profiles add column if not exists arena_score   int   not null default 1000;
alter table public.profiles add column if not exists power         int   not null default 0;
alter table public.profiles add column if not exists snapshot      jsonb;
alter table public.profiles add column if not exists arena_wins    int   not null default 0;
alter table public.profiles add column if not exists arena_losses  int   not null default 0;

create index if not exists profiles_arena_idx on public.profiles(arena_score desc);

-- 비슷한 점수의 상대 추천(스냅샷 있고 100층 이상인 플레이어 중 점수 근접 순)
create or replace function public.arena_opponents(my_id uuid, my_score int)
returns setof public.profiles language sql stable as $$
  select * from public.profiles
  where id <> my_id and snapshot is not null and floor >= 100   -- 아레나 해금(100층) 이상만 상대로
  order by abs(arena_score - my_score) asc, random()
  limit 10;
$$;

-- 내 아레나 순위
create or replace function public.my_rank_arena(my_score int)
returns int language sql stable as $$
  select count(*) + 1 from public.profiles where arena_score > my_score;
$$;
