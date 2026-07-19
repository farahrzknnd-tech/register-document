create extension if not exists pgcrypto;

create table public.app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('admin','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index projects_code_lower_key on public.projects (lower(code)) where code is not null;

create table public.clusters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  name text not null check (btrim(name) <> ''),
  code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, id)
);
create unique index clusters_project_name_lower_key on public.clusters (project_id, lower(name));
create unique index clusters_project_code_lower_key on public.clusters (project_id, lower(code)) where code is not null;

create table public.register_seq (
  document_type text not null,
  document_subtype text not null,
  year int not null check (year between 2000 and 2100),
  last_seq int not null default 0 check (last_seq >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (document_type, document_subtype, year)
);

create table public.gambar (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  cluster_id uuid,
  register_no text not null unique,
  judul_gambar text not null check (btrim(judul_gambar) <> ''),
  jenis_gambar text not null check (jenis_gambar in ('Gambar Pelaksanaan','Gambar Revisi Pelaksanaan','Gambar Tender','Gambar Revisi Tender','Gambar Informasi','As Built Drawing')),
  revisi text,
  status_gambar text not null default 'Aktif (Latest)' check (status_gambar in ('Aktif (Latest)','Digantikan (Obsolete)')),
  status_tindak_lanjut text not null default 'Belum Ada Tindak Lanjut' check (status_tindak_lanjut in ('Belum Ada Tindak Lanjut','Sudah Dibuat Surat')),
  tanggal_diterima date not null,
  link_drive text,
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, cluster_id) references public.clusters(project_id, id) on delete restrict
);

create table public.surat (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  cluster_id uuid,
  register_no text not null unique,
  nomor_surat text not null check (btrim(nomor_surat) <> ''),
  perihal text not null check (btrim(perihal) <> ''),
  jenis_surat text not null check (jenis_surat in ('Surat Masuk','Surat Keluar')),
  kategori_surat text,
  pengirim text,
  penerima text,
  tanggal_surat date not null,
  link_drive text,
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, cluster_id) references public.clusters(project_id, id) on delete restrict
);

create table public.surat_penunjukan (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  cluster_id uuid,
  register_no text not null unique,
  nomor_sp text not null check (btrim(nomor_sp) <> ''),
  tanggal_sp date not null,
  nama_kontraktor text not null check (btrim(nama_kontraktor) <> ''),
  jenis_pekerjaan text not null check (btrim(jenis_pekerjaan) <> ''),
  lokasi text,
  tanggal_start date,
  tanggal_finish date,
  durasi int generated always as (case when tanggal_start is null or tanggal_finish is null then null else (tanggal_finish - tanggal_start + 1) end) stored,
  tanggal_kickoff date,
  link_risalah text,
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tanggal_finish is null or tanggal_start is null or tanggal_finish >= tanggal_start),
  foreign key (project_id, cluster_id) references public.clusters(project_id, id) on delete restrict
);

create table public.berita_acara (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  cluster_id uuid,
  register_no text not null unique,
  jenis_berita_acara text not null check (jenis_berita_acara in ('Berita Acara Aanwijzing','Berita Acara Klarifikasi')),
  tanggal date not null,
  perihal text not null check (btrim(perihal) <> ''),
  link_drive text,
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, cluster_id) references public.clusters(project_id, id) on delete restrict
);

create table public.document_ref (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('gambar','surat','surat_penunjukan','berita_acara')),
  source_id uuid not null,
  ref_type text not null check (ref_type in ('gambar','surat','surat_penunjukan','berita_acara')),
  ref_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_type <> ref_type or source_id <> ref_id),
  unique (source_type, source_id, ref_type, ref_id)
);
create index document_ref_source_idx on public.document_ref(source_type, source_id);
create index document_ref_ref_idx on public.document_ref(ref_type, ref_id);
create index clusters_project_idx on public.clusters(project_id);
create index gambar_project_cluster_idx on public.gambar(project_id, cluster_id);
create index surat_project_cluster_idx on public.surat(project_id, cluster_id);
create index sp_project_cluster_idx on public.surat_penunjukan(project_id, cluster_id);
create index ba_project_cluster_idx on public.berita_acara(project_id, cluster_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.app_users(user_id,email,role) values (new.id,new.email,'viewer') on conflict (user_id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

insert into public.app_users(user_id,email,role)
select id,email,'viewer' from auth.users
on conflict (user_id) do nothing;

create or replace function public.current_user_active() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.app_users u where u.user_id = auth.uid() and u.active)
$$;
create or replace function public.current_user_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.app_users u where u.user_id = auth.uid() and u.active and u.role = 'admin')
$$;

