begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select extensions.has_table(
  'public',
  'billing_import_runs',
  'billing import audit table exists'
);

select extensions.has_function(
  'public',
  'import_legacy_billing_backup',
  array['jsonb','text','text','boolean'],
  'legacy billing import RPC exists'
);

select extensions.has_function(
  'public',
  'list_billing_import_runs',
  array[]::text[],
  'billing import history RPC exists'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.import_legacy_billing_backup(jsonb,text,text,boolean)',
    'execute'
  ),
  'authenticated can reach import RPC subject to internal admin validation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.import_legacy_billing_backup(jsonb,text,text,boolean)',
    'execute'
  ),
  'anonymous cannot execute legacy import'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.list_billing_import_runs()',
    'execute'
  ),
  'authenticated can reach import history subject to internal admin validation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.list_billing_import_runs()',
    'execute'
  ),
  'anonymous cannot list import history'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.billing_import_runs', 'select'),
  'authenticated retains read privilege governed by admin-only RLS'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.billing_import_runs', 'insert'),
  'browser roles cannot directly create import audit rows'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.billing_import_runs', 'update'),
  'browser roles cannot modify import audit rows'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.billing_import_runs', 'delete'),
  'browser roles cannot delete import audit rows'
);

select extensions.ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_import_runs'
      and policyname = 'billing_import_runs_select'
  ),
  'import audit history is protected by RLS'
);

select * from extensions.finish();
rollback;
