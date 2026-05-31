// Admin auth helpers
const AdminAuth = (() => {
  function getClient() {
    return HihibelDB.getClient();
  }

  function appBaseUrl() {
    const path = location.pathname.replace(/\/admin\/[^/]*$/, '');
    return location.origin + (path || '');
  }

  function resetPasswordUrl() {
    return `${appBaseUrl()}/admin/reset-password.html`;
  }

  function translateError(err) {
    const msg = (err?.message || String(err)).toLowerCase();
    if (msg.includes('invalid login credentials')) {
      return 'Email atau password salah — atau akun admin belum dibuat di Supabase.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Email belum dikonfirmasi. Buka Supabase → Authentication → Users → klik user → Confirm user.';
    }
    if (msg.includes('failed to fetch') || msg.includes('network')) {
      return 'Tidak bisa hubung ke Supabase. Cek koneksi internet atau config URL.';
    }
    return err.message || 'Login gagal.';
  }

  async function getSession() {
    const db = getClient();
    if (!db) return null;
    const { data: { session } } = await db.auth.getSession();
    return session;
  }

  async function requireAuth(redirectTo = 'login.html') {
    if (!HihibelDB.isConfigured()) {
      window.location.href = redirectTo + '?error=config';
      return null;
    }
    const session = await getSession();
    if (!session) {
      window.location.href = redirectTo;
      return null;
    }
    return session;
  }

  async function login(email, password) {
    const db = getClient();
    if (!db) throw new Error('Supabase belum dikonfigurasi.');
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      const e = new Error(translateError(error));
      e.original = error;
      throw e;
    }
    return data;
  }

  async function logout() {
    const db = getClient();
    if (db) await db.auth.signOut();
    window.location.href = 'login.html';
  }

  async function testConnection() {
    if (!HihibelDB.isConfigured()) return { ok: false, msg: 'Config belum diisi' };
    const db = getClient();
    const { error } = await db.auth.getSession();
    if (error) return { ok: false, msg: error.message };
    return { ok: true, msg: 'Terhubung ke Supabase' };
  }

  async function requestPasswordReset(email) {
    const db = getClient();
    if (!db) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: resetPasswordUrl(),
    });
    if (error) throw new Error(translateError(error));
  }

  async function updatePassword(newPassword) {
    const db = getClient();
    if (!db) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await db.auth.updateUser({ password: newPassword });
    if (error) throw new Error(translateError(error));
  }

  async function waitForRecoverySession() {
    const db = getClient();
    if (!db) return null;

    const hash = location.hash || '';
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      const { data: { session }, error } = await db.auth.getSession();
      if (error) throw new Error(translateError(error));
      return session;
    }

    return new Promise((resolve) => {
      const { data: { subscription } } = db.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          subscription.unsubscribe();
          resolve(session);
        }
      });
      setTimeout(() => {
        subscription.unsubscribe();
        resolve(null);
      }, 8000);
    });
  }

  return {
    getSession, requireAuth, login, logout, testConnection, translateError,
    requestPasswordReset, updatePassword, waitForRecoverySession, resetPasswordUrl,
  };
})();
