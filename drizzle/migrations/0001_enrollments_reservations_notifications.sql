create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users see own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  class_id text not null,
  status text not null default 'Pendente' check (status in ('Pendente','Aprovada','Cancelada')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create unique index enrollments_one_active on public.enrollments(user_id, class_id) where status <> 'Cancelada';
grant select, insert, update on public.enrollments to authenticated;
grant all on public.enrollments to service_role;
alter table public.enrollments enable row level security;
create policy "Own enrollments read" on public.enrollments for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Own enrollments create" on public.enrollments for insert to authenticated with check (auth.uid() = user_id and status = 'Pendente');
create policy "Own enrollments cancel" on public.enrollments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and status = 'Cancelada');
create policy "Admin enrollments update" on public.enrollments for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  space_id text not null,
  day date not null,
  slot text not null,
  purpose text not null default '',
  status text not null default 'Pendente' check (status in ('Pendente','Confirmada','Cancelada')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create unique index reservations_one_active on public.reservations(space_id, day, slot) where status <> 'Cancelada';
grant select, insert, update on public.reservations to authenticated;
grant all on public.reservations to service_role;
alter table public.reservations enable row level security;
create policy "Own reservations read" on public.reservations for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Own reservations create" on public.reservations for insert to authenticated with check (auth.uid() = user_id and status = 'Pendente');
create policy "Own reservations cancel" on public.reservations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and status = 'Cancelada');
create policy "Admin reservations update" on public.reservations for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.taken_slots()
returns table(space_id text, day date, slot text)
language sql stable security definer set search_path = public
as $$ select r.space_id, r.day, r.slot from public.reservations r where r.status <> 'Cancelada' and r.day >= current_date $$;
grant execute on function public.taken_slots() to authenticated, anon;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  text text not null,
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user on public.notifications(user_id, created_at desc);
grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Own notifications read" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Own notifications create" on public.notifications for insert to authenticated with check (auth.uid() = user_id);
create policy "Own notifications update" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.cleanup_old_notifications()
returns void language sql security definer set search_path = public
as $$ delete from public.notifications where read and read_at < now() - interval '30 days' $$;

create extension if not exists pg_cron;
select cron.schedule('cleanup-old-notifications', '0 3 * * *', 'select public.cleanup_old_notifications()');