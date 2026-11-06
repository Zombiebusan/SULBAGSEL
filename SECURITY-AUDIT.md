# Audit Keamanan — UNSPEC Sulbagsel

**Tanggal:** 6 November 2026, pemeriksaan terakhir 10.14 WITA / 02.14 UTC.  
**Target utama:** source `C:\Admin\Project\UNSPEC-Sulbagsel` dan production build lokal terisolasi.  
**Target produksi:** hanya pemeriksaan pasif header `GET https://underspec-sulbagsel.vercel.app/login`.  
**Status:** audit selesai; rekomendasi belum diterapkan ke kode aplikasi.

## Metode dan skill yang digunakan

Mengikuti alur skill lokal di `.agents/skills/`:

- `application-security-testing`: pemetaan aset dan prioritas berdasarkan dampak yang dibuktikan.
- `find-security-vulnerabilities-in-code`: penelusuran source, sink, serta model otorisasi.
- `api-security-testing`: pemeriksaan akses endpoint, token, sesi, dan CSRF.
- `owasp-top-10-testing`: pemetaan hasil ke OWASP Top 10:2025 dan OWASP API Security Top 10:2023.
- Panduan prasyarat dibaca dari `penetration-testing-with-strix`.

**Ini bukan hasil scan mesin Strix.** Perintah Strix dan Docker tidak tersedia di PATH sesi ini. Tidak ada akun/cloud scan Strix yang digunakan dan tidak ada source atau secret yang diunggah ke layanan pemindai. Hasil di bawah berasal dari review manual, uji HTTP/browser lokal, dan `npm audit`.

Server audit menggunakan production build Next.js dengan username/password/secret uji terpisah dan `DATABASE_URL` kosong. Data API browser diganti fixture sintetis untuk pengujian XSS dan CSV. Pengujian tidak memodifikasi database produksi, tidak menyerang API MONICA, dan tidak mengirim laporan Telegram.

**Bukti terstruktur:** [security-audit/2026-11-06/evidence.json](security-audit/2026-11-06/evidence.json).

## Ringkasan prioritas

| ID | Risiko | Prioritas | Temuan | Tingkat validasi |
|---|---|---|---|---|
| UNSPEC-SEC-001 | Tinggi, bersyarat | P1 | XSS pada tooltip grafik dari nama mapping Service Area | Eksekusi JavaScript terbukti dengan fixture lokal; hak penyerang mengubah API mapping asli belum dibuktikan |
| UNSPEC-SEC-002 | Sedang | P1 | Endpoint login tanpa pembatasan percobaan di aplikasi | 20 percobaan salah berurutan diterima tanpa throttling; konfigurasi WAF produksi belum diuji |
| UNSPEC-SEC-003 | Sedang | P2 | Cookie sesi yang disalin tetap berlaku setelah logout | Replay cookie sesudah logout berhasil mengakses endpoint terlindungi di lokal |
| UNSPEC-SEC-004 | Sedang, bersyarat | P2 | Formula spreadsheet tidak dinetralkan pada ekspor CSV | File CSV hasil unduhan terbukti memuat formula mentah; eksekusi spreadsheet belum diuji |

Tidak ada celah kritis yang berhasil dibuktikan dalam ruang lingkup ini. Pernyataan tersebut bukan jaminan seluruh aplikasi atau deployment produksi bebas kerentanan.

## UNSPEC-SEC-001 — XSS melalui nama Service Area pada tooltip SVG

**Lokasi:**

- `UNSPEC-Sulbagsel november.html:674`: `${br}` dimasukkan langsung ke elemen `<title>` dalam markup SVG.
- `UNSPEC-Sulbagsel november.html:668–676`: hasil markup dimasukkan melalui `innerHTML`.
- `lib/normalize.ts:13–21`: `SERVICE_AREA` dari mapping dinormalisasi menjadi huruf besar, tetapi bukan di-escape sebagai HTML.
- `lib/dashboard-runtime.ts:148–150`: mapping API diterapkan ke model dashboard.
- `app/dashboard/route.ts:19`: CSP masih mengizinkan script/event handler inline.

**Aliran data:** API mapping → `SERVICE_AREA` → `mapping[WORKZONE].sa` → pilihan Service Area → `item.label` / `br` → tooltip SVG → `innerHTML`.

Header kartu dan atribut aria sudah menggunakan `esc()`, tetapi interpolasi tooltip ini belum. Normalisasi uppercase tidak cukup: JavaScript dalam atribut event dapat ditulis sebagai numeric HTML entities yang tetap bertahan setelah `.toUpperCase()`.

