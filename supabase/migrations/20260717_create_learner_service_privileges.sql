-- Minimum table privileges required by the create-learner Edge Function.
-- The Service Role Key remains only inside Supabase Edge Functions.

begin;

grant select, update on table public.profiles to service_role;
grant select on table public.classes to service_role;
grant select, insert on table public.class_members to service_role;

commit;
