begin;
create or replace function public.get_reading_stage_content(target_activity_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare story text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if target_activity_id='community-garden-read-text' then select reading_text into story from readings where id='community-garden'; return jsonb_build_object('text',story); end if;
 return case target_activity_id
  when 'community-garden-before-reading' then jsonb_build_object('prompt','What do you think the children are doing together?','options',jsonb_build_array('Working together on a community project.','Waiting alone for a bus.','Shopping inside a grocery store.'))
  when 'community-garden-vocabulary' then jsonb_build_object(
    'prompt','Match each word from the reading with its meaning.',
    'words',jsonb_build_array('harvest','inferred','contributed','traditions','herbs','soil','curious','protected','hurried','carefully'),
    'definitions',jsonb_build_array(
      'kept something safe from harm',
      'plants used to add flavor or help people',
      'in a way that shows attention and care',
      'figured something out using clues',
      'wanting to know or learn more',
      'customs and beliefs shared over time',
      'moved quickly because there was little time',
      'food gathered from plants when it is ready',
      'the ground where plants grow',
      'gave or added something to help a group'
    ))
  when 'community-garden-main-idea' then jsonb_build_object('prompt','What is the main idea of the story?','options',jsonb_build_array('Neighbors build a garden and a stronger community.','Maya prefers watering plants alone.','Vegetables only grow in apartment buildings.'))
  when 'community-garden-inference' then jsonb_build_object('prompt','Why does Maya smile at the end?','options',jsonb_build_array('She is proud that small acts of care brought people together.','She wants everyone to leave the garden.','She found a new watering can.'))
  when 'community-garden-text-evidence' then jsonb_build_object('prompt','Which detail best shows that the garden connected neighbors?','options',jsonb_build_array('People who had never spoken began to laugh and tell stories together.','Weeds covered the empty lot.','Maya carried two watering cans.'))
  else jsonb_build_object() end;
end $$;
revoke all on function public.get_reading_stage_content(text) from public;
grant execute on function public.get_reading_stage_content(text) to authenticated;

create or replace function public.check_reading_answer(target_activity_id text, selected_option integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare correct_option integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if target_activity_id='community-garden-vocabulary' then
  return jsonb_build_object(
   'correct', selected_option in (7,13,29,35,41,58,64,70,86,92),
   'feedback', case when selected_option in (7,13,29,35,41,58,64,70,86,92)
    then 'Correct match!'
    else 'Not quite. Try a different meaning for that word.' end
  );
 end if;
 correct_option := case target_activity_id
  when 'community-garden-before-reading' then 0
  when 'community-garden-main-idea' then 0
  when 'community-garden-inference' then 0
  when 'community-garden-text-evidence' then 0
  else null end;
 if correct_option is null then raise exception 'Activity cannot be checked'; end if;
 return jsonb_build_object(
  'correct', selected_option=correct_option,
  'feedback', case when selected_option=correct_option
    then 'Correct! The text supports your answer.'
    else 'Not quite. Review the text clue and compare the choices.' end
 );
end $$;
revoke all on function public.check_reading_answer(text,integer) from public;
grant execute on function public.check_reading_answer(text,integer) to authenticated;

create or replace function public.complete_reading_journey(target_reading_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare required_count int; completed_count int;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select count(*) into required_count from activities where reading_id=target_reading_id and is_required=true and is_active=true;
 select count(*) into completed_count from student_progress sp join activities a on a.id=sp.activity_id where sp.student_id=auth.uid() and a.reading_id=target_reading_id and a.is_required=true and a.is_active=true and sp.status='completed';
 if required_count=0 or completed_count<required_count then return jsonb_build_object('completed',false,'completedActivities',completed_count,'requiredActivities',required_count); end if;
 update student_readings set status='completed',completed_at=coalesce(completed_at,now()),updated_at=now() where student_id=auth.uid() and reading_id=target_reading_id;
 return jsonb_build_object('completed',true);
end $$;
revoke all on function public.complete_reading_journey(text) from public;
grant execute on function public.complete_reading_journey(text) to authenticated;
commit;
