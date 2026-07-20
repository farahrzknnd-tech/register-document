begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select extensions.has_function(
  'public',
  'create_spk_billing',
  array[
    'uuid','uuid','uuid','uuid','uuid','uuid','text','date','text','text','text',
    'date','date','date','text','numeric','text','text'
  ],
  'secure billing create RPC exists'
);

select extensions.has_function(
  'public',
  'update_spk_billing',
  array[
    'uuid','uuid','uuid','uuid','uuid','text','date','text','text','text',
    'date','date','date','text','numeric','text','text'
  ],
  'secure billing update RPC exists'
);

select extensions.has_function(
  'public',
  'delete_spk_billing',
  array['uuid'],
  'secure billing delete RPC exists'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.create_spk_billing(uuid,uuid,uuid,uuid,uuid,uuid,text,date,text,text,text,date,date,date,text,numeric,text,text)',
    'execute'
  ),
  'authenticated can reach create RPC subject to internal admin validation'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.update_spk_billing(uuid,uuid,uuid,uuid,uuid,text,date,text,text,text,date,date,date,text,numeric,text,text)',
    'execute'
  ),
  'authenticated can reach update RPC subject to internal admin validation'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.delete_spk_billing(uuid)',
    'execute'
  ),
  'authenticated can reach delete RPC subject to internal admin validation'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.create_spk_billing(uuid,uuid,uuid,uuid,uuid,uuid,text,date,text,text,text,date,date,date,text,numeric,text,text)',
    'execute'
  ),
  'anonymous cannot execute create RPC'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.spk_billings', 'insert'),
  'authenticated browser role cannot directly insert billing records'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.spk_billings', 'update'),
  'authenticated browser role cannot directly update billing records'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.spk_billings', 'delete'),
  'authenticated browser role cannot directly delete billing records'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.spk_billings', 'select'),
  'authenticated retains read access governed by RLS'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.billing_activity_log', 'insert'),
  'activity rows can only be written through trusted functions'
);

select * from extensions.finish();
rollback;
