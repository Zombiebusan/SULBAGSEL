# UNSPEC Sulbagsel

Dashboard Next.js untuk Vercel, dengan login, pengambilan data terbaru saat halaman dibuka atau di-refresh, dan histori Neon PostgreSQL. Tidak ada polling otomatis atau jeda 60 detik. Tampilan menggunakan **HTML referensi asli** sebagai sumber layout, CSS, tabel, dan rumus. File referensi tetap diperlukan saat build/deploy.

## Navigasi dashboard

Menu berupa **sidebar permanen di sisi kiri**, tetap terlihat ketika dashboard digulir dan tidak memiliki tombol tutup. Area dashboard berada di sebelah kanan agar tidak tertutup menu. Pada layar kecil sidebar dibuat lebih ramping. Logo **U** hanya ada di sidebar, dengan aksen biru mengikuti palet dashboard. Badge target memakai ikon 🎯. Status pembaruan, mode siang/malam, dan tombol Keluar tersedia di sidebar. Perpindahan halaman tidak mereset filter dan dapat dioperasikan lewat keyboard.

Rincian Tabel IMJAS memiliki filter Branch dan bulan khusus tabel, terpisah dari filter progres harian. Seluruh tabel (performansi Branch, rekap, detail tiket, ringkasan bulanan Branch & Service Area, dan IMJAS) memiliki header kolom yang tetap terlihat saat isi tabel digulir.

### Unduh dashboard HTML

Setelah login dan masuk ke **`/dashboard`**, tambahkan **`/export`** di belakang alamat menjadi **`/dashboard/export`** (contoh: `https://underspec-sulbagsel.vercel.app/dashboard/export`). Browser langsung mengunduh `UNSPEC-Sulbagsel-<waktu>.html` dengan style dashboard yang sama, snapshot terbaru yang tersimpan beserta histori dan detail tiket. Alamat `/eksport` juga tetap tersedia. Ekspor tidak memicu sinkronisasi API baru.

File dapat dibuka tanpa internet: navigasi, filter, grafik, detail tiket, cetak/PDF, dan mode siang/malam tetap tersedia. Waktu ekspor dan pembaruan data ditampilkan pada sidebar. Isi file tetap mengikuti data saat diekspor; unduh kembali untuk mendapat pembaruan berikutnya. Impor ke database dan logout tidak tersedia pada file offline.

## Menjalankan lokal

1. Gunakan Node.js 22 atau lebih baru.
2. Jalankan `npm install`.
3. Buat `.env.local` berdasarkan `.env.example`.
4. Isi `DATABASE_URL` dengan connection string **pooled Neon**, termasuk `sslmode=require`.
5. Isi `SESSION_SECRET` dengan nilai acak minimal 32 karakter. Buat menggunakan:

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

6. Isi `CRON_SECRET` dengan nilai acak lain untuk pencatatan baseline bot pukul 08.00 WITA.
7. Jalankan `npm run dev`, lalu buka http://localhost:3000.

Username bawaan adalah **Sulbagsel**. Hash password bawaan cocok dengan password yang diminta saat pembuatan. Password divalidasi di server dan tidak dikirim dalam kode dashboard. Untuk mengganti password, jalankan `npm run password:hash`, lalu isi `AUTH_PASSWORD_HASH` dengan hasilnya.

Tanpa `DATABASE_URL`, aplikasi menampilkan histori referensi dengan keterangan **Neon belum dikonfigurasi**. Sinkronisasi realtime, impor, dan restore ke database membutuhkan koneksi Neon yang valid. Secret sesi wajib dikonfigurasi untuk mode produksi.

## Deploy ke Vercel

1. Upload proyek ke repository Git milik Anda, lalu **Import Project** di Vercel. Alternatif CLI: `npx vercel` dari folder proyek.
2. Framework preset: **Next.js**. Build command: `npm run build`.
3. Tambahkan environment variables berikut untuk environment Production:

   | Variable | Nilai |
   |---|---|
   | `DATABASE_URL` | Connection string pooled dari Neon |
   | `AUTH_USERNAME` | `Sulbagsel` |
   | `AUTH_PASSWORD_HASH` | Hash pada `.env.example`, atau hasil `npm run password:hash` |
   | `SESSION_SECRET` | Secret acak minimal 32 karakter |
   | `CRON_SECRET` | Secret acak terpisah untuk cron baseline bot pukul 08.00 WITA |

4. Deploy, login, lalu periksa status sinkronisasi di sidebar.
5. Pada akses data pertama, aplikasi membuat tabel dan mengimpor snapshot referensi secara otomatis. Pengguna database membutuhkan hak membuat tabel pada schema default.
6. Refresh halaman dashboard untuk mengambil data terbaru dari API sumber dan menyimpannya ke Neon.

Pembaruan tampilan tetap saat halaman dibuka atau di-refresh, tanpa polling 60 detik. Ada **satu cron harian khusus baseline bot** pada `0 0 * * *` UTC = **08.00 WITA**, menuju `/api/cron/morning`. Endpoint `/api/cron/sync` tetap tersedia untuk sinkronisasi manual eksternal dengan bearer `CRON_SECRET`.

