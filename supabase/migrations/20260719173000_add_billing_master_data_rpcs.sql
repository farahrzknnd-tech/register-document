-- Billing Master Data RPCs
--
-- Adds an atomic save path for billing termin templates and their items. Other
-- billing master tables remain protected by the admin-only RLS policies from
-- the Billing Monitoring Foundation migration.

create or replace function public.save_billing_termin_template(
  p_template_id uuid default null,
  p_code text default null,
  p_name text default null,
  p_description text default null,
  p_active boolean default true,
  p_items jsonb default '[]'::jsonb
)
returns public.billing_termin_templates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template public.billing_termin_templates;
  v_item jsonb;
  v_item_count integer;
  v_percentage_total numeric;
begin
  if not public.current_user_admin() then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  if nullif(btrim(p_code), '') is null then
    raise exception 'Billing termin template code is required' using errcode = '22023';
  end if;

  if nullif(btrim(p_name), '') is null then
    raise exception 'Billing termin template name is required' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Billing termin template items must be a JSON array' using errcode = '22023';
  end if;

  select count(*)
    into v_item_count
  from jsonb_array_elements(p_items) item
  where coalesce((item->>'active')::boolean, true);

  if v_item_count = 0 then
    raise exception 'Billing termin template requires at least one active item' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) item
    where nullif(btrim(item->>'name'), '') is null
       or coalesce((item->>'sequence_no')::integer, 0) <= 0
       or (
         nullif(item->>'percentage', '') is not null
         and (
           (item->>'percentage')::numeric < 0
           or (item->>'percentage')::numeric > 100
         )
       )
  ) then
    raise exception 'Billing termin template contains invalid items' using errcode = '22023';
  end if;

  if exists (
    select 1
    from (
      select (item->>'sequence_no')::integer as sequence_no
      from jsonb_array_elements(p_items) item
      group by (item->>'sequence_no')::integer
      having count(*) > 1
    ) duplicates
  ) then
    raise exception 'Billing termin template item sequence must be unique' using errcode = '23505';
  end if;

  if exists (
    select 1
    from (
      select lower(btrim(item->>'name')) as normalized_name
      from jsonb_array_elements(p_items) item
      group by lower(btrim(item->>'name'))
      having count(*) > 1
    ) duplicates
  ) then
    raise exception 'Billing termin template item name must be unique' using errcode = '23505';
  end if;

  select coalesce(sum((item->>'percentage')::numeric), 0)
    into v_percentage_total
  from jsonb_array_elements(p_items) item
  where nullif(item->>'percentage', '') is not null
    and coalesce((item->>'active')::boolean, true);

  if v_percentage_total > 100 then
    raise exception 'Billing termin template percentage total cannot exceed 100' using errcode = '22023';
  end if;

  if p_template_id is null then
    insert into public.billing_termin_templates (
      code,
      name,
      description,
      active,
      created_by,
      updated_by
    )
    values (
      lower(btrim(p_code)),
      btrim(p_name),
      nullif(btrim(p_description), ''),
      coalesce(p_active, true),
      auth.uid(),
      auth.uid()
    )
    returning * into v_template;
  else
    update public.billing_termin_templates
       set code = lower(btrim(p_code)),
           name = btrim(p_name),
           description = nullif(btrim(p_description), ''),
           active = coalesce(p_active, true),
           updated_by = auth.uid()
     where id = p_template_id
     returning * into v_template;

    if v_template.id is null then
      raise exception 'Billing termin template not found' using errcode = 'P0002';
    end if;

    delete from public.billing_termin_template_items
     where template_id = p_template_id;
  end if;

  for v_item in
    select item
    from jsonb_array_elements(p_items) item
    order by (item->>'sequence_no')::integer
  loop
    insert into public.billing_termin_template_items (
      template_id,
      sequence_no,
      name,
      percentage,
      active,
      created_by,
      updated_by
    )
    values (
      v_template.id,
      (v_item->>'sequence_no')::integer,
      btrim(v_item->>'name'),
      case
        when nullif(v_item->>'percentage', '') is null then null
        else (v_item->>'percentage')::numeric
      end,
      coalesce((v_item->>'active')::boolean, true),
      auth.uid(),
      auth.uid()
    );
  end loop;

  return v_template;
end;
$$;

revoke all on function public.save_billing_termin_template(uuid, text, text, text, boolean, jsonb)
  from public, anon;
grant execute on function public.save_billing_termin_template(uuid, text, text, text, boolean, jsonb)
  to authenticated;

comment on function public.save_billing_termin_template(uuid, text, text, text, boolean, jsonb) is
  'Admin-only atomic create/update of a billing termin template and its ordered items.';
