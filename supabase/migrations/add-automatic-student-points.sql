begin;

create or replace function public.recalculate_student_points(target_student_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare calculated_points integer;
begin
  select coalesce(sum(coalesce(a.total_points,0)),0)::integer
  into calculated_points
  from public.student_progress sp
  join public.activities a on a.id=sp.activity_id
  where sp.student_id=target_student_id
    and sp.status='completed'
    and a.is_active=true;

  update public.profiles
  set total_points=calculated_points,
      current_level=greatest(1,floor(calculated_points/100.0)::integer+1),
      updated_at=now()
  where id=target_student_id and role='student';
end $$;

create or replace function public.sync_student_points_from_progress()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.recalculate_student_points(case when tg_op='DELETE' then old.student_id else new.student_id end);
  return case when tg_op='DELETE' then old else new end;
end $$;

drop trigger if exists sync_points_after_progress_change on public.student_progress;
create trigger sync_points_after_progress_change
after insert or update or delete on public.student_progress
for each row execute function public.sync_student_points_from_progress();

do $$
declare learner record;
begin
  for learner in select id from public.profiles where role='student' loop
    perform public.recalculate_student_points(learner.id);
  end loop;
end $$;

revoke all on function public.recalculate_student_points(uuid) from public;
revoke all on function public.sync_student_points_from_progress() from public;

commit;
