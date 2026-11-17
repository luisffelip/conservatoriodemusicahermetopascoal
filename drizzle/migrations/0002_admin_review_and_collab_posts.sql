alter table public.enrollments drop constraint enrollments_status_check;
alter table public.enrollments add constraint enrollments_status_check check (status in ('Pendente','Aprovada','Recusada','Cancelada'));
alter table public.enrollments add column reviewed_at timestamptz;
drop index if exists public.enrollments_one_active;
create unique index enrollments_one_active on public.enrollments(user_id, class_id) where status in ('Pendente','Aprovada');

create policy "Admin reads profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.notify_enrollment_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('Aprovada','Recusada') then
    insert into public.notifications(user_id, text) values (new.user_id,
      case when new.status = 'Aprovada' then 'Sua matrícula foi aprovada pelo responsável.' else 'Sua solicitação de matrícula foi recusada pelo responsável.' end);
  end if;
  return new;
end $$;
create trigger enrollments_review_notify after update on public.enrollments for each row execute function public.notify_enrollment_review();

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  author_name text not null,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 10 and 2000),
  instrument text,
  activity text not null check (activity in ('Ensaio','Gravação','Apresentação','Outro')),
  wanted_date date,
  period text,
  interest_count integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "Posts read" on public.posts for select to authenticated using (true);
create policy "Posts create own" on public.posts for insert to authenticated with check (auth.uid() = author_id and interest_count = 0);
create policy "Posts update own" on public.posts for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "Posts delete own" on public.posts for delete to authenticated using (auth.uid() = author_id);

create table public.post_interests (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null,
  user_name text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
grant select, insert on public.post_interests to authenticated;
grant all on public.post_interests to service_role;
alter table public.post_interests enable row level security;
create policy "Interest read own or author" on public.post_interests for select to authenticated
  using (auth.uid() = user_id or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "Interest create own" on public.post_interests for insert to authenticated
  with check (auth.uid() = user_id and not exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create or replace function public.on_post_interest()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.posts;
begin
  update public.posts set interest_count = interest_count + 1 where id = new.post_id returning * into p;
  insert into public.notifications(user_id, text) values (p.author_id, new.user_name || ' demonstrou interesse na sua publicação “' || p.title || '”.');
  return new;
end $$;
create trigger post_interest_added after insert on public.post_interests for each row execute function public.on_post_interest();

-- Keep authors from editing their own interest counter.
create or replace function public.keep_interest_count()
returns trigger language plpgsql as $$
begin
  if current_user = 'authenticated' then new.interest_count := old.interest_count; end if;
  return new;
end $$;
create trigger posts_keep_count before update on public.posts for each row execute function public.keep_interest_count();