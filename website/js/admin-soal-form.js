// Admin form: kategori-specific animasi fields + live preview
const AdminSoalForm = (() => {
  const fieldsEl = () => document.getElementById('animFields');
  const previewEl = () => document.getElementById('animPreview');

  function getKategori() {
    return document.getElementById('kategori').value;
  }

  function getTipe(anim) {
    return anim?.tipe || AnimRenderer.tipeForKategori(getKategori());
  }

  function updatePreview() {
    AnimRenderer.renderInto(previewEl(), collectAnimasi());
  }

  function esc(v) {
    return String(v ?? '').replace(/"/g, '&quot;');
  }

  function renderFields(anim) {
    const kategori = getKategori();
    const tipe = getTipe(anim);
    const defaults = AnimRenderer.defaultAnimasi(kategori);
    const data = anim?.tipe === tipe ? anim.data : defaults.data;

    let html = `<p class="anim-fields-hint">Visual pembahasan — <strong>${kategori}</strong></p>`;

    switch (tipe) {
      case 'rute':
        html += renderRuteFields(Array.isArray(data) ? data : []);
        break;
      case 'susul':
      case 'temu':
        html += renderPairFields(data, tipe);
        break;
      case 'kereta':
        html += `<div class="row-2">
          <div class="field"><label>Panjang / jarak lintasan</label><input type="text" data-anim="p" value="${esc(data.p)}" placeholder="180 m"></div>
          <div class="field"><label>Kecepatan</label><input type="text" data-anim="v" value="${esc(data.v)}" placeholder="15 m/d"></div>
        </div>
        <div class="field"><label>Scene</label>
          <select data-anim="scene">
            <option value="tiang"${data.scene === 'tiang' ? ' selected' : ''}>Tiang listrik</option>
            <option value="jembatan"${data.scene === 'jembatan' ? ' selected' : ''}>Jembatan</option>
          </select>
        </div>`;
        break;
      case 'balik':
        html += `<div class="field"><label>Jarak one-way (km, opsional)</label><input type="text" data-anim="jarak" value="${esc(data.jarak)}" placeholder="60"></div>
        <div class="row-2">
          <div class="field"><label>Kecepatan pergi (km/j)</label><input type="text" data-anim="pergi" value="${esc(data.pergi)}"></div>
          <div class="field"><label>Kecepatan pulang (km/j)</label><input type="text" data-anim="pulang" value="${esc(data.pulang)}"></div>
        </div>
        <div class="field"><label>Hasil v̄ (km/j)</label><input type="text" data-anim="hasil" value="${esc(data.hasil)}"></div>`;
        break;
      case 'konversi':
        html += `<div class="row-2">
          <div class="field"><label>Dari</label><input type="text" data-anim="dari" value="${esc(data.dari)}"></div>
          <div class="field"><label>Ke</label><input type="text" data-anim="ke" value="${esc(data.ke)}"></div>
        </div>
        <div class="field"><label>Operasi</label><input type="text" data-anim="op" value="${esc(data.op || '÷ 3,6')}" placeholder="÷ 3,6 atau × 3,6"></div>`;
        break;
      case 'kapal':
        html += `<div class="row-2">
          <div class="field"><label>Kecepatan hilir (km/j)</label><input type="text" data-anim="hilir" value="${esc(data.hilir)}"></div>
          <div class="field"><label>Kecepatan hulu (km/j)</label><input type="text" data-anim="hulu" value="${esc(data.hulu)}"></div>
        </div>
        <div class="row-2">
          <div class="field"><label>v kapal (air tenang)</label><input type="text" data-anim="kapal" value="${esc(data.kapal)}"></div>
          <div class="field"><label>v arus</label><input type="text" data-anim="arus" value="${esc(data.arus)}"></div>
        </div>`;
        break;
      case 'logika':
        html += renderLogikaFields(data);
        break;
      case 'kombinasi':
        html += `<div class="row-2">
          <div class="field"><label>Jarak A↔B (km)</label><input type="text" data-anim="jarak" value="${esc(data.jarak)}"></div>
          <div class="field"><label>Istirahat di B</label><input type="text" data-anim="istirahat" value="${esc(data.istirahat)}" placeholder="1 jam"></div>
        </div>
        <div class="row-2">
          <div class="field"><label>Kecepatan pergi (km/j)</label><input type="text" data-anim="pergi" value="${esc(data.pergi)}"></div>
          <div class="field"><label>Kecepatan pulang (km/j)</label><input type="text" data-anim="pulang" value="${esc(data.pulang)}"></div>
        </div>
        <div class="field"><label>Total waktu</label><input type="text" data-anim="hasil" value="${esc(data.hasil)}" placeholder="8 jam"></div>`;
        break;
      default:
        html += renderRataFields(data);
    }

    fieldsEl().innerHTML = html;
    bindFieldListeners();
    updatePreview();
  }

  function renderRuteFields(segments) {
    const rows = segments.length ? segments : [{ l: 'A', j: '', t: '', v: '' }, { l: 'B', j: '', t: '', v: '' }];
    let html = '<div class="rute-segments" id="ruteSegments">';
    rows.forEach((seg, i) => { html += ruteRow(seg, i); });
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

  function renderRataFields(data) {
    const segs = data.segmen || [{ label: '', v: '', w: '' }];
    let html = '<div class="rata-segments" id="rataSegments">';
    segs.forEach((s, i) => {
      html += `<div class="rata-seg-row">
        <div class="field"><label>Segmen</label><input type="text" data-rata="label" value="${esc(s.label)}" placeholder="30 km"></div>
        <div class="field"><label>Kecepatan</label><input type="text" data-rata="v" value="${esc(s.v)}" placeholder="30"></div>
        <div class="field"><label>Bobot</label><input type="text" data-rata="w" value="${esc(s.w)}" placeholder="30"></div>
        <button type="button" class="btn-sm danger btn-rata-remove">×</button>
      </div>`;
    });
    html += `</div><button type="button" class="btn-sm" id="btnAddRataSeg">+ Tambah segmen</button>
      <div class="field" style="margin-top:12px"><label>Hasil v̄ (km/j)</label><input type="text" data-anim="hasil" value="${esc(data.hasil || data.h)}"></div>`;
    return html;
  }

  function renderLogikaFields(data) {
    const mode = data.mode || 'formula';
    let html = `<div class="field"><label>Tipe visual</label>
      <select data-anim="mode" id="logikaMode">
        <option value="race"${mode === 'race' ? ' selected' : ''}>Balapan (2 kecepatan)</option>
        <option value="compare"${mode === 'compare' ? ' selected' : ''}>Perbandingan (sebelum/sesudah)</option>
        <option value="formula"${mode === 'formula' ? ' selected' : ''}>Rumus</option>
      </select>
    </div><div id="logikaModeFields">`;

    if (mode === 'race') {
      html += `<div class="row-2">
        <div class="field"><label>Kecepatan A (km/j)</label><input type="text" data-anim="v1" value="${esc(data.v1)}"></div>
        <div class="field"><label>Kecepatan B (km/j)</label><input type="text" data-anim="v2" value="${esc(data.v2)}"></div>
      </div>
      <div class="row-2">
        <div class="field"><label>Jarak (km)</label><input type="text" data-anim="j" value="${esc(data.j)}"></div>
        <div class="field"><label>Waktu A / B</label><input type="text" data-anim="w1" value="${esc(data.w1)}" placeholder="4j"></div>
      </div>
      <div class="field"><label>Waktu B</label><input type="text" data-anim="w2" value="${esc(data.w2)}" placeholder="5j"></div>
      <div class="field"><label>Hasil (selisih/dst)</label><input type="text" data-anim="hasil" value="${esc(data.hasil)}"></div>`;
    } else if (mode === 'compare') {
      html += `<div class="row-2">
        <div class="field"><label>Kecepatan awal</label><input type="text" data-anim="v1" value="${esc(data.v1)}"></div>
        <div class="field"><label>Kecepatan baru</label><input type="text" data-anim="v2" value="${esc(data.v2)}"></div>
      </div>
      <div class="row-2">
        <div class="field"><label>Waktu awal</label><input type="text" data-anim="w1" value="${esc(data.w1)}"></div>
        <div class="field"><label>Waktu baru</label><input type="text" data-anim="w2" value="${esc(data.w2)}"></div>
      </div>
      <div class="field"><label>Hasil</label><input type="text" data-anim="hasil" value="${esc(data.hasil)}"></div>`;
    } else {
      html += `<div class="field"><label>Rumus</label><input type="text" data-anim="rumus" value="${esc(data.rumus || data.s)}" placeholder="J = v × t"></div>
      <div class="field"><label>Hasil</label><input type="text" data-anim="hasil" value="${esc(data.hasil || data.h)}"></div>`;
    }
    html += '</div>';
    return html;
  }

  function renderPairFields(data, tipe) {
    const susul = tipe === 'susul';
    return `<div class="row-2">
      <div class="field"><label>${susul ? 'Kecepatan mengejar (v₁)' : 'Kecepatan timur (v₁)'}</label><input type="number" data-anim="v1" value="${esc(data.v1)}"></div>
      <div class="field"><label>${susul ? 'Kecepatan di depan (v₂)' : 'Kecepatan barat (v₂)'}</label><input type="number" data-anim="v2" value="${esc(data.v2)}"></div>
    </div>
    <div class="field"><label>Jarak (km)</label><input type="number" data-anim="j" value="${esc(data.j)}"></div>`;
  }

  function bindFieldListeners() {
    fieldsEl().onclick = (e) => {
      if (e.target.id === 'btnAddRuteSeg') {
        const list = document.getElementById('ruteSegments');
        const div = document.createElement('div');
        div.innerHTML = ruteRow({ l: '', j: '', t: '', v: '' }, list.children.length);
        list.appendChild(div.firstElementChild);
        updatePreview();
      }
      if (e.target.classList.contains('btn-rute-remove')) {
        if (document.querySelectorAll('.rute-seg-row').length <= 1) return;
        e.target.closest('.rute-seg-row').remove();
        updatePreview();
      }
      if (e.target.id === 'btnAddRataSeg') {
        const list = document.getElementById('rataSegments');
        const row = document.createElement('div');
        row.className = 'rata-seg-row';
        row.innerHTML = `<div class="field"><label>Segmen</label><input type="text" data-rata="label" placeholder="30 km"></div>
          <div class="field"><label>Kecepatan</label><input type="text" data-rata="v"></div>
          <div class="field"><label>Bobot</label><input type="text" data-rata="w"></div>
          <button type="button" class="btn-sm danger btn-rata-remove">×</button>`;
        list.appendChild(row);
        updatePreview();
      }
      if (e.target.classList.contains('btn-rata-remove')) {
        if (document.querySelectorAll('.rata-seg-row').length <= 1) return;
        e.target.closest('.rata-seg-row').remove();
        updatePreview();
      }
    };

    fieldsEl().onchange = (e) => {
      if (e.target.id === 'logikaMode') {
        renderFields({ tipe: 'logika', data: { mode: e.target.value } });
      } else {
        updatePreview();
      }
    };

    fieldsEl().oninput = (e) => {
      if (e.target.matches('input, select')) updatePreview();
    };
  }

  function collectAnimasi() {
    const tipe = AnimRenderer.tipeForKategori(getKategori());

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

    if (tipe === 'rata') {
      const segmen = [...document.querySelectorAll('.rata-seg-row')].map(row => {
        const s = {};
        row.querySelectorAll('[data-rata]').forEach(inp => {
          const v = inp.value.trim();
          if (v) s[inp.dataset.rata] = inp.dataset.rata === 'w' ? Number(v) || v : v;
        });
        return s;
      }).filter(s => s.label || s.v);
      const hasilInp = fieldsEl().querySelector('[data-anim="hasil"]');
      return { tipe, data: { segmen, hasil: hasilInp?.value.trim() || '' } };
    }

    const data = {};
    fieldsEl().querySelectorAll('[data-anim]').forEach(inp => {
      const v = inp.tagName === 'SELECT' ? inp.value : inp.value.trim();
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
