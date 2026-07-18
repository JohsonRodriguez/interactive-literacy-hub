-- Public educator/learner registration and private learning groups.
-- Review in a staging project first, then run once in Supabase SQL Editor.
-- This migration does not create or expose any service-role key.

begin;

-- The existing profile trigger creates every account as a student. This second,
-- alphabetically-late trigger applies the explicit public signup choice.
create or replace function public.apply_public_signup_role()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'student');
  requested_name text := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
begin
  if requested_role = 'teacher'
     and (new.raw_user_meta_data ->> 'registration_source') is distinct from 'public_educator'
     and coalesce(new.raw_user_meta_data ->> 'educator_type', '') not in ('classroom', 'tutor', 'homeschool', 'family', 'other') then
    requested_role := 'student';
  elsif requested_role not in ('student', 'teacher') then
    requested_role := 'student';
  end if;

  update public.profiles
  set
    role = requested_role,
    display_name = coalesce(requested_name, display_name, case when requested_role = 'teacher' then 'Educator' else 'Learner' end),
    avatar = coalesce(nullif(new.raw_user_meta_data ->> 'avatar', ''), avatar),
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists z_apply_public_signup_role on auth.users;
create trigger z_apply_public_signup_role
after insert on auth.users
for each row execute function public.apply_public_signup_role();

-- Re-applies the account type after email confirmation/login. This makes the
-- flow independent of the execution order of pre-existing auth triggers.
create or replace function public.sync_my_public_profile()
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requested_role text;
  requested_name text;
  existing_role text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select
    case
      when raw_user_meta_data ->> 'role' = 'teacher'
       and (
         raw_user_meta_data ->> 'registration_source' = 'public_educator'
         or coalesce(raw_user_meta_data ->> 'educator_type', '') in ('classroom', 'tutor', 'homeschool', 'family', 'other')
       )
      then 'teacher'
      else 'student'
    end,
    nullif(trim(raw_user_meta_data ->> 'display_name'), '')
  into requested_role, requested_name
  from auth.users where id = auth.uid();

  select role into existing_role from public.profiles where id = auth.uid();
  if existing_role in ('teacher', 'admin') then
    requested_role := existing_role;
  end if;

  update public.profiles
  set role = requested_role, display_name = coalesce(requested_name, display_name), updated_at = now()
  where id = auth.uid();
  return requested_role;
end;
$$;

-- Educators create only groups owned by their authenticated profile. Codes are
-- generated in the database and retried on the existing unique constraint.
create or replace function public.create_learning_group(
  group_name text,
  organization_name text default null,
  learning_year text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_code text;
  attempt_count integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin')) then
    raise exception 'Educator role required';
  end if;
  if char_length(trim(coalesce(group_name, ''))) < 2 then raise exception 'Group name is required'; end if;

  loop
    attempt_count := attempt_count + 1;
    generated_code := upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text), 1, 7));
    begin
      insert into public.classes (class_code, class_name, teacher_id, school_name, school_year, is_active)
      values (generated_code, left(trim(group_name), 80), auth.uid(), nullif(left(trim(organization_name), 100), ''), nullif(left(trim(learning_year), 20), ''), true);
      return generated_code;
    exception when unique_violation then
      if attempt_count >= 5 then raise exception 'Could not generate a unique group code'; end if;
    end;
  end loop;
end;
$$;

-- Reserved for a future educator-controlled provisioning workflow. It is not
-- granted to learners, so learners cannot self-enroll from the public site.
create or replace function public.join_learning_group(requested_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_class uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'student') then
    raise exception 'Learner role required';
  end if;

  select id into target_class
  from public.classes
  where upper(class_code) = upper(trim(requested_code)) and is_active = true
  limit 1;
  if target_class is null then raise exception 'Learning group not found'; end if;

  insert into public.class_members (class_id, student_id)
  values (target_class, auth.uid())
  on conflict (class_id, student_id) do nothing;
  return target_class;
end;
$$;

revoke all on function public.create_learning_group(text, text, text) from public;
revoke all on function public.join_learning_group(text) from public;
revoke all on function public.sync_my_public_profile() from public;
grant execute on function public.create_learning_group(text, text, text) to authenticated;
grant execute on function public.sync_my_public_profile() to authenticated;

commit;
