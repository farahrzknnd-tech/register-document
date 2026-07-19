/*
# Fix nomor_gambar bug + Add document reference system

## Changes
1. Make `nomor_gambar` nullable on `gambar` table (fixes insert error).
2. Add `status_tindak_lanjut` column to `gambar` (auto-computed: 'Belum Ada Tindak Lanjut' / 'Sudah Dibuat Surat').
3. Create `surat_gambar_ref` junction table linking surat to gambar (many-to-many).
4. Add trigger `update_gambar_tindak_lanjut` that auto-updates status_tindak_lanjut
   whenever surat_gambar_ref changes (insert/delete).
5. RLS on surat_gambar_ref with anon+authenticated CRUD.

## Important Notes
1. nomor_gambar is kept but nullable - no longer used by the app.
2. status_tindak_lanjut is auto-managed by trigger, never set manually.
3. surat_gambar_ref allows one surat to reference multiple gambar, and one gambar to be referenced by multiple surat.
4. The trigger fires AFTER INSERT/DELETE on surat_gambar_ref and recomputes the status for affected gambar rows.
*/

-- 1. Make nomor_gambar nullable
ALTER TABLE gambar ALTER COLUMN nomor_gambar DROP NOT NULL;

-- 2. Add status_tindak_lanjut column
ALTER TABLE gambar ADD COLUMN IF NOT EXISTS status_tindak_lanjut text
  NOT NULL DEFAULT 'Belum Ada Tindak Lanjut'
  CHECK (status_tindak_lanjut IN ('Belum Ada Tindak Lanjut', 'Sudah Dibuat Surat'));

-- 3. Create junction table
CREATE TABLE IF NOT EXISTS surat_gambar_ref (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surat_id uuid NOT NULL REFERENCES surat(id) ON DELETE CASCADE,
  gambar_id uuid NOT NULL REFERENCES gambar(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (surat_id, gambar_id)
);
ALTER TABLE surat_gambar_ref ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sgr" ON surat_gambar_ref;
CREATE POLICY "anon_select_sgr" ON surat_gambar_ref FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sgr" ON surat_gambar_ref;
CREATE POLICY "anon_insert_sgr" ON surat_gambar_ref FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sgr" ON surat_gambar_ref;
CREATE POLICY "anon_delete_sgr" ON surat_gambar_ref FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sgr_surat ON surat_gambar_ref(surat_id);
CREATE INDEX IF NOT EXISTS idx_sgr_gambar ON surat_gambar_ref(gambar_id);

-- 4. Function to recompute status_tindak_lanjut for a given gambar_id
CREATE OR REPLACE FUNCTION recompute_tindak_lanjut(p_gambar_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE gambar
  SET status_tindak_lanjut = CASE
    WHEN EXISTS (SELECT 1 FROM surat_gambar_ref WHERE gambar_id = p_gambar_id) THEN 'Sudah Dibuat Surat'
    ELSE 'Belum Ada Tindak Lanjut'
  END
  WHERE id = p_gambar_id;
END;
$$;

-- 5. Trigger on surat_gambar_ref INSERT
CREATE OR REPLACE FUNCTION trg_sgr_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM recompute_tindak_lanjut(NEW.gambar_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sgr_after_insert ON surat_gambar_ref;
CREATE TRIGGER sgr_after_insert AFTER INSERT ON surat_gambar_ref
  FOR EACH ROW EXECUTE FUNCTION trg_sgr_insert();

-- 6. Trigger on surat_gambar_ref DELETE
CREATE OR REPLACE FUNCTION trg_sgr_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM recompute_tindak_lanjut(OLD.gambar_id);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS sgr_after_delete ON surat_gambar_ref;
CREATE TRIGGER sgr_after_delete AFTER DELETE ON surat_gambar_ref
  FOR EACH ROW EXECUTE FUNCTION trg_sgr_delete();

GRANT EXECUTE ON FUNCTION recompute_tindak_lanjut(uuid) TO anon, authenticated;
