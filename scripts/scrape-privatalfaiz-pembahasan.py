#!/usr/bin/env python3
"""
Scrape pembahasan tryout dari casn.privatalfaiz.id (Privat Alfaiz / Tryout Siswa).

Contoh:
  python3 scripts/scrape-privatalfaiz-pembahasan.py \\
    --url 'https://casn.privatalfaiz.id/#!/ujian/pembahasan/12396/6493076' \\
    --username 'email@example.com' \\
    --password 'password-kamu'

Atau pakai token dari browser (DevTools → Application → Local Storage → userInfo → access_token):
  python3 scripts/scrape-privatalfaiz-pembahasan.py \\
    --url 'https://casn.privatalfaiz.id/#!/ujian/pembahasan/12396/6493076' \\
    --token 'eyJhbG...'
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import uuid
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen

API_BASES = [
    "https://service26.tryoutsiswa.com/api",
    "https://service27.tryoutsiswa.com/api",
]
MEMBER_CODE = "ALFZ2"
JAWABAN_LABELS = "ABCDEF"


def parse_pembahasan_url(url: str) -> tuple[int, int]:
    match = re.search(r"/ujian/pembahasan/(\d+)/(\d+)", url)
    if not match:
        raise ValueError(
            "URL tidak valid. Harus berisi /ujian/pembahasan/{jadwalUjianId}/{jadwalUjianAbsensiId}"
        )
    return int(match.group(1)), int(match.group(2))


def strip_html(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<[^>]+>", " ", text)
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def request_json(
    method: str,
    url: str,
    *,
    data: dict[str, Any] | None = None,
    form: dict[str, str] | None = None,
    token: str | None = None,
    timeout: int = 60,
) -> Any:
    headers = {"Accept": "application/json"}
    payload: bytes | None = None

    if form is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        payload = urlencode(form).encode("utf-8")
    elif data is not None:
        headers["Content-Type"] = "application/json"
        payload = json.dumps(data).encode("utf-8")

    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = Request(url, data=payload, headers=headers, method=method)

    try:
        with urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            if not body:
                return {}
            return json.loads(body)
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} {url}: {detail}") from exc
    except URLError as exc:
        raise RuntimeError(f"Gagal konek ke {url}: {exc}") from exc


def login(username: str, password: str, device_id: str | None = None) -> str:
    device_id = device_id or str(uuid.uuid4())
    auth_username = f"{username}#{MEMBER_CODE}#{device_id}"
    last_error: Exception | None = None

    for base in API_BASES:
        try:
            resp = request_json(
                "POST",
                f"{base}/auth",
                form={
                    "username": auth_username,
                    "password": password,
                    "grant_type": "password",
                },
            )
            token = resp.get("access_token")
            if token:
                return token
            raise RuntimeError(resp.get("error_description") or resp.get("error") or "Login gagal")
        except Exception as exc:  # noqa: BLE001 — coba base API berikutnya
            last_error = exc

    raise RuntimeError(f"Login gagal di semua server API: {last_error}")


def fetch_pembahasan(token: str, jadwal_ujian_id: int, absensi_id: int) -> dict[str, Any]:
    last_error: Exception | None = None

    for base in API_BASES:
        try:
            url = (
                f"{base}/ujian/pembahasan/{jadwal_ujian_id}"
                f"?{urlencode({'jadwalUjianAbsensiID': absensi_id})}"
            )
            resp = request_json("GET", url, token=token)
            if resp.get("statusCode") == 200:
                return resp["data"]
            raise RuntimeError(resp.get("message") or "Response tidak sukses")
        except Exception as exc:  # noqa: BLE001
            last_error = exc

    raise RuntimeError(f"Gagal ambil pembahasan: {last_error}")


def jawaban_to_letter(value: Any) -> str:
    try:
        idx = int(value) - 1
    except (TypeError, ValueError):
        return str(value)
    if 0 <= idx < len(JAWABAN_LABELS):
        return JAWABAN_LABELS[idx]
    return str(value)


def normalize_soal(raw: dict[str, Any], *, nomor: int, pelajaran: str) -> dict[str, Any]:
    opsi: list[str] = []
    for i in range(1, 7):
        pilihan = raw.get(f"pilihan{i}")
        if pilihan:
            label = JAWABAN_LABELS[i - 1] if i <= len(JAWABAN_LABELS) else str(i)
            opsi.append(f"{label}. {strip_html(str(pilihan))}")

    pembahasan = strip_html(str(raw.get("pembahasan") or ""))
    langkah = [line.strip() for line in re.split(r"<br\s*/?>", raw.get("pembahasan") or "") if strip_html(line)]

    return {
        "nomor": nomor,
        "soalID": raw.get("soalID"),
        "pelajaran": pelajaran,
        "jenis": raw.get("jenis"),
        "soal": strip_html(str(raw.get("pertanyaan") or "")),
        "opsi": opsi,
        "jawaban": jawaban_to_letter(raw.get("jawabanBenar") or raw.get("jawaban")),
        "pembahasan": pembahasan,
        "langkah": langkah or ([pembahasan] if pembahasan else []),
        "urlVideo": raw.get("urlVideo"),
        "urlPDF": raw.get("urlPDF"),
        "raw": raw,
    }


def extract_all_soal(model: dict[str, Any]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    nomor = 1

    for pelajaran in model.get("ujianPelajaran") or []:
        nama = pelajaran.get("namaPelajaran") or "Umum"
        for soal in pelajaran.get("dataSoal") or []:
            result.append(normalize_soal(soal, nomor=nomor, pelajaran=nama))
            nomor += 1

    return result


def to_markdown(model: dict[str, Any], soal_list: list[dict[str, Any]]) -> str:
    lines = [
        f"# Pembahasan — {model.get('namaPaket') or model.get('namaUjian') or 'Tryout'}",
        "",
        f"- Jadwal Ujian ID: {model.get('jadwalUjianID')}",
        f"- Paket ID: {model.get('paketID')}",
        f"- Total soal: {len(soal_list)}",
        "",
    ]

    for item in soal_list:
        lines.extend(
            [
                f"## Soal {item['nomor']} ({item['pelajaran']})",
                "",
                item["soal"],
                "",
            ]
        )
        for opsi in item["opsi"]:
            lines.append(f"- {opsi}")
        lines.extend(["", f"**Jawaban: {item['jawaban']}**", ""])
        if item["pembahasan"]:
            lines.extend(["### Pembahasan", "", item["pembahasan"], ""])
        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Scrape pembahasan Privat Alfaiz")
    parser.add_argument("--url", required=True, help="URL halaman pembahasan")
    parser.add_argument("--username", help="Email/username login Privat Alfaiz")
    parser.add_argument("--password", help="Password login")
    parser.add_argument("--token", help="Bearer access_token (alternatif login)")
    parser.add_argument(
        "--out-dir",
        default="scraped/privatalfaiz",
        help="Folder output (default: scraped/privatalfaiz)",
    )
    args = parser.parse_args()

    token = args.token or os.environ.get("PRIVATALFAIZ_TOKEN")
    username = args.username or os.environ.get("PRIVATALFAIZ_USERNAME")
    password = args.password or os.environ.get("PRIVATALFAIZ_PASSWORD")

    if not token:
        if not username or not password:
            print(
                "Error: butuh --token ATAU (--username + --password).\n"
                "Token bisa diambil dari browser setelah login:\n"
                "  DevTools → Application → Local Storage → userInfo → access_token",
                file=sys.stderr,
            )
            return 1
        print("Login...", file=sys.stderr)
        token = login(username, password)

    jadwal_id, absensi_id = parse_pembahasan_url(args.url)
    print(f"Mengambil pembahasan {jadwal_id}/{absensi_id}...", file=sys.stderr)

    model = fetch_pembahasan(token, jadwal_id, absensi_id)
    soal_list = extract_all_soal(model)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    slug = f"pembahasan-{jadwal_id}-{absensi_id}"
    json_path = out_dir / f"{slug}.json"
    md_path = out_dir / f"{slug}.md"
    hihibel_path = out_dir / f"{slug}-hihibel.json"

    payload = {
        "source_url": args.url,
        "jadwal_ujian_id": jadwal_id,
        "jadwal_ujian_absensi_id": absensi_id,
        "meta": {
            "namaPaket": model.get("namaPaket"),
            "namaUjian": model.get("namaUjian"),
            "paketID": model.get("paketID"),
            "jadwalUjianID": model.get("jadwalUjianID"),
        },
        "soal": [{k: v for k, v in s.items() if k != "raw"} for s in soal_list],
    }

    hihibel = [
        {
            "kategori": s["pelajaran"],
            "soal": s["soal"],
            "opsi": s["opsi"],
            "jawaban": s["jawaban"],
            "langkah": s["langkah"],
        }
        for s in soal_list
    ]

    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(to_markdown(model, soal_list), encoding="utf-8")
    hihibel_path.write_text(json.dumps(hihibel, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Berhasil: {len(soal_list)} soal", file=sys.stderr)
    print(json_path)
    print(md_path)
    print(hihibel_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
