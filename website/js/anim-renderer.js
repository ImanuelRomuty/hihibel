// Shared animation renderer for latihan & admin preview
const AnimRenderer = (() => {
  const KATEGORI_TIPE = {
    'Dua Kecepatan': 'rute',
    'Kecepatan Rata-rata': 'rata',
    'Menyusul': 'susul',
    'Bertemu': 'temu',
    'Pergi-Pulang': 'balik',
    'Kereta': 'kereta',
    'Konversi': 'konversi',
    'Kapal & Arus': 'rata',
    'Logika': 'rata',
    'HOTS Kombinasi': 'balik',
  };

  function tipeForKategori(kategori) {
    return KATEGORI_TIPE[kategori] || 'rata';
  }

  function defaultAnimasi(kategori) {
    const tipe = tipeForKategori(kategori);
    switch (tipe) {
      case 'rute': return { tipe, data: [{ l: 'A', j: '', t: '', v: '' }, { l: 'B', j: '', t: '', v: '' }] };
      case 'susul': return { tipe, data: { v1: '', v2: '', j: '' } };
      case 'temu': return { tipe, data: { v1: '', v2: '', j: '' } };
      case 'kereta': return { tipe, data: { p: '', v: '' } };
      case 'balik': return { tipe, data: { pergi: '', pulang: '', hasil: '' } };
      case 'konversi': return { tipe, data: { dari: '', ke: '' } };
      default: return { tipe: 'rata', data: { s: '', h: '' } };
    }
  }

  function parseNum(str) {
    if (!str) return 0;
    const m = String(str).match(/[\d]+[,.]?\d*/);
    return m ? parseFloat(m[0].replace(',', '.')) : 0;
  }

  function segLabel(seg) {
    return [seg.j, seg.t, seg.v ? `@${seg.v}` : ''].filter(Boolean).join(' · ');
  }

  function renderRute(data) {
    if (!data || !data.length) return '<p class="anim-empty">Belum ada data rute</p>';

    const chain = [];
    const allSegments = data.every(s => !s.l && (s.j || s.v));

    if (allSegments) {
      chain.push({ kind: 'point', l: 'A' });
      data.forEach(seg => {
        const label = segLabel(seg);
        if (label) chain.push({ kind: 'seg', seg, label });
      });
      chain.push({ kind: 'point', l: 'B' });
    } else {
      data.forEach((seg, i) => {
        if (seg.l) chain.push({ kind: 'point', l: seg.l });
        const label = segLabel(seg);
        if (label && i < data.length - 1) {
          chain.push({ kind: 'seg', seg, label });
        }
      });
      if (chain.length && chain[0].kind === 'seg') {
        chain.unshift({ kind: 'point', l: 'A' });
      }
      const last = chain[chain.length - 1];
      if (last?.kind === 'seg') {
        chain.push({ kind: 'point', l: 'B' });
      }
    }

    const segItems = chain.filter(x => x.kind === 'seg');
    const weights = segItems.map(x => {
      const d = parseNum(x.seg.j);
      if (d > 0) return d;
      if (x.seg.t) return 0.15;
      return 1;
    });
    const totalW = weights.reduce((a, b) => a + b, 0) || 1;

    let segIdx = 0;
    let html = '<div class="anim-rute-v2"><div class="anim-rute-row">';

    chain.forEach(item => {
      if (item.kind === 'point') {
        html += `<div class="anim-rute-point">${item.l}</div>`;
      } else {
        const w = Math.max(12, Math.round((weights[segIdx] / totalW) * 100));
        const isRest = !item.seg.j && item.seg.t;
        html += `<div class="anim-rute-seg${isRest ? ' rest' : ''}" style="flex-grow:${w}">
          <span class="anim-rute-bar"></span>
          <span class="anim-rute-label">${item.label}</span>
        </div>`;
        segIdx++;
      }
    });

    html += '</div></div>';
    return html;
  }

  function renderSusul(data) {
    return `<div class="anim-motion">
      <div class="anim-track-line"><div class="anim-track-fill"></div></div>
      <div class="anim-cars">
        <span class="anim-car slow">🚗</span>
        <span class="anim-car fast">🏎️</span>
      </div>
      <div class="anim-info">v₁=${data.v1} km/j · v₂=${data.v2} km/j · jarak=${data.j} km</div>
    </div>`;
  }

  function renderTemu(data) {
    const sum = Number(data.v1) + Number(data.v2);
    const sumStr = Number.isFinite(sum) ? sum : '?';
    return `<div class="anim-motion">
      <div class="anim-track-line"><div class="anim-track-fill meet"></div></div>
      <div class="anim-cars meet">
        <span class="anim-car left">🚗</span>
        <span class="anim-car right">🚗</span>
      </div>
      <div class="anim-info">${data.v1}+${data.v2}=${sumStr} km/j · jarak=${data.j} km</div>
    </div>`;
  }

  function renderKereta(data) {
    return `<div class="anim-kereta-wrap"><span class="anim-kereta">🚂</span></div>
      <div class="anim-info">${data.p} @ ${data.v}</div>`;
  }

  function renderBalik(data) {
    return `<div class="anim-balik">
      <div class="anim-balik-row"><span class="anim-balik-arrow">→</span> Pergi @ ${data.pergi} km/j</div>
      <div class="anim-balik-row"><span class="anim-balik-arrow">←</span> Pulang @ ${data.pulang} km/j</div>
      <div class="anim-balik-result">v̄ = <strong>${data.hasil}</strong> km/j</div>
    </div>`;
  }

  function renderKonversi(data) {
    return `<div class="anim-konversi">
      <span>${data.dari}</span>
      <span class="anim-konversi-arrow">→</span>
      <span>${data.ke}</span>
    </div>`;
  }

  function renderRata(data) {
    return `<div class="anim-rata">
      <div class="anim-rata-formula">${data.s}</div>
      <div class="anim-rata-result">= <strong>${data.h}</strong></div>
    </div>`;
  }

  function render(anim) {
    if (!anim || !anim.tipe) return '';
    switch (anim.tipe) {
      case 'rute': return renderRute(anim.data);
      case 'susul': return renderSusul(anim.data);
      case 'temu': return renderTemu(anim.data);
      case 'kereta': return renderKereta(anim.data);
      case 'balik': return renderBalik(anim.data);
      case 'konversi': return renderKonversi(anim.data);
      case 'rata': return renderRata(anim.data);
      default: return '';
    }
  }

  function renderInto(el, anim) {
    if (!el) return;
    if (!anim || !anim.tipe) {
      el.innerHTML = '';
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    el.innerHTML = render(anim);
  }

  return { render, renderInto, defaultAnimasi, tipeForKategori, KATEGORI_TIPE };
})();
