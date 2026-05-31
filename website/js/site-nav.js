// Navigasi global — konsisten di semua halaman
const SiteNav = (() => {
  const LINKS = [
    { id: 'home', label: 'Beranda' },
    { id: 'twk', label: 'TWK' },
    { id: 'tiu', label: 'TIU' },
    { id: 'tkp', label: 'TKP' },
  ];

  function basePath() {
    const p = location.pathname;
    if (p.includes('/tiu/') || p.includes('/twk/') || p.includes('/tkp/')) return '../';
    return '';
  }

  function hrefFor(id, base) {
    if (id === 'home') return `${base}index.html`;
    return `${base}${id}/index.html`;
  }

  function activeSection() {
    return document.body.dataset.section || 'home';
  }

  function render() {
    const nav = document.getElementById('headerNav');
    if (!nav) return;

    const base = basePath();
    const active = activeSection();

    nav.innerHTML = LINKS.map((link) =>
      `<a href="${hrefFor(link.id, base)}" class="nav-main-link${link.id === active ? ' active' : ''}">${link.label}</a>`
    ).join('');
  }

  function closeMobile() {
    document.getElementById('headerNav')?.classList.remove('open');
  }

  function initMobileToggle() {
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('headerNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', closeMobile);
    });
  }

  function init() {
    render();
    initMobileToggle();
  }

  return { init, render, basePath, closeMobile };
})();
