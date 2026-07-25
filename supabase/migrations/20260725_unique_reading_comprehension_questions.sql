with comprehension(activity_id, questions, correct_answers) as (
  values
    (
      'grandmas-kitchen-reading-comprehension',
      '[
        {"prompt":"Who originally wrote the faded recipe card?","options":["Elena’s great-grandmother","Elena’s brother","Elena’s father"]},
        {"prompt":"Why did the family accept the uneven loaf?","options":["They planned to throw it away after dinner.","Its shape showed that many family members had helped.","Grandma preferred bread that was not fully baked."]},
        {"prompt":"What does Elena understand after sharing the bread?","options":["Old recipes should be replaced with new ones.","Cooking is only about following exact measurements.","A recipe can carry instructions and family memories across generations."]}
      ]'::jsonb,
      '[0,1,2]'::jsonb
    ),
    (
      'neighborhood-book-drive-reading-comprehension',
      '[
        {"prompt":"Why did Noah and Priya organize the book drive?","options":["They wanted to decorate the local shops.","The community center did not have enough books for the children.","They needed books to sell at a neighborhood market."]},
        {"prompt":"What helped the drive succeed after only a few books arrived?","options":["The friends stopped accepting biographies and comics.","They moved the collection boxes away from the shops.","They kept encouraging neighbors and welcomed many kinds of books."]},
        {"prompt":"What best explains why the shelves were full on opening day?","options":["The whole neighborhood contributed books and time.","Noah bought every book by himself.","The children brought books home from the center."]}
      ]'::jsonb,
      '[1,2,0]'::jsonb
    ),
    (
      'mexico-day-of-the-dead-reading-comprehension',
      '[
        {"prompt":"Which items did Sofía’s family place on the ofrenda?","options":["School supplies and musical instruments","Gardening tools and packets of seeds","Photographs, food, water, and a favorite chocolate"]},
        {"prompt":"Why did Grandma say Day of the Dead was not meant to be frightening?","options":["It is a joyful time to honor loved ones and share memories.","The family planned to remove all the decorations.","Only children were allowed to attend the celebration."]},
        {"prompt":"How did the family stories affect Sofía?","options":["They made her want to leave her grandmother’s town.","They helped her feel connected to relatives she had never met.","They convinced her that photographs were unimportant."]}
      ]'::jsonb,
      '[2,0,1]'::jsonb
    ),
    (
      'peru-inti-raymi-reading-comprehension',
      '[
        {"prompt":"What does Inti Raymi mean?","options":["Festival of the Sun","Parade of the Mountains","Music of the Winter"]},
        {"prompt":"What did Mateo observe during the procession?","options":["Athletes competed while the crowd remained silent.","Performers wore woven clothing, spoke Quechua, and moved to drums.","Artists removed the sun symbols from the streets."]},
        {"prompt":"How did Mateo’s understanding of the festival change?","options":["He decided that it was only a show for visitors.","He concluded that the celebration had no connection to the past.","He realized that it helps protect history, language, and community memory."]}
      ]'::jsonb,
      '[0,1,2]'::jsonb
    ),
    (
      'ecuador-otavalo-market-reading-comprehension',
      '[
        {"prompt":"What did Lucía explain about making a patterned scarf?","options":["The scarf could be completed quickly without planning.","It required careful planning and many hours at the loom.","Every scarf was produced by a machine outside the market."]},
        {"prompt":"Why did Ana ask who made the woven belt and what its pattern meant?","options":["She wanted to copy the pattern and sell it elsewhere.","She was trying to find the cheapest object in the market.","She wanted to understand the skill and story carried by the object."]},
        {"prompt":"What role does the Otavalo market play in the community?","options":["It is both a place for business and a gathering place for culture.","It is used only by tourists buying fruit.","It keeps farmers, musicians, and weavers separated."]}
      ]'::jsonb,
      '[1,2,0]'::jsonb
    ),
    (
      'colombia-barranquilla-carnival-reading-comprehension',
      '[
        {"prompt":"Why did Valeria feel nervous on parade morning?","options":["She had forgotten every cumbia step.","Her costume was not finished.","She saw the large number of spectators watching."]},
        {"prompt":"What helped Valeria regain confidence and stay in formation?","options":["She listened to the drumbeat and moved with her group.","She left the parade and practiced alone.","She asked the spectators to stop making noise."]},
        {"prompt":"What did Valeria learn about Carnival’s energy?","options":["It comes only from the dancers at the front.","It grows from cooperation and traditions shared by many people.","It depends on wearing the most expensive costume."]}
      ]'::jsonb,
      '[2,0,1]'::jsonb
    ),
    (
      'lantern-in-attic-reading-comprehension',
      '[
        {"prompt":"How did the lantern lead Amir and Jo to the map?","options":["Its beam pointed toward a loose floorboard hiding a notebook.","It projected the map directly onto the attic wall.","It opened the garden shed before the friends left the house."]},
        {"prompt":"What important event did the hidden letters describe?","options":["Jo’s great-grandfather building the clock tower","Neighbors sheltering one another during a terrible flood","Amir’s family moving into the house"]},
        {"prompt":"Why did the lantern’s glow fade after Grandma read the letters?","options":["The thunderstorm had ended outside.","The friends placed a candle inside it.","It had completed its purpose of returning a forgotten family story."]}
      ]'::jsonb,
      '[0,1,2]'::jsonb
    ),
    (
      'luna-paper-dragon-reading-comprehension',
      '[
        {"prompt":"Why did Luna follow the paper dragon into the courtyard?","options":["She wanted to enter it in a second art fair.","It came alive and flew through her open window.","She needed it to help fold another paper animal."]},
        {"prompt":"How did Luna and the dragon work together to rescue the kitten?","options":["Luna climbed the gutter while the dragon held the basket.","They waited until the kitten jumped down alone.","Luna held a basket while the dragon used its spark and bent wing to guide the kitten."]},
        {"prompt":"What lesson does Luna learn from the dragon’s crooked wing?","options":["Something imperfect can have an unexpected strength.","Every artwork must be corrected before it is useful.","A mistake should always be hidden from others."]}
      ]'::jsonb,
      '[1,2,0]'::jsonb
    ),
    (
      'clock-lost-hour-reading-comprehension',
      '[
        {"prompt":"What first showed Theo that an hour was missing?","options":["The sun rose one hour too early.","The clockmaker sent him a message.","The town clock struck eleven times, and the clocks jumped forward."]},
        {"prompt":"What small detail helped the clockmaker repair the jammed gear?","options":["A tiny screw beneath the pendulum","A silver ribbon tied around the bell","A new clock hidden beside the window"]},
        {"prompt":"What action finally returned the silver hour to the clock?","options":["The clockmaker replaced every gear in the tower.","Theo opened the window and rang the bell once.","Theo carried the silver ribbon home until dawn."]}
      ]'::jsonb,
      '[2,0,1]'::jsonb
    )
)
update public.reading_activity_content as content
set content = jsonb_set(content.content, '{questions}', comprehension.questions),
    correct_answers = comprehension.correct_answers
from comprehension
where content.activity_id = comprehension.activity_id;
