-- Phase 6: store the user's full name on their profile.
--
-- Source: Supabase Auth metadata (raw_user_meta_data.full_name), which is
-- populated either by our own signUp() call (options.data.full_name, for
-- email/password accounts) or automatically by the Google OAuth provider
-- (for Google accounts) — no extra provider-specific logic needed here,
-- both funnel through the same auth.users metadata column.

alter table public.profiles add column if not exists full_name text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, full_name)
  values (
    new.id,
    'user',
    new.email,
    nullif(trim(new.raw_user_meta_data->>'full_name'), '')
  );
  return new;
end;
$$;

-- Backfill existing profiles that don't have a name yet but whose auth
-- metadata already does (e.g. Google accounts created before this column
-- existed). Never overwrites a profile that already has a name.
update public.profiles p
set full_name = nullif(trim(u.raw_user_meta_data->>'full_name'), '')
from auth.users u
where p.id = u.id
  and p.full_name is null
  and nullif(trim(u.raw_user_meta_data->>'full_name'), '') is not null;
