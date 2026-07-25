create or replace function public.educator_rename_student(
  target_student_id uuid,
  new_student_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := btrim(new_student_name);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if char_length(clean_name) < 2 or char_length(clean_name) > 60 then
    raise exception 'Learner name must contain 2 to 60 characters';
  end if;

  update public.profiles as profile
  set display_name = clean_name,
      updated_at = now()
  where profile.id = target_student_id
    and profile.role = 'student'
    and exists (
      select 1
      from public.class_members as member
      join public.classes as class
        on class.id = member.class_id
      where member.student_id = profile.id
        and class.teacher_id = auth.uid()
        and class.is_active = true
    );

  if not found then
    raise exception 'Learner not found in one of your active learning groups';
  end if;

  return clean_name;
end
$$;

revoke all on function public.educator_rename_student(uuid, text) from public;
grant execute on function public.educator_rename_student(uuid, text) to authenticated;
