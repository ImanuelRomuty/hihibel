#!/usr/bin/env python3
"""
Import soal scraped → Supabase, dikelompokkan per materi (twk / tiu / tkp).

  export HIHIBEL_ADMIN_EMAIL='email@example.com'
  export HIHIBEL_ADMIN_PASSWORD='password'
  python3 scripts/import-scraped-to-supabase.py

Set HIHIBEL_REPLACE=1 untuk hapus soal twk/tiu/tkp lama sebelum import.
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
SCRAPED_DIR = ROOT / "scraped" / "privatalfaiz"
CONFIG_PATH = ROOT / "website" / "js" / "config.js"

KATEGORI_TO_SUB_BAB = {
    "Tes Wawasan Kebangsaan": "twk",
    "Tes Intelegensia Umum": "tiu",
    "Tes Intelegensi Umum": "tiu",
    "Tes Karakteristik Pribadi": "tkp",
}

SUB_BABS = ("twk", "tiu", "tkp")


def load_config() -> tuple[str, str]:
    text = CONFIG_PATH.read_text(encoding="utf-8")
    url_m = re.search(r"SUPABASE_URL:\s*'([^']+)'", text)
    key_m = re.search(r"SUPABASE_ANON_KEY:\s*'([^']+)'", text)
    if not url_m or not key_m:
        raise RuntimeError(f"Config tidak ditemukan di {CONFIG_PATH}")
    return url_m.group(1).rstrip("/"), key_m.group(1)


def api(method: str, url: str, key: str, token: str | None = None, data=None, extra_headers=None):
    headers = {"apikey": key, "Content-Type": "application/json", "Prefer": "return=minimal"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if extra_headers:
        headers.update(extra_headers)
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc


def login(base: str, key: str, email: str, password: str) -> str:
    data = api(
        "POST",
        f"{base}/auth/v1/token?grant_type=password",
        key,
        data={"email": email, "password": password},
    )
    token = data.get("access_token")
    if not token:
        raise RuntimeError(f"Login gagal: {data}")
    return token


def delete_sub_bab(base: str, key: str, token: str, sub_bab: str):
    api("DELETE", f"{base}/rest/v1/soal?sub_bab=eq.{sub_bab}", key, token)


def insert_batch(base: str, key: str, token: str, rows: list):
    for i in range(0, len(rows), 50):
        api("POST", f"{base}/rest/v1/soal", key, token, data=rows[i:i + 50])


def load_grouped(files: list[Path]) -> dict[str, list]:
    buckets: dict[str, list] = defaultdict(list)
    for path in files:
        for q in json.loads(path.read_text(encoding="utf-8")):
            sub = KATEGORI_TO_SUB_BAB.get(q["kategori"])
            if not sub:
                raise ValueError(f"Kategori tidak dikenal: {q['kategori']}")
            buckets[sub].append(q)
    return buckets


def main() -> int:
    email = os.environ.get("HIHIBEL_ADMIN_EMAIL", "").strip()
    password = os.environ.get("HIHIBEL_ADMIN_PASSWORD", "")

    if not email or not password:
        print("Set HIHIBEL_ADMIN_EMAIL dan HIHIBEL_ADMIN_PASSWORD", file=sys.stderr)
        return 1

    files = sorted(SCRAPED_DIR.glob("*-hihibel.json"))
    if not files:
        print(f"Tidak ada file di {SCRAPED_DIR}", file=sys.stderr)
        return 1

    base, key = load_config()
    print(f"Login {email}...")
    token = login(base, key, email, password)

    grouped = load_grouped(files)
    replace = os.environ.get("HIHIBEL_REPLACE", "1").lower() in ("1", "true", "yes")

    total = 0
    for sub_bab in SUB_BABS:
        questions = grouped.get(sub_bab, [])
        if not questions:
            print(f"  − {sub_bab}: kosong, skip")
            continue

        if replace:
            delete_sub_bab(base, key, token, sub_bab)
            # bersihkan import lama per-tryout
            for old in ("tryout-12396", "tryout-12409", "tryout-12420"):
                delete_sub_bab(base, key, token, old)

        rows = []
        for i, q in enumerate(questions, start=1):
            rows.append({
                "sub_bab": sub_bab,
                "kategori": q["kategori"],
                "soal": q["soal"],
                "opsi": q["opsi"],
                "jawaban": q["jawaban"],
                "langkah": q.get("langkah") or [],
                "animasi": q.get("animasi"),
                "urutan": i,
            })

        insert_batch(base, key, token, rows)
        total += len(rows)
        print(f"  ✓ {sub_bab.upper()}: {len(rows)} soal")

    print(f"\nSelesai: {total} soal dari {len(files)} file tryout.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
