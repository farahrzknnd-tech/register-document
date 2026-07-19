import { describe, expect, it } from 'vitest';
import { mapAppError } from './errors';

describe('error mapping', () => {
  it('maps authorization and data errors', () => {
    expect(mapAppError(new Error('Admin permission required'))).toMatch(/admin/i);
    expect(mapAppError(new Error('Cross-project document reference'))).toMatch(/beda proyek/i);
    expect(mapAppError(new Error('duplicate key value violates unique constraint'))).toMatch(/duplikat/i);
  });
});
