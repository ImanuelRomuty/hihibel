// Admin auth helpers
const AdminAuth = (() => {
  function getClient() {
    return HihibelDB.getClient();
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
    if (!db) throw new Error('Supabase belum dikonfigurasi. Isi js/config.js');
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function logout() {
    const db = getClient();
    if (db) await db.auth.signOut();
    window.location.href = 'login.html';
  }

  return { getSession, requireAuth, login, logout };
})();
