create or replace function public.get_reading_stage_content(target_activity_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
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

  select content
  into result
  from public.reading_activity_content
  where activity_id = target_activity_id;

  if result is not null then return result; end if;
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
declare
  keys jsonb;
  activity_kind text;
  question_index integer;
  option_index integer;
  expected integer;
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

  select content.correct_answers, activity.activity_type
  into keys, activity_kind
  from public.reading_activity_content as content
  join public.activities as activity on activity.id = content.activity_id
  where content.activity_id = target_activity_id;

  if keys is null then
    return public.check_reading_answer_without_before_reading(target_activity_id, selected_option);
  end if;

  if activity_kind in ('vocabulary', 'reading_comprehension') then
    question_index := selected_option / 10;
    option_index := selected_option % 10;
  else
    question_index := 0;
    option_index := selected_option;
  end if;

  if question_index < 0 or question_index >= jsonb_array_length(keys) then
    raise exception 'Invalid answer';
  end if;

  expected := (keys->>question_index)::integer;
  return jsonb_build_object(
    'correct', option_index = expected,
    'feedback', case when option_index = expected
      then 'Correct! The reading supports your answer.'
      else 'Not quite. Review the options and try again.'
    end
  );
end
$$;

revoke all on function public.check_reading_answer(text, integer) from public;
grant execute on function public.check_reading_answer(text, integer) to authenticated;