### Bukti lokal

1. Gunakan akun uji pada instance lokal terisolasi.
2. Ganti respons mapping lokal dengan nama SA sintetis yang memuat penutup `TITLE`/`CIRCLE`, elemen `IMAGE` dengan `HREF="/"`, dan `ONERROR` berupa numeric entities untuk ekspresi tidak berbahaya `window.__ax=1`.
3. Terapkan `.toUpperCase()` pada seluruh payload seperti normalizer aplikasi.
4. Pilih Service Area tersebut.
5. Chromium mengeksekusi event handler: `window.__ax === 1`; dua elemen SVG `image` terinjeksi. Renderer juga menghasilkan satu error karena struktur circle grafik berubah.

Tidak ada eksfiltrasi atau aksi perubahan data pada PoC. Kemampuan penyerang luar untuk mengubah nama SA pada API MONICA asli **tidak diuji**. Karena prasyarat itu, ini adalah sink XSS yang terkonfirmasi dengan data upstream sintetis, bukan klaim pengambilalihan produksi tanpa autentikasi.

**Dampak jika prasyarat terpenuhi:** JavaScript berjalan dalam origin aplikasi pada sesi pengguna yang sedang login. HttpOnly mencegah pembacaan cookie melalui JavaScript, tetapi tidak mencegah script memakai sesi browser untuk membaca API atau melakukan aksi yang diizinkan akun tersebut.

**Perbaikan:**

1. Gunakan `${esc(br)}` pada tooltip, atau bangun elemen SVG melalui `createElementNS()` dan isi teks dengan `textContent`.
2. Audit interpolasi teks pada seluruh markup SVG, bukan hanya judul visual kartu.
3. Perketat CSP memakai nonce/hash setelah event handler inline dimigrasikan ke `addEventListener`. Menghapus `unsafe-inline` begitu saja akan memutus tombol bawaan yang masih memakai `onclick`.
4. Tambahkan regresi untuk payload mapping yang mengandung tag, tanda kutip, numeric entities, dan normalisasi uppercase.

**Pemetaan:** OWASP A05:2025 Injection; CWE-79. Kepercayaan terhadap sumber mapping juga berkaitan dengan A08:2025 Data Integrity.

## UNSPEC-SEC-002 — Login tanpa rate limiting aplikasi

**Lokasi:** `app/api/auth/login/route.ts:3–12`, `lib/auth.ts:20–24`.

Login memeriksa origin dan panjang field, kemudian menghitung `scryptSync()` untuk setiap percobaan. Tidak terlihat counter, penundaan, pembatasan akun/IP, atau respons 429 pada jalur aplikasi tersebut.

### Bukti lokal

- 20 login salah berurutan pada akun uji yang sama.
- Seluruh respons **401**.
- Tidak ada `Retry-After` atau respons **429**.
- Login yang benar sesudahnya tetap berhasil.

Tes ini membuktikan perilaku pada jumlah percobaan terbatas tersebut. Tidak dilakukan stress test atau penebakan password akun produksi, dan tidak dinilai apakah deployment memiliki WAF eksternal yang menambahkan pembatasan.

**Dampak:** percobaan tebak password dapat dilakukan berulang tanpa pengendalian aplikasi; operasi scrypt sinkron juga memakai CPU/event loop untuk setiap percobaan. Besarnya dampak DoS produksi belum dibuktikan.

**Perbaikan:**

1. Tambahkan pembatas terdistribusi yang bekerja lintas instance Vercel, berdasarkan akun dan sumber request.
2. Gunakan batas bertahap/cooldown dan respons 429 dengan `Retry-After`; hindari lock permanen yang mudah disalahgunakan untuk mengunci akun.
3. Catat kegagalan berulang tanpa menyimpan password; gunakan scrypt asinkron agar perhitungan tidak memblokir event loop.

**Pemetaan:** OWASP A07:2025 Authentication Failures; OWASP API2/API4:2023; CWE-307.

## UNSPEC-SEC-003 — Logout tidak mencabut cookie yang sudah disalin

**Lokasi:** `lib/auth.ts:26–42`, `app/api/auth/logout/route.ts:3–6`.

Sesi adalah payload bertanda tangan HMAC dengan masa berlaku 12 jam. Logout hanya menghapus cookie pada browser yang melakukan logout; tidak ada pencabutan server-side, session ID aktif, atau versi sesi pengguna yang diperiksa.

### Bukti lokal

