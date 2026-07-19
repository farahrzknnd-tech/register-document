/*
# Generic Document Reference System

## Changes
1. Create `document_ref` table — generic many-to-many between any two documents.
   - source_type: 'gambar' | 'surat' | 'surat_penunjukan'
   - source_id: uuid (references the doc's id in its table)
   - ref_type: same enum — the REFERENCED document's type
   - ref_id: uuid — the REFERENCED document's id
   - Meaning: source document references ref document (ref is "Dokumen Sebelumnya", source is "Dokumen Berikutnya")
2. Unique constraint on (source_type, source_id, ref_type, ref_id) to prevent duplicates.
3. RLS with anon+authenticated CRUD.
4. Drop `surat_gambar_ref` table (no data, replaced by document_ref).
5. Update `recompute_tindak_lanjut` trigger to use document_ref instead of surat_gambar_ref.
   - A gambar's status_tindak_lanjut = 'Sudah Dibuat Surat' when ANY document_ref has ref_type='gambar' AND ref_id=that gambar.
6. Add trigger on document_ref INSERT/DELETE to recompute affected gambar status.

## Important Notes
1. document_ref stores directed edges: source → ref (source references ref).
2. No FK constraints on source_id/ref_id because they point to different tables.
   Data integrity is maintained at the application layer.
3. The trigger only recomputes gambar status_tindak_lanjut (other doc types don't have this field).
*/

-- 1. Create document_ref table
CREATE TABLE IF NOT EXISTS document_ref (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('gambar', 'surat', 'surat_penunjukan')),
  source_id uuid NOT NULL,
  ref_type text NOT NULL CHECK (ref_type IN ('gambar', 'surat', 'surat_penunjukan')),
  ref_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id, ref_type, ref_id)
);
ALTER TABLE document_ref ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_dr" ON document_ref;
CREATE POLICY "anon_select_dr" ON document_ref FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dr" ON document_ref;
CREATE POLICY "anon_insert_dr" ON document_ref FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_dr" ON document_ref;
CREATE POLICY "anon_delete_dr" ON document_ref FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_dr_source ON document_ref(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_dr_ref ON document_ref(ref_type, ref_id);

-- 2. Update recompute_tindak_lanjut to use document_ref
CREATE OR REPLACE FUNCTION recompute_tindak_lanjut(p_gambar_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE gambar
  SET status_tindak_lanjut = CASE
    WHEN EXISTS (
      SELECT 1 FROM document_ref
      WHERE ref_type = 'gambar' AND ref_id = p_gambar_id
    ) THEN 'Sudah Dibuat Surat'
    ELSE 'Belum Ada Tindak Lanjut'
  END
  WHERE id = p_gambar_id;
END;
$$;

-- 3. Triggers on document_ref to recompute gambar status
CREATE OR REPLACE FUNCTION trg_dr_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.ref_type = 'gambar' THEN
    PERFORM recompute_tindak_lanjut(NEW.ref_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dr_after_insert ON document_ref;
CREATE TRIGGER dr_after_insert AFTER INSERT ON document_ref
  FOR EACH ROW EXECUTE FUNCTION trg_dr_insert();

CREATE OR REPLACE FUNCTION trg_dr_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.ref_type = 'gambar' THEN
    PERFORM recompute_tindak_lanjut(OLD.ref_id);
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS dr_after_delete ON document_ref;
CREATE TRIGGER dr_after_delete AFTER DELETE ON document_ref
  FOR EACH ROW EXECUTE FUNCTION trg_dr_delete();

-- 4. Drop old surat_gambar_ref and its triggers
DROP TRIGGER IF EXISTS sgr_after_insert ON surat_gambar_ref;
DROP TRIGGER IF EXISTS sgr_after_delete ON surat_gambar_ref;
DROP FUNCTION IF EXISTS trg_sgr_insert();
DROP FUNCTION IF EXISTS trg_sgr_delete();
DROP TABLE IF EXISTS surat_gambar_ref;

GRANT EXECUTE ON FUNCTION recompute_tindak_lanjut(uuid) TO anon, authenticated;
