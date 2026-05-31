// Member auth — halaman publik hanya untuk user login
const SiteAuth = (() => {
  function loginUrl() {
    const path = location.pathname;
    if (path.includes('/tiu/') || path.includes('/tryout/') || path.includes('/twk/') || path.includes('/tkp/')) {
      return '../login.html';
    }
    if (path.includes('/admin/')) {
      return '../login.html';
    }
    return 'login.html';
  }

  function homeUrl() {
    const path = location.pathname;
    if (path.includes('/tiu/') || path.includes('/tryout/')) return '../index.html';
    return 'index.html';
  }

  async function waitForSession(timeoutMs = 5000) {
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

  async function guard() {
    if (!HihibelDB.isConfigured()) {
      document.body.innerHTML = `
        <div style="max-width:480px;margin:80px auto;padding:32px;font-family:sans-serif;text-align:center">
          <h1 style="font-size:1.25rem;margin-bottom:12px">Supabase belum dikonfigurasi</h1>
          <p style="color:#666;font-size:0.9rem">Buat <code>website/js/config.js</code> dari template config.example.js</p>
        </div>`;
      return null;
    }

    document.documentElement.classList.add('auth-pending');
    const session = await waitForSession();
    document.documentElement.classList.remove('auth-pending');

    if (!session) {
      const next = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace(`${loginUrl()}?next=${next}`);
      return null;
    }

    mountHeader(session);
    return session;
  }

  function mountHeader(session) {
    const nav = document.getElementById('headerNav');
    if (!nav || nav.querySelector('.nav-user')) return;

    const email = session.user?.email || 'Member';
    const wrap = document.createElement('div');
    wrap.className = 'nav-user';
    wrap.innerHTML = `
      <span class="nav-user-email" title="${email}">${email.split('@')[0]}</span>
      <button type="button" class="nav-logout-btn" id="siteLogoutBtn">Keluar</button>
    `;
    nav.appendChild(wrap);

    document.getElementById('siteLogoutBtn')?.addEventListener('click', logout);
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
    location.href = loginUrl();
  }

  return { guard, login, logout, waitForSession, loginUrl, homeUrl };
})();
