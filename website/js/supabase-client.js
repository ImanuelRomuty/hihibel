// Supabase client singleton
const HihibelDB = (() => {
  let client = null;

  function isConfigured() {
    const cfg = window.HIHIBEL_CONFIG || {};
    return !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (!client && window.supabase) {
      const cfg = window.HIHIBEL_CONFIG;
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    }
    return client;
  }

  return { isConfigured, getClient };
})();
