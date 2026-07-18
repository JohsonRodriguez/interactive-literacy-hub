begin;

-- Shuffle the nine newer vocabulary lists and preserve each word's answer key.
update public.reading_activity_content
set content=jsonb_set(
      content,
      '{definitions}',
      jsonb_build_array(
        content->'definitions'->3,
        content->'definitions'->7,
        content->'definitions'->1,
        content->'definitions'->9,
        content->'definitions'->5,
        content->'definitions'->0,
        content->'definitions'->8,
        content->'definitions'->4,
        content->'definitions'->2,
        content->'definitions'->6
      )
    ),
    correct_answers='[5,2,8,0,7,4,9,1,6,3]'::jsonb
where activity_id in (
  'grandmas-kitchen-vocabulary',
  'neighborhood-book-drive-vocabulary',
  'mexico-day-of-the-dead-vocabulary',
  'peru-inti-raymi-vocabulary',
  'ecuador-otavalo-market-vocabulary',
  'colombia-barranquilla-carnival-vocabulary',
  'lantern-in-attic-vocabulary',
  'luna-paper-dragon-vocabulary',
  'clock-lost-hour-vocabulary'
);

commit;
