// Load & transform soal (Supabase or offline fallback)
const SoalService = (() => {
  const KATEGORI_ANIMASI = {
    'Menyusul': { tipe: 'susul', data: { v1: '?', v2: '?', j: '?' } },
    'Bertemu': { tipe: 'temu', data: { v1: '?', v2: '?', j: '?' } },
    'Kereta': { tipe: 'kereta', data: { p: '?', v: '?', scene: 'tiang' } },
    'Pergi-Pulang': { tipe: 'balik', data: { jarak: '?', pergi: '?', pulang: '?', hasil: '?' } },
    'Konversi': { tipe: 'konversi', data: { dari: '?', ke: '?', op: '÷ 3,6' } },
    'Kecepatan Rata-rata': { tipe: 'rata', data: { segmen: [{ label: '?', v: '?', w: 1 }], hasil: '?' } },
    'Kapal & Arus': { tipe: 'kapal', data: { hilir: '?', hulu: '?', kapal: '?', arus: '?' } },
    'Logika': { tipe: 'logika', data: { mode: 'formula', rumus: '?', hasil: '?' } },
    'HOTS Kombinasi': { tipe: 'kombinasi', data: { jarak: '?', pergi: '?', pulang: '?', istirahat: '?', hasil: '?' } },
    'Dua Kecepatan': { tipe: 'rute', data: [{ l: 'A', j: '...' }, { l: 'B', j: '...' }] },
  };

  function autoAnimasi(kategori) {
    if (typeof AnimRenderer !== 'undefined') return AnimRenderer.defaultAnimasi(kategori);
    return KATEGORI_ANIMASI[kategori] || { tipe: 'rata', data: { s: kategori, h: '?' } };
  }

  function dbToQuiz(row, index) {
    return {
      id: row.urutan ?? index + 1,
      dbId: row.id,
      sub_bab: row.sub_bab,
      kategori: row.kategori,
      soal: row.soal,
      opsi: row.opsi,
      jawaban: row.jawaban,
      langkah: row.langkah || [],
      animasi: row.animasi || autoAnimasi(row.kategori),
      _key: String(row.id),
    };
  }

  function localToQuiz(q) {
    return { ...q, dbId: null, _key: String(q.id) };
  }

  async function fetchSoal(subBab = 'kecepatan') {
    const db = HihibelDB.getClient();
    if (db) {
      const { data, error } = await db
        .from('soal')
        .select('*')
        .eq('sub_bab', subBab)
        .order('urutan', { ascending: true })
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row, i) => dbToQuiz(row, i));
      }
    }

    if (typeof SOAL_KECEPATAN !== 'undefined') {
      return SOAL_KECEPATAN.map(localToQuiz);
    }
    return [];
  }

  async function saveSoal(payload) {
    const db = HihibelDB.getClient();
    if (!db) throw new Error('Supabase belum dikonfigurasi');

    const row = {
      sub_bab: payload.sub_bab || 'kecepatan',
      kategori: payload.kategori,
      soal: payload.soal,
      opsi: payload.opsi,
      jawaban: payload.jawaban,
      langkah: payload.langkah || [],
      animasi: payload.animasi || autoAnimasi(payload.kategori),
      urutan: payload.urutan ?? null,
    };

    if (payload.dbId) {
      const { data, error } = await db.from('soal').update(row).eq('id', payload.dbId).select().single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await db.from('soal').insert(row).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteSoal(dbId) {
    const db = HihibelDB.getClient();
    if (!db) throw new Error('Supabase belum dikonfigurasi');
    const { error } = await db.from('soal').delete().eq('id', dbId);
    if (error) throw error;
  }

  async function fetchAllAdmin(subBab = 'kecepatan') {
    const db = HihibelDB.getClient();
    if (!db) return [];
    const { data, error } = await db
      .from('soal')
      .select('id, kategori, soal, jawaban, urutan, created_at')
      .eq('sub_bab', subBab)
      .order('urutan', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function importSeed(seedData, subBab = 'kecepatan', startUrutan = 1) {
    const db = HihibelDB.getClient();
    if (!db) throw new Error('Supabase belum dikonfigurasi');

    const rows = seedData.map((q, i) => ({
      sub_bab: subBab,
      kategori: q.kategori,
      soal: q.soal,
      opsi: q.opsi,
      jawaban: q.jawaban,
      langkah: q.langkah || [],
      animasi: q.animasi || autoAnimasi(q.kategori),
      urutan: q.id ?? startUrutan + i,
    }));

    const { data, error } = await db.from('soal').insert(rows).select();
    if (error) throw error;
    return data;
  }

  async function fetchStats() {
    const db = HihibelDB.getClient();
    if (!db) return [];
    const { data, error } = await db.from('soal').select('sub_bab');
    if (error) throw error;
    const counts = {};
    (data || []).forEach((row) => {
      counts[row.sub_bab] = (counts[row.sub_bab] || 0) + 1;
    });
    return Object.entries(counts).map(([sub_bab, count]) => ({ sub_bab, count }));
  }

  async function deleteBySubBab(subBab) {
    const db = HihibelDB.getClient();
    if (!db) throw new Error('Supabase belum dikonfigurasi');
    const { error } = await db.from('soal').delete().eq('sub_bab', subBab);
    if (error) throw error;
  }

  async function countBySubBab(subBab) {
    const db = HihibelDB.getClient();
    if (!db) return 0;
    const { count, error } = await db
      .from('soal')
      .select('*', { count: 'exact', head: true })
      .eq('sub_bab', subBab);
    if (error) throw error;
    return count || 0;
  }

  return {
    fetchSoal, saveSoal, deleteSoal, fetchAllAdmin, importSeed, autoAnimasi,
    fetchStats, deleteBySubBab, countBySubBab,
  };
})();
