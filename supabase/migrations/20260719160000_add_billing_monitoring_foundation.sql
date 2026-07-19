-- Billing Monitoring Foundation
--
-- Register Document remains the host application. This migration introduces the
-- relational foundation required to port the Monitoring Billing business module
-- without copying its insecure anonymous policies or duplicate master-project data.

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null check (btrim(name) <> ''),
  pic_name text,
  phone text,
  email text,
  address text,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index contractors_code_lower_key
  on public.contractors (lower(code))
  where code is not null;
create unique index contractors_name_lower_key
  on public.contractors (lower(name));
create index contractors_active_name_idx
  on public.contractors (active, name);

create table public.billing_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  description text,
  color_key text not null default 'gray'
    check (color_key in ('gray', 'blue', 'amber', 'green', 'red', 'purple')),
  sort_order integer not null default 0 check (sort_order >= 0),
  terminal boolean not null default false,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index billing_statuses_code_lower_key
  on public.billing_statuses (lower(code));
create unique index billing_statuses_name_lower_key
  on public.billing_statuses (lower(name));
create index billing_statuses_active_sort_idx
  on public.billing_statuses (active, sort_order, name);

create table public.billing_stage_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  description text,
  sort_order integer not null check (sort_order >= 0),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index billing_stage_definitions_code_lower_key
  on public.billing_stage_definitions (lower(code));
create unique index billing_stage_definitions_sort_order_key
  on public.billing_stage_definitions (sort_order);
create index billing_stage_definitions_active_sort_idx
  on public.billing_stage_definitions (active, sort_order);

create table public.billing_termin_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  description text,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index billing_termin_templates_code_lower_key
  on public.billing_termin_templates (lower(code));
create unique index billing_termin_templates_name_lower_key
  on public.billing_termin_templates (lower(name));
create index billing_termin_templates_active_name_idx
  on public.billing_termin_templates (active, name);

create table public.billing_termin_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null
    constraint billing_termin_template_items_template_id_fkey
    references public.billing_termin_templates(id) on delete cascade,
  sequence_no integer not null check (sequence_no > 0),
  name text not null check (btrim(name) <> ''),
  percentage numeric(7,4)
    check (percentage is null or (percentage >= 0 and percentage <= 100)),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_termin_template_items_sequence_key
    unique (template_id, sequence_no)
);

create unique index billing_termin_template_items_name_lower_key
  on public.billing_termin_template_items (template_id, lower(name));
create index billing_termin_template_items_template_sort_idx
  on public.billing_termin_template_items (template_id, active, sequence_no);

create table public.spk_billings (
  id uuid primary key default gen_random_uuid(),
  surat_penunjukan_id uuid
    constraint spk_billings_surat_penunjukan_id_fkey
    references public.surat_penunjukan(id) on delete restrict,
  project_id uuid
    constraint spk_billings_project_id_fkey
    references public.projects(id) on delete restrict,
  cluster_id uuid
    constraint spk_billings_cluster_id_fkey
    references public.clusters(id) on delete restrict,
  contractor_id uuid
    constraint spk_billings_contractor_id_fkey
    references public.contractors(id) on delete restrict,
  termin_template_id uuid
    constraint spk_billings_termin_template_id_fkey
    references public.billing_termin_templates(id) on delete restrict,
  billing_status_id uuid not null
    constraint spk_billings_billing_status_id_fkey
    references public.billing_statuses(id) on delete restrict,
  spk_number text not null check (btrim(spk_number) <> ''),
  spk_date date,
  contractor_name_snapshot text not null
    check (btrim(contractor_name_snapshot) <> ''),
  work_name text not null check (btrim(work_name) <> ''),
  work_location text,
  work_start_date date,
  work_finish_date date,
  kickoff_date date,
  stage_weight text,
  contract_value numeric(18,2) not null default 0
    check (contract_value >= 0),
  document_drive_url text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spk_billings_work_dates_check
    check (
      work_finish_date is null
      or work_start_date is null
      or work_finish_date >= work_start_date
    )
);

create unique index spk_billings_spk_number_lower_key
  on public.spk_billings (lower(spk_number));
create unique index spk_billings_surat_penunjukan_unique
  on public.spk_billings (surat_penunjukan_id)
  where surat_penunjukan_id is not null;
create index spk_billings_project_idx on public.spk_billings(project_id);
create index spk_billings_cluster_idx on public.spk_billings(cluster_id);
create index spk_billings_contractor_idx on public.spk_billings(contractor_id);
create index spk_billings_status_idx on public.spk_billings(billing_status_id);
create index spk_billings_created_at_idx on public.spk_billings(created_at desc);

