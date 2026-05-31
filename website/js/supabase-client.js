// Supabase client singleton
const HihibelDB = (() => {
  let client = null;

  function isConfigured() {
    const cfg = window.HIHIBEL_CONFIG || {};
    const url = cfg.SUPABASE_URL || '';
    const key = cfg.SUPABASE_ANON_KEY || '';
    return url.includes('.supabase.co') && key.startsWith('eyJ');
  }

  function configError() {
    const cfg = window.HIHIBEL_CONFIG || {};
    const url = cfg.SUPABASE_URL || '';
    if (!url || !cfg.SUPABASE_ANON_KEY) return 'Supabase belum dikonfigurasi.';
    if (!url.includes('.supabase.co')) {
      return 'SUPABASE_URL salah. Harus format https://xxxxx.supabase.co (bukan publishable key).';
    }
    if (!cfg.SUPABASE_ANON_KEY.startsWith('eyJ')) {
      return 'SUPABASE_ANON_KEY salah. Pakai anon public key dari Settings → API.';
    }
    return null;
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (!client && window.supabase) {
      const cfg = window.HIHIBEL_CONFIG;
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    }
    return client;
  }

  return { isConfigured, getClient, configError };
})();
