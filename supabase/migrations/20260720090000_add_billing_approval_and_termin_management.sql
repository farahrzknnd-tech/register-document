-- Patch 5 — Billing Approval Timeline and Payment Terms
--
-- Adds secure, auditable mutation boundaries for billing stage progress and
-- payment terms. Browser roles keep read access, while all writes are routed
-- through admin-only SECURITY DEFINER RPC functions.

create function public.update_billing_stage_progress(
  p_progress_id uuid,
  p_status text,
  p_completed_at timestamptz default null,
  p_note text default null
)
returns public.billing_stage_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.billing_stage_progress;
  v_updated public.billing_stage_progress;
  v_completed_at timestamptz;
begin
  if not public.current_user_admin() then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  select *
    into v_existing
  from public.billing_stage_progress progress
  where progress.id = p_progress_id
  for update;

  if not found then
    raise exception 'Billing stage progress not found' using errcode = 'P0002';
  end if;

  if p_status is null or p_status not in ('not_started', 'in_progress', 'completed', 'skipped') then
    raise exception 'Unsupported billing stage status' using errcode = '23514';
  end if;

  v_completed_at := case
    when p_status = 'completed' then coalesce(p_completed_at, v_existing.completed_at, now())
    else null
  end;

  update public.billing_stage_progress progress
  set
    status = p_status,
    completed_at = v_completed_at,
    note = nullif(btrim(p_note), '')
  where progress.id = p_progress_id
  returning * into v_updated;

  insert into public.billing_activity_log (
    billing_id,
    entity_type,
    entity_id,
    action,
    old_value,
    new_value,
    actor_user_id
  )
  values (
    v_existing.billing_id,
    'stage',
    v_existing.id,
    'stage_updated',
    to_jsonb(v_existing),
    to_jsonb(v_updated),
    auth.uid()
  );

  return v_updated;
end
$$;

create function public.sync_billing_stage_progress(
  p_billing_id uuid
)
returns setof public.billing_stage_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted_count integer;
begin
  if not public.current_user_admin() then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.spk_billings billing where billing.id = p_billing_id
  ) then
    raise exception 'SPK billing not found' using errcode = 'P0002';
  end if;

  insert into public.billing_stage_progress (
    billing_id,
    stage_definition_id,
    status,
    created_by,
    updated_by
  )
  select
    p_billing_id,
    stage.id,
    'not_started',
    auth.uid(),
    auth.uid()
  from public.billing_stage_definitions stage
  where stage.active
    and not exists (
      select 1
      from public.billing_stage_progress progress
      where progress.billing_id = p_billing_id
        and progress.stage_definition_id = stage.id
    );

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count > 0 then
    insert into public.billing_activity_log (
      billing_id,
      entity_type,
      action,
      new_value,
      actor_user_id
    )
    values (
      p_billing_id,
      'stage',
      'stages_synced',
      jsonb_build_object('inserted_count', v_inserted_count),
      auth.uid()
    );
  end if;

  return query
  select progress.*
  from public.billing_stage_progress progress
  join public.billing_stage_definitions stage
    on stage.id = progress.stage_definition_id
  where progress.billing_id = p_billing_id
  order by stage.sort_order;
end
$$;

create function public.save_billing_termin(
  p_billing_id uuid,
  p_sequence_no integer,
  p_name text,
  p_planned_amount numeric,
  p_billed_amount numeric,
  p_paid_amount numeric,
  p_status text,
  p_termin_id uuid default null,
  p_percentage numeric default null,
  p_billed_date date default null,
  p_paid_date date default null,
  p_notes text default null
)
returns public.billing_termins
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.billing_termins;
  v_saved public.billing_termins;
  v_contract_value numeric(18,2);
  v_action text;
