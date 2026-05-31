// Boot header + auth untuk halaman latihan
async function bootLatihanPage() {
  SiteNav.init();
  window.__hihibelAuthReady = SiteAuth.requireLogin();
  return window.__hihibelAuthReady;
}
