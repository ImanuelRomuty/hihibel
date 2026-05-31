#!/bin/bash
# Setup Supabase untuk Hihibel
# Usage: ./scripts/setup-supabase.sh
set -e

cd "$(dirname "$0")/.."
CONFIG_FILE="website/js/config.js"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Hihibel — Setup Supabase              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# --- Input credentials ---
if [ -z "$SUPABASE_URL" ]; then
  echo "Project URL (contoh: https://abcdefgh.supabase.co):"
  read -r SUPABASE_URL
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "Anon public key (eyJhbG...):"
  read -r SUPABASE_ANON_KEY
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ URL dan anon key wajib diisi."
  exit 1
fi

if [[ ! "$SUPABASE_URL" =~ \.supabase\.co ]]; then
  echo "❌ SUPABASE_URL salah!"
  echo "   Harus: https://xxxxx.supabase.co"
  echo "   Bukan publishable key (sb_publishable_...)"
  echo "   Ambil dari: Supabase → Settings → API → Project URL"
  exit 1
fi

if [[ ! "$SUPABASE_ANON_KEY" =~ ^eyJ ]]; then
  echo "❌ SUPABASE_ANON_KEY salah! Pakai 'anon public' key (mulai eyJ...)"
  exit 1
fi

# --- Local config ---
cat > "$CONFIG_FILE" << EOF
// Supabase config — jangan commit file ini
window.HIHIBEL_CONFIG = {
  SUPABASE_URL: '${SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
};
EOF
echo "✅ config.js lokal diupdate"

# --- GitHub Secrets ---
if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  echo "→ Set GitHub Secrets..."
  echo "$SUPABASE_URL" | gh secret set SUPABASE_URL -R ImanuelRomuty/hihibel
  echo "$SUPABASE_ANON_KEY" | gh secret set SUPABASE_ANON_KEY -R ImanuelRomuty/hihibel
  echo "✅ GitHub Secrets diset"

  echo "→ Trigger redeploy..."
  gh workflow run "Deploy Hihibel to GitHub Pages" -R ImanuelRomuty/hihibel 2>/dev/null || {
    git commit --allow-empty -m "chore: trigger redeploy with Supabase config" 2>/dev/null || true
    git push origin main 2>/dev/null || true
  }
  echo "✅ Deploy ulang dipicu (~2 menit)"
else
  echo "⚠️  gh tidak login — set secrets manual di GitHub repo → Settings → Secrets"
fi

echo ""
echo "══════════════════════════════════════════"
echo "  Selesai! Langkah berikutnya:"
echo ""
echo "  1. Supabase → SQL Editor → jalankan schema.sql"
echo "  2. Supabase → Authentication → Users → Add user"
echo "  3. Buka: https://imanuelromuty.github.io/hihibel/admin"
echo "  4. Login → Import 50 Soal Seed"
echo "══════════════════════════════════════════"
echo ""