begin
  if not public.current_user_admin() then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  select billing.contract_value
    into v_contract_value
  from public.spk_billings billing
  where billing.id = p_billing_id
  for update;

  if not found then
    raise exception 'SPK billing not found' using errcode = 'P0002';
  end if;

  if p_termin_id is not null then
    select *
      into v_existing
    from public.billing_termins termin
    where termin.id = p_termin_id
      and termin.billing_id = p_billing_id
    for update;

    if not found then
      raise exception 'Billing termin not found' using errcode = 'P0002';
    end if;
  end if;

  if p_sequence_no is null or p_sequence_no <= 0 then
    raise exception 'Billing termin sequence must be greater than zero' using errcode = '23514';
  end if;

  if nullif(btrim(p_name), '') is null then
    raise exception 'Billing termin name is required' using errcode = '23514';
  end if;

  if p_percentage is not null and (p_percentage < 0 or p_percentage > 100) then
    raise exception 'Billing termin percentage must be between zero and 100' using errcode = '23514';
  end if;

  if p_planned_amount is null or p_planned_amount < 0
     or p_billed_amount is null or p_billed_amount < 0
     or p_paid_amount is null or p_paid_amount < 0 then
    raise exception 'Billing termin amounts cannot be negative' using errcode = '23514';
  end if;

  if p_planned_amount > v_contract_value then
    raise exception 'Billing termin planned amount exceeds contract value' using errcode = '23514';
  end if;

  if p_billed_amount > p_planned_amount then
    raise exception 'Billing termin billed amount exceeds planned amount' using errcode = '23514';
  end if;

  if p_paid_amount > p_billed_amount then
    raise exception 'Billing termin paid amount exceeds billed amount' using errcode = '23514';
  end if;

  if p_billed_amount > 0 and p_billed_date is null then
    raise exception 'Billing termin billed date is required' using errcode = '23514';
  end if;

  if p_paid_amount > 0 and p_paid_date is null then
    raise exception 'Billing termin paid date is required' using errcode = '23514';
  end if;

  if p_paid_date is not null and p_billed_date is not null and p_paid_date < p_billed_date then
    raise exception 'Billing termin paid date cannot be earlier than billed date' using errcode = '23514';
  end if;

  if p_status is null or p_status not in ('not_billed', 'in_process', 'billed', 'partially_paid', 'paid', 'cancelled') then
    raise exception 'Unsupported billing termin status' using errcode = '23514';
  end if;

  if p_status = 'not_billed' and (p_billed_amount <> 0 or p_paid_amount <> 0) then
    raise exception 'Not billed termin cannot contain billed or paid amount' using errcode = '23514';
  end if;

  if p_status = 'in_process' and (p_billed_amount <> 0 or p_paid_amount <> 0) then
    raise exception 'In process termin cannot contain billed or paid amount' using errcode = '23514';
  end if;

  if p_status = 'billed' and (p_billed_amount <= 0 or p_paid_amount <> 0) then
    raise exception 'Billed termin requires billed amount and zero paid amount' using errcode = '23514';
  end if;

  if p_status = 'partially_paid'
     and (p_billed_amount <= 0 or p_paid_amount <= 0 or p_paid_amount >= p_billed_amount) then
    raise exception 'Partially paid termin requires paid amount below billed amount' using errcode = '23514';
  end if;

  if p_status = 'paid'
     and (p_billed_amount <= 0 or p_paid_amount <> p_billed_amount) then
    raise exception 'Paid termin requires paid amount equal to billed amount' using errcode = '23514';
  end if;

  if p_termin_id is null then
    insert into public.billing_termins (
      billing_id,
      sequence_no,
      name,
      percentage,
      planned_amount,
      billed_amount,
      paid_amount,
      status,
      billed_date,
      paid_date,
      notes
    )
    values (
      p_billing_id,
      p_sequence_no,
      btrim(p_name),
      p_percentage,
      p_planned_amount,
      p_billed_amount,
      p_paid_amount,
      p_status,
      p_billed_date,
      p_paid_date,
      nullif(btrim(p_notes), '')
    )
    returning * into v_saved;

    v_action := 'termin_created';
  else
    update public.billing_termins termin
    set
      sequence_no = p_sequence_no,
      name = btrim(p_name),
      percentage = p_percentage,
      planned_amount = p_planned_amount,
      billed_amount = p_billed_amount,
      paid_amount = p_paid_amount,
      status = p_status,
      billed_date = p_billed_date,
      paid_date = p_paid_date,
      notes = nullif(btrim(p_notes), '')
    where termin.id = p_termin_id
    returning * into v_saved;

    v_action := 'termin_updated';
  end if;

  insert into public.billing_activity_log (
    billing_id,
    entity_type,
    entity_id,
    action,
    old_value,
    new_value,
    actor_user_id
  )
  values (
    p_billing_id,
    'termin',
    v_saved.id,
    v_action,
    case when p_termin_id is null then null else to_jsonb(v_existing) end,
    to_jsonb(v_saved),
    auth.uid()
  );

  return v_saved;
