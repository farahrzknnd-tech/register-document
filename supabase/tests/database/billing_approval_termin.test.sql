begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

select extensions.has_function(
  'public',
  'update_billing_stage_progress',
  array['uuid','text','timestamp with time zone','text'],
  'stage progress update RPC exists'
);

select extensions.has_function(
  'public',
  'sync_billing_stage_progress',
  array['uuid'],
  'stage synchronization RPC exists'
);

select extensions.has_function(
  'public',
  'save_billing_termin',
  array['uuid','integer','text','numeric','numeric','numeric','text','uuid','numeric','date','date','text'],
  'termin save RPC exists'
);

select extensions.has_function(
  'public',
  'delete_billing_termin',
  array['uuid'],
  'termin delete RPC exists'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.update_billing_stage_progress(uuid,text,timestamp with time zone,text)',
    'execute'
  ),
  'authenticated can reach stage update RPC subject to internal admin validation'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.sync_billing_stage_progress(uuid)',
    'execute'
  ),
  'authenticated can reach stage sync RPC subject to internal admin validation'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.save_billing_termin(uuid,integer,text,numeric,numeric,numeric,text,uuid,numeric,date,date,text)',
    'execute'
  ),
  'authenticated can reach termin save RPC subject to internal admin validation'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.delete_billing_termin(uuid)',
    'execute'
  ),
  'authenticated can reach termin delete RPC subject to internal admin validation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.update_billing_stage_progress(uuid,text,timestamp with time zone,text)',
    'execute'
  ),
  'anonymous cannot update stage progress'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.save_billing_termin(uuid,integer,text,numeric,numeric,numeric,text,uuid,numeric,date,date,text)',
    'execute'
  ),
  'anonymous cannot save a termin'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.billing_stage_progress', 'insert'),
  'authenticated browser role cannot directly insert stage progress'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.billing_stage_progress', 'update'),
  'authenticated browser role cannot directly update stage progress'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.billing_stage_progress', 'delete'),
  'authenticated browser role cannot directly delete stage progress'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.billing_termins', 'insert'),
  'authenticated browser role cannot directly insert a termin'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.billing_termins', 'update'),
  'authenticated browser role cannot directly update a termin'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.billing_termins', 'delete'),
  'authenticated browser role cannot directly delete a termin'
);

select extensions.ok(
  exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.spk_billings'::regclass
      and tgname = 'spk_billings_validate_contract_value'
      and not tgisinternal
  ),
  'contract value updates remain consistent with existing termins'
);

select * from extensions.finish();
rollback;
