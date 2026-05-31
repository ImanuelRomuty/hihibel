// Latihan materi SKD — Quiz Engine (TWK / TIU / TKP)
(function () {
  const subBab = document.body.dataset.subBab || new URLSearchParams(location.search).get('materi') || 'twk';
  const materiInfo = (typeof MATERI_SKD !== 'undefined'
    ? MATERI_SKD.find(p => p.id === subBab)
    : null) || { label: subBab.toUpperCase(), fullName: subBab };

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
    pageTitle: document.getElementById('latihanTitle'),
  };

  async function init() {
    if (window.__hihibelAuthReady) await window.__hihibelAuthReady;

    if (els.pageTitle) els.pageTitle.textContent = materiInfo.label || subBab.toUpperCase();
    document.title = `${materiInfo.fullName || materiInfo.label} — Hihibel`;
    const heading = document.getElementById('latihanHeading');
    if (heading && materiInfo.fullName) heading.textContent = materiInfo.fullName;

    if (els.loadingState) els.loadingState.style.display = 'block';
    if (els.singleView) els.singleView.style.display = 'none';

    try {
      questions = await SoalService.fetchSoal(subBab);
      activeList = [...questions];
    } catch (e) {
      console.error(e);
    }

    if (els.loadingState) els.loadingState.style.display = 'none';
    if (els.singleView) els.singleView.style.display = '';

    if (questions.length === 0) {
      if (els.singleView) {
        els.singleView.innerHTML = `
          <div class="alert alert-info" style="margin:40px">
            Belum ada soal untuk paket ini. Admin bisa import dari panel admin.
          </div>`;
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
    if (els.filters) els.filters.style.display = 'none';
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

    if (els.filters && els.filters.children.length) {
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
    }

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

  function optionText(opt) {
    return opt.replace(/^[A-F]\.\s*/, '');
  }

  function showQuestion(q) {
    const globalIdx = questions.indexOf(q);
    const pct = ((globalIdx + 1) / questions.length) * 100;
    els.progressFill.style.width = pct + '%';
    els.progressText.innerHTML = `<span>Soal ${q.id} / ${questions.length}</span><span>${Math.round(pct)}%</span>`;
    els.badge.textContent = q.kategori.replace('Tes ', '');
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
        <span>${optionText(opt)}</span>
      </button>`;
    }).join('');

    if (!answered) {
      els.options.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => selectOption(btn));
      });
    }

    renderPembahasan(q, !!answered);

    els.btnPrev.disabled = currentIndex === 0;
    els.btnNext.disabled = currentIndex === activeList.length - 1;
    els.btnCheck.style.display = 'none';
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
      if (els.animVisual) els.animVisual.innerHTML = '';
      return;
    }
    els.pembahasan.style.display = 'block';
    if (els.animVisual) els.animVisual.style.display = 'none';

    const steps = q.langkah?.length ? q.langkah : [q.pembahasan || ''];
    els.pembahasanSteps.innerHTML = steps.map(s =>
      `<div class="pembahasan-step"><span class="step-dot-p"></span><div class="pembahasan-html">${s}</div></div>`
    ).join('');
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