create or replace function public.document_exists(p_type text, p_id uuid) returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  case p_type
    when 'gambar' then return exists(select 1 from public.gambar where id=p_id);
    when 'surat' then return exists(select 1 from public.surat where id=p_id);
    when 'surat_penunjukan' then return exists(select 1 from public.surat_penunjukan where id=p_id);
    when 'berita_acara' then return exists(select 1 from public.berita_acara where id=p_id);
    else raise exception 'Unsupported document type: %', p_type using errcode='22023';
  end case;
end $$;

create or replace function public.document_project_id(p_type text, p_id uuid) returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v_project uuid;
begin
  case p_type
    when 'gambar' then select project_id into v_project from public.gambar where id=p_id;
    when 'surat' then select project_id into v_project from public.surat where id=p_id;
    when 'surat_penunjukan' then select project_id into v_project from public.surat_penunjukan where id=p_id;
    when 'berita_acara' then select project_id into v_project from public.berita_acara where id=p_id;
    else raise exception 'Unsupported document type: %', p_type using errcode='22023';
  end case;
  if v_project is null then raise exception 'Referenced document not found' using errcode='P0002'; end if;
  return v_project;
end $$;

create or replace function public.next_register_no(p_type text, p_subtype text, p_year int) returns text language plpgsql security definer set search_path = '' as $$
declare v_prefix text; v_seq int;
begin
  if p_type='gambar' then
    v_prefix := case p_subtype when 'Gambar Pelaksanaan' then 'GP' when 'Gambar Revisi Pelaksanaan' then 'GRP' when 'Gambar Tender' then 'GT' when 'Gambar Revisi Tender' then 'GRT' when 'Gambar Informasi' then 'GI' when 'As Built Drawing' then 'ABD' else null end;
  elsif p_type='surat' then
    v_prefix := case p_subtype when 'Surat Masuk' then 'SM' when 'Surat Keluar' then 'SK' else null end;
  elsif p_type='surat_penunjukan' and p_subtype='Surat Penunjukan' then v_prefix := 'SP';
  elsif p_type='berita_acara' then
    v_prefix := case p_subtype when 'Berita Acara Aanwijzing' then 'AWZ' when 'Berita Acara Klarifikasi' then 'KLR' else null end;
  end if;
  if v_prefix is null then raise exception 'Unsupported register subtype: %.%', p_type, p_subtype using errcode='22023'; end if;
  insert into public.register_seq(document_type,document_subtype,year,last_seq) values(p_type,p_subtype,p_year,1)
  on conflict(document_type,document_subtype,year) do update set last_seq=public.register_seq.last_seq+1, updated_at=now()
  returning last_seq into v_seq;
  return v_prefix || '-' || right(p_year::text,2) || '-' || lpad(v_seq::text,4,'0');
end $$;

