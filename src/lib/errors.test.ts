import { describe, expect, it } from 'vitest';
import { mapAppError } from './errors';

describe('error mapping', () => {
  it('maps authorization and data errors', () => {
    expect(mapAppError(new Error('Admin permission required'))).toMatch(/admin/i);
    expect(mapAppError(new Error('Cross-project document reference'))).toMatch(/beda proyek/i);
    expect(mapAppError(new Error('Cluster not found'))).toMatch(/Cluster tidak ditemukan/i);
    expect(mapAppError(new Error('duplicate key value violates unique constraint'))).toMatch(/duplikat/i);
    expect(mapAppError({ code: 'PGRST202', message: 'Could not find the function public.create_spk_billing' })).toMatch(/migration Patch 3/i);
  });
});
