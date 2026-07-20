-- Patch 8 — Legacy Billing Import, Hardening, and Final Integration Cleanup
--
-- Adds a controlled, additive import path for JSON backups produced by the
-- legacy Monitoring Billing application. The import never truncates or
-- overwrites existing Admin Management System data. Duplicate SPK numbers are
-- skipped, unresolved project/cluster labels remain nullable, and every
-- successful import is audited.

create table public.billing_import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'monitoring-billing-legacy'
    check (btrim(source) <> ''),
  file_name text,
  checksum text,
  imported_by uuid references auth.users(id) on delete set null,
  status text not null default 'completed'
    check (status in ('completed', 'completed_with_warnings')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index billing_import_runs_created_at_idx
  on public.billing_import_runs(created_at desc);
create index billing_import_runs_imported_by_idx
  on public.billing_import_runs(imported_by, created_at desc);

alter table public.billing_import_runs enable row level security;

create policy billing_import_runs_select
  on public.billing_import_runs
  for select
  to authenticated
  using (public.current_user_admin());

revoke all on table public.billing_import_runs from public, anon, authenticated;
grant select on table public.billing_import_runs to authenticated;

create function public.legacy_try_numeric(p_value text)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_value is null or btrim(p_value) = '' then
    return 0;
  end if;
  return p_value::numeric;
exception
  when invalid_text_representation or numeric_value_out_of_range then
    return 0;
end
$$;

create function public.legacy_try_timestamptz(
  p_date text,
  p_time text,
  p_fallback timestamptz default null
)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
declare
  v_value text;
begin
  if p_date is null or btrim(p_date) = '' then
    return p_fallback;
  end if;

  if position('T' in p_date) > 0 or position(' ' in btrim(p_date)) > 0 then
    return btrim(p_date)::timestamptz;
  end if;

  v_value := btrim(p_date) || ' ' || coalesce(nullif(btrim(p_time), ''), '00:00');
  return v_value::timestamptz;
exception
  when invalid_datetime_format or datetime_field_overflow then
    return p_fallback;
end
$$;

create function public.legacy_stage_code(p_key text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_key
    when 'diterimaAdmin' then 'received_admin'
    when 'biReview' then 'bi_review'
    when 'smReview' then 'sm_review'
    when 'pmReview' then 'pm_review'
    when 'gmReview' then 'gm_review'
    when 'tmReview' then 'tm_review'
    when 'awaitingScanned' then 'awaiting_scanned'
    when 'readyForPickUp' then 'ready_for_pick_up'
    when 'completed' then 'completed'
    else null
  end
$$;

create function public.import_legacy_billing_backup(
  p_payload jsonb,
  p_file_name text default null,
  p_checksum text default null,
  p_dry_run boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_record jsonb;
  v_template jsonb;
  v_master_contractor jsonb;
  v_master_status text;
  v_item jsonb;
  v_stage_pair record;
  v_termin jsonb;
  v_total integer := 0;
  v_importable integer := 0;
  v_imported integer := 0;
  v_duplicates integer := 0;
  v_invalid integer := 0;
  v_unresolved_scopes integer := 0;
  v_created_contractors integer := 0;
  v_created_statuses integer := 0;
  v_created_templates integer := 0;
  v_preview_contractors integer := 0;
  v_preview_statuses integer := 0;
  v_preview_templates integer := 0;
  v_warning_count integer := 0;
  v_warnings jsonb := '[]'::jsonb;
  v_spk_number text;
  v_scope text;
  v_contractor_name text;
  v_status_name text;
  v_work_name text;
  v_project_id uuid;
  v_cluster_id uuid;
  v_contractor_id uuid;
  v_status_id uuid;
  v_template_id uuid;
  v_billing_id uuid;
  v_template_name text;
  v_contract_value numeric(18,2);
  v_legacy_total_billed numeric(18,2);
  v_termin_total_planned numeric(18,2);
  v_termin_total_billed numeric(18,2);
  v_adjustment numeric(18,2);
  v_sequence integer;
  v_planned numeric(18,2);
  v_billed numeric(18,2);
  v_status text;
  v_created_at timestamptz;
  v_completed_at timestamptz;
  v_summary jsonb;
  v_run_status text;
  v_checksum text;
begin
  if not public.current_user_admin() then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Legacy billing payload must be a JSON object' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_payload -> 'spkRecords', '[]'::jsonb)) <> 'array' then
    raise exception 'Legacy billing payload spkRecords must be an array' using errcode = '22023';
  end if;

  v_total := jsonb_array_length(coalesce(p_payload -> 'spkRecords', '[]'::jsonb));
  if v_total > 5000 then
    raise exception 'Legacy billing import supports at most 5000 records per file' using errcode = '54000';
  end if;

  -- Preview counts. These are calculated before any mutation so dry-run and
  -- actual-import summaries use the same baseline.
  select count(*)
    into v_duplicates
  from jsonb_array_elements(coalesce(p_payload -> 'spkRecords', '[]'::jsonb)) as records(record)
  where nullif(btrim(record ->> 'nomorSpk'), '') is not null
    and exists (
      select 1
      from public.spk_billings billing
      where lower(billing.spk_number) = lower(btrim(record ->> 'nomorSpk'))
    );

  select count(*)
    into v_invalid
  from jsonb_array_elements(coalesce(p_payload -> 'spkRecords', '[]'::jsonb)) as records(record)
  where nullif(btrim(record ->> 'nomorSpk'), '') is null
     or nullif(btrim(record ->> 'namaKontraktor'), '') is null
     or nullif(btrim(record ->> 'namaPekerjaan'), '') is null;

  select count(*)
    into v_unresolved_scopes
  from jsonb_array_elements(coalesce(p_payload -> 'spkRecords', '[]'::jsonb)) as records(record)
  where nullif(btrim(record ->> 'projectCluster'), '') is not null
    and not exists (
      select 1 from public.projects project
      where lower(project.name) = lower(btrim(record ->> 'projectCluster'))
    )
    and not exists (
      select 1 from public.clusters cluster
      where lower(cluster.name) = lower(btrim(record ->> 'projectCluster'))
    );

  select count(*)
    into v_importable
  from jsonb_array_elements(coalesce(p_payload -> 'spkRecords', '[]'::jsonb)) as records(record)
  where nullif(btrim(record ->> 'nomorSpk'), '') is not null
    and nullif(btrim(record ->> 'namaKontraktor'), '') is not null
    and nullif(btrim(record ->> 'namaPekerjaan'), '') is not null
    and not exists (
      select 1
      from public.spk_billings billing
      where lower(billing.spk_number) = lower(btrim(record ->> 'nomorSpk'))
    );

  select count(*)
    into v_preview_contractors
  from (
    select distinct lower(name) as normalized_name
    from (
      select nullif(btrim(value ->> 'name'), '') as name
      from jsonb_array_elements(coalesce(p_payload -> 'masterContractors', '[]'::jsonb))
      union all
      select nullif(btrim(value ->> 'namaKontraktor'), '') as name
      from jsonb_array_elements(coalesce(p_payload -> 'spkRecords', '[]'::jsonb))
    ) candidates
    where name is not null
  ) candidate
  where not exists (
    select 1 from public.contractors contractor
    where lower(contractor.name) = candidate.normalized_name
  );

  select count(*)
    into v_preview_statuses
  from (
    select distinct lower(name) as normalized_name
    from (
      select nullif(btrim(value ->> 'name'), '') as name
      from jsonb_array_elements(coalesce(p_payload -> 'masterStatuses', '[]'::jsonb))
      union all
      select nullif(btrim(value ->> 'status'), '') as name
      from jsonb_array_elements(coalesce(p_payload -> 'spkRecords', '[]'::jsonb))
    ) candidates
    where name is not null
  ) candidate
  where not exists (
    select 1 from public.billing_statuses status
    where lower(status.name) = candidate.normalized_name
  );

  select count(*)
    into v_preview_templates
  from (
    select distinct lower(nullif(btrim(value ->> 'name'), '')) as normalized_name
    from jsonb_array_elements(coalesce(p_payload -> 'masterTerminTemplates', '[]'::jsonb))
  ) candidate
  where candidate.normalized_name is not null
    and not exists (
      select 1 from public.billing_termin_templates template
      where lower(template.name) = candidate.normalized_name
    );

  for v_record in
    select value
    from jsonb_array_elements(coalesce(p_payload -> 'spkRecords', '[]'::jsonb))
  loop
    v_spk_number := nullif(btrim(v_record ->> 'nomorSpk'), '');
    v_scope := nullif(btrim(v_record ->> 'projectCluster'), '');

    if v_spk_number is null then
      if v_warning_count < 100 then
        v_warnings := v_warnings || jsonb_build_array('Record tanpa nomor SPK dilewati.');
        v_warning_count := v_warning_count + 1;
      end if;
      continue;
    end if;

    if exists (
      select 1 from public.spk_billings billing
      where lower(billing.spk_number) = lower(v_spk_number)
    ) then
      if v_warning_count < 100 then
        v_warnings := v_warnings || jsonb_build_array(format('SPK %s sudah ada dan akan dilewati.', v_spk_number));
        v_warning_count := v_warning_count + 1;
      end if;
      continue;
    end if;

    if nullif(btrim(v_record ->> 'namaKontraktor'), '') is null
       or nullif(btrim(v_record ->> 'namaPekerjaan'), '') is null then
      if v_warning_count < 100 then
        v_warnings := v_warnings || jsonb_build_array(format('SPK %s tidak memiliki kontraktor atau nama pekerjaan dan akan dilewati.', v_spk_number));
        v_warning_count := v_warning_count + 1;
      end if;
      continue;
    end if;

    if v_scope is not null
       and not exists (select 1 from public.projects project where lower(project.name) = lower(v_scope))
       and not exists (select 1 from public.clusters cluster where lower(cluster.name) = lower(v_scope))
       and v_warning_count < 100 then
      v_warnings := v_warnings || jsonb_build_array(format('SPK %s: Project/Cluster "%s" tidak ditemukan; data akan diimpor tanpa Project dan Cluster.', v_spk_number, v_scope));
      v_warning_count := v_warning_count + 1;
    end if;
  end loop;

  if p_dry_run then
    return jsonb_build_object(
      'dry_run', true,
      'total_records', v_total,
      'importable_records', v_importable,
      'imported_records', 0,
      'duplicate_records', v_duplicates,
      'invalid_records', v_invalid,
      'unresolved_scopes', v_unresolved_scopes,
      'created_contractors', v_preview_contractors,
      'created_statuses', v_preview_statuses,
      'created_templates', v_preview_templates,
      'warnings', v_warnings
    );
  end if;

  -- Import missing contractors from both master data and record snapshots.
  for v_master_contractor in
    select distinct on (lower(name)) payload
    from (
      select
        nullif(btrim(value ->> 'name'), '') as name,
        jsonb_build_object(
          'name', nullif(btrim(value ->> 'name'), ''),
          'pic', nullif(btrim(value ->> 'pic'), ''),
          'phone', nullif(btrim(value ->> 'phone'), '')
        ) as payload
      from jsonb_array_elements(coalesce(p_payload -> 'masterContractors', '[]'::jsonb))
      union all
      select
        nullif(btrim(value ->> 'namaKontraktor'), '') as name,
        jsonb_build_object('name', nullif(btrim(value ->> 'namaKontraktor'), '')) as payload
      from jsonb_array_elements(coalesce(p_payload -> 'spkRecords', '[]'::jsonb))
    ) candidates
    where name is not null
    order by lower(name)
  loop
    if not exists (
      select 1 from public.contractors contractor
      where lower(contractor.name) = lower(v_master_contractor ->> 'name')
    ) then
      insert into public.contractors(code, name, pic_name, phone, active)
      values (
        'LEGACY-' || upper(substr(md5(lower(v_master_contractor ->> 'name')), 1, 10)),
        v_master_contractor ->> 'name',
        nullif(btrim(v_master_contractor ->> 'pic'), ''),
        nullif(btrim(v_master_contractor ->> 'phone'), ''),
        true
      );
      v_created_contractors := v_created_contractors + 1;
    end if;
  end loop;

  -- Preserve custom legacy statuses by creating missing master rows.
  for v_master_status in
    select distinct on (lower(name)) name
    from (
      select nullif(btrim(value ->> 'name'), '') as name
      from jsonb_array_elements(coalesce(p_payload -> 'masterStatuses', '[]'::jsonb))
      union all
      select nullif(btrim(value ->> 'status'), '') as name
      from jsonb_array_elements(coalesce(p_payload -> 'spkRecords', '[]'::jsonb))
    ) candidates
    where name is not null
    order by lower(name)
  loop
    if not exists (
      select 1 from public.billing_statuses status
      where lower(status.name) = lower(v_master_status)
    ) then
      insert into public.billing_statuses(
        code,
        name,
        description,
        color_key,
        sort_order,
        terminal,
        active
      )
      values (
        'legacy_' || substr(md5(lower(v_master_status)), 1, 12),
        v_master_status,
        'Status diimpor dari aplikasi Monitoring Billing legacy.',
        'gray',
        1000 + v_created_statuses,
        lower(v_master_status) in ('completed', 'cancelled', 'selesai'),
        true
      );
      v_created_statuses := v_created_statuses + 1;
    end if;
  end loop;

  -- Import missing termin templates. Existing templates are never overwritten.
  for v_template in
    select value
    from jsonb_array_elements(coalesce(p_payload -> 'masterTerminTemplates', '[]'::jsonb))
  loop
    v_template_name := nullif(btrim(v_template ->> 'name'), '');
    if v_template_name is null then
      continue;
    end if;

    select template.id
      into v_template_id
    from public.billing_termin_templates template
    where lower(template.name) = lower(v_template_name)
    limit 1;

    if v_template_id is null then
      insert into public.billing_termin_templates(code, name, description, active)
      values (
        'legacy_' || substr(md5(lower(v_template_name)), 1, 12),
        v_template_name,
        'Template diimpor dari aplikasi Monitoring Billing legacy.',
        true
      )
      returning id into v_template_id;

      v_sequence := 0;
      for v_item in
        select value
        from jsonb_array_elements(coalesce(v_template -> 'termins', '[]'::jsonb))
      loop
        if nullif(btrim(v_item ->> 'name'), '') is null then
          continue;
        end if;
        v_sequence := v_sequence + 1;
        insert into public.billing_termin_template_items(
          template_id,
          sequence_no,
          name,
          percentage,
          active
        )
        values (
          v_template_id,
          v_sequence,
          btrim(v_item ->> 'name'),
          case
            when v_item ? 'percentage' and jsonb_typeof(v_item -> 'percentage') <> 'null'
              then public.legacy_try_numeric(v_item ->> 'percentage')
            else null
          end,
          true
        );
      end loop;
      v_created_templates := v_created_templates + 1;
    end if;
  end loop;

  for v_record in
    select value
    from jsonb_array_elements(coalesce(p_payload -> 'spkRecords', '[]'::jsonb))
  loop
    v_spk_number := nullif(btrim(v_record ->> 'nomorSpk'), '');
    v_contractor_name := nullif(btrim(v_record ->> 'namaKontraktor'), '');
    v_work_name := nullif(btrim(v_record ->> 'namaPekerjaan'), '');
    v_status_name := coalesce(nullif(btrim(v_record ->> 'status'), ''), 'Open');
    v_scope := nullif(btrim(v_record ->> 'projectCluster'), '');

    if v_spk_number is null or v_contractor_name is null or v_work_name is null then
      continue;
    end if;

    if exists (
      select 1 from public.spk_billings billing
      where lower(billing.spk_number) = lower(v_spk_number)
    ) then
      continue;
    end if;

    v_project_id := null;
    v_cluster_id := null;

    if v_scope is not null then
      select cluster.id, cluster.project_id
        into v_cluster_id, v_project_id
      from public.clusters cluster
      where lower(cluster.name) = lower(v_scope)
      order by cluster.created_at
      limit 1;

      if v_cluster_id is null then
        select project.id
          into v_project_id
        from public.projects project
        where lower(project.name) = lower(v_scope)
        order by project.created_at
        limit 1;
      end if;
    end if;

    select contractor.id
      into v_contractor_id
    from public.contractors contractor
    where lower(contractor.name) = lower(v_contractor_name)
    limit 1;

    select status.id
      into v_status_id
    from public.billing_statuses status
    where lower(status.name) = lower(v_status_name)
       or lower(status.code) = lower(v_status_name)
    order by status.active desc, status.sort_order
    limit 1;

    if v_status_id is null then
      select status.id
        into v_status_id
      from public.billing_statuses status
      where lower(status.code) = 'open'
      limit 1;
    end if;

    v_template_id := null;
    v_template_name := null;
    if nullif(btrim(v_record ->> 'terminTemplateId'), '') is not null then
      select template_payload ->> 'name'
        into v_template_name
      from jsonb_array_elements(coalesce(p_payload -> 'masterTerminTemplates', '[]'::jsonb)) as templates(template_payload)
      where template_payload ->> 'id' = v_record ->> 'terminTemplateId'
      limit 1;

      if v_template_name is not null then
        select template.id
          into v_template_id
        from public.billing_termin_templates template
        where lower(template.name) = lower(v_template_name)
        limit 1;
      end if;
    end if;

    select
      coalesce(sum(greatest(
        public.legacy_try_numeric(termin ->> 'nilaiTermin'),
        public.legacy_try_numeric(termin ->> 'nilaiDitagihkan')
      )), 0),
      coalesce(sum(public.legacy_try_numeric(termin ->> 'nilaiDitagihkan')), 0)
    into v_termin_total_planned, v_termin_total_billed
    from jsonb_array_elements(coalesce(v_record -> 'termins', '[]'::jsonb)) as termins(termin);

    v_legacy_total_billed := public.legacy_try_numeric(v_record ->> 'nilaiDitagihkan');
    v_contract_value := greatest(
      public.legacy_try_numeric(v_record ->> 'nilaiSpk'),
      v_legacy_total_billed,
      v_termin_total_planned + greatest(v_legacy_total_billed - v_termin_total_billed, 0),
      0
    );
    v_created_at := public.legacy_try_timestamptz(
      v_record ->> 'createdAt',
      null,
      now()
    );

    insert into public.spk_billings(
      surat_penunjukan_id,
      project_id,
      cluster_id,
      contractor_id,
      termin_template_id,
      billing_status_id,
      spk_number,
      contractor_name_snapshot,
      work_name,
      work_location,
      stage_weight,
      contract_value,
      document_drive_url,
      notes,
      created_at
    )
    values (
      null,
      v_project_id,
      v_cluster_id,
      v_contractor_id,
      null,
      v_status_id,
      v_spk_number,
      v_contractor_name,
      v_work_name,
      nullif(btrim(v_record ->> 'lokasiPekerjaan'), ''),
      nullif(btrim(v_record ->> 'bobotTahapan'), ''),
      v_contract_value,
      nullif(btrim(v_record ->> 'linkGdrive'), ''),
      'Diimpor dari aplikasi Monitoring Billing legacy.',
      v_created_at
    )
    returning id into v_billing_id;

    -- Apply legacy approval state onto rows created by the standard insert trigger.
    for v_stage_pair in
      select key, value
      from jsonb_each(coalesce(v_record -> 'stages', '{}'::jsonb))
    loop
      if public.legacy_stage_code(v_stage_pair.key) is null then
        continue;
      end if;

      v_status := case v_stage_pair.value ->> 'status'
        when 'Selesai' then 'completed'
        when 'Proses' then 'in_progress'
        else 'not_started'
      end;

      v_completed_at := case
        when v_status = 'completed' then public.legacy_try_timestamptz(
          v_stage_pair.value ->> 'date',
          v_stage_pair.value ->> 'time',
          v_created_at
        )
        else null
      end;

      update public.billing_stage_progress progress
      set
        status = v_status,
        completed_at = v_completed_at,
        note = nullif(btrim(v_stage_pair.value ->> 'note'), '')
      from public.billing_stage_definitions definition
      where progress.billing_id = v_billing_id
        and progress.stage_definition_id = definition.id
        and definition.code = public.legacy_stage_code(v_stage_pair.key);
    end loop;

    delete from public.billing_termins termin
    where termin.billing_id = v_billing_id;

    v_sequence := 0;
    v_termin_total_billed := 0;
    for v_termin in
      select value
      from jsonb_array_elements(coalesce(v_record -> 'termins', '[]'::jsonb))
    loop
      if nullif(btrim(v_termin ->> 'name'), '') is null then
        continue;
      end if;

      v_sequence := v_sequence + 1;
      v_billed := greatest(public.legacy_try_numeric(v_termin ->> 'nilaiDitagihkan'), 0);
      v_planned := greatest(public.legacy_try_numeric(v_termin ->> 'nilaiTermin'), v_billed, 0);
      v_termin_total_billed := v_termin_total_billed + v_billed;

      v_status := case
        when v_billed > 0 then 'billed'
        when v_termin ->> 'status' = 'Sedang Diproses' then 'in_process'
        else 'not_billed'
      end;

      insert into public.billing_termins(
        billing_id,
        sequence_no,
        name,
        percentage,
        planned_amount,
        billed_amount,
        paid_amount,
        status,
        billed_date,
        notes
      )
      values (
        v_billing_id,
        v_sequence,
        btrim(v_termin ->> 'name'),
        case
          when v_termin ? 'percentage' and jsonb_typeof(v_termin -> 'percentage') <> 'null'
            then public.legacy_try_numeric(v_termin ->> 'percentage')
          else null
        end,
        v_planned,
        v_billed,
        0,
        v_status,
        case when v_billed > 0 then v_created_at::date else null end,
        'Diimpor dari termin Monitoring Billing legacy.'
      );
    end loop;

    v_adjustment := greatest(v_legacy_total_billed - v_termin_total_billed, 0);
    if v_adjustment > 0 then
      v_sequence := v_sequence + 1;
      insert into public.billing_termins(
        billing_id,
        sequence_no,
        name,
        planned_amount,
        billed_amount,
        paid_amount,
        status,
        billed_date,
        notes
      )
      values (
        v_billing_id,
        v_sequence,
        'Penyesuaian Import Legacy',
        v_adjustment,
        v_adjustment,
        0,
        'billed',
        v_created_at::date,
        'Penyesuaian agar total tagihan sama dengan nilai legacy.'
      );
    end if;

    if v_template_id is not null then
      update public.spk_billings billing
      set termin_template_id = v_template_id
      where billing.id = v_billing_id;
    end if;

    insert into public.billing_activity_log(
      billing_id,
      entity_type,
      action,
      new_value,
      actor_user_id
    )
    values (
      v_billing_id,
      'billing',
      'legacy_imported',
      jsonb_build_object(
        'source_id', v_record ->> 'id',
        'source_created_at', v_record ->> 'createdAt',
        'source_updated_at', v_record ->> 'updatedAt'
      ),
      auth.uid()
    );

    v_imported := v_imported + 1;
  end loop;

  v_checksum := nullif(btrim(p_checksum), '');
  v_run_status := case when jsonb_array_length(v_warnings) > 0 then 'completed_with_warnings' else 'completed' end;

  v_summary := jsonb_build_object(
    'dry_run', false,
    'total_records', v_total,
    'importable_records', v_importable,
    'imported_records', v_imported,
    'duplicate_records', v_duplicates,
    'invalid_records', v_invalid,
    'unresolved_scopes', v_unresolved_scopes,
    'created_contractors', v_created_contractors,
    'created_statuses', v_created_statuses,
    'created_templates', v_created_templates,
    'warnings', v_warnings
  );

  insert into public.billing_import_runs(
    source,
    file_name,
    checksum,
    imported_by,
    status,
    summary
  )
  values (
    'monitoring-billing-legacy',
    nullif(btrim(p_file_name), ''),
    v_checksum,
    auth.uid(),
    v_run_status,
    v_summary
  );

  return v_summary;
end
$$;

create function public.list_billing_import_runs()
returns setof public.billing_import_runs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.current_user_admin() then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  return query
  select run.*
  from public.billing_import_runs run
  order by run.created_at desc
  limit 25;
end
$$;

revoke all on function public.legacy_try_numeric(text) from public, anon, authenticated;
revoke all on function public.legacy_try_timestamptz(text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.legacy_stage_code(text) from public, anon, authenticated;
revoke all on function public.import_legacy_billing_backup(jsonb,text,text,boolean) from public, anon, authenticated;
revoke all on function public.list_billing_import_runs() from public, anon, authenticated;

grant execute on function public.import_legacy_billing_backup(jsonb,text,text,boolean) to authenticated;
grant execute on function public.list_billing_import_runs() to authenticated;

comment on table public.billing_import_runs is
  'Audit log for additive imports from the legacy Monitoring Billing JSON backup format.';
comment on function public.import_legacy_billing_backup(jsonb,text,text,boolean) is
  'Admin-only dry-run and additive import for legacy Monitoring Billing JSON backups. Existing SPK numbers are never overwritten.';
