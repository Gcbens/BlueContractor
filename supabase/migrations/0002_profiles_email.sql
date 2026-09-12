-- Phase 3: add email to profiles so the admin UI can list users via RLS
-- (anon/authenticated clients can't read auth.users directly).

alter table public.profiles add column email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email) values (new.id, 'user', new.email);
  return new;
end;
$$;

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- backfill any existing profiles (e.g. the seeded owner) with their email
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is distinct from u.email;
