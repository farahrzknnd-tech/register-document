/*
# Add Berita Acara Register + As Built Drawing

## Changes
1. Create `berita_acara` table — stores Berita Acara Aanwijzing and Berita Acara Klarifikasi.
   - register_no: auto-generated (AWZ-YY-0001 / KLR-YY-0001)
   - jenis_berita_acara: 'Berita Acara Aanwijzing' | 'Berita Acara Klarifikasi'
   - tanggal, perihal, link_drive, keterangan
   - No "Nomor Berita Acara" field per spec.
2. Update `next_gambar_register_no` to add 'As Built Drawing' -> 'ABD' prefix.
3. Create `next_berita_acara_register_no` function (AWZ / KLR prefixes, per-jenis sequence).
4. Update `document_ref` CHECK constraints to include 'berita_acara' as a valid source_type/ref_type.
5. Enable RLS on berita_acara with anon+authenticated CRUD (single-tenant, no auth).

## Important Notes
1. No data is deleted or modified. Existing gambar/surat/surat_penunjukan data untouched.
2. register_seq table reused for berita_acara sequences (table_name='berita_acara').
3. As Built Drawing is a new jenis_gambar value — existing data won't be affected.
4. document_ref constraint dropped and recreated to include berita_acara.
*/

-- 1. Create berita_acara table
CREATE TABLE IF NOT EXISTS berita_acara (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_no text UNIQUE,
  jenis_berita_acara text NOT NULL CHECK (jenis_berita_acara IN ('Berita Acara Aanwijzing', 'Berita Acara Klarifikasi')),
  tanggal date NOT NULL,
  perihal text NOT NULL,
  link_drive text,
  keterangan text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE berita_acara ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ba" ON berita_acara;
CREATE POLICY "anon_select_ba" ON berita_acara FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ba" ON berita_acara;
CREATE POLICY "anon_insert_ba" ON berita_acara FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ba" ON berita_acara;
CREATE POLICY "anon_update_ba" ON berita_acara FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ba" ON berita_acara;
CREATE POLICY "anon_delete_ba" ON berita_acara FOR DELETE
  TO anon, authenticated USING (true);

-- 2. Update next_gambar_register_no to add As Built Drawing
CREATE OR REPLACE FUNCTION next_gambar_register_no(p_jenis text, p_tahun integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
v_prefix text;
v_year2 text := lpad(p_tahun::text, 4, '0');
v_year_short text := substring(v_year2 from 3 for 2);
v_next int;
v_register_no text;
BEGIN
v_prefix := CASE p_jenis
WHEN 'Gambar Pelaksanaan' THEN 'GP'
WHEN 'Gambar Revisi Pelaksanaan' THEN 'GRP'
WHEN 'Gambar Tender' THEN 'GT'
WHEN 'Gambar Revisi Tender' THEN 'GRT'
WHEN 'Gambar Informasi' THEN 'GI'
WHEN 'As Built Drawing' THEN 'ABD'
ELSE 'GP'
END;

INSERT INTO register_seq (table_name, jenis, year, last_seq)
VALUES ('gambar', p_jenis, p_tahun, 1)
ON CONFLICT (table_name, jenis, year)
DO UPDATE SET last_seq = register_seq.last_seq + 1
RETURNING last_seq INTO v_next;

v_register_no := v_prefix || '-' || v_year_short || '-' || lpad(v_next::text, 4, '0');
RETURN v_register_no;
END;
$function$;

-- 3. Create next_berita_acara_register_no function
CREATE OR REPLACE FUNCTION next_berita_acara_register_no(p_jenis text, p_tahun integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
v_prefix text;
v_year2 text := lpad(p_tahun::text, 4, '0');
v_year_short text := substring(v_year2 from 3 for 2);
v_next int;
v_register_no text;
BEGIN
v_prefix := CASE p_jenis
WHEN 'Berita Acara Aanwijzing' THEN 'AWZ'
WHEN 'Berita Acara Klarifikasi' THEN 'KLR'
ELSE 'AWZ'
END;

INSERT INTO register_seq (table_name, jenis, year, last_seq)
VALUES ('berita_acara', p_jenis, p_tahun, 1)
ON CONFLICT (table_name, jenis, year)
DO UPDATE SET last_seq = register_seq.last_seq + 1
RETURNING last_seq INTO v_next;

v_register_no := v_prefix || '-' || v_year_short || '-' || lpad(v_next::text, 4, '0');
RETURN v_register_no;
END;
$function$;

GRANT EXECUTE ON FUNCTION next_berita_acara_register_no(text, integer) TO anon, authenticated;

-- 4. Update document_ref CHECK constraints to include berita_acara
ALTER TABLE document_ref DROP CONSTRAINT IF EXISTS document_ref_source_type_check;
ALTER TABLE document_ref ADD CONSTRAINT document_ref_source_type_check
  CHECK (source_type IN ('gambar', 'surat', 'surat_penunjukan', 'berita_acara'));

ALTER TABLE document_ref DROP CONSTRAINT IF EXISTS document_ref_ref_type_check;
ALTER TABLE document_ref ADD CONSTRAINT document_ref_ref_type_check
  CHECK (ref_type IN ('gambar', 'surat', 'surat_penunjukan', 'berita_acara'));