Baseline `unspec_morning_baselines` menyimpan hitungan pertama yang berhasil diambil pada 08.00–sebelum 08.05 WITA, tidak ditimpa pengambilan berikutnya, dan memiliki waktu capture aktual. Bot menghitung CLOSE HI sebagai baseline pagi dikurangi saldo terkini, bukan H-1; hasil dapat negatif. Tanpa baseline yang valid, API mengirim `morning: null` dan bot menampilkan `—`. Jangan menganggap data siang sebagai pengganti posisi 08.00. Cron yang terlambat pada Vercel Hobby dapat melewati jendela ini; gunakan scheduler yang presisi bila diperlukan.

Saat refresh, server menyertakan snapshot terakhir dari Neon langsung pada HTML awal. Dashboard mempertahankan saldo dan grafik tersebut selama pengambilan API terbaru berlangsung; tidak kembali menampilkan snapshot bawaan 4 November. Data berubah setelah sinkronisasi baru berhasil. Jika database tidak dapat dibaca, halaman memberi respons gagal memuat alih-alih menampilkan angka referensi sebagai posisi terbaru.

Setelah mengubah environment variables di Vercel, lakukan redeploy.

## Sumber data dan filter

### Integrasi bot Telegram UNSPEC

Endpoint `POST /api/bot/unspec` disediakan untuk KKP-BOT. Header `Authorization: Bearer <UNSPEC_BOT_API_TOKEN>` wajib, dengan token minimal 32 karakter di environment Production Vercel. Bot menggunakan URL endpoint serta token yang sama melalui `UNSPEC_API_URL` dan `UNSPEC_API_TOKEN`.

Bot mengirim JSON `{ "requestId": "tg-..." }`. Endpoint menyimpan permintaan pada tabel `unspec_bot_requests`, mengembalikan HTTP 202 segera, lalu menyiapkan data di background melalui Next.js `after()` (durasi function 300 detik, batas worker 210 detik). Bot mengecek `GET /api/bot/unspec?requestId=...`; hasil lengkap dikembalikan sebagai HTTP 200. Request ID yang sama tidak memulai pengambilan baru, termasuk setelah cold start/retry Telegram.

Snapshot hanya boleh dipakai bersama jika waktu pengambilannya sesudah permintaan tersebut. Tidak ada fallback diam-diam ke snapshot lama. Payload memuat agregat STO hari ini WITA, tepat tanggal kemarin, baseline pagi terpisah bila tersedia, dan metadata job; tidak ada identitas pelanggan. Kegagalan dibedakan melalui kode terstruktur (misalnya `UPSTREAM_TIMEOUT`, `UPSTREAM_HTTP_ERROR`, `DATABASE_UNAVAILABLE`, `BOT_NOT_CONFIGURED`). Pemanggil lama tanpa requestId masih dapat memakai jalur sinkron 38 detik. Tidak ada polling otomatis dashboard; satu cron harian khusus baseline pagi dijelaskan di atas.

- Tiket: `https://monica.pamasuka.id/android/android/tiket_bar_unspec.php`
- Mapping: `https://monica.pamasuka.id/android/android/get_workzone_filter.php`
- Mapping JSON lokal dan mapping HTML disertakan sebagai dokumentasi/data referensi. Sinkronisasi live menggunakan mapping API; jika mapping live gagal, seluruh sinkronisasi dibatalkan dan data terakhir dipertahankan.
- Filter wilayah **hanya berdasarkan `WORKZONE` yang dicocokkan ke mapping**. `WITEL`, `OWNER_GROUP`, dan `SERVICE_AREA` pada tiket tidak menjadi dasar wilayah.
- Cakupan jenis tiket mengikuti referensi dan CSV: summary berawalan `[UNSPEC]` berisi `Proactive underspec`, dengan reporter `PROACTIVE_OHI` jika kolom reporter tersedia. Snapshot referensi lama tanpa kolom reporter dikenali melalui summary. Tiket legacy seperti `Unspec[... dBm]` tidak ikut saldo. Filter jenis ini terpisah dari filter wilayah WORKZONE.
- Jangan menggunakan `SOURCE_TICKET = PROACTIVE` sebagai satu-satunya penentu: CSV memberi label `PROACTIVE`, sedangkan API memberi label `UNSPEC` untuk tiket proactive yang sama. Metadata reporter dan sumber ikut disimpan untuk audit.
- `INCIDENT` unik dalam satu snapshot. INCIDENT yang sama dapat berada pada snapshot tanggal lain.
- `PAREPARE` dinormalisasi menjadi `PARE-PARE`; spasi WORKZONE dihapus dan huruf disamakan menjadi kapital.
- API diambil per halaman, maksimal 500 tiket per halaman, dengan concurrency terbatas. Jumlah baris harus sesuai metadata total sumber. Jika ada INCIDENT berulang, aplikasi memverifikasi dua putaran lengkap dengan kumpulan INCIDENT yang sama (maksimal tiga percobaan), lalu menghitung tiap INCIDENT sekali. Metadata jumlah baris sumber dapat lebih besar daripada jumlah tiket unik. Halaman hilang, kumpulan yang belum stabil, atau total berubah membatalkan snapshot; refresh halaman berikutnya mencoba kembali.
- Sinkronisasi memakai lease di PostgreSQL, sehingga beberapa tab/pengguna dan cron tidak melakukan pengambilan serentak.
- Data terbaru hanya ditulis setelah pengambilan lengkap berhasil. Error tidak diubah menjadi saldo nol.

