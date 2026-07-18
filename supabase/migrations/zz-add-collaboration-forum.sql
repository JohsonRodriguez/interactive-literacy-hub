begin;

create table if not exists public.collaboration_posts (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  reading_id text not null references public.readings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  idea_text text not null check (char_length(idea_text) between 10 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id,reading_id,student_id)
);

create table if not exists public.collaboration_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.collaboration_posts(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  reply_text text not null check (char_length(reply_text) between 10 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id,student_id)
);

alter table public.collaboration_posts enable row level security;
alter table public.collaboration_replies enable row level security;
revoke all on public.collaboration_posts from anon,authenticated;
revoke all on public.collaboration_replies from anon,authenticated;

insert into public.activities
  (id,title,description,category,skill,page_url,activity_order,total_points,is_active,reading_id,activity_type,is_required)
values
  ('community-garden-collaboration-forum','Collaboration Forum','Share an idea and respond respectfully to a classmate in the same learning group.','collaboration','perspective sharing','reading-journey.html?reading=community-garden&stage=collaboration-forum',108,15,true,'community-garden','collaboration_forum',true)
on conflict (id) do update set
  title=excluded.title,
  description=excluded.description,
  page_url=excluded.page_url,
  activity_order=excluded.activity_order,
  total_points=excluded.total_points,
  is_active=true,
  is_required=true;

create or replace function public.get_collaboration_forum(target_reading_id text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  target_class_id uuid;
  target_class_name text;
  own_post jsonb;
  visible_posts jsonb;
  has_replied boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select cm.class_id,c.class_name
  into target_class_id,target_class_name
  from public.class_members cm
  join public.classes c on c.id=cm.class_id
  where cm.student_id=auth.uid() and c.is_active=true
  limit 1;

  if target_class_id is null then raise exception 'A learning group is required'; end if;

  select jsonb_build_object('id',cp.id,'idea',cp.idea_text,'createdAt',cp.created_at)
  into own_post
  from public.collaboration_posts cp
  where cp.class_id=target_class_id and cp.reading_id=target_reading_id and cp.student_id=auth.uid();

  select exists(
    select 1
    from public.collaboration_replies cr
    join public.collaboration_posts cp on cp.id=cr.post_id
    where cr.student_id=auth.uid()
      and cp.class_id=target_class_id
      and cp.reading_id=target_reading_id
      and cp.student_id<>auth.uid()
  ) into has_replied;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',item.id,
    'displayName',item.display_name,
    'idea',item.idea_text,
    'createdAt',item.created_at,
    'replyCount',item.reply_count,
    'repliedByMe',item.replied_by_me,
    'replies',item.replies
  ) order by item.created_at desc),'[]'::jsonb)
  into visible_posts
  from (
    select cp.id,cp.idea_text,cp.created_at,
      coalesce(nullif(trim(p.display_name),''),'Classmate') as display_name,
      (select count(*) from public.collaboration_replies cr where cr.post_id=cp.id) as reply_count,
      exists(select 1 from public.collaboration_replies cr where cr.post_id=cp.id and cr.student_id=auth.uid()) as replied_by_me,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'displayName',coalesce(nullif(trim(rp.display_name),''),'Classmate'),
          'reply',cr.reply_text,
          'createdAt',cr.created_at
        ) order by cr.created_at)
        from public.collaboration_replies cr
        join public.profiles rp on rp.id=cr.student_id
        where cr.post_id=cp.id
      ),'[]'::jsonb) as replies
    from public.collaboration_posts cp
    join public.profiles p on p.id=cp.student_id
    where cp.class_id=target_class_id
      and cp.reading_id=target_reading_id
      and cp.student_id<>auth.uid()
  ) item;

  return jsonb_build_object(
    'className',target_class_name,
    'ownPost',own_post,
    'posts',visible_posts,
    'hasOwnPost',own_post is not null,
    'hasReplied',has_replied,
    'requirementsMet',own_post is not null and has_replied
  );
end $$;

create or replace function public.publish_collaboration_idea(target_reading_id text,idea_text text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare target_class_id uuid; clean_idea text; saved_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  clean_idea:=trim(idea_text);
  if char_length(clean_idea)<10 or char_length(clean_idea)>500 then raise exception 'Write between 10 and 500 characters'; end if;
  if clean_idea ~* '(https?://|www\.)' then raise exception 'Links are not allowed'; end if;
  select cm.class_id into target_class_id
  from public.class_members cm join public.classes c on c.id=cm.class_id
  where cm.student_id=auth.uid() and c.is_active=true limit 1;
  if target_class_id is null then raise exception 'A learning group is required'; end if;
  insert into public.collaboration_posts(class_id,reading_id,student_id,idea_text)
  values(target_class_id,target_reading_id,auth.uid(),clean_idea)
  on conflict(class_id,reading_id,student_id) do update
    set idea_text=excluded.idea_text,updated_at=now()
  returning id into saved_id;
  return jsonb_build_object('ok',true,'postId',saved_id);
end $$;

create or replace function public.reply_to_collaboration_idea(target_post_id uuid,reply_text text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare target_post public.collaboration_posts%rowtype; clean_reply text; saved_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  clean_reply:=trim(reply_text);
  if char_length(clean_reply)<10 or char_length(clean_reply)>500 then raise exception 'Write between 10 and 500 characters'; end if;
  if clean_reply ~* '(https?://|www\.)' then raise exception 'Links are not allowed'; end if;
  select * into target_post from public.collaboration_posts where id=target_post_id;
  if target_post.id is null then raise exception 'Idea not found'; end if;
  if target_post.student_id=auth.uid() then raise exception 'You cannot reply to your own idea'; end if;
  if not exists(select 1 from public.class_members cm where cm.class_id=target_post.class_id and cm.student_id=auth.uid()) then
    raise exception 'This idea is not in your learning group';
  end if;
  insert into public.collaboration_replies(post_id,student_id,reply_text)
  values(target_post_id,auth.uid(),clean_reply)
  on conflict(post_id,student_id) do update
    set reply_text=excluded.reply_text,updated_at=now()
  returning id into saved_id;
  return jsonb_build_object('ok',true,'replyId',saved_id);
end $$;

revoke all on function public.get_collaboration_forum(text) from public;
revoke all on function public.publish_collaboration_idea(text,text) from public;
revoke all on function public.reply_to_collaboration_idea(uuid,text) from public;
grant execute on function public.get_collaboration_forum(text) to authenticated;
grant execute on function public.publish_collaboration_idea(text,text) to authenticated;
grant execute on function public.reply_to_collaboration_idea(uuid,text) to authenticated;

commit;
