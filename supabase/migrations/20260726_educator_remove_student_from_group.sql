create or replace function public.educator_remove_student_from_group(
  target_class_id uuid,
  target_student_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  delete from public.class_members as member
  using public.classes as learning_class
  where member.class_id = target_class_id
    and member.student_id = target_student_id
    and learning_class.id = member.class_id
    and learning_class.teacher_id = auth.uid()
    and learning_class.is_active = true;

  if not found then
    raise exception 'Learner was not found in one of your active learning groups';
  end if;
end
$$;

revoke all on function public.educator_remove_student_from_group(uuid, uuid) from public;
grant execute on function public.educator_remove_student_from_group(uuid, uuid) to authenticated;