## Histori dan periode

- Zona waktu: **Asia/Makassar / WITA**.
- Histori awal Juli–November 2026 mengikuti referensi, termasuk koreksi November dan basis pelanggan yang disematkan pada HTML.
- Oktober 2026 tetap FM sampai **30 Oktober 2026**.
- Snapshot hari berjalan diperbarui saat halaman dibuka/di-refresh, diminta bot, atau cron baseline 08.00 berjalan; hari sebelumnya dipertahankan. H-1 dashboard tetap snapshot sebelumnya yang tersedia sesuai referensi, sedangkan baseline pagi bot tersimpan terpisah.
- Bulan baru otomatis ditambahkan mulai Desember 2026, termasuk pergantian tahun. Bulan berjalan berlabel MTD; bulan sebelumnya FM berdasarkan snapshot terakhir yang tersedia.
- Bulan tanpa snapshot ditampilkan sebagai data belum tersedia, bukan nol. Tidak ada pengisian ulang historis dari tanggal laporan tiket.
- Basis pelanggan, nilai IMJAS, dan bobot 6% mengikuti referensi; API yang diberikan belum menyediakan pembaruan basis tersebut. STO baru tanpa basis pelanggan disebutkan di catatan bawah dashboard.
- Prognosa November 0,08% dan Desember 0,05% mengikuti referensi; angka itu tidak diteruskan menjadi prognosa bulan lain.

## Impor, backup, dan restore

- CSV membutuhkan `INCIDENT` dan `WORKZONE`. Nama kolom detail mendukung versi spasi dan underscore.
- Impor hanya memasukkan tiket proactive UNSPEC Sulbagsel sesuai cakupan referensi. File berisi tiket lain saja ditolak.
- Impor/restore disimpan di Neon dan terlihat oleh pengguna lain. Tanggal yang sama dapat diganti setelah konfirmasi.
- Tanggal masa depan, tanggal tidak valid, INCIDENT kosong, dan WORKZONE tidak dikenal ditolak.
- Restore dilakukan per tanggal untuk menjaga ukuran respons/permintaan Vercel. Jika gagal di tengah proses, pesan menyebutkan jumlah snapshot yang sudah dipulihkan; file dapat dipulihkan ulang.
- Backup mengunduh detail lengkap dari setiap tanggal, bukan placeholder agregasi yang dipakai grafik.
- Snapshot hari ini yang diimpor dapat digantikan oleh sinkronisasi API berikutnya.

## Struktur penting

```text
app/login/                 Halaman login
app/dashboard/             HTML referensi dengan data dinamis
app/api/auth/              Login dan logout
app/api/dashboard/         Agregat histori dan pemicu sinkronisasi
app/api/tickets/           Detail satu tanggal
app/api/history/           Impor / restore snapshot
app/api/cron/sync/         Pemicu scheduler dengan bearer secret
lib/reference.ts           Membaca data final dan koreksi bawaan HTML
lib/dashboard-html.ts      Adaptasi referensi dan periode dinamis
lib/dashboard-runtime.ts   Pengambilan saat halaman dibuka, detail, impor, backup, restore
lib/upstream.ts            Pagination dan validasi data API
lib/normalize.ts           WORKZONE / INCIDENT dan WITA
lib/db.ts                  Tabel Neon, seed, snapshot, dan lease
```

Data script pertama pada HTML adalah aset lokal tepercaya: pembaca referensi menjalankan script data tersebut dalam konteks VM terisolasi untuk menerapkan koreksi November yang mengikuti JSON awal. API dan file unggahan tidak dievaluasi sebagai JavaScript.

## Verifikasi

Audit CSV terhadap snapshot tanggal tertentu (laporan hanya jumlah agregat dan selisih INCIDENT):

```sh
npm run audit:csv -- "export (45).csv" "2026-11-05"
```

Hasil pemeriksaan `export (45).csv`: 420 tiket unik, terdiri dari 390 Sulbagsel dan 30 di luar cakupan. Sebaran Sulbagsel: MAKASSAR 152, BONE 23, KENDARI 98, PARE-PARE 117. Kumpulan INCIDENT Sulbagsel CSV cocok dengan 390 tiket proactive pada snapshot 5 November sebelum koreksi; 728 tiket legacy tambahan tidak ada dalam CSV.

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:browser
```

Tes browser memakai kredensial uji terpisah serta server lokal port 3100. Meliputi akses tanpa sesi, login salah/benar, tiga menu, filter, detail, tampilan mobile, logout, pergantian periode sampai Januari 2027, serta memastikan data tetap sampai halaman di-refresh. Pengujian deployment Vercel dilakukan setelah akun deployment tersedia.
