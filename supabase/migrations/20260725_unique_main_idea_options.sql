with unique_main_ideas(activity_id, options, correct_answers) as (
  values
    (
      'grandmas-kitchen-main-idea',
      '["Elena wants to open a restaurant by herself.","An uneven loaf ruins the family gathering.","Cooking a family recipe helps Elena understand how food carries memories across generations."]'::jsonb,
      '[2]'::jsonb
    ),
    (
      'neighborhood-book-drive-main-idea',
      '["Neighbors working together can make books and opportunities available to everyone.","Noah organizes the drive because he wants to sell the donated books.","The community center decides to replace books with games."]'::jsonb,
      '[0]'::jsonb
    ),
    (
      'mexico-day-of-the-dead-main-idea',
      '["The decorations at the market make Sofía afraid of the celebration.","Day of the Dead traditions help Sofía honor relatives and feel connected to her family history.","Sofía’s family decides to stop sharing stories about past generations."]'::jsonb,
      '[1]'::jsonb
    ),
    (
      'peru-inti-raymi-main-idea',
      '["Mateo attends Inti Raymi because he wants to become a performer.","Inti Raymi is only a colorful attraction created for visitors.","Inti Raymi brings people together while preserving history, language, and community memory."]'::jsonb,
      '[2]'::jsonb
    ),
    (
      'ecuador-otavalo-market-main-idea',
      '["The Otavalo market is a place where handmade objects carry community skills, traditions, and stories.","Ana visits the market because she plans to open a large clothing factory.","The market is mainly important because every product has a low price."]'::jsonb,
      '[0]'::jsonb
    ),
    (
      'colombia-barranquilla-carnival-main-idea',
      '["Valeria succeeds because she performs without help from anyone else.","Carnival gains its energy from teamwork and traditions shared throughout the community.","The spectators are responsible for making every costume during the parade."]'::jsonb,
      '[1]'::jsonb
    ),
    (
      'lantern-in-attic-main-idea',
      '["Amir and Jo use the lantern to search for hidden treasure.","The lantern needs to be repaired before the friends can leave the attic.","A mysterious lantern guides two friends to recover an important story of family and community courage."]'::jsonb,
      '[2]'::jsonb
    ),
    (
      'luna-paper-dragon-main-idea',
      '["Luna discovers that an imperfection can become a strength when she and the paper dragon help a kitten.","Luna must create a perfectly shaped dragon before it can fly.","The school cancels its art fair after Luna leaves the courtyard."]'::jsonb,
      '[0]'::jsonb
    ),
    (
      'clock-lost-hour-main-idea',
      '["Theo solves the mystery by rushing through the town without stopping.","Careful observation helps Theo and the clockmaker return the missing hour.","The town decides that clocks are no longer useful after midnight."]'::jsonb,
      '[1]'::jsonb
    )
)
update public.reading_activity_content as content
set content = jsonb_set(content.content, '{options}', unique_main_ideas.options),
    correct_answers = unique_main_ideas.correct_answers
from unique_main_ideas
where content.activity_id = unique_main_ideas.activity_id;
