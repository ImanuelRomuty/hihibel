// Struktur subbab per materi SKD
const SITE_STRUCTURE = {
  twk: {
    title: 'Tes Wawasan Kebangsaan',
    subtitle: 'Nasionalisme, integritas, bela negara, dan pilar negara.',
    stats: [
      { label: 'soal latihan', key: 'twk' },
      { label: 'passing grade', text: '65' },
      { label: 'sub bab', text: '4' },
    ],
    groups: [
      {
        title: 'Latihan',
        items: [
          {
            title: 'Bank Soal TWK',
            desc: 'Latihan lengkap dengan pembahasan — dikumpulkan dari tryout.',
            href: 'latihan.html',
            live: true,
            countKey: 'twk',
          },
        ],
      },
      {
        title: 'Materi (segera)',
        items: [
          { title: 'Pancasila & Ideologi', desc: 'Nilai dasar dan penerapan', soon: true },
          { title: 'UUD 1945 & NKRI', desc: 'Konstitusi dan lembaga negara', soon: true },
          { title: 'Nasionalisme & Integritas', desc: 'Sikap dan etika bernegara', soon: true },
          { title: 'Bela Negara', desc: 'Semangat mempertahankan negara', soon: true },
        ],
      },
    ],
  },
  tiu: {
    title: 'Tes Intelegensia Umum',
    subtitle: 'Verbal, numerik, dan figural — pilih sub bab untuk belajar.',
    stats: [
      { label: 'soal SKD', key: 'tiu' },
      { label: 'passing grade', text: '80' },
      { label: 'sub bab', text: '10' },
    ],
    groups: [
      {
        title: 'Kemampuan Verbal',
        items: [
          { title: 'Analogi Verbal', desc: 'Hubungan antar kata dan konsep', soon: true },
          { title: 'Silogisme', desc: 'Menarik kesimpulan dari premis', soon: true },
          { title: 'Analitis', desc: 'Analisis informasi dan urutan', soon: true },
        ],
      },
      {
        title: 'Kemampuan Numerik',
        items: [
          {
            title: 'Soal Cerita',
            desc: 'Materi jarak, waktu, kecepatan — rumus & contoh.',
            href: 'soal-cerita.html',
            live: true,
          },
          {
            title: 'Latihan HOTS Kecepatan',
            desc: '50 soal numerik dengan pembahasan & animasi.',
            href: 'latihan-kecepatan.html',
            live: true,
            badge: '50 Soal',
          },
          { title: 'Berhitung', desc: 'Operasi hitung dan aritmatika', soon: true },
          { title: 'Deret Angka', desc: 'Pola dan hubungan antar angka', soon: true },
          { title: 'Perbandingan Kuantitatif', desc: 'Membandingkan dua kuantitas', soon: true },
        ],
      },
      {
        title: 'Kemampuan Figural',
        items: [
          { title: 'Analogi Gambar', desc: 'Hubungan antar pola visual', soon: true },
          { title: 'Ketidaksamaan', desc: 'Mencari gambar yang berbeda', soon: true },
          { title: 'Serial Gambar', desc: 'Melanjutkan pola gambar', soon: true },
        ],
      },
      {
        title: 'Latihan SKD',
        items: [
          {
            title: 'Bank Soal TIU',
            desc: 'Soal TIU dari tryout — verbal, numerik, figural.',
            href: 'latihan-skd.html',
            live: true,
            countKey: 'tiu',
          },
        ],
      },
    ],
  },
  tkp: {
    title: 'Tes Karakteristik Pribadi',
    subtitle: 'Pelayanan publik, jejaring kerja, dan profesionalisme.',
    stats: [
      { label: 'soal latihan', key: 'tkp' },
      { label: 'passing grade', text: '166' },
      { label: 'sub bab', text: '4' },
    ],
    groups: [
      {
        title: 'Latihan',
        items: [
          {
            title: 'Bank Soal TKP',
            desc: 'Latihan lengkap dengan pembahasan — dikumpulkan dari tryout.',
            href: 'latihan.html',
            live: true,
            countKey: 'tkp',
          },
        ],
      },
      {
        title: 'Materi (segera)',
        items: [
          { title: 'Pelayanan Publik', desc: 'Orientasi melayani masyarakat', soon: true },
          { title: 'Jejaring Kerja', desc: 'Kolaborasi dan komunikasi', soon: true },
          { title: 'Sosial Budaya', desc: 'Adaptasi dan toleransi', soon: true },
          { title: 'Profesionalisme', desc: 'Integritas dan tanggung jawab', soon: true },
        ],
      },
    ],
  },
};

function renderSubbabPage(materiId, countMap = {}) {
  const data = SITE_STRUCTURE[materiId];
  const root = document.getElementById('subbabRoot');
  const statsEl = document.getElementById('pageStats');
  if (!data || !root) return;

  if (statsEl) {
    statsEl.innerHTML = data.stats.map((s) => {
      const val = s.key ? (countMap[s.key] || '—') : s.text;
      const suffix = s.key && countMap[s.key] ? '' : '';
      return `<div class="page-stat"><strong>${val}${suffix}</strong> ${s.label}</div>`;
    }).join('');
  }

  root.innerHTML = data.groups.map((group) => `
    <section class="section-group reveal">
      <h2 class="section-group-title">${group.title}</h2>
      <div class="subbab-list">
        ${group.items.map((item) => renderSubbabItem(item, countMap)).join('')}
      </div>
    </section>
  `).join('');

  document.querySelectorAll('.reveal').forEach((el) => {
    if (!el.classList.contains('visible')) {
      requestAnimationFrame(() => el.classList.add('visible'));
    }
  });
}

function renderSubbabItem(item, countMap) {
  if (item.soon) {
    return `<div class="subbab-item disabled">
      <div class="subbab-info"><h3>${item.title}</h3><p>${item.desc}</p></div>
      <span class="badge badge-soon">Segera</span>
    </div>`;
  }

  const badge = item.badge
    || (item.countKey && countMap[item.countKey] ? `${countMap[item.countKey]} Soal` : 'Latihan');

  return `<a href="${item.href}" class="subbab-item">
    <div class="subbab-info"><h3>${item.title}</h3><p>${item.desc}</p></div>
    <span class="badge badge-live">${badge}</span>
  </a>`;
}
