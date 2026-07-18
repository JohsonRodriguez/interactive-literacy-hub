create or replace function public.educator_get_collaboration_forum(target_student_id uuid,target_reading_id text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare target_class_id uuid; target_class_name text; visible_posts jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select c.id,c.class_name into target_class_id,target_class_name
  from public.classes c
  join public.class_members cm on cm.class_id=c.id
  where c.teacher_id=auth.uid() and cm.student_id=target_student_id and c.is_active=true
  limit 1;
  if target_class_id is null then raise exception 'You cannot view this learning group'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',item.id,'studentId',item.student_id,'displayName',item.display_name,
    'idea',item.idea_text,'createdAt',item.created_at,'replyCount',item.reply_count,'replies',item.replies
  ) order by item.created_at desc),'[]'::jsonb) into visible_posts
  from (
    select cp.id,cp.student_id,cp.idea_text,cp.created_at,
      coalesce(nullif(trim(p.display_name),''),'Learner') display_name,
      (select count(*) from public.collaboration_replies cr where cr.post_id=cp.id) reply_count,
      coalesce((select jsonb_agg(jsonb_build_object(
        'displayName',coalesce(nullif(trim(rp.display_name),''),'Learner'),
        'reply',cr.reply_text,'createdAt',cr.created_at
      ) order by cr.created_at)
      from public.collaboration_replies cr join public.profiles rp on rp.id=cr.student_id
      where cr.post_id=cp.id),'[]'::jsonb) replies
    from public.collaboration_posts cp
    join public.profiles p on p.id=cp.student_id
    where cp.class_id=target_class_id and cp.reading_id=target_reading_id
  ) item;
  return jsonb_build_object('classId',target_class_id,'className',target_class_name,'posts',visible_posts);
end $$;

revoke all on function public.educator_get_collaboration_forum(uuid,text) from public;
grant execute on function public.educator_get_collaboration_forum(uuid,text) to authenticated;
notify pgrst,'reload schema';
