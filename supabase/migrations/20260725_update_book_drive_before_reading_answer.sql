update public.reading_activity_content
set content = jsonb_set(
  content,
  '{options,0}',
  to_jsonb('Even small efforts can become something truly important'::text)
)
where activity_id = 'neighborhood-book-drive-before-reading';