create table public.billing_stage_progress (
  id uuid primary key default gen_random_uuid(),
  billing_id uuid not null
    constraint billing_stage_progress_billing_id_fkey
    references public.spk_billings(id) on delete cascade,
  stage_definition_id uuid not null
    constraint billing_stage_progress_stage_definition_id_fkey
    references public.billing_stage_definitions(id) on delete restrict,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'skipped')),
  completed_at timestamptz,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_stage_progress_billing_stage_key
    unique (billing_id, stage_definition_id),
  constraint billing_stage_progress_completion_check
    check (
      (status = 'completed' and completed_at is not null)
      or (status <> 'completed' and completed_at is null)
    )
);

create index billing_stage_progress_billing_idx
  on public.billing_stage_progress (billing_id);
create index billing_stage_progress_stage_status_idx
  on public.billing_stage_progress (stage_definition_id, status);

create table public.billing_termins (
  id uuid primary key default gen_random_uuid(),
  billing_id uuid not null
    constraint billing_termins_billing_id_fkey
    references public.spk_billings(id) on delete cascade,
  template_item_id uuid
    constraint billing_termins_template_item_id_fkey
    references public.billing_termin_template_items(id) on delete set null,
  sequence_no integer not null check (sequence_no > 0),
  name text not null check (btrim(name) <> ''),
  percentage numeric(7,4)
    check (percentage is null or (percentage >= 0 and percentage <= 100)),
  planned_amount numeric(18,2) not null default 0
    check (planned_amount >= 0),
  billed_amount numeric(18,2) not null default 0
    check (billed_amount >= 0),
  paid_amount numeric(18,2) not null default 0
    check (paid_amount >= 0),
  status text not null default 'not_billed'
    check (status in ('not_billed', 'in_process', 'billed', 'partially_paid', 'paid', 'cancelled')),
  billed_date date,
  paid_date date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_termins_billing_sequence_key unique (billing_id, sequence_no),
  constraint billing_termins_amounts_check check (
    billed_amount <= planned_amount
    and paid_amount <= billed_amount
  ),
  constraint billing_termins_billed_date_check check (
    billed_amount = 0 or billed_date is not null
  ),
  constraint billing_termins_paid_date_check check (
    paid_amount = 0 or paid_date is not null
  )
);

create index billing_termins_billing_idx
  on public.billing_termins (billing_id, sequence_no);
create index billing_termins_status_idx
  on public.billing_termins (status);

