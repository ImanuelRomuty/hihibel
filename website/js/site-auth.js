// Auth situs — browsing publik, login wajib hanya untuk latihan
const SiteAuth = (() => {
  function loginUrl() {
    const path = location.pathname;
    if (path.includes('/tiu/') || path.includes('/twk/') || path.includes('/tkp/') || path.includes('/admin/')) {
      return '../login.html';
    }
    return 'login.html';
  }

  async function waitForSession(timeoutMs = 3000) {
    const db = HihibelDB.getClient();
    if (!db) return null;

    const { data: { session } } = await db.auth.getSession();
    if (session) return session;

    return new Promise((resolve) => {
      let done = false;
      const finish = (s) => {
        if (done) return;
        done = true;
        subscription.unsubscribe();
        resolve(s);
      };

      const { data: { subscription } } = db.auth.onAuthStateChange((event, s) => {
        if (s && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          finish(s);
        }
      });

      setTimeout(async () => {
        if (done) return;
        const { data: { session: s } } = await db.auth.getSession();
        finish(s);
      }, timeoutMs);
    });
  }

  function mountAuth(session) {
    const slot = document.getElementById('headerAuth');
    if (!slot) return;

    const base = SiteNav?.basePath?.() || '';
    const loginHref = `${base}login.html`;

    if (session) {
      const email = session.user?.email || 'Member';
      slot.innerHTML = `
        <span class="nav-user-email" title="${email}">${email.split('@')[0]}</span>
        <button type="button" class="nav-logout-btn" id="siteLogoutBtn">Keluar</button>`;
      document.getElementById('siteLogoutBtn')?.addEventListener('click', logout);
    } else {
      slot.innerHTML = `<a href="${loginHref}" class="nav-login-btn">Masuk</a>`;
    }
  }

  /** Browsing biasa — tidak redirect */
  async function init() {
    if (!HihibelDB.isConfigured()) return null;
    const session = await waitForSession();
    mountAuth(session);
    return session;
  }

  /** Halaman latihan — wajib login */
  async function requireLogin() {
    if (!HihibelDB.isConfigured()) {
      document.body.innerHTML = `<div class="container" style="padding:80px 28px;text-align:center">
        <h1>Config belum siap</h1><p>Supabase belum dikonfigurasi.</p></div>`;
      return null;
    }

    const session = await waitForSession();
    mountAuth(session);

    if (!session) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.replace(`${loginUrl()}?next=${next}`);
      return null;
    }

    return session;
  }

  async function login(email, password) {
    const db = HihibelDB.getClient();
    if (!db) throw new Error('Supabase belum dikonfigurasi.');
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw new Error(AdminAuth?.translateError?.(error) || error.message);
    return data.session || waitForSession(3000);
  }

  async function logout() {
    const db = HihibelDB.getClient();
    if (db) await db.auth.signOut();
    const base = SiteNav?.basePath?.() || '';
    location.href = base + 'index.html';
  }

  return { init, requireLogin, login, logout, waitForSession, loginUrl };
})();
