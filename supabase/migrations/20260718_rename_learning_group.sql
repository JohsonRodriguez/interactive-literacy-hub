create or replace function public.rename_learning_group(target_class_id uuid,new_group_name text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare clean_name text:=btrim(new_group_name);
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(clean_name)<2 or char_length(clean_name)>80 then raise exception 'Group name must contain 2 to 80 characters'; end if;
  update public.classes
  set class_name=clean_name
  where id=target_class_id and teacher_id=auth.uid() and is_active=true;
  if not found then raise exception 'Learning group not found'; end if;
end $$;

revoke all on function public.rename_learning_group(uuid,text) from public;
grant execute on function public.rename_learning_group(uuid,text) to authenticated;