create or replace function public.assert_admin_project_cluster(p_project uuid, p_cluster uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_admin() then raise exception 'Admin permission required' using errcode='42501'; end if;
  if not exists(select 1 from public.projects where id=p_project) then raise exception 'Project not found' using errcode='P0002'; end if;
  if p_cluster is not null and not exists(select 1 from public.clusters where id=p_cluster and project_id=p_project) then raise exception 'Cluster does not belong to project' using errcode='23514'; end if;
end $$;

create or replace function public.recompute_gambar_follow_up(p_gambar_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.gambar g set status_tindak_lanjut = case when exists(select 1 from public.document_ref r where r.source_type='surat' and r.ref_type='gambar' and r.ref_id=p_gambar_id) then 'Sudah Dibuat Surat' else 'Belum Ada Tindak Lanjut' end, updated_at=now() where g.id=p_gambar_id;
end $$;

create or replace function public.validate_document_ref() returns trigger language plpgsql security definer set search_path = '' as $$
declare sp uuid; rp uuid;
begin
  sp := public.document_project_id(new.source_type,new.source_id);
  rp := public.document_project_id(new.ref_type,new.ref_id);
  if sp <> rp then raise exception 'Cross-project document reference' using errcode='23514'; end if;
  return new;
end $$;
create trigger document_ref_validate before insert or update on public.document_ref for each row execute function public.validate_document_ref();

create or replace function public.document_ref_after_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('INSERT','UPDATE') and new.ref_type='gambar' then perform public.recompute_gambar_follow_up(new.ref_id); end if;
  if tg_op in ('DELETE','UPDATE') and old.ref_type='gambar' then perform public.recompute_gambar_follow_up(old.ref_id); end if;
  return coalesce(new, old);
end $$;
create trigger document_ref_followup after insert or update or delete on public.document_ref for each row execute function public.document_ref_after_change();

create or replace function public.clean_document_refs() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.document_ref where (source_type=tg_table_name and source_id=old.id) or (ref_type=tg_table_name and ref_id=old.id);
  return old;
end $$;

create or replace function public.set_document_refs(p_source_type text, p_source_id uuid, p_refs jsonb default '[]'::jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare item jsonb; src_project uuid; ref_project uuid;
begin
  if not public.current_user_admin() then raise exception 'Admin permission required' using errcode='42501'; end if;
  src_project := public.document_project_id(p_source_type,p_source_id);
  delete from public.document_ref where source_type=p_source_type and source_id=p_source_id;
  for item in select * from jsonb_array_elements(coalesce(p_refs,'[]'::jsonb)) loop
    ref_project := public.document_project_id(item->>'ref_type',(item->>'ref_id')::uuid);
    if src_project <> ref_project then raise exception 'Cross-project document reference' using errcode='23514'; end if;
    insert into public.document_ref(source_type,source_id,ref_type,ref_id) values(p_source_type,p_source_id,item->>'ref_type',(item->>'ref_id')::uuid);
  end loop;
end $$;

create or replace function public.create_gambar(p_project_id uuid,p_cluster_id uuid,p_judul_gambar text,p_jenis_gambar text,p_revisi text,p_status_gambar text,p_tanggal_diterima date,p_link_drive text,p_keterangan text,p_refs jsonb default '[]'::jsonb) returns public.gambar language plpgsql security definer set search_path = '' as $$
declare row public.gambar; reg text;
begin
  perform public.assert_admin_project_cluster(p_project_id,p_cluster_id);
  reg := public.next_register_no('gambar',p_jenis_gambar,extract(year from p_tanggal_diterima)::int);
  insert into public.gambar(project_id,cluster_id,register_no,judul_gambar,jenis_gambar,revisi,status_gambar,tanggal_diterima,link_drive,keterangan) values(p_project_id,p_cluster_id,reg,p_judul_gambar,p_jenis_gambar,p_revisi,p_status_gambar,p_tanggal_diterima,p_link_drive,p_keterangan) returning * into row;
  perform public.set_document_refs('gambar',row.id,p_refs); return row;
end $$;

create or replace function public.create_surat(p_project_id uuid,p_cluster_id uuid,p_nomor_surat text,p_perihal text,p_jenis_surat text,p_kategori_surat text,p_pengirim text,p_penerima text,p_tanggal_surat date,p_link_drive text,p_keterangan text,p_refs jsonb default '[]'::jsonb) returns public.surat language plpgsql security definer set search_path = '' as $$
declare row public.surat; reg text;
begin
  perform public.assert_admin_project_cluster(p_project_id,p_cluster_id);
  reg := public.next_register_no('surat',p_jenis_surat,extract(year from p_tanggal_surat)::int);
  insert into public.surat(project_id,cluster_id,register_no,nomor_surat,perihal,jenis_surat,kategori_surat,pengirim,penerima,tanggal_surat,link_drive,keterangan) values(p_project_id,p_cluster_id,reg,p_nomor_surat,p_perihal,p_jenis_surat,p_kategori_surat,p_pengirim,p_penerima,p_tanggal_surat,p_link_drive,p_keterangan) returning * into row;
  perform public.set_document_refs('surat',row.id,p_refs); return row;
end $$;

create or replace function public.create_surat_penunjukan(p_project_id uuid,p_cluster_id uuid,p_nomor_sp text,p_tanggal_sp date,p_nama_kontraktor text,p_jenis_pekerjaan text,p_lokasi text,p_tanggal_start date,p_tanggal_finish date,p_tanggal_kickoff date,p_link_risalah text,p_keterangan text,p_refs jsonb default '[]'::jsonb) returns public.surat_penunjukan language plpgsql security definer set search_path = '' as $$
declare row public.surat_penunjukan; reg text;
begin
  perform public.assert_admin_project_cluster(p_project_id,p_cluster_id);
  reg := public.next_register_no('surat_penunjukan','Surat Penunjukan',extract(year from p_tanggal_sp)::int);
  insert into public.surat_penunjukan(project_id,cluster_id,register_no,nomor_sp,tanggal_sp,nama_kontraktor,jenis_pekerjaan,lokasi,tanggal_start,tanggal_finish,tanggal_kickoff,link_risalah,keterangan) values(p_project_id,p_cluster_id,reg,p_nomor_sp,p_tanggal_sp,p_nama_kontraktor,p_jenis_pekerjaan,p_lokasi,p_tanggal_start,p_tanggal_finish,p_tanggal_kickoff,p_link_risalah,p_keterangan) returning * into row;
  perform public.set_document_refs('surat_penunjukan',row.id,p_refs); return row;
end $$;

create or replace function public.create_berita_acara(p_project_id uuid,p_cluster_id uuid,p_jenis_berita_acara text,p_tanggal date,p_perihal text,p_link_drive text,p_keterangan text,p_refs jsonb default '[]'::jsonb) returns public.berita_acara language plpgsql security definer set search_path = '' as $$
declare row public.berita_acara; reg text;
begin
  perform public.assert_admin_project_cluster(p_project_id,p_cluster_id);
  reg := public.next_register_no('berita_acara',p_jenis_berita_acara,extract(year from p_tanggal)::int);
  insert into public.berita_acara(project_id,cluster_id,register_no,jenis_berita_acara,tanggal,perihal,link_drive,keterangan) values(p_project_id,p_cluster_id,reg,p_jenis_berita_acara,p_tanggal,p_perihal,p_link_drive,p_keterangan) returning * into row;
  perform public.set_document_refs('berita_acara',row.id,p_refs); return row;
end $$;



create or replace function public.register_prefix(p_type text, p_subtype text) returns text language plpgsql immutable set search_path = '' as $$
begin
  if p_type='gambar' then
    return case p_subtype when 'Gambar Pelaksanaan' then 'GP' when 'Gambar Revisi Pelaksanaan' then 'GRP' when 'Gambar Tender' then 'GT' when 'Gambar Revisi Tender' then 'GRT' when 'Gambar Informasi' then 'GI' when 'As Built Drawing' then 'ABD' else null end;
  elsif p_type='surat' then
    return case p_subtype when 'Surat Masuk' then 'SM' when 'Surat Keluar' then 'SK' else null end;
  elsif p_type='surat_penunjukan' and p_subtype='Surat Penunjukan' then
    return 'SP';
  elsif p_type='berita_acara' then
    return case p_subtype when 'Berita Acara Aanwijzing' then 'AWZ' when 'Berita Acara Klarifikasi' then 'KLR' else null end;
  end if;
  return null;
end $$;

create or replace function public.register_year(p_register_no text) returns int language sql immutable set search_path = '' as $$
  select (2000 + substring(p_register_no from '^[A-Z]+-([0-9]{2})-[0-9]{4}$')::int)
$$;

create or replace function public.assert_register_consistent(p_type text, p_register_no text, p_subtype text, p_date date) returns void language plpgsql stable set search_path = '' as $$
declare v_prefix text; v_reg_prefix text; v_reg_year int;
begin
  v_prefix := public.register_prefix(p_type, p_subtype);
  if v_prefix is null then raise exception 'Unsupported register subtype: %.%', p_type, p_subtype using errcode='22023'; end if;
  v_reg_prefix := split_part(p_register_no, '-', 1);
  v_reg_year := public.register_year(p_register_no);
  if v_reg_prefix <> v_prefix then raise exception 'Document subtype cannot change assigned register prefix' using errcode='23514'; end if;
  if v_reg_year is null or v_reg_year <> extract(year from p_date)::int then raise exception 'Document date year must match assigned register number' using errcode='23514'; end if;
end $$;

create or replace function public.protect_gambar_system_fields() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.register_no is distinct from old.register_no then raise exception 'Register number is immutable' using errcode='23514'; end if;
  if new.created_at is distinct from old.created_at then raise exception 'created_at is system managed' using errcode='23514'; end if;
  if new.updated_at is distinct from old.updated_at and pg_trigger_depth() <= 1 then raise exception 'updated_at is system managed' using errcode='23514'; end if;
  if new.status_tindak_lanjut is distinct from old.status_tindak_lanjut and pg_trigger_depth() <= 1 then raise exception 'status_tindak_lanjut is system managed' using errcode='23514'; end if;
  perform public.assert_register_consistent('gambar', old.register_no, new.jenis_gambar, new.tanggal_diterima);
  return new;
end $$;

create or replace function public.protect_surat_system_fields() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.register_no is distinct from old.register_no then raise exception 'Register number is immutable' using errcode='23514'; end if;
  if new.created_at is distinct from old.created_at then raise exception 'created_at is system managed' using errcode='23514'; end if;
  if new.updated_at is distinct from old.updated_at and pg_trigger_depth() <= 1 then raise exception 'updated_at is system managed' using errcode='23514'; end if;
  perform public.assert_register_consistent('surat', old.register_no, new.jenis_surat, new.tanggal_surat);
  return new;
end $$;

create or replace function public.protect_sp_system_fields() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.register_no is distinct from old.register_no then raise exception 'Register number is immutable' using errcode='23514'; end if;
  if new.created_at is distinct from old.created_at then raise exception 'created_at is system managed' using errcode='23514'; end if;
  if new.updated_at is distinct from old.updated_at and pg_trigger_depth() <= 1 then raise exception 'updated_at is system managed' using errcode='23514'; end if;
  perform public.assert_register_consistent('surat_penunjukan', old.register_no, 'Surat Penunjukan', new.tanggal_sp);
  return new;
end $$;

create or replace function public.protect_ba_system_fields() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.register_no is distinct from old.register_no then raise exception 'Register number is immutable' using errcode='23514'; end if;
  if new.created_at is distinct from old.created_at then raise exception 'created_at is system managed' using errcode='23514'; end if;
  if new.updated_at is distinct from old.updated_at and pg_trigger_depth() <= 1 then raise exception 'updated_at is system managed' using errcode='23514'; end if;
  perform public.assert_register_consistent('berita_acara', old.register_no, new.jenis_berita_acara, new.tanggal);
  return new;
end $$;

create or replace function public.validate_project_references(p_source_type text, p_source_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare source_project uuid; item record;
begin
  source_project := public.document_project_id(p_source_type,p_source_id);
  for item in select ref_type, ref_id from public.document_ref where source_type=p_source_type and source_id=p_source_id loop
    if source_project <> public.document_project_id(item.ref_type,item.ref_id) then raise exception 'Cross-project document reference' using errcode='23514'; end if;
  end loop;
  for item in select source_type, source_id from public.document_ref where ref_type=p_source_type and ref_id=p_source_id loop
    if source_project <> public.document_project_id(item.source_type,item.source_id) then raise exception 'Cross-project document reference' using errcode='23514'; end if;
  end loop;
end $$;

create or replace function public.update_gambar(p_id uuid,p_project_id uuid,p_cluster_id uuid,p_judul_gambar text,p_jenis_gambar text,p_revisi text,p_status_gambar text,p_tanggal_diterima date,p_link_drive text,p_keterangan text,p_refs jsonb default '[]'::jsonb) returns public.gambar language plpgsql security definer set search_path = '' as $$
declare row public.gambar;
begin
  if not exists(select 1 from public.gambar where id=p_id) then raise exception 'Document not found' using errcode='P0002'; end if;
  perform public.assert_admin_project_cluster(p_project_id,p_cluster_id);
  update public.gambar set project_id=p_project_id, cluster_id=p_cluster_id, judul_gambar=p_judul_gambar, jenis_gambar=p_jenis_gambar, revisi=p_revisi, status_gambar=p_status_gambar, tanggal_diterima=p_tanggal_diterima, link_drive=p_link_drive, keterangan=p_keterangan where id=p_id returning * into row;
  perform public.set_document_refs('gambar',p_id,p_refs);
  perform public.validate_project_references('gambar',p_id);
  select * into row from public.gambar where id=p_id;
  return row;
end $$;

create or replace function public.update_surat(p_id uuid,p_project_id uuid,p_cluster_id uuid,p_nomor_surat text,p_perihal text,p_jenis_surat text,p_kategori_surat text,p_pengirim text,p_penerima text,p_tanggal_surat date,p_link_drive text,p_keterangan text,p_refs jsonb default '[]'::jsonb) returns public.surat language plpgsql security definer set search_path = '' as $$
declare row public.surat;
begin
  if not exists(select 1 from public.surat where id=p_id) then raise exception 'Document not found' using errcode='P0002'; end if;
  perform public.assert_admin_project_cluster(p_project_id,p_cluster_id);
  update public.surat set project_id=p_project_id, cluster_id=p_cluster_id, nomor_surat=p_nomor_surat, perihal=p_perihal, jenis_surat=p_jenis_surat, kategori_surat=p_kategori_surat, pengirim=p_pengirim, penerima=p_penerima, tanggal_surat=p_tanggal_surat, link_drive=p_link_drive, keterangan=p_keterangan where id=p_id returning * into row;
  perform public.set_document_refs('surat',p_id,p_refs);
  perform public.validate_project_references('surat',p_id);
  select * into row from public.surat where id=p_id;
  return row;
end $$;

create or replace function public.update_surat_penunjukan(p_id uuid,p_project_id uuid,p_cluster_id uuid,p_nomor_sp text,p_tanggal_sp date,p_nama_kontraktor text,p_jenis_pekerjaan text,p_lokasi text,p_tanggal_start date,p_tanggal_finish date,p_tanggal_kickoff date,p_link_risalah text,p_keterangan text,p_refs jsonb default '[]'::jsonb) returns public.surat_penunjukan language plpgsql security definer set search_path = '' as $$
declare row public.surat_penunjukan;
begin
  if not exists(select 1 from public.surat_penunjukan where id=p_id) then raise exception 'Document not found' using errcode='P0002'; end if;
  perform public.assert_admin_project_cluster(p_project_id,p_cluster_id);
  update public.surat_penunjukan set project_id=p_project_id, cluster_id=p_cluster_id, nomor_sp=p_nomor_sp, tanggal_sp=p_tanggal_sp, nama_kontraktor=p_nama_kontraktor, jenis_pekerjaan=p_jenis_pekerjaan, lokasi=p_lokasi, tanggal_start=p_tanggal_start, tanggal_finish=p_tanggal_finish, tanggal_kickoff=p_tanggal_kickoff, link_risalah=p_link_risalah, keterangan=p_keterangan where id=p_id returning * into row;
  perform public.set_document_refs('surat_penunjukan',p_id,p_refs);
  perform public.validate_project_references('surat_penunjukan',p_id);
  select * into row from public.surat_penunjukan where id=p_id;
  return row;
end $$;

create or replace function public.update_berita_acara(p_id uuid,p_project_id uuid,p_cluster_id uuid,p_jenis_berita_acara text,p_tanggal date,p_perihal text,p_link_drive text,p_keterangan text,p_refs jsonb default '[]'::jsonb) returns public.berita_acara language plpgsql security definer set search_path = '' as $$
declare row public.berita_acara;
begin
  if not exists(select 1 from public.berita_acara where id=p_id) then raise exception 'Document not found' using errcode='P0002'; end if;
  perform public.assert_admin_project_cluster(p_project_id,p_cluster_id);
  update public.berita_acara set project_id=p_project_id, cluster_id=p_cluster_id, jenis_berita_acara=p_jenis_berita_acara, tanggal=p_tanggal, perihal=p_perihal, link_drive=p_link_drive, keterangan=p_keterangan where id=p_id returning * into row;
  perform public.set_document_refs('berita_acara',p_id,p_refs);
  perform public.validate_project_references('berita_acara',p_id);
  select * into row from public.berita_acara where id=p_id;
  return row;
end $$;

create trigger protect_gambar before update on public.gambar for each row execute function public.protect_gambar_system_fields();
create trigger protect_surat before update on public.surat for each row execute function public.protect_surat_system_fields();
create trigger protect_sp before update on public.surat_penunjukan for each row execute function public.protect_sp_system_fields();
create trigger protect_ba before update on public.berita_acara for each row execute function public.protect_ba_system_fields();

create trigger touch_app_users before update on public.app_users for each row execute function public.touch_updated_at();
create trigger touch_projects before update on public.projects for each row execute function public.touch_updated_at();
create trigger touch_clusters before update on public.clusters for each row execute function public.touch_updated_at();
create trigger touch_register_seq before update on public.register_seq for each row execute function public.touch_updated_at();
create trigger touch_gambar before update on public.gambar for each row execute function public.touch_updated_at();
create trigger touch_surat before update on public.surat for each row execute function public.touch_updated_at();
create trigger touch_sp before update on public.surat_penunjukan for each row execute function public.touch_updated_at();
create trigger touch_ba before update on public.berita_acara for each row execute function public.touch_updated_at();
create trigger touch_document_ref before update on public.document_ref for each row execute function public.touch_updated_at();
create trigger clean_gambar_refs before delete on public.gambar for each row execute function public.clean_document_refs();
create trigger clean_surat_refs before delete on public.surat for each row execute function public.clean_document_refs();
create trigger clean_surat_penunjukan_refs before delete on public.surat_penunjukan for each row execute function public.clean_document_refs();
create trigger clean_berita_acara_refs before delete on public.berita_acara for each row execute function public.clean_document_refs();

alter table public.app_users enable row level security;
alter table public.projects enable row level security;
alter table public.clusters enable row level security;
alter table public.register_seq enable row level security;
alter table public.gambar enable row level security;
alter table public.surat enable row level security;
alter table public.surat_penunjukan enable row level security;
alter table public.berita_acara enable row level security;
alter table public.document_ref enable row level security;

create policy app_users_select on public.app_users for select to authenticated using (user_id = auth.uid() or public.current_user_admin());
create policy app_users_update_self_safe on public.app_users for update to authenticated using (user_id = auth.uid() and public.current_user_active()) with check (user_id = auth.uid() and role = (select role from public.app_users where user_id=auth.uid()) and active = (select active from public.app_users where user_id=auth.uid()));

create policy projects_select on public.projects for select to authenticated using (public.current_user_active());
create policy projects_insert on public.projects for insert to authenticated with check (public.current_user_admin());
create policy projects_update on public.projects for update to authenticated using (public.current_user_admin()) with check (public.current_user_admin());
create policy projects_delete on public.projects for delete to authenticated using (public.current_user_admin());
create policy clusters_select on public.clusters for select to authenticated using (public.current_user_active());
create policy clusters_insert on public.clusters for insert to authenticated with check (public.current_user_admin());
create policy clusters_update on public.clusters for update to authenticated using (public.current_user_admin()) with check (public.current_user_admin());
create policy clusters_delete on public.clusters for delete to authenticated using (public.current_user_admin());
create policy gambar_select on public.gambar for select to authenticated using (public.current_user_active());
create policy gambar_insert on public.gambar for insert to authenticated with check (public.current_user_admin());
create policy gambar_update on public.gambar for update to authenticated using (public.current_user_admin()) with check (public.current_user_admin());
create policy gambar_delete on public.gambar for delete to authenticated using (public.current_user_admin());
create policy surat_select on public.surat for select to authenticated using (public.current_user_active());
create policy surat_insert on public.surat for insert to authenticated with check (public.current_user_admin());
create policy surat_update on public.surat for update to authenticated using (public.current_user_admin()) with check (public.current_user_admin());
create policy surat_delete on public.surat for delete to authenticated using (public.current_user_admin());
create policy sp_select on public.surat_penunjukan for select to authenticated using (public.current_user_active());
create policy sp_insert on public.surat_penunjukan for insert to authenticated with check (public.current_user_admin());
create policy sp_update on public.surat_penunjukan for update to authenticated using (public.current_user_admin()) with check (public.current_user_admin());
create policy sp_delete on public.surat_penunjukan for delete to authenticated using (public.current_user_admin());
create policy ba_select on public.berita_acara for select to authenticated using (public.current_user_active());
create policy ba_insert on public.berita_acara for insert to authenticated with check (public.current_user_admin());
create policy ba_update on public.berita_acara for update to authenticated using (public.current_user_admin()) with check (public.current_user_admin());
create policy ba_delete on public.berita_acara for delete to authenticated using (public.current_user_admin());
create policy refs_select on public.document_ref for select to authenticated using (public.current_user_active());
create policy refs_insert on public.document_ref for insert to authenticated with check (public.current_user_admin());
create policy refs_update on public.document_ref for update to authenticated using (public.current_user_admin()) with check (public.current_user_admin());
create policy refs_delete on public.document_ref for delete to authenticated using (public.current_user_admin());

revoke all on all functions in schema public from public, anon;
grant execute on function public.current_user_active() to authenticated;
grant execute on function public.current_user_admin() to authenticated;
grant execute on function public.create_gambar(uuid,uuid,text,text,text,text,date,text,text,jsonb) to authenticated;
grant execute on function public.create_surat(uuid,uuid,text,text,text,text,text,text,date,text,text,jsonb) to authenticated;
grant execute on function public.create_surat_penunjukan(uuid,uuid,text,date,text,text,text,date,date,date,text,text,jsonb) to authenticated;
grant execute on function public.create_berita_acara(uuid,uuid,text,date,text,text,text,jsonb) to authenticated;
grant execute on function public.update_gambar(uuid,uuid,uuid,text,text,text,text,date,text,text,jsonb) to authenticated;
grant execute on function public.update_surat(uuid,uuid,uuid,text,text,text,text,text,text,date,text,text,jsonb) to authenticated;
grant execute on function public.update_surat_penunjukan(uuid,uuid,uuid,text,date,text,text,text,date,date,date,text,text,jsonb) to authenticated;
grant execute on function public.update_berita_acara(uuid,uuid,uuid,text,date,text,text,text,jsonb) to authenticated;
grant execute on function public.set_document_refs(text,uuid,jsonb) to authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.projects, public.clusters, public.gambar, public.surat, public.surat_penunjukan, public.berita_acara, public.document_ref to authenticated;
grant select, update on public.app_users to authenticated;
