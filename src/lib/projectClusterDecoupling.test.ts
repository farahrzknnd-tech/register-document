import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const documentFormFiles = [
  'src/pages/RegisterGambar.tsx',
  'src/pages/RegisterSurat.tsx',
  'src/pages/RegisterBeritaAcara.tsx',
  'src/pages/RegisterSuratPenunjukan.tsx',
];

describe('document project and cluster decoupling', () => {
  it('keeps document forms independent and optional', () => {
    for (const file of documentFormFiles) {
      const source = readFileSync(file, 'utf8');
      expect(source).toContain('project_id: null');
      expect(source).toContain('Tanpa Project');
      expect(source).toContain('Tanpa Cluster');
      expect(source).toContain('clusters.map((cluster)');
      expect(source).not.toContain('clustersForProject');
      expect(source).not.toContain('defaultProjectIdForClusters');
      expect(source).not.toContain('cluster_id: null })');
      expect(source).not.toContain('Pilih Project dulu');
    }
  });

  it('drops database project-cluster compatibility enforcement', () => {
    const migration = readFileSync('supabase/migrations/20260719093000_decouple_document_project_and_cluster.sql', 'utf8');
    expect(migration).toContain('alter column project_id drop not null');
    expect(migration).toContain('foreign key (cluster_id) references public.clusters(id)');
    expect(migration).toContain('p_project is not null');
    expect(migration).toContain('p_cluster is not null and not exists(select 1 from public.clusters where id=p_cluster)');
    expect(migration).not.toContain('project_id=p_project');
  });
});
