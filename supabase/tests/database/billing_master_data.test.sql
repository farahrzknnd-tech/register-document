begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

select extensions.has_function(
  'public',
  'save_billing_termin_template',
  array['uuid', 'text', 'text', 'text', 'boolean', 'jsonb'],
  'atomic termin template save function exists'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.save_billing_termin_template(uuid,text,text,text,boolean,jsonb)',
    'execute'
  ),
  'anonymous cannot execute termin template mutation'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.save_billing_termin_template(uuid,text,text,text,boolean,jsonb)',
    'execute'
  ),
  'authenticated can reach termin template RPC subject to internal admin check'
);

select extensions.ok(
  exists (
    select 1
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'save_billing_termin_template'
      and procedure.prosecdef
  ),
  'termin template RPC is security definer'
);

select extensions.ok(
  exists (
    select 1
    from public.billing_termin_templates template
    join public.billing_termin_template_items item on item.template_id = template.id
    where template.code = 'termin_bertahap'
  ),
  'seeded termin template has relational items'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.contractors', 'select'),
  'anonymous cannot read billing master data'
);

select * from extensions.finish();
rollback;
