begin;

insert into public.activities
  (id,title,description,category,skill,page_url,activity_order,total_points,is_active,reading_id,activity_type,is_required)
values
  ('community-garden-before-reading','Before Reading','Observe an image and make a prediction before reading.','reading','prediction','reading-journey.html?reading=community-garden&stage=before-reading',100,5,true,'community-garden','before_reading',true)
on conflict (id) do update set
  title=excluded.title,
  description=excluded.description,
  page_url=excluded.page_url,
  activity_order=excluded.activity_order,
  total_points=excluded.total_points,
  is_active=true,
  is_required=true;

alter function public.get_reading_stage_content(text)
  rename to get_reading_stage_content_without_before_reading;

create function public.get_reading_stage_content(target_activity_id text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_activity_id='community-garden-before-reading' then
    return jsonb_build_object(
      'prompt','What do you think the children are doing together?',
      'options',jsonb_build_array(
        'Working together on a community project.',
        'Waiting alone for a bus.',
        'Shopping inside a grocery store.'
      )
    );
  end if;
  return public.get_reading_stage_content_without_before_reading(target_activity_id);
end $$;

revoke all on function public.get_reading_stage_content(text) from public;
grant execute on function public.get_reading_stage_content(text) to authenticated;

alter function public.check_reading_answer(text,integer)
  rename to check_reading_answer_without_before_reading;

create function public.check_reading_answer(target_activity_id text, selected_option integer)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_activity_id='community-garden-before-reading' then
    return jsonb_build_object(
      'correct',selected_option=0,
      'feedback',case when selected_option=0
        then 'Great prediction! The image shows children working together.'
        else 'Look at the people and what they are doing together, then try again.'
      end
    );
  end if;
  return public.check_reading_answer_without_before_reading(target_activity_id,selected_option);
end $$;

revoke all on function public.check_reading_answer(text,integer) from public;
grant execute on function public.check_reading_answer(text,integer) to authenticated;

commit;
