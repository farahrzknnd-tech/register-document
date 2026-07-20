-- Billing Monitoring Core
--
-- Adds secure mutation entry points for SPK billing records. The browser keeps
-- read-only table access and uses these RPCs for create, update, and delete.

create or replace function public.create_spk_billing(
  p_surat_penunjukan_id uuid,
  p_project_id uuid,
  p_cluster_id uuid,
  p_contractor_id uuid,
  p_termin_template_id uuid,
  p_billing_status_id uuid,
  p_spk_number text,
  p_spk_date date,
  p_contractor_name_snapshot text,
  p_work_name text,
  p_work_location text,
  p_work_start_date date,
  p_work_finish_date date,
  p_kickoff_date date,
  p_stage_weight text,
  p_contract_value numeric,
  p_document_drive_url text,
  p_notes text
)
returns public.spk_billings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_created public.spk_billings;
  v_contractor_name text;
begin
  if not public.current_user_admin() then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  if nullif(btrim(p_spk_number), '') is null then
    raise exception 'SPK number is required' using errcode = '23514';
  end if;

  if nullif(btrim(p_work_name), '') is null then
    raise exception 'Work name is required' using errcode = '23514';
  end if;

  if p_contract_value is null or p_contract_value < 0 then
    raise exception 'Contract value must be zero or greater' using errcode = '23514';
  end if;

  if p_work_finish_date is not null
     and p_work_start_date is not null
     and p_work_finish_date < p_work_start_date then
    raise exception 'Work finish date cannot be earlier than start date' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.billing_statuses status
    where status.id = p_billing_status_id
      and status.active
  ) then
    raise exception 'Billing status not found or inactive' using errcode = 'P0002';
  end if;

  if p_project_id is not null
     and not exists (select 1 from public.projects project where project.id = p_project_id) then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;

  if p_cluster_id is not null
     and not exists (select 1 from public.clusters cluster where cluster.id = p_cluster_id) then
    raise exception 'Cluster not found' using errcode = 'P0002';
  end if;

  if p_surat_penunjukan_id is not null
     and not exists (
       select 1 from public.surat_penunjukan sp where sp.id = p_surat_penunjukan_id
     ) then
    raise exception 'Surat Penunjukan not found' using errcode = 'P0002';
  end if;

  if p_termin_template_id is not null
     and not exists (
       select 1
       from public.billing_termin_templates template
       where template.id = p_termin_template_id
         and template.active
     ) then
    raise exception 'Billing termin template not found or inactive' using errcode = 'P0002';
  end if;

  if p_contractor_id is not null then
    select contractor.name
      into v_contractor_name
    from public.contractors contractor
    where contractor.id = p_contractor_id;

    if not found then
      raise exception 'Contractor not found' using errcode = 'P0002';
    end if;
  end if;

  v_contractor_name := coalesce(
    nullif(btrim(p_contractor_name_snapshot), ''),
    v_contractor_name
  );

  if v_contractor_name is null then
    raise exception 'Contractor name is required' using errcode = '23514';
  end if;

  insert into public.spk_billings (
    surat_penunjukan_id,
    project_id,
    cluster_id,
    contractor_id,
    termin_template_id,
    billing_status_id,
    spk_number,
    spk_date,
    contractor_name_snapshot,
    work_name,
    work_location,
    work_start_date,
    work_finish_date,
    kickoff_date,
    stage_weight,
    contract_value,
    document_drive_url,
    notes
  )
  values (
    p_surat_penunjukan_id,
    p_project_id,
    p_cluster_id,
    p_contractor_id,
    p_termin_template_id,
    p_billing_status_id,
    btrim(p_spk_number),
    p_spk_date,
    v_contractor_name,
    btrim(p_work_name),
    nullif(btrim(p_work_location), ''),
    p_work_start_date,
    p_work_finish_date,
    p_kickoff_date,
    nullif(btrim(p_stage_weight), ''),
    p_contract_value,
    nullif(btrim(p_document_drive_url), ''),
    nullif(btrim(p_notes), '')
  )
  returning * into v_created;

  insert into public.billing_activity_log (
    billing_id,
    entity_type,
    entity_id,
    action,
    new_value,
    actor_user_id
  )
  values (
    v_created.id,
    'billing',
    v_created.id,
    'created',
    to_jsonb(v_created),
    auth.uid()
  );

  return v_created;
end
$$;

create or replace function public.update_spk_billing(
  p_billing_id uuid,
  p_project_id uuid,
  p_cluster_id uuid,
  p_contractor_id uuid,
  p_billing_status_id uuid,
  p_spk_number text,
  p_spk_date date,
  p_contractor_name_snapshot text,
  p_work_name text,
  p_work_location text,
  p_work_start_date date,
  p_work_finish_date date,
  p_kickoff_date date,
  p_stage_weight text,
  p_contract_value numeric,
  p_document_drive_url text,
  p_notes text
)
returns public.spk_billings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.spk_billings;
  v_updated public.spk_billings;
  v_contractor_name text;
