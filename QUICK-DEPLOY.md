# Deploy Cepat — 3 Langkah

Semua file sudah siap. Kamu tinggal **3 langkah** ini:

## Langkah 1 — Login GitHub (sekali saja)

Buka terminal di folder `catatan`, jalankan:

```bash
gh auth login -h github.com -p https -w
```

1. Copy kode yang muncul di terminal
2. Buka https://github.com/login/device
3. Paste kode → Authorize

## Langkah 2 — Push & deploy otomatis

```bash
cd /Users/imanuelr/catatan
./scripts/deploy.sh hihibel
```

Script ini akan:
- Buat repo `hihibel` di GitHub kamu
- Push semua code
- Aktifkan GitHub Pages

## Langkah 3 — Tunggu ~2 menit

Site live di:
```
https://USERNAME-KAMU.github.io/hihibel/
```

Admin panel:
```
https://USERNAME-KAMU.github.io/hihibel/admin/login.html
```

---

## Supabase (opsional, untuk admin buat soal)

Tanpa Supabase, **50 soal latihan tetap jalan** (offline mode).

1. [supabase.com](https://supabase.com) → New project
2. SQL Editor → paste isi `website/sql/schema.sql` → Run
3. Authentication → Users → Add user (email + password admin)
4. Settings → API → copy URL & anon key
5. GitHub repo → **Settings → Secrets and variables → Actions** → New secret:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. GitHub repo → **Actions** → Re-run latest workflow

Setelah deploy ulang, login admin → **Import 50 Soal Seed**.

---

## Troubleshooting

**`gh: command not found`**
```bash
brew install gh
```

**Pages belum muncul**
- GitHub repo → Settings → Pages → Source: **GitHub Actions**

**Latihan kosong**
- Supabase belum diisi → klik Import Seed di admin, ATAU
- Supabase secrets belum diset → latihan pakai fallback JS (50 soal) jika config kosong
