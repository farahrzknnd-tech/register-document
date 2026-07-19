/*
# Revisi: Add kategori_surat column + Create surat_penunjukan table

## Changes
1. Add `kategori_surat` text column (nullable) to `surat` table.
2. Create `surat_penunjukan` table for recording Surat Penunjukan.
3. Add `next_surat_penunjukan_register_no(tahun int)` RPC function (SP prefix).
4. RLS enabled on surat_penunjukan with anon+authenticated CRUD policies.
*/

ALTER TABLE surat ADD COLUMN IF NOT EXISTS kategori_surat text;

CREATE TABLE IF NOT EXISTS surat_penunjukan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_no text UNIQUE,
  nomor_sp text NOT NULL,
  tanggal_sp date NOT NULL DEFAULT CURRENT_DATE,
  nama_kontraktor text NOT NULL,
  jenis_pekerjaan text NOT NULL,
  lokasi text,
  tanggal_start date,
  tanggal_finish date,
  durasi int,
  tanggal_kickoff date,
  link_risalah text,
  keterangan text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE surat_penunjukan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sp" ON surat_penunjukan;
CREATE POLICY "anon_select_sp" ON surat_penunjukan FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sp" ON surat_penunjukan;
CREATE POLICY "anon_insert_sp" ON surat_penunjukan FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sp" ON surat_penunjukan;
CREATE POLICY "anon_update_sp" ON surat_penunjukan FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sp" ON surat_penunjukan;
CREATE POLICY "anon_delete_sp" ON surat_penunjukan FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sp_register_no ON surat_penunjukan(register_no);
CREATE INDEX IF NOT EXISTS idx_sp_nomor ON surat_penunjukan(nomor_sp);
CREATE INDEX IF NOT EXISTS idx_sp_kontraktor ON surat_penunjukan(nama_kontraktor);
CREATE INDEX IF NOT EXISTS idx_sp_jenis ON surat_penunjukan(jenis_pekerjaan);
CREATE INDEX IF NOT EXISTS idx_sp_tanggal ON surat_penunjukan(tanggal_sp);

CREATE OR REPLACE FUNCTION next_surat_penunjukan_register_no(p_tahun int)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year2 text := lpad(p_tahun::text, 4, '0');
  v_year_short text := substring(v_year2 from 3 for 2);
  v_next int;
  v_register_no text;
BEGIN
  INSERT INTO register_seq (table_name, jenis, year, last_seq)
  VALUES ('surat_penunjukan', 'SP', p_tahun, 1)
  ON CONFLICT (table_name, jenis, year)
  DO UPDATE SET last_seq = register_seq.last_seq + 1
  RETURNING last_seq INTO v_next;

  v_register_no := 'SP-' || v_year_short || '-' || lpad(v_next::text, 4, '0');
  RETURN v_register_no;
END;
$$;

GRANT EXECUTE ON FUNCTION next_surat_penunjukan_register_no(int) TO anon, authenticated;