1. Login dengan akun uji, simpan salinan nilai cookie dalam memori penguji.
2. `POST /api/auth/logout` dengan origin yang benar → **200**.
3. Kirim cookie yang sama ke `GET /api/tickets?date=2026-11-04` → **200**, mengembalikan **411 baris referensi lokal**.

Nilai cookie dan isi pelanggan tidak disimpan dalam laporan. Cookie tersebut ditandatangani dengan secret uji, bukan secret produksi.

**Prasyarat:** pelaku sudah memperoleh cookie sesi yang valid. Audit tidak membuktikan pencurian cookie. Menghapus cookie browser tetap bekerja, tetapi salinan yang dimiliki pihak lain belum dinonaktifkan sampai kedaluwarsa/rotasi secret.

**Perbaikan:** gunakan session ID acak yang disimpan dan divalidasi server-side, lalu hapus/revoke pada logout. Alternatif versioned session dapat digunakan untuk mencabut seluruh sesi akun saat password berubah; pertimbangkan juga kontrol pencabutan per sesi.

**Pemetaan:** OWASP A07:2025 Authentication Failures; CWE-613.

## UNSPEC-SEC-004 — Formula injection pada ekspor CSV

**Lokasi:** `UNSPEC-Sulbagsel november.html:680`, fungsi `exportDetail()` dan `cell()`.

Formatter membungkus sel dengan tanda kutip dan menggandakan tanda kutip di dalamnya. Ini menangani struktur CSV, tetapi tidak membuat formula menjadi teks literal pada aplikasi spreadsheet.

### Bukti lokal

1. Respons detail tiket sintetis berisi `CUSTOMER NAME = =1+1`.
2. Tabel menampilkan teks tersebut dengan aman.
3. Panggil ekspor detail dan tangkap unduhan CSV di Chromium.
4. CSV memuat sel **`"=1+1"`**, tanpa netralisasi formula.

PoC hanya memakai formula aritmetika. Excel/LibreOffice tidak dibuka, sehingga perilaku eksekusi bergantung pada aplikasi, versi, dan pengaturan import/prompt yang dipakai. Tidak ada bukti eksekusi perintah sistem atau eksfiltrasi dalam pengujian ini.

**Dampak jika file dibuka sebagai spreadsheet:** isi data yang berasal dari sumber tidak tepercaya dapat ditafsirkan sebagai formula, bukan nama/teks biasa.

**Perbaikan:** netralkan nilai berawalan formula (`=`, `+`, `-`, `@`, serta awalan whitespace/control yang relevan) sebelum encoding CSV, atau ekspor format spreadsheet dengan jenis sel string secara eksplisit. Terapkan kebijakan yang menjaga nomor layanan dan teks bisnis tetap tampil benar. Uji juga tanda kutip, separator, multiline, BOM, dan leading whitespace.

**Pemetaan:** OWASP A05:2025 Injection; CWE-1236.

## Kontrol yang terverifikasi bekerja

| Pemeriksaan | Hasil lokal |
|---|---|
| Dashboard tanpa sesi | 302 menuju login |
| API dashboard/tiket/history tanpa sesi | 401 |
| Endpoint bot dan cron dengan token salah | 401 |
| Cookie dengan tanda tangan diubah | 401 |
| Cookie bertanda tangan uji yang sudah kedaluwarsa | 401 |
| Login dan operasi mutasi dari origin lain | 403 |
| Cookie produksi | HttpOnly, Secure, SameSite=Lax |
| Payload tanggal menyerupai SQL injection | 400; query SQL pada source juga memakai parameter |
| Upload history lebih dari 4.000.000 byte | 413 |
| Tag HTML pada summary detail tiket | Di-escape; tidak membuat elemen image atau menjalankan script |
| Akses langsung `.env.local`, bundle server Next, dan HTML referensi | 404 |

**Dependensi:** `npm audit --omit=dev --json` dan `npm audit --json` sama-sama melaporkan **0 advisory** pada lockfile yang diperiksa. Ini hanya mencakup kerentanan yang dikenal database npm, bukan bukti supply chain atau semua dependensi bebas cacat.

