import type { UserRole, Cluster, DocType } from './types';

export const isAdminRole = (role: UserRole | null | undefined) => role === 'admin';
export const canMutate = isAdminRole;
export const inclusiveDuration = (start: string | null, finish: string | null): number | null => {
  if (!start || !finish) return null;
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const finishMs = Date.parse(`${finish}T00:00:00Z`);
  if (Number.isNaN(startMs) || Number.isNaN(finishMs) || finishMs < startMs) return null;
  return Math.floor((finishMs - startMs) / 86_400_000) + 1;
};
export const clustersForProject = (clusters: Cluster[], projectId: string) => {
  const selectedProjectId = projectId.trim();
  return clusters.filter((cluster) => cluster.project_id === selectedProjectId);
};
export const normalizeRefs = (refs: { ref_type: DocType; ref_id: string }[]) => refs.map((ref) => ({ ref_type: ref.ref_type, ref_id: ref.ref_id }));
export const yearFromDate = (date: string) => new Date(`${date}T00:00:00`).getFullYear();
