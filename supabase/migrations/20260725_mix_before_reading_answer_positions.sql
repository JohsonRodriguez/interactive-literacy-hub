-- Rotate the correct Before Reading answer through positions 2, 3, and 1.
with targets as (
  select
    rac.activity_id,
    rac.content,
    (rac.correct_answers->>0)::integer as old_answer_index,
    mod(r.reading_order, 3) as new_answer_index
  from public.reading_activity_content as rac
  join public.activities as activity on activity.id = rac.activity_id
  join public.readings as r on r.id = activity.reading_id
  where activity.activity_type = 'before_reading'
), mixed as (
  select
    activity_id,
    new_answer_index,
    content->'options'->old_answer_index as correct_option,
    (
      select jsonb_agg(option_value order by option_position)
      from jsonb_array_elements(content->'options') with ordinality as option(option_value, option_position)
      where option_position - 1 <> old_answer_index
    ) as distractors
  from targets
)
update public.reading_activity_content as rac
set content = jsonb_set(
      rac.content,
      '{options}',
      case mixed.new_answer_index
        when 1 then jsonb_build_array(mixed.distractors->0, mixed.correct_option, mixed.distractors->1)
        when 2 then jsonb_build_array(mixed.distractors->0, mixed.distractors->1, mixed.correct_option)
        else jsonb_build_array(mixed.correct_option, mixed.distractors->0, mixed.distractors->1)
      end
    ),
    correct_answers = jsonb_build_array(mixed.new_answer_index)
from mixed
where rac.activity_id = mixed.activity_id;

-- The first journey predates the shared content table and uses wrapper RPCs.
create or replace function public.get_reading_stage_content(target_activity_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_activity_id = 'community-garden-before-reading' then
    return jsonb_build_object(
      'prompt', 'What do you think the children are doing together?',
      'options', jsonb_build_array(
        'Waiting alone for a bus.',
        'Working together on a community project.',
        'Shopping inside a grocery store.'
      )
    );
  end if;
  return public.get_reading_stage_content_without_before_reading(target_activity_id);
end
$$;

revoke all on function public.get_reading_stage_content(text) from public;
grant execute on function public.get_reading_stage_content(text) to authenticated;

create or replace function public.check_reading_answer(target_activity_id text, selected_option integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_activity_id = 'community-garden-before-reading' then
    return jsonb_build_object(
      'correct', selected_option = 1,
      'feedback', case when selected_option = 1
        then 'Great prediction! The image shows children working together.'
        else 'Look at the people and what they are doing together, then try again.'
      end
    );
  end if;
  return public.check_reading_answer_without_before_reading(target_activity_id, selected_option);
end
$$;

revoke all on function public.check_reading_answer(text, integer) from public;
grant execute on function public.check_reading_answer(text, integer) to authenticated;
