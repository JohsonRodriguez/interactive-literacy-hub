begin;

-- Store the prototype's single-question stages in the shared content table so
-- their option order and answer keys follow the same secure validation path.
insert into public.reading_activity_content(activity_id,content,correct_answers) values
('community-garden-main-idea',jsonb_build_object(
  'prompt','What is the main idea of the story?',
  'options',jsonb_build_array('Maya prefers watering plants alone.','Neighbors build a garden and a stronger community.','Vegetables only grow in apartment buildings.')
),'[1]'::jsonb),
('community-garden-inference',jsonb_build_object(
  'prompt','Why does Maya smile at the end?',
  'options',jsonb_build_array('She found a new watering can.','She wants everyone to leave the garden.','She is proud that small acts of care brought people together.')
),'[2]'::jsonb),
('community-garden-text-evidence',jsonb_build_object(
  'prompt','Which detail best shows that the garden connected neighbors?',
  'options',jsonb_build_array('Weeds covered the empty lot.','People who had never spoken began to laugh and tell stories together.','Maya carried two watering cans.')
),'[1]'::jsonb)
on conflict(activity_id) do update
set content=excluded.content,correct_answers=excluded.correct_answers;

-- Rotate the correct position for every newer single-question activity.
with targets as (
  select rac.activity_id,rac.content,
    mod(r.reading_order + case a.activity_type
      when 'main_idea' then 0
      when 'inference' then 1
      else 2 end,3) as answer_index
  from public.reading_activity_content rac
  join public.activities a on a.id=rac.activity_id
  join public.readings r on r.id=a.reading_id
  where r.reading_order between 2 and 10
    and a.activity_type in ('main_idea','inference','text_evidence')
), mixed as (
  select activity_id,answer_index,
    case answer_index
      when 1 then jsonb_build_array(content->'options'->1,content->'options'->0,content->'options'->2)
      when 2 then jsonb_build_array(content->'options'->1,content->'options'->2,content->'options'->0)
      else content->'options'
    end as options
  from targets
)
update public.reading_activity_content rac
set content=jsonb_set(rac.content,'{options}',mixed.options),
    correct_answers=jsonb_build_array(mixed.answer_index)
from mixed
where rac.activity_id=mixed.activity_id;

-- Every comprehension exercise now uses three different answer positions:
-- second option, third option, then first option.
update public.reading_activity_content
set content=jsonb_set(content,'{questions}',jsonb_build_array(
      jsonb_set(content->'questions'->0,'{options}',jsonb_build_array(
        content->'questions'->0->'options'->1,
        content->'questions'->0->'options'->0,
        content->'questions'->0->'options'->2
      )),
      jsonb_set(content->'questions'->1,'{options}',jsonb_build_array(
        content->'questions'->1->'options'->1,
        content->'questions'->1->'options'->2,
        content->'questions'->1->'options'->0
      )),
      content->'questions'->2
    )),
    correct_answers='[1,2,0]'::jsonb
where activity_id in (
  select a.id from public.activities a
  join public.readings r on r.id=a.reading_id
  where r.reading_order between 1 and 10
    and a.activity_type='reading_comprehension'
);

commit;