**Pemeriksaan pasif produksi `/login`:** HTTP 200; HSTS `max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, dan `X-Frame-Options: DENY` tersedia. Header CSP tidak ditemukan pada halaman login produksi saat pemeriksaan. Kesesuaian seluruh source deployment produksi dengan working tree lokal tidak dibuktikan.

## Catatan tambahan, bukan exploit terkonfirmasi

1. **Fallback kredensial pada produksi.** `lib/auth.ts:8,21,24` masih memakai hash/password dan username bawaan bila environment kosong. Sebaiknya konfigurasi autentikasi produksi wajib eksplisit dan fail-closed. Tidak dilakukan penebakan/recovery password atau login dengan kredensial produksi untuk membuktikan eksploit default ini.
2. **Batas body sesudah pembacaan.** Login melakukan `request.json()` sebelum validasi field; history membaca seluruh body sebelum memeriksa batas 4 MB. Uji membuktikan history mengembalikan 413, tetapi bukan batas pemakaian memori pada koneksi streaming. Batas ingress Vercel dan stream yang dibatasi perlu ditinjau bersama.
3. **CSP `unsafe-inline`.** Pada dashboard lokal memungkinkan handler pada PoC XSS di atas berjalan. Terapkan nonce dan pindahkan handler inline secara bertahap agar fitur tetap berjalan.
4. **Satu akun bersama.** Model akses memang memakai satu akun dengan akses data global. Tidak ada dua tenant/role terpisah yang dapat dipakai untuk membuktikan BOLA/IDOR antar-pengguna; ini tidak dilaporkan sebagai bypass otorisasi.
5. **Audit trail dan hak database.** Hak akun Neon, retensi log, alert kegagalan login, enkripsi at-rest, CI/CD provenance, dan respons insiden belum diuji. `console.error` dan metadata snapshot tidak otomatis membuktikan seluruh kebutuhan audit trail sudah terpenuhi.
6. **Secret scan terbatas.** `.env.local` tercatat di-ignore oleh Git dan pola token Neon/API yang diperiksa tidak ditemukan dalam source TS/TSX/MD/JSON/YAML yang dicari. Riwayat Git penuh dan layanan pengelolaan secret produksi belum diaudit. Nilai secret tidak dicantumkan dalam laporan ini.
7. **VM reference.** `lib/reference.ts` menjalankan script dari aset lokal tepercaya, bukan dari request/unggahan. Ini bukan bukti RCE dari pengguna. Tetap perlakukan penggantian aset tersebut sebagai perubahan kode, bukan import data biasa.

## Cakupan OWASP Top 10:2025

| Kategori | Cakupan dan batasan |
|---|---|
| A01 Broken Access Control | Guard endpoint dan token diuji; pemisahan role/tenant, SSRF lintas infrastruktur, serta bypass WAF belum diuji |
| A02 Security Misconfiguration | Header, file sensitif, dan konfigurasi autentikasi ditinjau; panel pengaturan Vercel/Neon belum diaudit |
| A03 Software Supply Chain Failures | npm audit produksi/dev selesai; provenance, runner, dan kredensial CI belum diuji |
| A04 Cryptographic Failures | Cookie/HMAC/signature/expiry dan scrypt ditinjau; manajemen kunci serta enkripsi at-rest belum diuji |
| A05 Injection | XSS mapping terkonfirmasi di fixture lokal; formula CSV output terkonfirmasi; tanggal injection ditolak; bukan pentest SQL menyeluruh |
| A06 Insecure Design | Percobaan login dan session lifecycle diuji terbatas; bukan evaluasi semua proses bisnis |
| A07 Authentication Failures | Login, guard, cookie palsu/kedaluwarsa, serta replay setelah logout diuji lokal |
| A08 Software or Data Integrity Failures | Trust boundary mapping dan parsing data ditinjau; tidak mengubah/menyerang sistem sumber |
| A09 Security Logging and Alerting Failures | Review source terbatas; alert/log produksi tidak dapat dinyatakan lulus |
| A10 Mishandling of Exceptional Conditions | Penolakan origin/token/tanggal/body serta error aman diuji; bukan pengujian setiap race/timeout/kegagalan database |

## Urutan perbaikan yang disarankan

1. **P1:** tutup sink XSS tooltip, tambah tes regresi, dan batasi login lintas instance.
2. **P2:** tambahkan pencabutan sesi dan netralisasi ekspor CSV.
3. **P2/P3:** wajibkan konfigurasi autentikasi produksi, rapikan CSP tanpa merusak tombol, serta tinjau batas request body dan audit logging.
4. Jalankan ulang PoC yang sama sesudah patch; tambahkan regresi negatif untuk memastikan payload tidak lagi bekerja.
5. Jika ingin scan Strix resmi, siapkan runtime Docker/LLM atau akun cloud, staging, batas biaya, serta scope yang disetujui. Gunakan salinan source yang sudah dibersihkan dari secret dan data pelanggan.

Audit ini tidak mengubah kode aplikasi, kredensial, fitur, atau data produksi. Artefak yang ditambahkan hanya laporan dan bukti yang sudah disanitasi.
