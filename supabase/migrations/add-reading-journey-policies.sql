begin;
alter table public.readings enable row level security;
alter table public.student_readings enable row level security;
grant select on public.readings to authenticated;
grant select, insert, update on public.student_readings to authenticated;

drop policy if exists "Authenticated users read active readings" on public.readings;
create policy "Authenticated users read active readings" on public.readings for select to authenticated using (is_active = true);
drop policy if exists "Learners read own reading journeys" on public.student_readings;
create policy "Learners read own reading journeys" on public.student_readings for select to authenticated using (student_id = auth.uid() or exists (select 1 from public.classes c join public.class_members cm on cm.class_id=c.id where c.teacher_id=auth.uid() and cm.student_id=student_readings.student_id));
drop policy if exists "Learners start own reading journeys" on public.student_readings;
create policy "Learners start own reading journeys" on public.student_readings for insert to authenticated with check (student_id=auth.uid());
drop policy if exists "Learners update own reading journeys" on public.student_readings;
create policy "Learners update own reading journeys" on public.student_readings for update to authenticated using (student_id=auth.uid()) with check (student_id=auth.uid());
commit;