end
$$;

create function public.delete_billing_termin(
  p_termin_id uuid
)
returns public.billing_termins
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.billing_termins;
begin
  if not public.current_user_admin() then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  select *
    into v_existing
  from public.billing_termins termin
  where termin.id = p_termin_id
  for update;

  if not found then
    raise exception 'Billing termin not found' using errcode = 'P0002';
  end if;

  if v_existing.billed_amount > 0 or v_existing.paid_amount > 0 then
    raise exception 'Billing termin with financial realization cannot be deleted' using errcode = '23514';
  end if;

  delete from public.billing_termins termin
  where termin.id = p_termin_id;

  insert into public.billing_activity_log (
    billing_id,
    entity_type,
    entity_id,
    action,
    old_value,
    actor_user_id
  )
  values (
    v_existing.billing_id,
    'termin',
    v_existing.id,
    'termin_deleted',
    to_jsonb(v_existing),
    auth.uid()
  );

  return v_existing;
end
$$;


create function public.validate_billing_contract_value()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total_planned numeric(18,2);
  v_total_billed numeric(18,2);
begin
  select
    coalesce(sum(termin.planned_amount) filter (where termin.status <> 'cancelled'), 0),
    coalesce(sum(termin.billed_amount) filter (where termin.status <> 'cancelled'), 0)
  into v_total_planned, v_total_billed
  from public.billing_termins termin
  where termin.billing_id = new.id;

  if v_total_planned > new.contract_value then
    raise exception 'Billing planned amount exceeds contract value' using errcode = '23514';
  end if;

  if v_total_billed > new.contract_value then
    raise exception 'Billing billed amount exceeds contract value' using errcode = '23514';
  end if;

  return new;
end
$$;

create trigger spk_billings_validate_contract_value
before update of contract_value on public.spk_billings
for each row
when (old.contract_value is distinct from new.contract_value)
execute function public.validate_billing_contract_value();

-- Direct browser writes are disabled. The RLS policies remain as defense in
-- depth, but approved mutation paths are the RPC functions above.
revoke insert, update, delete on public.billing_stage_progress from authenticated;
revoke insert, update, delete on public.billing_termins from authenticated;
revoke insert on public.billing_activity_log from authenticated;

revoke all on function public.update_billing_stage_progress(uuid, text, timestamptz, text)
  from public, anon;
revoke all on function public.sync_billing_stage_progress(uuid)
  from public, anon;
revoke all on function public.save_billing_termin(
  uuid, integer, text, numeric, numeric, numeric, text,
  uuid, numeric, date, date, text
) from public, anon;
revoke all on function public.delete_billing_termin(uuid)
  from public, anon;
revoke all on function public.validate_billing_contract_value()
  from public, anon, authenticated;

grant execute on function public.update_billing_stage_progress(uuid, text, timestamptz, text)
  to authenticated;
grant execute on function public.sync_billing_stage_progress(uuid)
  to authenticated;
grant execute on function public.save_billing_termin(
  uuid, integer, text, numeric, numeric, numeric, text,
  uuid, numeric, date, date, text
) to authenticated;
grant execute on function public.delete_billing_termin(uuid)
  to authenticated;

comment on function public.update_billing_stage_progress(uuid, text, timestamptz, text) is
  'Admin-only stage progress mutation with completion semantics and activity log.';
comment on function public.sync_billing_stage_progress(uuid) is
  'Admin-only synchronization of active stage definitions into an existing billing.';
comment on function public.save_billing_termin(
  uuid, integer, text, numeric, numeric, numeric, text,
  uuid, numeric, date, date, text
) is
  'Admin-only atomic create/update of a billing termin with financial validation and activity log.';
comment on function public.delete_billing_termin(uuid) is
  'Admin-only deletion of a billing termin that has no billed or paid realization.';