begin
  if not public.current_user_admin() then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  select *
    into v_existing
  from public.spk_billings billing
  where billing.id = p_billing_id
  for update;

  if not found then
    raise exception 'SPK billing not found' using errcode = 'P0002';
  end if;

  if nullif(btrim(p_spk_number), '') is null then
    raise exception 'SPK number is required' using errcode = '23514';
  end if;

  if nullif(btrim(p_work_name), '') is null then
    raise exception 'Work name is required' using errcode = '23514';
  end if;

  if p_contract_value is null or p_contract_value < 0 then
    raise exception 'Contract value must be zero or greater' using errcode = '23514';
  end if;

  if v_existing.termin_template_id is not null
     and p_contract_value <> v_existing.contract_value then
    raise exception 'Contract value is locked after termin initialization' using errcode = '23514';
  end if;

  if p_work_finish_date is not null
     and p_work_start_date is not null
     and p_work_finish_date < p_work_start_date then
    raise exception 'Work finish date cannot be earlier than start date' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.billing_statuses status
    where status.id = p_billing_status_id
  ) then
    raise exception 'Billing status not found' using errcode = 'P0002';
  end if;

  if p_project_id is not null
     and not exists (select 1 from public.projects project where project.id = p_project_id) then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;

  if p_cluster_id is not null
     and not exists (select 1 from public.clusters cluster where cluster.id = p_cluster_id) then
    raise exception 'Cluster not found' using errcode = 'P0002';
  end if;

  if p_contractor_id is not null then
    select contractor.name
      into v_contractor_name
    from public.contractors contractor
    where contractor.id = p_contractor_id;

    if not found then
      raise exception 'Contractor not found' using errcode = 'P0002';
    end if;
  end if;

  v_contractor_name := coalesce(
    nullif(btrim(p_contractor_name_snapshot), ''),
    v_contractor_name
  );

  if v_contractor_name is null then
    raise exception 'Contractor name is required' using errcode = '23514';
  end if;

  update public.spk_billings billing
  set
    project_id = p_project_id,
    cluster_id = p_cluster_id,
    contractor_id = p_contractor_id,
    billing_status_id = p_billing_status_id,
    spk_number = btrim(p_spk_number),
    spk_date = p_spk_date,
    contractor_name_snapshot = v_contractor_name,
    work_name = btrim(p_work_name),
    work_location = nullif(btrim(p_work_location), ''),
    work_start_date = p_work_start_date,
    work_finish_date = p_work_finish_date,
    kickoff_date = p_kickoff_date,
    stage_weight = nullif(btrim(p_stage_weight), ''),
    contract_value = p_contract_value,
    document_drive_url = nullif(btrim(p_document_drive_url), ''),
    notes = nullif(btrim(p_notes), '')
  where billing.id = p_billing_id
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
    v_updated.id,
    'billing',
    v_updated.id,
    'updated',
    to_jsonb(v_existing),
    to_jsonb(v_updated),
    auth.uid()
  );

  return v_updated;
end
$$;

create or replace function public.delete_spk_billing(p_billing_id uuid)
returns public.spk_billings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted public.spk_billings;
begin
  if not public.current_user_admin() then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  delete from public.spk_billings billing
  where billing.id = p_billing_id
  returning * into v_deleted;

  if not found then
    raise exception 'SPK billing not found' using errcode = 'P0002';
  end if;

  return v_deleted;
end
$$;

revoke all on function public.create_spk_billing(
  uuid, uuid, uuid, uuid, uuid, uuid, text, date, text, text, text,
  date, date, date, text, numeric, text, text
) from public, anon;
revoke all on function public.update_spk_billing(
  uuid, uuid, uuid, uuid, uuid, text, date, text, text, text,
  date, date, date, text, numeric, text, text
) from public, anon;
revoke all on function public.delete_spk_billing(uuid) from public, anon;

grant execute on function public.create_spk_billing(
  uuid, uuid, uuid, uuid, uuid, uuid, text, date, text, text, text,
  date, date, date, text, numeric, text, text
) to authenticated;
grant execute on function public.update_spk_billing(
  uuid, uuid, uuid, uuid, uuid, text, date, text, text, text,
  date, date, date, text, numeric, text, text
) to authenticated;
grant execute on function public.delete_spk_billing(uuid) to authenticated;

revoke insert, update, delete on public.spk_billings from authenticated;
revoke insert on public.billing_activity_log from authenticated;

comment on function public.create_spk_billing(
  uuid, uuid, uuid, uuid, uuid, uuid, text, date, text, text, text,
  date, date, date, text, numeric, text, text
) is 'Creates an SPK billing atomically and initializes stage/termin children through existing triggers.';
comment on function public.update_spk_billing(
  uuid, uuid, uuid, uuid, uuid, text, date, text, text, text,
  date, date, date, text, numeric, text, text
) is 'Updates SPK billing core fields and records an activity-log snapshot.';
comment on function public.delete_spk_billing(uuid) is
  'Deletes an SPK billing and cascades its stage, termin, and activity records.';
