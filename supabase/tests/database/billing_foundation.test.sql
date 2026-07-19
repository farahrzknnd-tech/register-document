begin;

create extension if not exists pgtap with schema extensions;

select plan(29);

select extensions.ok(to_regclass('public.contractors') is not null, 'contractors table exists');
select extensions.ok(to_regclass('public.billing_statuses') is not null, 'billing_statuses table exists');
select extensions.ok(to_regclass('public.billing_stage_definitions') is not null, 'billing_stage_definitions table exists');
select extensions.ok(to_regclass('public.billing_termin_templates') is not null, 'billing_termin_templates table exists');
select extensions.ok(to_regclass('public.billing_termin_template_items') is not null, 'billing_termin_template_items table exists');
select extensions.ok(to_regclass('public.spk_billings') is not null, 'spk_billings table exists');
select extensions.ok(to_regclass('public.billing_stage_progress') is not null, 'billing_stage_progress table exists');
select extensions.ok(to_regclass('public.billing_termins') is not null, 'billing_termins table exists');
select extensions.ok(to_regclass('public.billing_activity_log') is not null, 'billing_activity_log table exists');
select extensions.ok(to_regclass('public.spk_billing_financial_summary') is not null, 'financial summary view exists');

select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.spk_billings'::regclass
      and conname = 'spk_billings_surat_penunjukan_id_fkey'
      and contype = 'f'
  ),
  'spk_billings references surat_penunjukan'
);
select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.spk_billings'::regclass
      and conname = 'spk_billings_project_id_fkey'
      and contype = 'f'
  ),
  'spk_billings references projects'
);
select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.spk_billings'::regclass
      and conname = 'spk_billings_cluster_id_fkey'
      and contype = 'f'
  ),
  'spk_billings references clusters'
);
select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.spk_billings'::regclass
      and conname = 'spk_billings_contractor_id_fkey'
      and contype = 'f'
  ),
  'spk_billings references contractors'
);
select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.spk_billings'::regclass
      and conname = 'spk_billings_billing_status_id_fkey'
      and contype = 'f'
  ),
  'spk_billings references billing statuses'
);

select extensions.ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'spk_billings_surat_penunjukan_unique'
  ),
  'one billing record per surat penunjukan is enforced'
);
select extensions.ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.spk_billings'::regclass
      and tgname = 'spk_billings_initialize_children'
      and not tgisinternal
  ),
  'billing child initialization trigger exists'
);
select extensions.ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.billing_termins'::regclass
      and tgname = 'billing_termins_validate_totals'
      and not tgisinternal
  ),
  'termin total validation trigger exists'
);

select extensions.ok(
  (
    select count(*) = 9
    from pg_class class
    join pg_namespace namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname in (
        'contractors',
        'billing_statuses',
        'billing_stage_definitions',
        'billing_termin_templates',
        'billing_termin_template_items',
        'spk_billings',
        'billing_stage_progress',
        'billing_termins',
        'billing_activity_log'
      )
      and class.relrowsecurity
  ),
  'RLS is enabled on every billing table'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.spk_billings', 'select'),
  'anonymous cannot select billing records'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.spk_billings', 'insert'),
  'anonymous cannot insert billing records'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.spk_billings', 'select'),
  'authenticated receives table select privilege governed by RLS'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.spk_billings', 'insert'),
  'authenticated receives table insert privilege governed by admin RLS'
);
select extensions.ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'spk_billings'
      and policyname = 'spk_billings_select'
  ),
  'billing viewer/select policy exists'
);
select extensions.ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'spk_billings'
      and policyname = 'spk_billings_insert'
  ),
  'billing admin/insert policy exists'
);

select extensions.is((select count(*)::integer from public.billing_statuses), 5, 'five default billing statuses are seeded');
select extensions.is((select count(*)::integer from public.billing_stage_definitions), 9, 'nine approval stages are seeded');
select extensions.is((select count(*)::integer from public.billing_termin_templates), 2, 'two termin templates are seeded');
select extensions.is((select count(*)::integer from public.billing_termin_template_items), 17, 'termin template items are seeded');

select * from extensions.finish();
rollback;