create table public.billing_activity_log (
  id uuid primary key default gen_random_uuid(),
  billing_id uuid not null
    constraint billing_activity_log_billing_id_fkey
    references public.spk_billings(id) on delete cascade,
  entity_type text not null default 'billing'
    check (entity_type in ('billing', 'stage', 'termin')),
  entity_id uuid,
  action text not null check (btrim(action) <> ''),
  old_value jsonb,
  new_value jsonb,
  actor_user_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index billing_activity_log_billing_created_idx
  on public.billing_activity_log (billing_id, created_at desc);
create index billing_activity_log_actor_idx
  on public.billing_activity_log (actor_user_id, created_at desc);

create or replace function public.billing_touch_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();

  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.created_by := auth.uid();
    end if;
  end if;

  if auth.uid() is not null then
    new.updated_by := auth.uid();
  else
    new.updated_by := coalesce(new.updated_by, new.created_by);
  end if;
  return new;
end
$$;

create trigger contractors_touch_audit
before insert or update on public.contractors
for each row execute function public.billing_touch_audit_fields();

create trigger billing_statuses_touch_audit
before insert or update on public.billing_statuses
for each row execute function public.billing_touch_audit_fields();

create trigger billing_stage_definitions_touch_audit
before insert or update on public.billing_stage_definitions
for each row execute function public.billing_touch_audit_fields();

create trigger billing_termin_templates_touch_audit
before insert or update on public.billing_termin_templates
for each row execute function public.billing_touch_audit_fields();

create trigger billing_termin_template_items_touch_audit
before insert or update on public.billing_termin_template_items
for each row execute function public.billing_touch_audit_fields();

create trigger spk_billings_touch_audit
before insert or update on public.spk_billings
for each row execute function public.billing_touch_audit_fields();

create trigger billing_stage_progress_touch_audit
before insert or update on public.billing_stage_progress
for each row execute function public.billing_touch_audit_fields();

create trigger billing_termins_touch_audit
before insert or update on public.billing_termins
for each row execute function public.billing_touch_audit_fields();

create or replace function public.initialize_spk_billing_children()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.billing_stage_progress (
    billing_id,
    stage_definition_id,
    status,
    completed_at,
    note,
    created_by,
    updated_by
  )
  select
    new.id,
    stage.id,
    case when stage.code = 'received_admin' then 'completed' else 'not_started' end,
    case when stage.code = 'received_admin' then now() else null end,
    case when stage.code = 'received_admin' then 'Dokumen diterima oleh Admin Project' else null end,
    new.created_by,
    new.updated_by
  from public.billing_stage_definitions stage
  where stage.active
  order by stage.sort_order;

  if new.termin_template_id is not null then
    insert into public.billing_termins (
      billing_id,
      template_item_id,
      sequence_no,
      name,
      percentage,
      planned_amount,
      created_by,
      updated_by
    )
    select
      new.id,
      item.id,
      item.sequence_no,
      item.name,
      item.percentage,
      case
        when item.percentage is null then 0
        else round(new.contract_value * item.percentage / 100, 2)
      end,
      new.created_by,
      new.updated_by
    from public.billing_termin_template_items item
    where item.template_id = new.termin_template_id
      and item.active
    order by item.sequence_no;
  end if;

  return new;
end
$$;

create trigger spk_billings_initialize_children
after insert on public.spk_billings
for each row execute function public.initialize_spk_billing_children();

create or replace function public.validate_billing_termin_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_billing_id uuid;
  v_contract_value numeric(18,2);
  v_percentage numeric(18,4);
  v_planned numeric(18,2);
  v_billed numeric(18,2);
  v_paid numeric(18,2);
begin
  if tg_op = 'DELETE' then
    v_billing_id := old.billing_id;
  else
    v_billing_id := new.billing_id;
  end if;

  select contract_value
    into v_contract_value
  from public.spk_billings
  where id = v_billing_id;

  if not found then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select
    coalesce(sum(percentage), 0),
    coalesce(sum(planned_amount), 0),
    coalesce(sum(billed_amount), 0),
    coalesce(sum(paid_amount), 0)
  into v_percentage, v_planned, v_billed, v_paid
  from public.billing_termins
  where billing_id = v_billing_id
    and status <> 'cancelled';

  if v_percentage > 100 then
    raise exception 'Billing termin percentage exceeds 100 percent'
      using errcode = '23514';
  end if;

  if v_planned > v_contract_value then
    raise exception 'Billing planned amount exceeds contract value'
      using errcode = '23514';
  end if;

  if v_billed > v_contract_value then
    raise exception 'Billing billed amount exceeds contract value'
      using errcode = '23514';
  end if;

  if v_paid > v_billed then
    raise exception 'Billing paid amount exceeds billed amount'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

create constraint trigger billing_termins_validate_totals
after insert or update or delete on public.billing_termins
deferrable initially deferred
for each row execute function public.validate_billing_termin_totals();

create view public.spk_billing_financial_summary
with (security_invoker = true)
as
select
  billing.id as billing_id,
  billing.contract_value,
  coalesce(sum(termin.planned_amount) filter (where termin.status <> 'cancelled'), 0)::numeric(18,2)
    as total_planned,
  coalesce(sum(termin.billed_amount) filter (where termin.status <> 'cancelled'), 0)::numeric(18,2)
    as total_billed,
  coalesce(sum(termin.paid_amount) filter (where termin.status <> 'cancelled'), 0)::numeric(18,2)
    as total_paid,
  greatest(
    billing.contract_value
      - coalesce(sum(termin.billed_amount) filter (where termin.status <> 'cancelled'), 0),
    0
  )::numeric(18,2) as remaining_contract,
  case
    when billing.contract_value = 0 then 0
    else round(
      coalesce(sum(termin.billed_amount) filter (where termin.status <> 'cancelled'), 0)
        / billing.contract_value * 100,
      2
    )
  end::numeric(7,2) as billing_percentage,
  case
    when coalesce(sum(termin.billed_amount) filter (where termin.status <> 'cancelled'), 0) = 0 then 0
    else round(
      coalesce(sum(termin.paid_amount) filter (where termin.status <> 'cancelled'), 0)
        / coalesce(sum(termin.billed_amount) filter (where termin.status <> 'cancelled'), 0) * 100,
      2
    )
  end::numeric(7,2) as payment_percentage
from public.spk_billings billing
left join public.billing_termins termin on termin.billing_id = billing.id
group by billing.id, billing.contract_value;

insert into public.billing_statuses (
  code,
  name,
  description,
  color_key,
  sort_order,
  terminal
)
values
  ('open', 'Open', 'Monitoring baru dibuat dan belum diproses.', 'gray', 10, false),
  ('in_progress', 'In Progress', 'Dokumen atau tagihan sedang diproses.', 'blue', 20, false),
  ('on_hold', 'On Hold', 'Proses ditahan sementara.', 'amber', 30, false),
  ('completed', 'Completed', 'Seluruh proses monitoring selesai.', 'green', 40, true),
  ('cancelled', 'Cancelled', 'Monitoring dibatalkan.', 'red', 50, true);

insert into public.billing_stage_definitions (code, name, sort_order)
values
  ('received_admin', 'Dokumen Diterima Admin', 10),
  ('bi_review', 'BI Review & Signed', 20),
  ('sm_review', 'SM Review & Signed', 30),
  ('pm_review', 'PM Review & Signed', 40),
  ('gm_review', 'GM Review & Signed', 50),
  ('tm_review', 'TM Review & Signed', 60),
  ('awaiting_scanned', 'Awaiting Scanned', 70),
  ('ready_for_pick_up', 'Ready For Pick Up', 80),
  ('completed', 'Completed', 90);

insert into public.billing_termin_templates (code, name, description)
values
  ('termin_bertahap', 'Termin Bertahap', 'Template termin pekerjaan bertahap dan retensi.'),
  ('bast', 'BAST', 'Template termin berbasis berita acara serah terima.');

insert into public.billing_termin_template_items (
  template_id,
  sequence_no,
  name,
  percentage
)
select template.id, item.sequence_no, item.name, item.percentage
from public.billing_termin_templates template
join (
  values
    ('termin_bertahap', 1, 'Uang Muka', null::numeric),
    ('termin_bertahap', 2, 'Tahap 1', null::numeric),
    ('termin_bertahap', 3, 'Tahap 2', null::numeric),
    ('termin_bertahap', 4, 'Tahap 3', null::numeric),
    ('termin_bertahap', 5, 'Tahap 4', null::numeric),
    ('termin_bertahap', 6, 'Tahap 5', null::numeric),
    ('termin_bertahap', 7, 'Tahap 6', null::numeric),
    ('termin_bertahap', 8, 'Tahap 7', null::numeric),
    ('termin_bertahap', 9, 'Tahap 8', null::numeric),
    ('termin_bertahap', 10, 'Tahap 9', null::numeric),
    ('termin_bertahap', 11, 'Tahap 10 (100%)', null::numeric),
    ('termin_bertahap', 12, 'Retensi 1', null::numeric),
    ('termin_bertahap', 13, 'Retensi 2', null::numeric),
    ('termin_bertahap', 14, 'Jaminan Kebocoran', null::numeric),
    ('bast', 1, 'Persentase Pekerjaan', null::numeric),
    ('bast', 2, 'BAST 1 (100%)', null::numeric),
    ('bast', 3, 'Retensi 5%', null::numeric)
) as item(template_code, sequence_no, name, percentage)
  on item.template_code = template.code;

alter table public.contractors enable row level security;
alter table public.billing_statuses enable row level security;
alter table public.billing_stage_definitions enable row level security;
alter table public.billing_termin_templates enable row level security;
alter table public.billing_termin_template_items enable row level security;
alter table public.spk_billings enable row level security;
alter table public.billing_stage_progress enable row level security;
alter table public.billing_termins enable row level security;
alter table public.billing_activity_log enable row level security;

create policy contractors_select
  on public.contractors for select to authenticated
  using (public.current_user_active());
create policy contractors_insert
  on public.contractors for insert to authenticated
  with check (public.current_user_admin());
create policy contractors_update
  on public.contractors for update to authenticated
  using (public.current_user_admin())
  with check (public.current_user_admin());
create policy contractors_delete
  on public.contractors for delete to authenticated
  using (public.current_user_admin());

create policy billing_statuses_select
  on public.billing_statuses for select to authenticated
  using (public.current_user_active());
create policy billing_statuses_insert
  on public.billing_statuses for insert to authenticated
  with check (public.current_user_admin());
create policy billing_statuses_update
  on public.billing_statuses for update to authenticated
  using (public.current_user_admin())
  with check (public.current_user_admin());
create policy billing_statuses_delete
  on public.billing_statuses for delete to authenticated
  using (public.current_user_admin());

create policy billing_stage_definitions_select
  on public.billing_stage_definitions for select to authenticated
  using (public.current_user_active());
create policy billing_stage_definitions_insert
  on public.billing_stage_definitions for insert to authenticated
  with check (public.current_user_admin());
create policy billing_stage_definitions_update
  on public.billing_stage_definitions for update to authenticated
  using (public.current_user_admin())
  with check (public.current_user_admin());
create policy billing_stage_definitions_delete
  on public.billing_stage_definitions for delete to authenticated
  using (public.current_user_admin());

create policy billing_termin_templates_select
  on public.billing_termin_templates for select to authenticated
  using (public.current_user_active());
create policy billing_termin_templates_insert
  on public.billing_termin_templates for insert to authenticated
  with check (public.current_user_admin());
create policy billing_termin_templates_update
  on public.billing_termin_templates for update to authenticated
  using (public.current_user_admin())
  with check (public.current_user_admin());
create policy billing_termin_templates_delete
  on public.billing_termin_templates for delete to authenticated
  using (public.current_user_admin());

create policy billing_termin_template_items_select
  on public.billing_termin_template_items for select to authenticated
  using (public.current_user_active());
create policy billing_termin_template_items_insert
  on public.billing_termin_template_items for insert to authenticated
  with check (public.current_user_admin());
create policy billing_termin_template_items_update
  on public.billing_termin_template_items for update to authenticated
  using (public.current_user_admin())
  with check (public.current_user_admin());
create policy billing_termin_template_items_delete
  on public.billing_termin_template_items for delete to authenticated
  using (public.current_user_admin());

create policy spk_billings_select
  on public.spk_billings for select to authenticated
  using (public.current_user_active());
create policy spk_billings_insert
  on public.spk_billings for insert to authenticated
  with check (public.current_user_admin());
create policy spk_billings_update
  on public.spk_billings for update to authenticated
  using (public.current_user_admin())
  with check (public.current_user_admin());
create policy spk_billings_delete
  on public.spk_billings for delete to authenticated
  using (public.current_user_admin());

create policy billing_stage_progress_select
  on public.billing_stage_progress for select to authenticated
  using (public.current_user_active());
create policy billing_stage_progress_insert
  on public.billing_stage_progress for insert to authenticated
  with check (public.current_user_admin());
create policy billing_stage_progress_update
  on public.billing_stage_progress for update to authenticated
  using (public.current_user_admin())
  with check (public.current_user_admin());
create policy billing_stage_progress_delete
  on public.billing_stage_progress for delete to authenticated
  using (public.current_user_admin());

create policy billing_termins_select
  on public.billing_termins for select to authenticated
  using (public.current_user_active());
create policy billing_termins_insert
  on public.billing_termins for insert to authenticated
  with check (public.current_user_admin());
create policy billing_termins_update
  on public.billing_termins for update to authenticated
  using (public.current_user_admin())
  with check (public.current_user_admin());
create policy billing_termins_delete
  on public.billing_termins for delete to authenticated
  using (public.current_user_admin());

create policy billing_activity_log_select
  on public.billing_activity_log for select to authenticated
  using (public.current_user_active());
create policy billing_activity_log_insert
  on public.billing_activity_log for insert to authenticated
  with check (
    public.current_user_admin()
    and actor_user_id = auth.uid()
  );

revoke all on public.contractors from public, anon;
revoke all on public.billing_statuses from public, anon;
revoke all on public.billing_stage_definitions from public, anon;
revoke all on public.billing_termin_templates from public, anon;
revoke all on public.billing_termin_template_items from public, anon;
revoke all on public.spk_billings from public, anon;
revoke all on public.billing_stage_progress from public, anon;
revoke all on public.billing_termins from public, anon;
revoke all on public.billing_activity_log from public, anon;
revoke all on public.spk_billing_financial_summary from public, anon;

revoke all on function public.billing_touch_audit_fields() from public, anon, authenticated;
revoke all on function public.initialize_spk_billing_children() from public, anon, authenticated;
revoke all on function public.validate_billing_termin_totals() from public, anon, authenticated;

grant select, insert, update, delete
  on public.contractors,
     public.billing_statuses,
     public.billing_stage_definitions,
     public.billing_termin_templates,
     public.billing_termin_template_items,
     public.spk_billings,
     public.billing_stage_progress,
     public.billing_termins
  to authenticated;

grant select, insert on public.billing_activity_log to authenticated;
grant select on public.spk_billing_financial_summary to authenticated;

comment on table public.spk_billings is
  'SPK billing monitoring records integrated with Register Document. Project and cluster are optional and independent.';
comment on view public.spk_billing_financial_summary is
  'Derived billing totals. Billing and payment totals must not be stored as editable duplicates on spk_billings.';
