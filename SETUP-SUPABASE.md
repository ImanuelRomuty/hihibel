# Setup Supabase — Hihibel

Ikuti langkah berurutan. Estimasi waktu: **15 menit**.

---

## Langkah 1 — Buat Project Supabase

1. Buka https://supabase.com → **Start your project**
2. Login dengan GitHub (pilih akun `ImanuelRomuty`)
3. **New project**
   - **Name:** `hihibel`
   - **Database Password:** buat password kuat → **simpan di notes**
   - **Region:** Southeast Asia (Singapore) — paling dekat Indonesia
4. Klik **Create new project** → tunggu ~2 menit

---

## Langkah 2 — Jalankan Schema Database

1. Di dashboard Supabase, buka **SQL Editor** (sidebar kiri)
2. Klik **New query**
3. Copy **seluruh isi** file `website/sql/schema.sql`
4. Paste → klik **Run**
5. Harus muncul: **Success. No rows returned**

---

## Langkah 3 — Atur URL Auth (PENTING)

Supabase default-nya pakai `localhost` — ini bikin link reset password error.

1. Buka **Authentication** → **URL Configuration**
2. **Site URL:** ganti jadi
   ```
   https://imanuelromuty.github.io/hihibel/
   ```
3. **Redirect URLs** — tambahkan (klik Add URL):
   ```
   https://imanuelromuty.github.io/hihibel/**
   ```
4. Klik **Save**

---

## Langkah 4 — Buat Akun Admin

1. Buka **Authentication** → **Users**
2. Klik **Add user** → **Create new user**
3. Isi:
   - **Email:** `romuty16@gmail.com` (atau email kamu)
   - **Password:** buat password admin → **simpan**
   - Centang **Auto Confirm User**
4. Klik **Create user**

---

## Langkah 5 — Ambil API Keys

1. Buka **Settings** (gear icon) → **API**
2. Copy dua nilai ini:

| Field | Contoh | ❌ Bukan ini |
|-------|--------|-------------|
| **Project URL** | `https://xxxxx.supabase.co` | `sb_publishable_...` |
| **anon public** key | `eyJhbGciOiJIUzI1NiIs...` (panjang) | service_role key |

> **Project URL** ada di bagian **Project URL** — format `https://something.supabase.co`
>
> Jangan pakai **Publishable key** (`sb_publishable_...`) sebagai URL!

---

## Langkah 6 — Hubungkan ke Website

Jalankan di terminal:

```bash
cd /Users/imanuelr/catatan
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh
```

Paste **Project URL** dan **anon key** saat diminta.

Script otomatis:
- Update `config.js` lokal
- Set GitHub Secrets
- Trigger redeploy (~2 menit)

---

## Langkah 7 — Import Soal & Test

1. Tunggu deploy selesai: https://github.com/ImanuelRomuty/hihibel/actions
2. Buka https://imanuelromuty.github.io/hihibel/admin/login.html
3. Login dengan email + password admin (Langkah 4)
4. Klik **Import 50 Soal Seed**
5. Buka latihan → soal dari database Supabase

---

## Verifikasi

| Test | Harus |
|------|-------|
| Admin login | Berhasil masuk dashboard |
| Import seed | 50 soal muncul di dashboard |
| Latihan publik | Soal tampil, bisa dijawab |
| Buat soal baru | Muncul di latihan setelah simpan |

---

## Troubleshooting

**Login admin gagal**
- Pastikan user sudah **Auto Confirm** di Supabase
- Cek email/password benar

**Reset password → localhost / connection refused**
- Supabase **Site URL** masih `http://localhost:3000` → ubah ke Langkah 3
- Tambahkan redirect URL `https://imanuelromuty.github.io/hihibel/**`
- Atau reset manual: Supabase → Users → klik user → set password baru langsung

**"email rate limit exceeded" saat reset password**
- Supabase membatasi jumlah email reset (~4/jam). Kamu sudah klik terlalu sering.
- **Solusi cepat (tanpa email):**
  1. Supabase → **Authentication** → **Users**
  2. Klik user admin kamu
  3. Tab **Overview** → **Reset password** atau edit user → isi password baru
  4. Login di website dengan password baru itu
- Atau tunggu ~1 jam lalu coba kirim link reset lagi

**Import seed error**
- Pastikan schema.sql sudah di-run (Langkah 2)
- Cek RLS policies aktif

**Latihan masih pakai soal offline**
- GitHub Secrets belum diset → jalankan `setup-supabase.sh` lagi
- Tunggu deploy Actions selesai (~2 menit)

**"Supabase belum dikonfigurasi" di admin**
- Redeploy belum selesai atau secrets salah

---

## Keamanan (Opsional)

Batasi write hanya untuk email kamu — edit di SQL Editor:

```sql
DROP POLICY IF EXISTS "soal_admin_insert" ON soal;
CREATE POLICY "soal_admin_insert" ON soal
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'romuty16@gmail.com');
```

(Ulangi untuk update/delete jika perlu)
