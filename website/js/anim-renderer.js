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
    'Kapal & Arus': 'kapal',
    'Logika': 'logika',
    'HOTS Kombinasi': 'kombinasi',
  };

  function tipeForKategori(kategori) {
    return KATEGORI_TIPE[kategori] || 'rata';
  }

  function defaultAnimasi(kategori) {
    const tipe = tipeForKategori(kategori);
    switch (tipe) {
      case 'rute':
        return { tipe, data: [{ l: 'A', j: '', t: '', v: '' }, { l: 'B', j: '', t: '', v: '' }] };
      case 'susul':
      case 'temu':
        return { tipe, data: { v1: '', v2: '', j: '' } };
      case 'kereta':
        return { tipe, data: { p: '', v: '', scene: 'tiang' } };
      case 'balik':
        return { tipe, data: { jarak: '', pergi: '', pulang: '', hasil: '' } };
      case 'konversi':
        return { tipe, data: { dari: '', ke: '', op: '÷ 3,6' } };
      case 'kapal':
        return { tipe, data: { hilir: '', hulu: '', kapal: '', arus: '' } };
      case 'logika':
        return { tipe, data: { mode: 'race', v1: '', v2: '', j: '', hasil: '' } };
      case 'kombinasi':
        return { tipe, data: { jarak: '', pergi: '', pulang: '', istirahat: '', hasil: '' } };
      default:
        return { tipe: 'rata', data: { segmen: [{ label: '', v: '', w: 1 }], hasil: '' } };
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
        if (label && i < data.length - 1) chain.push({ kind: 'seg', seg, label });
      });
      if (chain.length && chain[0].kind === 'seg') chain.unshift({ kind: 'point', l: 'A' });
      if (chain[chain.length - 1]?.kind === 'seg') chain.push({ kind: 'point', l: 'B' });
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
      <div class="anim-info">v₁=${data.v1} km/j · v₂=${data.v2} km/j · selisih jarak=${data.j} km</div>
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
    const scene = data.scene || (parseNum(data.p) > 500 ? 'jembatan' : 'tiang');
    const icon = scene === 'jembatan' ? '🌉' : '🗼';
    const label = scene === 'jembatan' ? 'Jembatan + kereta' : 'Tiang listrik';
    return `<div class="anim-kereta-scene">
      <div class="anim-kereta-landmark">${icon}</div>
      <div class="anim-kereta-wrap"><span class="anim-kereta">🚂</span></div>
      <div class="anim-info">${label} · ${data.p} @ ${data.v}</div>
    </div>`;
  }

  function renderBalik(data) {
    const jarak = data.jarak ? `${data.jarak} km` : '';
    return `<div class="anim-trip">
      <div class="anim-trip-row">
        <div class="anim-trip-node">🏠</div>
        <div class="anim-trip-seg go">
          <span class="anim-trip-bar"></span>
          <span class="anim-trip-label">→ ${data.pergi} km/j${jarak ? ' · ' + jarak : ''}</span>
        </div>
        <div class="anim-trip-node">📍</div>
        <div class="anim-trip-seg back">
          <span class="anim-trip-bar"></span>
          <span class="anim-trip-label">← ${data.pulang} km/j${jarak ? ' · ' + jarak : ''}</span>
        </div>
        <div class="anim-trip-node">🏠</div>
      </div>
      <div class="anim-trip-result">v̄ = <strong>${data.hasil}</strong> km/j</div>
    </div>`;
  }

  function renderKonversi(data) {
    const op = data.op || '÷ 3,6';
    return `<div class="anim-konversi-v2">
      <div class="anim-unit-box from">${data.dari}</div>
      <div class="anim-convert-op">${op}</div>
      <div class="anim-unit-box to">${data.ke}</div>
    </div>`;
  }

  function renderRata(data) {
    if (data.segmen && data.segmen.length) {
      const weights = data.segmen.map(s => parseNum(s.w) || parseNum(s.label) || 1);
      const total = weights.reduce((a, b) => a + b, 0) || 1;
      const segs = data.segmen.map((s, i) => {
        const pct = Math.max(15, Math.round((weights[i] / total) * 100));
        const text = [s.label, s.v ? `@${s.v}` : ''].filter(Boolean).join(' ');
        return `<div class="anim-rata-seg" style="flex:${pct}"><span>${text || '—'}</span></div>`;
      }).join('');
      return `<div class="anim-rata-v2">
        <div class="anim-rata-bar">${segs}</div>
        <div class="anim-rata-result">v̄ = <strong>${data.hasil}</strong> km/j</div>
      </div>`;
    }
    return `<div class="anim-rata-fallback">
      <div class="anim-rata-formula">${data.s || '—'}</div>
      <div class="anim-rata-result">= <strong>${data.h || data.hasil || '?'}</strong></div>
    </div>`;
  }

  function renderKapal(data) {
    const kapal = data.kapal || '?';
    const arus = data.arus || '?';
    return `<div class="anim-kapal">
      <div class="anim-kapal-row hilir">
        <span class="anim-kapal-flow">≋≋≋→</span>
        <span class="anim-kapal-ship">🚢</span>
        <span class="anim-kapal-speed">${data.hilir} km/j</span>
        <span class="anim-kapal-tag">Hilir</span>
      </div>
      <div class="anim-kapal-row hulu">
        <span class="anim-kapal-flow">←≋≋≋</span>
        <span class="anim-kapal-ship">🚢</span>
        <span class="anim-kapal-speed">${data.hulu} km/j</span>
        <span class="anim-kapal-tag">Hulu</span>
      </div>
      <div class="anim-info">v_kapal = <strong>${kapal}</strong> km/j · v_arus = ${arus} km/j</div>
    </div>`;
  }

  function renderLogika(data) {
    const mode = data.mode || 'formula';
    if (mode === 'race') {
      const w1 = parseNum(data.w1) || (data.j && data.v1 ? parseNum(data.j) / parseNum(data.v1) : 0);
      const w2 = parseNum(data.w2) || (data.j && data.v2 ? parseNum(data.j) / parseNum(data.v2) : 0);
      const maxW = Math.max(w1, w2, 1);
      const p1 = Math.round((w1 / maxW) * 100);
      const p2 = Math.round((w2 / maxW) * 100);
      return `<div class="anim-logika-race">
        <div class="anim-race-lane">
          <span class="anim-race-name">A · ${data.v1} km/j</span>
          <div class="anim-race-track"><span class="anim-race-fill" style="width:${p1}%">🏃</span></div>
          <span class="anim-race-time">${data.w1 || w1.toFixed(1) + 'j'}</span>
        </div>
        <div class="anim-race-lane">
          <span class="anim-race-name">B · ${data.v2} km/j</span>
          <div class="anim-race-track"><span class="anim-race-fill slow" style="width:${p2}%">🏃</span></div>
          <span class="anim-race-time">${data.w2 || w2.toFixed(1) + 'j'}</span>
        </div>
        <div class="anim-info">Jarak ${data.j} km · selisih = <strong>${data.hasil}</strong></div>
      </div>`;
    }
    if (mode === 'compare') {
      return `<div class="anim-logika-compare">
        <div class="anim-compare-col">
          <div class="anim-compare-label">Awal · ${data.v1} km/j</div>
          <div class="anim-compare-bar" style="height:${Math.min(100, parseNum(data.v1) * 2)}px"></div>
          <div class="anim-compare-time">${data.w1 || '?'}</div>
        </div>
        <div class="anim-compare-arrow">→</div>
        <div class="anim-compare-col">
          <div class="anim-compare-label">Baru · ${data.v2} km/j</div>
          <div class="anim-compare-bar accent" style="height:${Math.min(100, parseNum(data.v2) * 2)}px"></div>
          <div class="anim-compare-time">${data.w2 || '?'}</div>
        </div>
        <div class="anim-info">Hasil: <strong>${data.hasil}</strong></div>
      </div>`;
    }
    return `<div class="anim-logika-formula">
      <div class="anim-formula-box">${data.rumus || data.s || 'J = v × t'}</div>
      <div class="anim-formula-arrow">↓</div>
      <div class="anim-formula-result"><strong>${data.hasil || data.h || '?'}</strong></div>
    </div>`;
  }

  function renderKombinasi(data) {
    return `<div class="anim-kombinasi">
      <div class="anim-kombinasi-row">
        <div class="anim-rute-point">A</div>
        <div class="anim-kombinasi-seg go">
          <span class="anim-rute-bar"></span>
          <span class="anim-rute-label">${data.jarak} km @ ${data.pergi} km/j</span>
        </div>
        <div class="anim-rute-point">B</div>
        <div class="anim-kombinasi-seg rest">
          <span class="anim-rute-bar"></span>
          <span class="anim-rute-label">☕ ${data.istirahat || '—'}</span>
        </div>
        <div class="anim-kombinasi-seg back">
          <span class="anim-rute-bar"></span>
          <span class="anim-rute-label">${data.jarak} km @ ${data.pulang} km/j</span>
        </div>
        <div class="anim-rute-point">A</div>
      </div>
      <div class="anim-trip-result">Total waktu = <strong>${data.hasil}</strong></div>
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
      case 'kapal': return renderKapal(anim.data);
      case 'logika': return renderLogika(anim.data);
      case 'kombinasi': return renderKombinasi(anim.data);
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
