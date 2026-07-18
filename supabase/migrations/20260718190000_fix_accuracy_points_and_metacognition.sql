begin;

create or replace function public.recalculate_student_points(target_student_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare calculated_points integer;
begin
  select coalesce(sum(
    case
      when sp.score is null then coalesce(a.total_points,0)
      else round(coalesce(a.total_points,0) * sp.score / 100.0)
    end
  ),0)::integer
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

update public.activities
set title='Metacognition',
    description='Think about learning strategies and confidence.'
where id='community-garden-reflection'
   or (reading_id='community-garden' and activity_type='reflection');

do $$
declare learner record;
begin
  for learner in select id from public.profiles where role='student' loop
    perform public.recalculate_student_points(learner.id);
  end loop;
end $$;

revoke all on function public.recalculate_student_points(uuid) from public, anon, authenticated;
revoke all on function public.sync_student_points_from_progress() from public, anon, authenticated;

commit;
