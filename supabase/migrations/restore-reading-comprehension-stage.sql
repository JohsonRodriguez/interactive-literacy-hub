begin;

insert into public.activities
  (id,title,description,category,skill,page_url,activity_order,total_points,is_active,reading_id,activity_type,is_required)
values
  ('community-garden-reading-comprehension','Reading Comprehension','Answer three questions to demonstrate understanding of the complete reading.','reading','comprehension','reading-journey.html?reading=community-garden&stage=reading-comprehension',106,15,true,'community-garden','reading_comprehension',true)
on conflict (id) do update set
  title=excluded.title,
  description=excluded.description,
  page_url=excluded.page_url,
  activity_order=excluded.activity_order,
  total_points=excluded.total_points,
  is_active=true,
  is_required=true;

update public.activities set activity_order=107 where id='community-garden-reflection';

alter function public.get_reading_stage_content(text)
  rename to get_reading_stage_content_without_comprehension;

create function public.get_reading_stage_content(target_activity_id text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_activity_id='community-garden-reading-comprehension' then
    return jsonb_build_object('questions',jsonb_build_array(
      jsonb_build_object(
        'prompt','Why did the neighbors decide to transform the empty lot?',
        'options',jsonb_build_array('They wanted a place to grow food and connect.','They needed somewhere to park cars.','They wanted to build a shopping center.')
      ),
      jsonb_build_object(
        'prompt','What did families contribute to the community meal?',
        'options',jsonb_build_array('Only gardening tools.','Recipes and food connected to their cultures.','Tickets for a neighborhood concert.')
      ),
      jsonb_build_object(
        'prompt','What important change happened because of the garden?',
        'options',jsonb_build_array('Neighbors formed stronger relationships.','Everyone moved away from the neighborhood.','The children stopped helping adults.')
      )
    ));
  end if;
  return public.get_reading_stage_content_without_comprehension(target_activity_id);
end $$;

revoke all on function public.get_reading_stage_content(text) from public;
grant execute on function public.get_reading_stage_content(text) to authenticated;

alter function public.check_reading_answer(text,integer)
  rename to check_reading_answer_without_comprehension;

create function public.check_reading_answer(target_activity_id text, selected_option integer)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare correct_answers integer[] := array[0,1,0];
declare question_index integer;
declare option_index integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_activity_id='community-garden-reading-comprehension' then
    question_index := selected_option / 10;
    option_index := selected_option % 10;
    if question_index < 0 or question_index > 2 or option_index < 0 or option_index > 2 then
      raise exception 'Invalid answer';
    end if;
    return jsonb_build_object(
      'correct',option_index=correct_answers[question_index+1],
      'feedback',case when option_index=correct_answers[question_index+1] then 'Correct!' else 'Not quite.' end
    );
  end if;
  return public.check_reading_answer_without_comprehension(target_activity_id,selected_option);
end $$;

revoke all on function public.check_reading_answer(text,integer) from public;
grant execute on function public.check_reading_answer(text,integer) to authenticated;

commit;
