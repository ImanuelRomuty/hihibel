#!/bin/bash
# Script deploy Hihibel — jalankan setelah gh auth login
set -e

REPO_NAME="${1:-hihibel}"
cd "$(dirname "$0")/.."

echo "=== Hihibel Deploy Setup ==="

if ! command -v gh &>/dev/null; then
  echo "Install GitHub CLI: brew install gh"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "Login GitHub dulu:"
  gh auth login -h github.com -p https -w
fi

echo "→ Membuat repo GitHub: $REPO_NAME"
gh repo create "$REPO_NAME" --public --source=. --remote=origin --push 2>/dev/null || {
  echo "Repo mungkin sudah ada, push saja..."
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$(gh api user -q .login)/$REPO_NAME.git"
  git push -u origin main
}

echo ""
echo "→ Aktifkan GitHub Pages:"
gh api -X POST "repos/$(gh api user -q .login)/$REPO_NAME/pages" \
  -f build_type=workflow 2>/dev/null || \
gh api -X PUT "repos/$(gh api user -q .login)/$REPO_NAME/pages" \
  -f build_type=workflow 2>/dev/null || true

USER=$(gh api user -q .login)
echo ""
echo "✅ Selesai!"
echo ""
echo "   Repo:  https://github.com/$USER/$REPO_NAME"
echo "   Site:  https://$USER.github.io/$REPO_NAME/  (live ~2 menit setelah push)"
echo ""
echo "   Admin: https://$USER.github.io/$REPO_NAME/admin/login.html"
echo ""
echo "Langkah Supabase (opsional):"
echo "  1. supabase.com → buat project → jalankan website/sql/schema.sql"
echo "  2. Buat user admin di Authentication"
echo "  3. GitHub repo → Settings → Secrets → Actions:"
echo "     SUPABASE_URL, SUPABASE_ANON_KEY"
echo "  4. Re-run workflow atau push ulang"
