// Admin form: kategori-specific animasi fields + live preview
const AdminSoalForm = (() => {
  const fieldsEl = () => document.getElementById('animFields');
  const previewEl = () => document.getElementById('animPreview');

  function getKategori() {
    return document.getElementById('kategori').value;
  }

  function updatePreview() {
    AnimRenderer.renderInto(previewEl(), collectAnimasi());
  }

  function renderFields(anim) {
    const kategori = getKategori();
    const tipe = AnimRenderer.tipeForKategori(kategori);
    const data = anim?.tipe === tipe ? anim.data : AnimRenderer.defaultAnimasi(kategori).data;

    let html = `<p class="anim-fields-hint">Isi visual pembahasan untuk kategori <strong>${kategori}</strong></p>`;

    switch (tipe) {
      case 'rute':
        html += renderRuteFields(Array.isArray(data) ? data : []);
        break;
      case 'susul':
      case 'temu':
        html += renderPairFields(data, tipe === 'susul' ? 'Menyusul' : 'Bertemu');
        break;
      case 'kereta':
        html += `<div class="row-2">
          <div class="field"><label>Panjang / jarak</label><input type="text" data-anim="p" value="${esc(data.p)}"></div>
          <div class="field"><label>Kecepatan</label><input type="text" data-anim="v" value="${esc(data.v)}"></div>
        </div>`;
        break;
      case 'balik':
        html += `<div class="row-2">
          <div class="field"><label>Kecepatan pergi (km/j)</label><input type="text" data-anim="pergi" value="${esc(data.pergi)}"></div>
          <div class="field"><label>Kecepatan pulang (km/j)</label><input type="text" data-anim="pulang" value="${esc(data.pulang)}"></div>
        </div>
        <div class="field"><label>Hasil v̄ (km/j)</label><input type="text" data-anim="hasil" value="${esc(data.hasil)}"></div>`;
        break;
      case 'konversi':
        html += `<div class="row-2">
          <div class="field"><label>Dari</label><input type="text" data-anim="dari" value="${esc(data.dari)}"></div>
          <div class="field"><label>Ke</label><input type="text" data-anim="ke" value="${esc(data.ke)}"></div>
        </div>`;
        break;
      default:
        html += `<div class="field"><label>Rumus / keterangan</label><input type="text" data-anim="s" value="${esc(data.s)}"></div>
        <div class="field"><label>Hasil</label><input type="text" data-anim="h" value="${esc(data.h)}"></div>`;
    }

    fieldsEl().innerHTML = html;
    bindFieldListeners();
    updatePreview();
  }

  function esc(v) {
    return String(v ?? '').replace(/"/g, '&quot;');
  }

  function renderRuteFields(segments) {
    const rows = segments.length ? segments : [{ l: 'A', j: '', t: '', v: '' }, { l: 'B', j: '', t: '', v: '' }];
    let html = '<div class="rute-segments" id="ruteSegments">';
    rows.forEach((seg, i) => {
      html += ruteRow(seg, i);
    });
    html += '</div><button type="button" class="btn-sm" id="btnAddRuteSeg">+ Tambah titik/segmen</button>';
    return html;
  }

  function ruteRow(seg, i) {
    return `<div class="rute-seg-row" data-idx="${i}">
      <div class="field"><label>Titik</label><input type="text" data-rute="l" value="${esc(seg.l)}" placeholder="A, B, ☕"></div>
      <div class="field"><label>Jarak</label><input type="text" data-rute="j" value="${esc(seg.j)}" placeholder="120 km"></div>
      <div class="field"><label>Waktu</label><input type="text" data-rute="t" value="${esc(seg.t)}" placeholder="2 jam"></div>
      <div class="field"><label>Kecepatan</label><input type="text" data-rute="v" value="${esc(seg.v)}" placeholder="60"></div>
      <button type="button" class="btn-sm danger btn-rute-remove" title="Hapus">×</button>
    </div>`;
  }

  function renderPairFields(data, label) {
    const v1Label = label === 'Menyusul' ? 'Kecepatan mengejar (v₁)' : 'Kecepatan dari timur (v₁)';
    const v2Label = label === 'Menyusul' ? 'Kecepatan di depan (v₂)' : 'Kecepatan dari barat (v₂)';
    return `<div class="row-2">
      <div class="field"><label>${v1Label}</label><input type="number" data-anim="v1" value="${esc(data.v1)}"></div>
      <div class="field"><label>${v2Label}</label><input type="number" data-anim="v2" value="${esc(data.v2)}"></div>
    </div>
    <div class="field"><label>Jarak (km)</label><input type="number" data-anim="j" value="${esc(data.j)}"></div>`;
  }

  function bindFieldListeners() {
    fieldsEl().onclick = (e) => {
      if (e.target.id === 'btnAddRuteSeg') {
        const list = document.getElementById('ruteSegments');
        const idx = list.querySelectorAll('.rute-seg-row').length;
        const div = document.createElement('div');
        div.innerHTML = ruteRow({ l: '', j: '', t: '', v: '' }, idx);
        list.appendChild(div.firstElementChild);
        updatePreview();
      }
      if (e.target.classList.contains('btn-rute-remove')) {
        const rows = document.querySelectorAll('.rute-seg-row');
        if (rows.length <= 1) return;
        e.target.closest('.rute-seg-row').remove();
        updatePreview();
      }
    };

    fieldsEl().oninput = (e) => {
      if (e.target.matches('input')) updatePreview();
    };
  }

  function collectAnimasi() {
    const kategori = getKategori();
    const tipe = AnimRenderer.tipeForKategori(kategori);

    if (tipe === 'rute') {
      const data = [...document.querySelectorAll('.rute-seg-row')].map(row => {
        const seg = {};
        row.querySelectorAll('[data-rute]').forEach(inp => {
          const v = inp.value.trim();
          if (v) seg[inp.dataset.rute] = v;
        });
        return seg;
      }).filter(s => s.l || s.j || s.t || s.v);
      return { tipe, data: data.length ? data : [{ l: 'A' }, { l: 'B' }] };
    }

    const data = {};
    fieldsEl().querySelectorAll('[data-anim]').forEach(inp => {
      const v = inp.value.trim();
      if (v) data[inp.dataset.anim] = inp.type === 'number' ? Number(v) : v;
    });
    return { tipe, data };
  }

  function init(anim) {
    document.getElementById('kategori').addEventListener('change', () => {
      renderFields(AnimRenderer.defaultAnimasi(getKategori()));
    });
    renderFields(anim || AnimRenderer.defaultAnimasi(getKategori()));
  }

  return { init, collectAnimasi, updatePreview };
})();
