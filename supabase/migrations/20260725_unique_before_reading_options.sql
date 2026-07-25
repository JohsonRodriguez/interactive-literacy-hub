with unique_options(activity_id, options, correct_answers) as (
  values
    (
      'grandmas-kitchen-before-reading',
      '["A chef is opening a busy restaurant alone.","A family is repairing broken kitchen appliances.","A family is cooking together and sharing meaningful memories."]'::jsonb,
      '[2]'::jsonb
    ),
    (
      'neighborhood-book-drive-before-reading',
      '["Even small efforts can become something truly important","Neighbors are training together for a sporting event.","A library is closing because nobody wants books."]'::jsonb,
      '[0]'::jsonb
    ),
    (
      'mexico-day-of-the-dead-before-reading',
      '["A frightening creature is chasing a family.","A family is honoring loved ones through a meaningful celebration.","Children are planting vegetables in a community garden."]'::jsonb,
      '[1]'::jsonb
    ),
    (
      'peru-inti-raymi-before-reading',
      '["Astronauts are preparing to travel toward the sun.","Students are taking a science test about the weather.","A community celebration connects people with history and tradition."]'::jsonb,
      '[2]'::jsonb
    ),
    (
      'ecuador-otavalo-market-before-reading',
      '["A busy market shares the skills, traditions, and stories of a community.","An empty shopping center is waiting for new stores.","Robots are producing identical clothing inside a factory."]'::jsonb,
      '[0]'::jsonb
    ),
    (
      'colombia-barranquilla-carnival-before-reading',
      '["Visitors are quietly studying paintings inside a museum.","A colorful celebration depends on music, tradition, and teamwork.","One performer is practicing the piano without an audience."]'::jsonb,
      '[1]'::jsonb
    ),
    (
      'lantern-in-attic-before-reading',
      '["Friends are reading instructions for a camping trip.","Students are testing how electric lights work.","A mysterious object may guide friends toward a forgotten family story."]'::jsonb,
      '[2]'::jsonb
    ),
    (
      'luna-paper-dragon-before-reading',
      '["A paper creation may come alive and lead to an unexpected adventure.","A student is following a recipe for a dragon-shaped cake.","A weather report is warning everyone about strong winds."]'::jsonb,
      '[0]'::jsonb
    ),
    (
      'clock-lost-hour-before-reading',
      '["A conductor is checking the schedule for a morning train.","A curious child may solve a mystery involving time.","A museum guide is explaining the history of clocks."]'::jsonb,
      '[1]'::jsonb
    )
)
update public.reading_activity_content as content
set content = jsonb_set(content.content, '{options}', unique_options.options),
    correct_answers = unique_options.correct_answers
from unique_options
where content.activity_id = unique_options.activity_id;
