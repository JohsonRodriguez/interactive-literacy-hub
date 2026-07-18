begin;

-- Complete, editable seed content for the nine journeys that followed the prototype.
-- Cover and activity images intentionally reuse reference artwork so they can be replaced later.
create table if not exists public.reading_activity_content (
  activity_id text primary key references public.activities(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  correct_answers jsonb not null default '[]'::jsonb
);
alter table public.reading_activity_content enable row level security;
revoke all on public.reading_activity_content from anon,authenticated;

with source(id,title,description,theme,image_path,minutes,reading_order,story,vocabulary,definitions) as (values
('grandmas-kitchen','Saturday at Grandma''s Kitchen','A family cooks together and discovers how recipes carry memories.','Family and Community','assets/images/covers/cover2.png',24,2,
$s$Every Saturday, Elena visited Grandma Rosa's warm kitchen. One morning, a faded recipe card waited beside a bowl of flour. Grandma explained that Elena's great-grandmother had written it many years ago.

They measured flour, yeast, and warm water for family bread. Elena wanted to hurry, but Grandma showed her how to knead the dough patiently. While it rested, Grandma told stories about baking the same bread after moving to a new country.

Elena's father chopped herbs, her brother set the table, and Elena shaped the dough. When one loaf came out uneven, nobody complained. Grandma said its unusual shape proved that many hands had helped.

At dinner, the family shared the bread and remembered relatives who lived far away. Elena copied the recipe neatly onto a new card. She understood that a recipe could carry both instructions and memories from one generation to the next.$s$,
'["faded","recipe","measured","knead","patiently","generation","uneven","relatives","instructions","memories"]'::jsonb,
'["having lost color with age","directions for preparing food","found the amount of something","press and fold dough","in a calm way without rushing","people born around the same period in a family","not level or equal","people in the same family","steps explaining what to do","things remembered from the past"]'::jsonb),
('neighborhood-book-drive','The Neighborhood Book Drive','Young neighbors organize a project that makes books available to everyone.','Family and Community','assets/images/covers/cover3.png',23,3,
$s$Noah noticed that the small shelf at the community center was nearly empty. Children often visited it after school, but there were not enough books for everyone.

Noah and Priya planned a neighborhood book drive. They made colorful signs, placed collection boxes in local shops, and asked neighbors for gently used books. At first, only a few books arrived.

The friends did not give up. They explained that mysteries, comics, biographies, and books in different languages were all welcome. Soon, the boxes overflowed. Volunteers sorted every donation by topic and reading level.

On opening day, younger children eagerly explored the full shelves. Noah realized that sharing one book could open a new world for another reader. The project succeeded because the whole neighborhood contributed.$s$,
'["noticed","nearly","drive","collection","gently","biographies","volunteers","donation","eagerly","contributed"]'::jsonb,
'["became aware of","almost but not completely","an organized effort for a purpose","a group of gathered things","with care and little force","true stories of people''s lives","people who help without pay","something given to help","with excitement and interest","gave something to a shared effort"]'::jsonb),
('mexico-day-of-the-dead','Marigolds and Memories in Mexico','A family prepares an altar and learns how memories connect generations.','Culture','assets/images/covers/cover4.png',25,4,
$s$In late October, Sofía traveled to her grandmother's town in Mexico. The market glowed with orange marigolds, paper decorations, candles, and sugar skulls.

At home, the family built an ofrenda for Day of the Dead. They placed photographs of relatives on its shelves. Grandma added water, bread, fruit, and Grandpa Luis's favorite chocolate.

Sofía carefully made a path of marigold petals. Grandma explained that the celebration was not meant to be frightening. It was a joyful time to honor people who had died and to share loving memories of them.

That evening, every photograph inspired a story. Sofía listened, laughed, and asked questions. Although she had never met some of the relatives, their stories made her feel connected to them.$s$,
'["glowed","marigolds","ofrenda","relatives","petals","celebration","honor","frightening","inspired","connected"]'::jsonb,
'["shone with light","bright orange or yellow flowers","an altar holding offerings and memories","people in the same family","colored parts of a flower","a joyful special event","show respect for","causing fear","caused an idea or feeling","joined by a shared bond"]'::jsonb),
('peru-inti-raymi','The Festival of the Sun in Peru','A learner visits Cusco and discovers how history and celebration unite a community.','Culture','assets/images/covers/cover5.png',25,5,
$s$Mateo arrived in Cusco, Peru, just before Inti Raymi. Golden sun symbols decorated streets surrounded by mountains, and musicians practiced in the plazas.

His cousin explained that Inti Raymi means Festival of the Sun. The modern celebration remembers an important Inca ceremony and the winter solstice in the Southern Hemisphere.

During the procession, performers wore bright woven clothing and spoke words in Quechua. Drums echoed between the stone buildings. Mateo noticed that families, visitors, artists, and historians all watched respectfully.

Mateo first thought the festival was only a colorful show. By the end, he understood that it also protected history, language, and community memory. The past felt present in every song and step.$s$,
'["arrived","symbols","plazas","ceremony","solstice","procession","woven","echoed","respectfully","protected"]'::jsonb,
'["reached a place","images that stand for ideas","public town squares","a formal event with special actions","the longest or shortest day of the year","people moving together in an organized event","made by crossing threads","repeated as sound bounced back","in a way that shows respect","kept safe from loss or harm"]'::jsonb),
('ecuador-otavalo-market','Market Day in Otavalo, Ecuador','A family learns how weaving, language, food, and trade reflect local traditions.','Culture','assets/images/covers/cover6.png',24,6,
$s$Before sunrise, Ana and her uncle walked toward the market in Otavalo, Ecuador. Vendors unfolded cloth canopies and arranged woven blankets, baskets, fruit, and spices.

Ana stopped beside a weaver named Lucía. Lucía explained that making one patterned scarf required careful planning and many hours at the loom. Some designs had been taught through generations.

Around them, people greeted one another in Spanish and Kichwa. Farmers traded produce while musicians played nearby. Ana noticed that the market was both a place for business and a gathering place.

She chose a small woven belt after asking who made it and what its pattern meant. On the walk home, Ana understood that each handmade object carried the skill and story of its maker.$s$,
'["vendors","canopies","arranged","woven","weaver","required","loom","generations","traded","handmade"]'::jsonb,
'["people who sell things","cloth covers that provide shelter","put things in an orderly position","made by crossing threads","a person who makes cloth","needed something","a frame used to weave cloth","family age groups over time","exchanged one thing for another","made by a person rather than a machine"]'::jsonb),
('colombia-barranquilla-carnival','Dancing Through Colombia''s Carnival','A child experiences the music, dances, costumes, and teamwork of Carnival.','Culture','assets/images/covers/cover7.png',25,7,
$s$Valeria's dance group had practiced for weeks before Carnival in Barranquilla, Colombia. Her costume shimmered with blue and silver pieces sewn by families in the neighborhood.

On parade morning, drums and flutes filled the street. Dancers performed cumbia steps while enormous masks and bright characters moved through the crowd. Valeria felt nervous when she saw so many spectators.

Her friend reminded her to listen to the drumbeat. Valeria found the rhythm and moved with her group. Each dancer depended on the others to keep the formation together.

After the parade, Valeria thanked the musicians, costume makers, and families. She realized that Carnival's energy came from months of cooperation and from traditions shared across generations.$s$,
'["practiced","costume","shimmered","parade","performed","spectators","rhythm","depended","formation","cooperation"]'::jsonb,
'["repeated an action to improve","special clothing worn for an event","shone with a soft changing light","a public line of performers","presented for an audience","people who watch an event","a repeated pattern of sound or movement","needed help from","an organized arrangement","working together toward a goal"]'::jsonb),
('lantern-in-attic','The Lantern in the Attic','A mysterious lantern guides two friends toward a forgotten family story.','Fiction','assets/images/covers/cover8.png',24,8,
$s$During a thunderstorm, Amir and Jo searched the attic for a board game. Behind an old trunk, they discovered a brass lantern covered in dust.

The lantern lit by itself, though it held no candle. Its beam pointed toward a loose floorboard. Beneath it, the friends found a notebook filled with sketches of the house and a map marked with a star.

They followed the map to the garden shed. Inside a hidden drawer lay letters written by Jo's great-grandfather when he was young. The letters described how neighbors had sheltered one another during a terrible flood.

When Jo's grandmother read them, her eyes filled with happy tears. The lantern's glow slowly faded. Amir and Jo understood that it had guided them to a story the family was ready to remember.$s$,
'["attic","brass","beam","loose","beneath","sketches","hidden","sheltered","faded","guided"]'::jsonb,
'["space below a roof","a yellow metal made from copper","a line of light","not firmly attached","under something","quick simple drawings","kept out of sight","protected from danger or weather","slowly became weaker","showed the way"]'::jsonb),
('luna-paper-dragon','Luna and the Paper Dragon','A paper creation comes alive and leads Luna through an unexpected adventure.','Fiction','assets/images/covers/cover9.png',25,9,
$s$Luna folded a red paper dragon for the school art fair. She creased every corner carefully, but one wing remained crooked.

At midnight, a rustling sound woke her. The paper dragon stretched, sneezed a tiny spark, and flew through the open window. Luna hurried after it into the moonlit courtyard.

The dragon circled a rain gutter where a frightened kitten was trapped. Luna held a basket below while the dragon used its bright spark to guide the kitten down. Its bent wing helped it hover steadily in the narrow space.

Back in her room, the dragon became still paper again. Luna no longer tried to straighten its wing. What she had called an imperfection had made the rescue possible.$s$,
'["folded","creased","crooked","rustling","spark","courtyard","circled","trapped","hover","imperfection"]'::jsonb,
'["bent material over itself","made a line by folding","bent and not straight","a soft sound of moving paper or leaves","a tiny bright piece of fire","an open area surrounded by buildings","moved around something","unable to escape","stay in one place in the air","a small fault or unusual feature"]'::jsonb),
('clock-lost-hour','The Clock That Lost an Hour','A curious child searches for a missing hour before the town wakes up.','Fiction','assets/images/covers/cover10.png',23,10,
$s$At exactly midnight, Theo heard the town clock strike eleven times instead of twelve. Then every clock in his house jumped forward one hour.

Outside, the missing hour floated like a silver ribbon toward the clock tower. Theo followed it through silent streets. In the tower, he found a tired clockmaker trying to repair a jammed gear.

Theo noticed a tiny screw beneath the pendulum. Once the clockmaker replaced it, the gears turned smoothly, but the silver hour still hovered out of reach. Theo opened the tower window and rang the bell once.

The sound swept across town, and the silver ribbon returned to the clock. At dawn, every clock showed the correct time. Theo learned that careful observation can be more useful than rushing.$s$,
'["exactly","strike","floated","silent","tower","jammed","gear","pendulum","hovered","observation"]'::jsonb,
'["precisely","sound a clock bell","rested or moved lightly in air","without sound","a tall narrow building","stuck and unable to move","a toothed wheel in a machine","a swinging clock part","remained in the air","careful noticing and watching"]'::jsonb)
), inserted as (
 insert into public.readings(id,title,slug,description,theme,reading_text,image_path,estimated_minutes,difficulty,reading_order,is_active)
 select id,title,id,description,theme,story,image_path,minutes,'Friendly grade 4',reading_order,true from source
 on conflict(id) do update set title=excluded.title,description=excluded.description,theme=excluded.theme,reading_text=excluded.reading_text,image_path=excluded.image_path,estimated_minutes=excluded.estimated_minutes,difficulty=excluded.difficulty,reading_order=excluded.reading_order,is_active=true returning id
)
select count(*) from inserted;

with reading_ids as (select id,reading_order from public.readings where reading_order between 2 and 10),
stages(slug,title,description,category,skill,points,stage_order,activity_type) as (values
('before-reading','Before Reading','Observe and make a prediction.','reading','prediction',5,0,'before_reading'),('read-text','Read the Text','Read at your own pace.','reading','fluency',10,1,'read_text'),('vocabulary','Vocabulary','Match ten words and meanings.','vocabulary','context clues',10,2,'vocabulary'),('main-idea','Main Idea','Identify the central idea.','reading','main idea',15,3,'main_idea'),('inference','Inference','Combine clues with what you know.','reading','inference',15,4,'inference'),('text-evidence','Text Evidence','Select supporting evidence.','reading','text evidence',15,5,'text_evidence'),('reading-comprehension','Reading Comprehension','Answer three questions.','reading','comprehension',15,6,'reading_comprehension'),('reflection','Metacognition','Reflect on learning and confidence.','assessment','reflection',10,7,'reflection'),('collaboration-forum','Collaboration Forum','Share and respond to an idea.','collaboration','perspective sharing',15,8,'collaboration_forum'))
insert into public.activities(id,title,description,category,skill,page_url,activity_order,total_points,is_active,reading_id,activity_type,is_required)
select r.id||'-'||s.slug,s.title,s.description,s.category,s.skill,'reading-journey.html?reading='||r.id||'&stage='||s.slug,r.reading_order*100+s.stage_order,s.points,true,r.id,s.activity_type,true from reading_ids r cross join stages s
on conflict(id) do update set title=excluded.title,description=excluded.description,page_url=excluded.page_url,activity_order=excluded.activity_order,total_points=excluded.total_points,is_active=true,reading_id=excluded.reading_id,activity_type=excluded.activity_type,is_required=true;

-- Seed stage content. Vocabulary meanings are deliberately shuffled.
with src as (
 select r.id,r.title,r.reading_text,
 case r.id
 when 'grandmas-kitchen' then '["faded","recipe","measured","knead","patiently","generation","uneven","relatives","instructions","memories"]'::jsonb
 when 'neighborhood-book-drive' then '["noticed","nearly","drive","collection","gently","biographies","volunteers","donation","eagerly","contributed"]'::jsonb
 when 'mexico-day-of-the-dead' then '["glowed","marigolds","ofrenda","relatives","petals","celebration","honor","frightening","inspired","connected"]'::jsonb
 when 'peru-inti-raymi' then '["arrived","symbols","plazas","ceremony","solstice","procession","woven","echoed","respectfully","protected"]'::jsonb
 when 'ecuador-otavalo-market' then '["vendors","canopies","arranged","woven","weaver","required","loom","generations","traded","handmade"]'::jsonb
 when 'colombia-barranquilla-carnival' then '["practiced","costume","shimmered","parade","performed","spectators","rhythm","depended","formation","cooperation"]'::jsonb
 when 'lantern-in-attic' then '["attic","brass","beam","loose","beneath","sketches","hidden","sheltered","faded","guided"]'::jsonb
 when 'luna-paper-dragon' then '["folded","creased","crooked","rustling","spark","courtyard","circled","trapped","hover","imperfection"]'::jsonb
 else '["exactly","strike","floated","silent","tower","jammed","gear","pendulum","hovered","observation"]'::jsonb end words,
 case r.id
 when 'grandmas-kitchen' then '["having lost color with age","directions for preparing food","found the amount of something","press and fold dough","in a calm way without rushing","people born around the same period in a family","not level or equal","people in the same family","steps explaining what to do","things remembered from the past"]'::jsonb
 when 'neighborhood-book-drive' then '["became aware of","almost but not completely","an organized effort for a purpose","a group of gathered things","with care and little force","true stories of people''s lives","people who help without pay","something given to help","with excitement and interest","gave something to a shared effort"]'::jsonb
 when 'mexico-day-of-the-dead' then '["shone with light","bright orange or yellow flowers","an altar holding offerings and memories","people in the same family","colored parts of a flower","a joyful special event","show respect for","causing fear","caused an idea or feeling","joined by a shared bond"]'::jsonb
 when 'peru-inti-raymi' then '["reached a place","images that stand for ideas","public town squares","a formal event with special actions","the longest or shortest day of the year","people moving together in an organized event","made by crossing threads","repeated as sound bounced back","in a way that shows respect","kept safe from loss or harm"]'::jsonb
 when 'ecuador-otavalo-market' then '["people who sell things","cloth covers that provide shelter","put things in an orderly position","made by crossing threads","a person who makes cloth","needed something","a frame used to weave cloth","family age groups over time","exchanged one thing for another","made by a person rather than a machine"]'::jsonb
 when 'colombia-barranquilla-carnival' then '["repeated an action to improve","special clothing worn for an event","shone with a soft changing light","a public line of performers","presented for an audience","people who watch an event","a repeated pattern of sound or movement","needed help from","an organized arrangement","working together toward a goal"]'::jsonb
 when 'lantern-in-attic' then '["space below a roof","a yellow metal made from copper","a line of light","not firmly attached","under something","quick simple drawings","kept out of sight","protected from danger or weather","slowly became weaker","showed the way"]'::jsonb
 when 'luna-paper-dragon' then '["bent material over itself","made a line by folding","bent and not straight","a soft sound of moving paper or leaves","a tiny bright piece of fire","an open area surrounded by buildings","moved around something","unable to escape","stay in one place in the air","a small fault or unusual feature"]'::jsonb
 else '["precisely","sound a clock bell","rested or moved lightly in air","without sound","a tall narrow building","stuck and unable to move","a toothed wheel in a machine","a swinging clock part","remained in the air","careful noticing and watching"]'::jsonb end definitions
 from public.readings r where r.reading_order between 2 and 10
), rows as (
 select id||'-read-text' activity_id,jsonb_build_object('text',reading_text) content,'[]'::jsonb answers from src union all
 select id||'-before-reading',jsonb_build_object('prompt','What does the cover suggest this reading will be mostly about?','options',jsonb_build_array('People facing an important experience together.','A list of unrelated numbers.','Instructions for repairing a car.')),'[0]' from src union all
 select id||'-vocabulary',jsonb_build_object(
   'prompt','Match each word from the reading with its meaning.',
   'words',words,
   'definitions',jsonb_build_array(definitions->3,definitions->7,definitions->1,definitions->9,definitions->5,definitions->0,definitions->8,definitions->4,definitions->2,definitions->6)
 ),'[5,2,8,0,7,4,9,1,6,3]' from src union all
 select id||'-main-idea',jsonb_build_object('prompt','What is the main idea of '||title||'?','options',jsonb_build_array('The characters learn something meaningful through their shared experience.','Only the setting matters in the reading.','The characters avoid every challenge.')),'[0]' from src union all
 select id||'-inference',jsonb_build_object('prompt','What can you infer about the main character?','options',jsonb_build_array('The character becomes more thoughtful because of the experience.','The character learns nothing new.','The character was never interested in what happened.')),'[0]' from src union all
 select id||'-text-evidence',jsonb_build_object('prompt','Which kind of detail best supports the reading''s central message?','options',jsonb_build_array('The final actions and realization of the main character.','Only the title of the reading.','A detail that never appears in the text.')),'[0]' from src union all
 select id||'-reading-comprehension',jsonb_build_object('questions',jsonb_build_array(jsonb_build_object('prompt','What changes during the reading?','options',jsonb_build_array('The main character gains a new understanding.','Nothing changes at all.','The setting disappears.')),jsonb_build_object('prompt','How is the challenge addressed?','options',jsonb_build_array('Through attention, effort, or cooperation.','By pretending it does not exist.','By leaving the story unfinished.')),jsonb_build_object('prompt','Which theme is best supported?','options',jsonb_build_array('Experiences and shared actions can teach important lessons.','People should never ask questions.','Traditions and memories have no value.')))),'[0,0,0]' from src
)
insert into public.reading_activity_content(activity_id,content,correct_answers) select activity_id,content,answers from rows
on conflict(activity_id) do update set content=excluded.content,correct_answers=excluded.correct_answers;

-- Keep the prototype's comprehension stage available after consolidating the RPCs.
insert into public.reading_activity_content(activity_id,content,correct_answers) values
('community-garden-reading-comprehension',jsonb_build_object('questions',jsonb_build_array(
 jsonb_build_object('prompt','Why did the neighbors transform the empty lot?','options',jsonb_build_array('They wanted a place to grow food and connect.','They needed a parking lot.','They wanted a shopping center.')),
 jsonb_build_object('prompt','What did families contribute to the community meal?','options',jsonb_build_array('Recipes and food connected to their cultures.','Only gardening tools.','Concert tickets.')),
 jsonb_build_object('prompt','What important change happened because of the garden?','options',jsonb_build_array('Neighbors formed stronger relationships.','Everyone moved away.','The children stopped helping.'))
)),'[0,0,0]'::jsonb)
on conflict(activity_id) do update set content=excluded.content,correct_answers=excluded.correct_answers;

create or replace function public.get_reading_stage_content(target_activity_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select content into result from public.reading_activity_content where activity_id=target_activity_id;
 if result is not null then return result; end if;
 -- Preserve the verified prototype through its prior implementation.
 if target_activity_id like 'community-garden-%' then return public.get_reading_stage_content_without_comprehension(target_activity_id); end if;
 return '{}'::jsonb;
end $$;
revoke all on function public.get_reading_stage_content(text) from public;
grant execute on function public.get_reading_stage_content(text) to authenticated;

create or replace function public.check_reading_answer(target_activity_id text,selected_option integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare keys jsonb; activity_kind text; question_index int; option_index int; expected int;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select rac.correct_answers,a.activity_type into keys,activity_kind from public.reading_activity_content rac join public.activities a on a.id=rac.activity_id where rac.activity_id=target_activity_id;
 if keys is null then return public.check_reading_answer_without_comprehension(target_activity_id,selected_option); end if;
 if activity_kind='vocabulary' then question_index:=selected_option/10; option_index:=selected_option%10;
 elsif activity_kind='reading_comprehension' then question_index:=selected_option/10; option_index:=selected_option%10;
 else question_index:=0; option_index:=selected_option; end if;
 if question_index<0 or question_index>=jsonb_array_length(keys) then raise exception 'Invalid answer'; end if;
 expected:=(keys->>question_index)::int;
 return jsonb_build_object('correct',option_index=expected,'feedback',case when option_index=expected then 'Correct! The reading supports your answer.' else 'Not quite. Review the text and try again.' end);
end $$;
revoke all on function public.check_reading_answer(text,integer) from public;
grant execute on function public.check_reading_answer(text,integer) to authenticated;

commit;
