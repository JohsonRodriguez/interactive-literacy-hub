create or replace function public.complete_reading_journey(target_reading_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare required_count int; completed_count int;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select count(*) into required_count from activities where reading_id=target_reading_id and is_required=true and is_active=true;
 select count(*) into completed_count from student_progress sp join activities a on a.id=sp.activity_id where sp.student_id=auth.uid() and a.reading_id=target_reading_id and a.is_required=true and a.is_active=true and sp.status='completed';
 if required_count=0 or completed_count<required_count then return jsonb_build_object('completed',false,'completedActivities',completed_count,'requiredActivities',required_count); end if;
 update student_readings set status='completed',completed_at=coalesce(completed_at,now()),updated_at=now() where student_id=auth.uid() and reading_id=target_reading_id;
 return jsonb_build_object('completed',true,'eagleStageUnlocked',true);
end $$;
revoke all on function public.complete_reading_journey(text) from public;
grant execute on function public.complete_reading_journey(text) to authenticated;
update public.readings set badge_id=null where badge_id is not null;
