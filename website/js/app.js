// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const headerNav = document.getElementById('headerNav');

menuToggle?.addEventListener('click', () => {
  headerNav.classList.toggle('open');
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.12 }
);
revealEls.forEach(el => revealObs.observe(el));

// Sidebar active section
const sidebarNav = document.getElementById('sidebarNav');
if (sidebarNav) {
  const links = [...sidebarNav.querySelectorAll('a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    links.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  });
}

// Formula triangle
document.querySelectorAll('.tri-part').forEach(part => {
  const show = () => {
    document.querySelectorAll('.tri-part').forEach(p => p.classList.remove('active'));
    part.classList.add('active');
    const result = document.getElementById('triangleResult');
    if (result) result.textContent = part.dataset.formula;
  };
  part.addEventListener('click', show);
});

// Pattern tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector(`[data-panel="${idx}"]`)?.classList.add('active');
  });
});

// Quiz reveal
document.querySelectorAll('.btn-reveal').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    const open = answer.classList.toggle('open');
    btn.textContent = open ? 'Sembunyikan' : 'Lihat Jawaban';
    btn.classList.toggle('open', open);
  });
});

// Disable placeholder sidebar links
document.querySelectorAll('.disabled-link').forEach(link => {
  link.addEventListener('click', e => e.preventDefault());
  link.style.opacity = '0.45';
  link.style.cursor = 'default';
});
