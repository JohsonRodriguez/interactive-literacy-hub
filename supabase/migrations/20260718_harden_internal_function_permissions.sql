-- Prevent internal trigger and policy-helper functions from being exposed as
-- anonymous RPC endpoints. Application RPC functions keep their explicit,
-- authenticated grants and perform their own ownership checks.
begin;

revoke all on function public.apply_public_signup_role() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

revoke all on function public.current_user_role() from public, anon;
revoke all on function public.teacher_has_student(uuid) from public, anon;
revoke all on function public.teacher_owns_class(uuid) from public, anon;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.teacher_has_student(uuid) to authenticated;
grant execute on function public.teacher_owns_class(uuid) to authenticated;

commit;
