alter table public.gambar drop constraint if exists gambar_project_id_cluster_id_fkey;
alter table public.surat drop constraint if exists surat_project_id_cluster_id_fkey;
alter table public.surat_penunjukan drop constraint if exists surat_penunjukan_project_id_cluster_id_fkey;
alter table public.berita_acara drop constraint if exists berita_acara_project_id_cluster_id_fkey;

alter table public.gambar alter column project_id drop not null;
alter table public.surat alter column project_id drop not null;
alter table public.surat_penunjukan alter column project_id drop not null;
alter table public.berita_acara alter column project_id drop not null;

alter table public.gambar add constraint gambar_cluster_id_fkey foreign key (cluster_id) references public.clusters(id) on delete restrict;
alter table public.surat add constraint surat_cluster_id_fkey foreign key (cluster_id) references public.clusters(id) on delete restrict;
alter table public.surat_penunjukan add constraint surat_penunjukan_cluster_id_fkey foreign key (cluster_id) references public.clusters(id) on delete restrict;
alter table public.berita_acara add constraint berita_acara_cluster_id_fkey foreign key (cluster_id) references public.clusters(id) on delete restrict;

create or replace function public.assert_admin_project_cluster(p_project uuid, p_cluster uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_admin() then raise exception 'Admin permission required' using errcode='42501'; end if;
  if p_project is not null and not exists(select 1 from public.projects where id=p_project) then raise exception 'Project not found' using errcode='P0002'; end if;
  if p_cluster is not null and not exists(select 1 from public.clusters where id=p_cluster) then raise exception 'Cluster not found' using errcode='P0002'; end if;
end $$;
