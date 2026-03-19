-- Auto-close open surveys once all eligible active users have submitted.
-- Works for both app submissions and direct SQL/script inserts into participation_tokens.

create or replace function public.auto_close_survey_on_completion(p_survey_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_has_role_audience boolean;
  v_eligible_count integer := 0;
  v_submitted_count integer := 0;
begin
  select s.status
    into v_status
  from public.surveys s
  where s.id = p_survey_id
  for update;

  if v_status is null or v_status <> 'open' then
    return;
  end if;

  select exists (
    select 1
    from public.survey_audiences sa
    where sa.survey_id = p_survey_id
      and sa.target_role_id is not null
  ) into v_has_role_audience;

  if v_has_role_audience then
    select count(*)
      into v_eligible_count
    from public.profiles p
    where coalesce(p.is_active, true) = true
      and p.role_id in (
        select sa.target_role_id
        from public.survey_audiences sa
        where sa.survey_id = p_survey_id
          and sa.target_role_id is not null
      );

    select count(distinct pt.user_id)
      into v_submitted_count
    from public.participation_tokens pt
    join public.profiles p on p.id = pt.user_id
    where pt.survey_id = p_survey_id
      and coalesce(p.is_active, true) = true
      and p.role_id in (
        select sa.target_role_id
        from public.survey_audiences sa
        where sa.survey_id = p_survey_id
          and sa.target_role_id is not null
      );
  else
    select count(*)
      into v_eligible_count
    from public.profiles p
    where coalesce(p.is_active, true) = true;

    select count(distinct pt.user_id)
      into v_submitted_count
    from public.participation_tokens pt
    where pt.survey_id = p_survey_id
      and pt.user_id is not null;
  end if;

  if v_eligible_count > 0 and v_submitted_count >= v_eligible_count then
    update public.surveys
    set status = 'closed',
        closes_at = coalesce(closes_at, now())
    where id = p_survey_id
      and status = 'open';
  end if;
end;
$$;

create or replace function public.trg_auto_close_survey_on_participation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.auto_close_survey_on_completion(new.survey_id);
  return new;
end;
$$;

drop trigger if exists trg_auto_close_survey_on_participation on public.participation_tokens;

create trigger trg_auto_close_survey_on_participation
after insert on public.participation_tokens
for each row
execute function public.trg_auto_close_survey_on_participation();
