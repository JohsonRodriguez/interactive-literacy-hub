-- Run only after replacing the placeholder with the Authentication user's UUID.
-- This changes one existing test profile; it does not create users or tables.
begin;

update public.profiles
set
  role = 'teacher',
  display_name = 'Demo Teacher',
  username = 'demo_teacher',
  updated_at = now()
where id = 'PASTE_USER_UUID_HERE';

commit;
