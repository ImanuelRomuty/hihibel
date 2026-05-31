-- Migration: batasi baca soal hanya untuk user login
-- Jalankan di Supabase SQL Editor jika project sudah pernah deploy schema lama

DROP POLICY IF EXISTS "soal_public_read" ON soal;
DROP POLICY IF EXISTS "soal_member_read" ON soal;
CREATE POLICY "soal_member_read" ON soal
  FOR SELECT TO authenticated USING (true);
