# Hihibel

Platform belajar ringkas untuk persiapan TIU CPNS — materi, latihan HOTS, dan panel admin.

## Struktur

```
website/
├── index.html              # Beranda
├── tiu/                    # Materi & latihan TIU
├── admin/                  # Panel admin (login, dashboard, buat soal)
├── js/
│   ├── config.example.js   # Template Supabase config
│   ├── soal-service.js     # Load/save soal
│   └── questions-kecepatan.js # Fallback offline (50 soal)
├── sql/schema.sql          # Database schema Supabase
└── netlify.toml            # Deploy config
```

## Setup Lokal

1. Buka folder `website/` di browser, atau:
   ```bash
   cd website && npx serve .
   ```

2. **Tanpa Supabase** — latihan pakai 50 soal dari `questions-kecepatan.js` (offline).

3. **Dengan Supabase** — ikuti langkah di bawah.

---

## Setup Supabase

### 1. Buat project
- Daftar di [supabase.com](https://supabase.com)
- Buat project baru

### 2. Jalankan schema
- Buka **SQL Editor** di dashboard Supabase
- Copy-paste isi `website/sql/schema.sql`
- Klik **Run**

### 3. Buat akun admin
- Buka **Authentication → Users**
- Klik **Add user** → isi email & password
- Akun ini dipakai login di `/admin`

### 4. Ambil API keys
- **Settings → API**
- Copy **Project URL** dan **anon public key**

### 5. Config lokal
```bash
cp website/js/config.example.js website/js/config.js
```
Edit `config.js`, isi URL dan anon key.

---

## Deploy ke Netlify

### 1. Push ke GitHub
```bash
cd catatan
git init
git add .
git commit -m "Initial Hihibel deploy"
git remote add origin https://github.com/USERNAME/hihibel.git
git push -u origin main
```

### 2. Connect Netlify
- Daftar di [netlify.com](https://netlify.com)
- **Add new site → Import from Git**
- Pilih repo GitHub
- Settings:
  - **Base directory:** `website`
  - **Build command:** `node scripts/generate-config.js`
  - **Publish directory:** `.` (root of base)

### 3. Environment Variables (Netlify)
Di **Site settings → Environment variables**, tambah:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbG...` |

### 4. Redeploy
Trigger deploy ulang setelah set env vars.

### 5. Import soal seed
- Buka `https://situs-kamu.netlify.app/admin`
- Login dengan akun admin
- Klik **Import 50 Soal Seed**

---

## Panel Admin

| URL | Fungsi |
|-----|--------|
| `/admin/login.html` | Login admin |
| `/admin/dashboard.html` | Daftar & kelola soal |
| `/admin/buat-soal.html` | Form buat soal baru |
| `/admin/buat-soal.html?id=123` | Edit soal |

**Hanya user yang login** bisa tambah/edit/hapus soal. Publik hanya bisa latihan.

---

## Keamanan (Opsional)

Batasi write hanya untuk email admin tertentu — edit bagian opsional di `sql/schema.sql`:

```sql
CREATE POLICY "soal_admin_insert" ON soal
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'email-kamu@gmail.com');
```

---

## Domain Custom

1. Beli domain (Niagahoster, Cloudflare, dll.)
2. Netlify → **Domain settings → Add custom domain**
3. Ikuti instruksi DNS

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (static)
- **Database & Auth:** Supabase (free tier)
- **Hosting:** Netlify (free tier)

Biaya MVP: **Rp 0** (+ domain opsional ~Rp 150rb/tahun)
