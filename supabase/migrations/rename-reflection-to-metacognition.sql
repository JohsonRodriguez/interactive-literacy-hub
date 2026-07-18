update public.activities
set title='Metacognition',
    description='Think about learning strategies and confidence.'
where id='community-garden-reflection'
   or (reading_id='community-garden' and activity_type='reflection');
