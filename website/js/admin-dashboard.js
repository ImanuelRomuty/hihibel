// Admin dashboard — stats, tabs, import JSON
(function () {
  const SUB_BABS = [
    ...MATERI_SKD.map(m => ({ id: m.id, label: m.label, desc: m.fullName })),
    { id: 'kecepatan', label: 'Kecepatan', desc: '50 soal HOTS latihan TIU numerik' },
  ];

  let activeSubBab = 'twk';
  let stats = [];

  const els = {
    alertBox: document.getElementById('alertBox'),
    statsGrid: document.getElementById('statsGrid'),
    subBabTabs: document.getElementById('subBabTabs'),
    subBabDesc: document.getElementById('subBabDesc'),
    tableWrap: document.getElementById('tableWrap'),
    btnClearSubBab: document.getElementById('btnClearSubBab'),
    fileImport: document.getElementById('fileImport'),
    btnImportSeed: document.getElementById('btnImportSeed'),
  };

  function showAlert(msg, type = 'success') {
    els.alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    setTimeout(() => { els.alertBox.innerHTML = ''; }, 5000);
  }

  function countFor(id) {
    const row = stats.find(s => s.sub_bab === id);
    return row?.count || 0;
  }

  function renderStats() {
    els.statsGrid.innerHTML = SUB_BABS.map(s => {
      const n = countFor(s.id);
      return `
        <button type="button" class="stat-card${activeSubBab === s.id ? ' active' : ''}" data-sub="${s.id}">
          <span class="stat-card-label">${s.label}</span>
          <span class="stat-card-num">${n}</span>
          <span class="stat-card-hint">soal</span>
        </button>`;
    }).join('');

    els.statsGrid.querySelectorAll('.stat-card').forEach(card => {
      card.addEventListener('click', () => {
        activeSubBab = card.dataset.sub;
        renderTabs();
        renderStats();
        loadTable();
      });
    });
  }

  function renderTabs() {
    els.subBabTabs.innerHTML = SUB_BABS.map(s =>
      `<button type="button" class="admin-tab${activeSubBab === s.id ? ' active' : ''}" data-sub="${s.id}">${s.label}</button>`
    ).join('');

    els.subBabTabs.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeSubBab = tab.dataset.sub;
        renderTabs();
        renderStats();
        loadTable();
      });
    });

    const meta = SUB_BABS.find(s => s.id === activeSubBab);
    els.subBabDesc.textContent = meta?.desc || activeSubBab;
    els.btnClearSubBab.hidden = countFor(activeSubBab) === 0;
  }

  async function refreshStats() {
    stats = await SoalService.fetchStats();
    renderStats();
    renderTabs();
  }

  async function loadTable() {
    els.tableWrap.innerHTML = '<div class="loading-state">Memuat soal...</div>';
    els.btnClearSubBab.hidden = true;

    try {
      const rows = await SoalService.fetchAllAdmin(activeSubBab);
      els.btnClearSubBab.hidden = rows.length === 0;

      if (rows.length === 0) {
        els.tableWrap.innerHTML = `
          <div class="empty-state">
            <p>Belum ada soal untuk <strong>${subBabLabel(activeSubBab)}</strong>.</p>
            <p style="font-size:0.85rem">Jalankan <code>scripts/import-scraped-to-supabase.py</code> atau import JSON.</p>
          </div>`;
        return;
      }

      els.tableWrap.innerHTML = `
        <table class="soal-table">
          <thead><tr>
            <th>#</th><th>Kategori</th><th>Soal</th><th>Jawaban</th><th>Aksi</th>
          </tr></thead>
          <tbody>${rows.map(r => `
            <tr>
              <td>${r.urutan ?? r.id}</td>
              <td><span class="tag-pill">${(r.kategori || '').replace('Tes ', '')}</span></td>
              <td class="soal-preview">${escapeHtml(r.soal.slice(0, 100))}${r.soal.length > 100 ? '…' : ''}</td>
              <td><strong>${r.jawaban}</strong></td>
              <td class="table-actions">
                <a href="buat-soal.html?id=${r.id}" class="btn-sm">Edit</a>
                <button class="btn-sm danger" data-delete="${r.id}">Hapus</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>`;

      els.tableWrap.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Hapus soal ini?')) return;
          try {
            await SoalService.deleteSoal(parseInt(btn.dataset.delete, 10));
            showAlert('Soal dihapus.');
            await refreshStats();
            loadTable();
          } catch (e) {
            showAlert(e.message, 'error');
          }
        });
      });
    } catch (e) {
      els.tableWrap.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
    }
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function normalizeImportRows(data, subBab) {
    return data.map((q, i) => {
      const mappedSub = materiFromKategori(q.kategori) || subBab;
      return {
        kategori: q.kategori || subBabLabel(mappedSub),
        soal: q.soal,
        opsi: q.opsi,
        jawaban: q.jawaban,
        langkah: q.langkah || [],
        animasi: q.animasi,
        _sub: mappedSub,
        _urutan: i + 1,
      };
    });
  }

  async function importJsonFile(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('JSON harus array soal');
    }

    const normalized = normalizeImportRows(data, activeSubBab);
    const bySub = {};
    normalized.forEach((q) => {
      const sub = q._sub;
      if (!bySub[sub]) bySub[sub] = [];
      bySub[sub].push(q);
    });

    let total = 0;
    for (const [sub, items] of Object.entries(bySub)) {
      const existing = countFor(sub);
      const payload = items.map((q, i) => ({
        kategori: q.kategori,
        soal: q.soal,
        opsi: q.opsi,
        jawaban: q.jawaban,
        langkah: q.langkah,
        animasi: q.animasi,
        id: existing + i + 1,
      }));
      const result = await SoalService.importSeed(payload, sub, existing + 1);
      total += result.length;
    }

    showAlert(`${total} soal diimport (${Object.keys(bySub).join(', ')}).`);
    await refreshStats();
    loadTable();
  }

  async function init() {
    const session = await AdminAuth.requireAuth();
    if (!session) return;

    document.getElementById('userEmail').textContent = session.user.email;
    document.getElementById('btnLogout').addEventListener('click', () => AdminAuth.logout());

    await refreshStats();
    loadTable();

    els.fileImport.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await importJsonFile(file);
      } catch (err) {
        showAlert(err.message, 'error');
      }
      e.target.value = '';
    });

    els.btnImportSeed.addEventListener('click', async () => {
      if (activeSubBab !== 'kecepatan') {
        showAlert('Seed kecepatan hanya untuk tab Kecepatan.', 'error');
        return;
      }
      if (!confirm('Import 50 soal kecepatan bawaan?')) return;
      try {
        if (countFor('kecepatan') > 0) {
          showAlert('Kecepatan sudah berisi soal.', 'error');
          return;
        }
        const result = await SoalService.importSeed(SOAL_KECEPATAN, 'kecepatan');
        showAlert(`${result.length} soal kecepatan diimport.`);
        await refreshStats();
        loadTable();
      } catch (e) {
        showAlert(e.message, 'error');
      }
    });

    els.btnClearSubBab.addEventListener('click', async () => {
      const n = countFor(activeSubBab);
      if (!confirm(`Hapus semua ${n} soal di ${subBabLabel(activeSubBab)}?`)) return;
      try {
        await SoalService.deleteBySubBab(activeSubBab);
        showAlert('Semua soal di materi ini dihapus.');
        await refreshStats();
        loadTable();
      } catch (e) {
        showAlert(e.message, 'error');
      }
    });
  }

  init();
})();
