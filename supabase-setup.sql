-- Run in Supabase Dashboard → SQL Editor as project owner.
-- Profiles are created by trigger. Do not expose auth.users or service-role credentials.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);
create table if not exists public.login_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'email',
  created_at timestamptz not null default now()
);
create table if not exists public.student_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sessions integer not null default 0 check (sessions >= 0),
  tasks text[] not null default '{}',
  bookmarks text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create index if not exists login_events_created_at_idx on public.login_events(created_at desc);
create index if not exists login_events_user_created_idx on public.login_events(user_id,created_at desc);
create index if not exists profiles_created_at_idx on public.profiles(created_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id,email,full_name)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do update set email=excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.login_events enable row level security;
alter table public.student_progress enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Users update own name" on public.profiles;
create policy "Users update own name" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = 'student');
drop policy if exists "Users record own login" on public.login_events;
create policy "Users record own login" on public.login_events for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users save own progress" on public.student_progress;
create policy "Users save own progress" on public.student_progress for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Admin-only statistics RPC. The role check happens on the server, not in the browser.
create or replace function public.admin_platform_analytics()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Admin access required';
  end if;
  select jsonb_build_object(
    'total_accounts', (select count(*) from public.profiles),
    'total_logins', (select count(*) from public.login_events),
    'new_accounts_7d', (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'active_students_7d', (select count(distinct user_id) from public.login_events where created_at >= now() - interval '7 days'),
    'recent_logins', coalesce((select jsonb_agg(row_to_json(x)) from (
      select p.email, le.created_at, le.provider
      from public.login_events le join public.profiles p on p.id = le.user_id
      order by le.created_at desc limit 20
    ) x), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_platform_analytics() from public;
grant execute on function public.admin_platform_analytics() to authenticated;

-- NOTE: Client-reported login events are useful analytics, not fraud-proof audit logs.
-- For high-assurance analytics, record sign-in events through a trusted server/auth hook.
-- After your own account is created, promote it to admin using the SQL below:
-- update public.profiles set role='admin' where email='YOUR-EMAIL@example.com';
