create or replace function public.choose_my_avatar(avatar_file text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare allowed text[]:=array['avatar1.png','avatar2.png','avatar3.png','avatar4.png','avatar5.png','avatar6.png'];
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not (avatar_file=any(allowed)) then raise exception 'Invalid avatar'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and role='student') then raise exception 'Learner account required'; end if;
  update public.profiles set avatar=avatar_file,updated_at=now() where id=auth.uid();
  return jsonb_build_object('ok',true,'avatar',avatar_file);
end $$;

revoke all on function public.choose_my_avatar(text) from public;
grant execute on function public.choose_my_avatar(text) to authenticated;
