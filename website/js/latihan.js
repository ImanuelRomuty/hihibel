// Latihan Kecepatan — Quiz Engine (Supabase + offline fallback)
(function () {
  let questions = [];
  let activeList = [];
  let currentIndex = 0;
  let answers = {};
  let gridMode = false;
  let firstRender = true;

  const els = {
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    badge: document.getElementById('quizBadge'),
    numDisplay: document.getElementById('quizNumDisplay'),
    questionText: document.getElementById('questionText'),
    options: document.getElementById('quizOptions'),
    animVisual: document.getElementById('animVisual'),
    pembahasan: document.getElementById('pembahasanPanel'),
    pembahasanSteps: document.getElementById('pembahasanSteps'),
    btnPrev: document.getElementById('btnPrev'),
    btnNext: document.getElementById('btnNext'),
    btnCheck: document.getElementById('btnCheck'),
    singleView: document.getElementById('singleView'),
    gridView: document.getElementById('gridView'),
    scoreBanner: document.getElementById('scoreBanner'),
    scoreNum: document.getElementById('scoreNum'),
    filters: document.getElementById('quizFilters'),
    modeToggle: document.getElementById('modeToggle'),
    loadingState: document.getElementById('loadingState'),
  };

  async function init() {
    if (els.loadingState) els.loadingState.style.display = 'block';
    if (els.singleView) els.singleView.style.display = 'none';

    try {
      questions = await SoalService.fetchSoal('kecepatan');
      activeList = [...questions];
    } catch (e) {
      console.error(e);
      if (typeof SOAL_KECEPATAN !== 'undefined') {
        questions = SOAL_KECEPATAN.map(q => ({ ...q, _key: String(q.id) }));
        activeList = [...questions];
      }
    }

    if (els.loadingState) els.loadingState.style.display = 'none';
    if (els.singleView) els.singleView.style.display = '';

    if (questions.length === 0) {
      if (els.singleView) {
        els.singleView.innerHTML = '<div class="alert alert-info" style="margin:40px">Belum ada soal. Admin bisa tambah soal di panel admin.</div>';
      }
      return;
    }

    buildFilters();
    buildGrid();
    renderQuestion();
    bindEvents();
    updateScore();
  }

  function qKey(q) { return q._key || String(q.id); }

  function buildFilters() {
    const cats = ['Semua', ...new Set(questions.map(q => q.kategori))];
    els.filters.innerHTML = cats.map((c, i) =>
      `<button class="filter-btn${i === 0 ? ' active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
  }

  function buildGrid() {
    els.gridView.innerHTML = questions.map((q, i) =>
      `<button class="grid-item" data-idx="${i}">${q.id}</button>`
    ).join('');
  }

  function bindEvents() {
    els.btnPrev.addEventListener('click', () => navigate(-1));
    els.btnNext.addEventListener('click', () => navigate(1));
    els.btnCheck.addEventListener('click', checkAnswer);

    els.filters.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      els.filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      activeList = cat === 'Semua' ? [...questions] : questions.filter(q => q.kategori === cat);
      currentIndex = 0;
      renderQuestion();
    });

    els.modeToggle.addEventListener('click', () => {
      gridMode = !gridMode;
      els.singleView.classList.toggle('hidden', gridMode);
      els.gridView.classList.toggle('active', gridMode);
      els.modeToggle.textContent = gridMode ? 'Mode Soal' : 'Daftar Soal';
      updateGridState();
    });

    els.gridView.addEventListener('click', e => {
      const item = e.target.closest('.grid-item');
      if (!item) return;
      const qIdx = parseInt(item.dataset.idx, 10);
      activeList = [...questions];
      els.filters.querySelectorAll('.filter-btn').forEach((b, i) => {
        b.classList.toggle('active', i === 0);
      });
      currentIndex = qIdx;
      gridMode = false;
      els.singleView.classList.remove('hidden');
      els.gridView.classList.remove('active');
      els.modeToggle.textContent = 'Daftar Soal';
      renderQuestion();
    });
  }

  function getCurrentQ() {
    return activeList[currentIndex];
  }

  function renderQuestion() {
    const q = getCurrentQ();
    if (!q) return;

    const card = document.querySelector('.quiz-card-main');
    if (firstRender) {
      showQuestion(q);
      firstRender = false;
    } else {
      card.classList.add('slide-out');
      setTimeout(() => {
        card.classList.remove('slide-out');
        showQuestion(q);
      }, 280);
    }
  }

  function showQuestion(q) {
    const globalIdx = questions.indexOf(q);
    const pct = ((globalIdx + 1) / questions.length) * 100;
    els.progressFill.style.width = pct + '%';
    els.progressText.innerHTML = `<span>Soal ${q.id} / ${questions.length}</span><span>${Math.round(pct)}%</span>`;
    els.badge.textContent = q.kategori;
    els.numDisplay.textContent = `#${String(q.id).padStart(2, '0')}`;
    els.questionText.textContent = q.soal;

    const letters = ['A', 'B', 'C', 'D', 'E'];
    const key = qKey(q);
    const answered = answers[key];
    els.options.innerHTML = q.opsi.map((opt, i) => {
      const letter = letters[i];
      let cls = 'quiz-option';
      if (answered) {
        cls += ' disabled';
        if (letter === q.jawaban) cls += ' correct';
        else if (letter === answered) cls += ' wrong';
      }
      return `<button class="${cls}" data-letter="${letter}">
        <span class="option-letter">${letter}</span>
        <span>${opt.slice(3)}</span>
      </button>`;
    }).join('');

    if (!answered) {
      els.options.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => selectOption(btn));
      });
    }

    renderAnimation(q.animasi);
    renderPembahasan(q, !!answered);

    els.btnPrev.disabled = currentIndex === 0;
    els.btnNext.disabled = currentIndex === activeList.length - 1;
    els.btnCheck.style.display = answered ? 'none' : 'none';
    updateGridState();
  }

  function selectOption(btn) {
    els.options.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    els.btnCheck.style.display = 'inline-flex';
  }

  function checkAnswer() {
    const q = getCurrentQ();
    const selected = els.options.querySelector('.quiz-option.selected');
    if (!selected) return;

    const letter = selected.dataset.letter;
    answers[qKey(q)] = letter;

    els.options.querySelectorAll('.quiz-option').forEach(btn => {
      btn.classList.add('disabled');
      btn.classList.remove('selected');
      const l = btn.dataset.letter;
      if (l === q.jawaban) btn.classList.add('correct');
      else if (l === letter) btn.classList.add('wrong');
    });

    renderPembahasan(q, true);
    els.btnCheck.style.display = 'none';
    updateScore();
    updateGridState();
  }

  function renderPembahasan(q, show) {
    if (!show) {
      els.pembahasan.style.display = 'none';
      return;
    }
    els.pembahasan.style.display = 'block';
    els.pembahasanSteps.innerHTML = q.langkah.map(s =>
      `<div class="pembahasan-step"><span class="step-dot-p"></span><p>${s}</p></div>`
    ).join('');
  }

  function renderAnimation(anim) {
    if (!anim) { els.animVisual.innerHTML = ''; return; }

    let html = '';
    switch (anim.tipe) {
      case 'rute':
        html = '<div class="anim-rute">';
        anim.data.forEach(seg => {
          if (seg.l) html += `<div class="anim-node">${seg.l}</div>`;
          const label = [seg.j, seg.t, seg.v ? '@'+seg.v : ''].filter(Boolean).join(' · ');
          if (label) html += `<div class="anim-seg"><span class="anim-seg-label">${label}</span></div>`;
        });
        html += '</div>';
        break;
      case 'susul':
        html = `<div class="anim-susul"><div class="anim-track">
          <span class="anim-mover slow">🚗</span>
          <span class="anim-mover" style="animation-delay:0.3s">🏎️</span>
        </div></div>
        <div class="anim-info">v₁=${anim.data.v1} · v₂=${anim.data.v2} · jarak=${anim.data.j} km</div>`;
        break;
      case 'temu':
        html = `<div class="anim-susul"><div class="anim-track">
          <span class="anim-mover" style="left:10%">→ 🚗</span>
          <span class="anim-mover" style="right:10%;left:auto;animation:moveLeft 2s ease-in-out infinite alternate">🚗 ←</span>
        </div></div>
        <div class="anim-info">${anim.data.v1}+${anim.data.v2}=${Number(anim.data.v1)+Number(anim.data.v2)} km/j · ${anim.data.j} km</div>`;
        break;
      case 'kereta':
        html = `<div class="anim-kereta-wrap"><span class="anim-kereta">🚂</span></div>
        <div class="anim-info">${anim.data.p} @ ${anim.data.v}</div>`;
        break;
      case 'balik':
        html = `<div class="anim-info" style="margin-top:0">
          <div style="margin-bottom:8px">→ Pergi @ ${anim.data.pergi} km/j</div>
          <div style="margin-bottom:8px">← Pulang @ ${anim.data.pulang} km/j</div>
          <strong style="color:var(--accent)">v̄ = ${anim.data.hasil}</strong></div>`;
        break;
      case 'konversi':
        html = `<div class="anim-info" style="font-size:1rem;margin-top:0">
          ${anim.data.dari} <span style="color:var(--accent)">→</span> ${anim.data.ke}</div>`;
        break;
      case 'rata':
        html = `<div class="anim-info" style="margin-top:0">
          <div>${anim.data.s}</div>
          <strong style="color:var(--accent);font-size:1.1rem">= ${anim.data.h}</strong></div>`;
        break;
    }
    els.animVisual.innerHTML = html;
  }

  function navigate(dir) {
    currentIndex = Math.max(0, Math.min(activeList.length - 1, currentIndex + dir));
    renderQuestion();
    window.scrollTo({ top: document.querySelector('.quiz-main').offsetTop - 80, behavior: 'smooth' });
  }

  function updateScore() {
    const total = Object.keys(answers).length;
    const correct = Object.entries(answers).filter(([key, a]) => {
      const q = questions.find(x => qKey(x) === key);
      return q && q.jawaban === a;
    }).length;
    if (total > 0) {
      els.scoreBanner.style.display = 'block';
      els.scoreNum.textContent = `${correct}/${total}`;
    }
  }

  function updateGridState() {
    const currentQ = getCurrentQ();
    els.gridView.querySelectorAll('.grid-item').forEach((item, i) => {
      const q = questions[i];
      item.classList.remove('current', 'done', 'wrong-done');
      if (currentQ && q.id === currentQ.id && !gridMode) item.classList.add('current');
      const key = qKey(q);
      if (answers[key]) {
        item.classList.add(answers[key] === q.jawaban ? 'done' : 'wrong-done');
      }
    });
  }

  const style = document.createElement('style');
  style.textContent = `@keyframes moveLeft { from { right: 10%; } to { right: 60%; } }`;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
