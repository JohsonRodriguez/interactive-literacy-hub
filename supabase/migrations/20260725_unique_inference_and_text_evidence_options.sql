with unique_content(activity_id, prompt, options, correct_answers) as (
  values
    ('grandmas-kitchen-inference','What can you infer about Elena by the end of the story?','["Elena has learned to value the patience and memories connected to family traditions.","Elena still believes cooking should always be rushed.","Elena feels ashamed because the loaf has an unusual shape."]'::jsonb,'[0]'::jsonb),
    ('grandmas-kitchen-text-evidence','Which detail best shows that Elena wants to preserve her family tradition?','["Elena finds a faded recipe card beside the flour.","Elena copies the recipe neatly onto a new card.","Elena’s father chops herbs for the meal."]'::jsonb,'[1]'::jsonb),

    ('neighborhood-book-drive-inference','What can you infer about Noah and Priya?','["They organize the drive because they hope to earn money.","They care about giving other children better access to books.","They are satisfied when only a few books arrive."]'::jsonb,'[1]'::jsonb),
    ('neighborhood-book-drive-text-evidence','Which detail best shows that the neighborhood supported the project?','["The community center’s shelf was nearly empty.","Noah and Priya made colorful signs.","The collection boxes overflowed, and volunteers sorted every donation."]'::jsonb,'[2]'::jsonb),

    ('mexico-day-of-the-dead-inference','What can you infer about Sofía after listening to the family stories?','["She believes the celebration should be frightening.","She wants her family to stop discussing past generations.","She feels connected even to relatives she never met."]'::jsonb,'[2]'::jsonb),
    ('mexico-day-of-the-dead-text-evidence','Which detail best supports the idea that memories connect generations?','["Every photograph inspired a story that the family shared.","The market displayed orange marigolds and sugar skulls.","Grandma placed water and fruit on the ofrenda."]'::jsonb,'[0]'::jsonb),

    ('peru-inti-raymi-inference','What can you infer about Mateo’s understanding of Inti Raymi?','["He realizes the festival has a deeper purpose than entertainment.","He decides that he must become a performer.","He believes the music is the only important part."]'::jsonb,'[0]'::jsonb),
    ('peru-inti-raymi-text-evidence','Which detail best shows that the festival preserves culture?','["Mateo arrives in Cusco before the celebration.","He understands that it protects history, language, and community memory.","Visitors watch the procession from the plazas."]'::jsonb,'[1]'::jsonb),

    ('ecuador-otavalo-market-inference','What can you infer about Ana’s choice at the market?','["She only wants to find the least expensive product.","She values knowing who made an object and what its design means.","She believes factory-made objects require more skill."]'::jsonb,'[1]'::jsonb),
    ('ecuador-otavalo-market-text-evidence','Which detail best shows that handmade objects carry stories?','["Farmers trade produce while musicians play nearby.","Ana walks to the market with her uncle.","Ana asks who made the woven belt and what its pattern means."]'::jsonb,'[2]'::jsonb),

    ('colombia-barranquilla-carnival-inference','What can you infer about Valeria’s view of Carnival at the end?','["She thinks spectators create all of the celebration’s energy.","She believes dancers can succeed without listening to one another.","She understands that the celebration depends on many people working together."]'::jsonb,'[2]'::jsonb),
    ('colombia-barranquilla-carnival-text-evidence','Which detail best supports the importance of teamwork?','["Valeria thanks the musicians, costume makers, and families after the parade.","Valeria’s group practices for only one morning.","Valeria performs alone while the other dancers watch."]'::jsonb,'[0]'::jsonb),

    ('lantern-in-attic-inference','What can you infer about the mysterious lantern?','["It appears to guide the friends toward a story their family is ready to remember.","It wants Amir and Jo to remain afraid of the attic.","It belongs to the grandmother, who already knows where the letters are hidden."]'::jsonb,'[0]'::jsonb),
    ('lantern-in-attic-text-evidence','Which detail best reveals the importance of the discovered letters?','["The friends first enter the attic to find a board game.","The letters describe neighbors sheltering one another during a terrible flood.","The lantern is made of brass and covered in dust."]'::jsonb,'[1]'::jsonb),

    ('luna-paper-dragon-inference','What can you infer about the dragon’s crooked wing?','["It prevents the dragon from helping anyone.","Its imperfection becomes useful during the rescue.","Luna must replace it with a perfectly folded wing."]'::jsonb,'[1]'::jsonb),
    ('luna-paper-dragon-text-evidence','Which detail best supports the idea that an imperfection can be a strength?','["The dragon flies through the open window at midnight.","Luna follows the dragon into the courtyard.","The bent wing helps the dragon hover steadily in the narrow space."]'::jsonb,'[2]'::jsonb),

    ('clock-lost-hour-inference','What can you infer about Theo from the way he solves the mystery?','["He prefers to rush without examining any clues.","He believes the clockmaker should solve everything alone.","He is observant and notices small details that others may miss."]'::jsonb,'[2]'::jsonb),
    ('clock-lost-hour-text-evidence','Which detail best supports the lesson that careful observation is useful?','["Theo notices a tiny screw, then rings the bell to return the silver hour.","Theo stays home and waits for morning.","Theo breaks another gear while climbing the tower."]'::jsonb,'[0]'::jsonb)
)
update public.reading_activity_content as content
set content = jsonb_set(
      jsonb_set(content.content, '{prompt}', to_jsonb(unique_content.prompt)),
      '{options}',
      unique_content.options
    ),
    correct_answers = unique_content.correct_answers
from unique_content
where content.activity_id = unique_content.activity_id;
