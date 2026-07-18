begin;

insert into public.badges (id, name, description, icon_path, points_required)
values ('community-garden-explorer', 'Community Garden Explorer', 'Completed The Community Garden Reading Journey.', 'assets/icons/globe.svg', 0)
on conflict (id) do update set name = excluded.name, description = excluded.description, icon_path = excluded.icon_path;

create table if not exists public.readings (
  id text primary key,
  title text not null,
  slug text unique not null,
  description text,
  theme text not null,
  reading_text text not null,
  image_path text,
  estimated_minutes integer,
  difficulty text,
  reading_order integer,
  badge_id text references public.badges(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.activities add column if not exists reading_id text references public.readings(id);
alter table public.activities add column if not exists activity_type text;
alter table public.activities add column if not exists is_required boolean default true;

create table if not exists public.student_readings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  reading_id text not null references public.readings(id) on delete cascade,
  status text not null default 'started' check (status in ('not_started','started','completed')),
  current_activity_id text references public.activities(id),
  started_at timestamptz default now(),
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique (student_id, reading_id)
);

insert into public.readings (id,title,slug,description,theme,reading_text,image_path,estimated_minutes,difficulty,reading_order,badge_id,is_active)
values ('community-garden','The Community Garden','community-garden','Neighbors transform an empty lot into a welcoming place to grow food, share knowledge, and build friendships.','Family and Community',
'On Maple Street, an empty lot sat between two apartment buildings. Weeds covered the ground, and people hurried past it every day. One Saturday, Mrs. Rivera placed a bright sign by the sidewalk. It said, “Let’s build a community garden!”\n\nAt first, only a few neighbors came. Maya and her little brother pulled weeds. Mr. Chen brought tools. The Johnson family carried bags of soil. Soon, more people joined. Some planted tomatoes, beans, and peppers. Others painted signs in English and Spanish so everyone could understand them.\n\nThe work was not always easy. After a hot week, several young plants bent toward the dry ground. Maya noticed them on her way home. She filled two watering cans and asked her friends to help. Together, they watered every row. The next morning, the leaves looked strong again.\n\nAs the garden grew, the neighbors shared more than vegetables. Mr. Chen showed the children how worms help the soil. Mrs. Rivera taught them to save seeds. Families brought recipes from their cultures and cooked a meal with the first harvest. Even people who had never spoken before began to laugh and tell stories together.\n\nBy the end of summer, the empty lot had become a colorful meeting place. Maya looked at the garden and smiled. She understood that many small acts of care could create something important. The garden had grown food, but it had also grown a stronger community.',
'assets/images/culture-kids.png',25,'Friendly grade 4',1,'community-garden-explorer',true)
on conflict (id) do update set title=excluded.title,description=excluded.description,theme=excluded.theme,reading_text=excluded.reading_text,image_path=excluded.image_path,estimated_minutes=excluded.estimated_minutes,difficulty=excluded.difficulty,badge_id=excluded.badge_id,is_active=true;

update public.readings set reading_text=$story$
On Maple Street, an empty lot sat between two apartment buildings. Tall weeds covered the dry ground.

People hurried past the lot every day. Most of them did not stop to look at it.

One Saturday, Mrs. Rivera placed a bright sign beside the sidewalk. It said, “Let’s build a community garden!”

Maya read the sign and felt curious. She asked her little brother to help her pull weeds.

At first, only a few neighbors came. Mr. Chen brought tools, and the Johnson family carried bags of soil.

The work was difficult, but no one worked alone. Every person completed one small job.

Soon, more neighbors joined the project. They cleared the lot and made straight rows for planting.

Some families planted tomatoes, beans, and peppers. Other families planted herbs they used in special recipes.

The children painted signs in English and Spanish. The signs helped more neighbors understand what was growing.

After a hot week, several young plants bent toward the ground. Their leaves looked dry and weak.

Maya noticed the plants on her way home. She inferred that they needed water quickly.

She filled two watering cans and called her friends. Together, they carefully watered every row.

The next morning, the leaves looked strong again. Maya knew their teamwork had protected the plants.

As the garden grew, the neighbors shared more than vegetables. They also shared knowledge and stories.

Mr. Chen showed the children how worms help the soil. Mrs. Rivera taught them how to save seeds.

Families brought recipes from their cultures. They planned a community meal with the first harvest.

A harvest is the food gathered from plants when it is ready. Everyone contributed something to the meal.

People who had never spoken before began to laugh together. They learned one another’s names and traditions.

By the end of summer, the empty lot had become a colorful meeting place for the whole neighborhood.

Maya smiled because many small acts of care had created something important. The garden grew food and a stronger community.
$story$ where id='community-garden';

insert into public.activities (id,title,description,category,skill,page_url,activity_order,total_points,is_active,reading_id,activity_type,is_required)
values
('community-garden-before-reading','Before You Read','Connect the topic to what you know.','reading','background knowledge','reading-journey.html?reading=community-garden&stage=before-reading',101,5,true,'community-garden','before_reading',true),
('community-garden-vocabulary','Vocabulary','Explore important words from the story.','vocabulary','context clues','reading-journey.html?reading=community-garden&stage=vocabulary',102,10,true,'community-garden','vocabulary',true),
('community-garden-read-text','Read the Text','Read The Community Garden at your own pace.','reading','fluency','reading-journey.html?reading=community-garden&stage=read-text',103,10,true,'community-garden','read_text',true),
('community-garden-main-idea','Main Idea','Identify the most important idea.','reading','main idea','reading-journey.html?reading=community-garden&stage=main-idea',104,15,true,'community-garden','main_idea',true),
('community-garden-inference','Inference','Combine text clues with what you know.','reading','inference','reading-journey.html?reading=community-garden&stage=inference',105,15,true,'community-garden','inference',true),
('community-garden-text-evidence','Text Evidence','Choose evidence that supports an idea.','reading','text evidence','reading-journey.html?reading=community-garden&stage=text-evidence',106,15,true,'community-garden','text_evidence',true),
('community-garden-reflection','Metacognition','Think about learning strategies and confidence.','assessment','reflection','reading-journey.html?reading=community-garden&stage=reflection',107,10,true,'community-garden','reflection',true)
on conflict (id) do update set title=excluded.title,description=excluded.description,page_url=excluded.page_url,activity_order=excluded.activity_order,reading_id=excluded.reading_id,activity_type=excluded.activity_type,is_required=true,is_active=true;

update public.activities
set is_required=false, is_active=false
where id='community-garden-before-reading';

update public.activities set activity_order=101 where id='community-garden-read-text';
update public.activities set activity_order=102 where id='community-garden-vocabulary';
update public.activities set activity_order=103 where id='community-garden-main-idea';
update public.activities set activity_order=104 where id='community-garden-inference';
update public.activities set activity_order=105 where id='community-garden-text-evidence';
update public.activities set activity_order=106 where id='community-garden-reflection';

commit;
