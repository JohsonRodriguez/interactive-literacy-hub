create or replace function public.update_learning_group_organization(target_class_id uuid,new_organization_name text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare clean_organization text:=nullif(btrim(new_organization_name),'');
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(coalesce(clean_organization,''))>100 then raise exception 'Organization or setting must contain no more than 100 characters'; end if;
  update public.classes
  set school_name=clean_organization
  where id=target_class_id and teacher_id=auth.uid() and is_active=true;
  if not found then raise exception 'Learning group not found'; end if;
end $$;

revoke all on function public.update_learning_group_organization(uuid,text) from public;
grant execute on function public.update_learning_group_organization(uuid,text) to authenticated;
