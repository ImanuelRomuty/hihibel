// Metadata materi SKD (tanpa konten soal)
const KATEGORI_TO_SUB_BAB = {
  'Tes Wawasan Kebangsaan': 'twk',
  'Tes Intelegensi Umum': 'tiu',
  'Tes Intelegensia Umum': 'tiu',
  'Tes Karakteristik Pribadi': 'tkp',
};

const MATERI_SKD = [
  { id: 'twk', label: 'TWK', fullName: 'Tes Wawasan Kebangsaan', deskripsi: 'Nasionalisme, integritas, bela negara' },
  { id: 'tiu', label: 'TIU', fullName: 'Tes Intelegensia Umum', deskripsi: 'Verbal, numerik, figural' },
  { id: 'tkp', label: 'TKP', fullName: 'Tes Karakteristik Pribadi', deskripsi: 'Pelayanan publik & profesionalisme' },
];

const SUB_BAB_META = {
  kecepatan: { label: 'Latihan Kecepatan', group: 'TIU Numerik', icon: '⚡' },
  twk: { label: 'TWK', group: 'SKD', icon: '🇮🇩' },
  tiu: { label: 'TIU', group: 'SKD', icon: '🧠' },
  tkp: { label: 'TKP', group: 'SKD', icon: '🤝' },
};

function subBabLabel(id) {
  return SUB_BAB_META[id]?.label || id;
}

function materiFromKategori(kategori) {
  return KATEGORI_TO_SUB_BAB[kategori] || null;
}
