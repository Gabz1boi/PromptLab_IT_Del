# PromptLab IT Del

Aplikasi latihan Prompt Engineering untuk workshop GSA Event 2. Antarmuka dan panduan menggunakan Bahasa Indonesia.

## Fitur utama

- Satu studi kasus bersama: mahasiswa semester pertama kesulitan memahami `for`, `while`, dan `do-while`.
- Evaluasi prompt dengan Hybrid Rule-Based: pengenalan frasa, pola instruksi, dan pemeriksaan relevansi konteks.
- Delapan dimensi penilaian dengan total 100 poin.
- Feedback berdasarkan indikator yang benar-benar terdeteksi.
- Maksimal empat percobaan per peserta.
- Riwayat skor dan ringkasan peningkatan.
- Sesi peserta anonim melalui cookie.
- Dashboard admin dengan rekap peserta dan ekspor CSV.
- Tidak memerlukan Gemini API key atau API AI eksternal.

## Kebutuhan

- Node.js 20 LTS disarankan.
- npm.
- Satu server Node.js yang berjalan terus-menerus untuk penggunaan acara.

## Menjalankan di komputer lokal

1. Ekstrak ZIP.
2. Buka terminal di folder `PromptLab_IT_Del`.
3. Salin `.env.example` menjadi `.env`.
4. Ganti `ADMIN_PASSWORD` dan `ADMIN_SECRET` pada `.env`.
5. Jalankan:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

6. Buka `http://localhost:3000`.

Dashboard admin tersedia di `http://localhost:3000/admin`.

## Menjalankan versi produksi

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
npm run start
```

Jalankan aplikasi pada satu instance Node.js dan gunakan penyimpanan disk persisten untuk file SQLite. Jangan menempatkan SQLite pada filesystem sementara serverless atau menjalankan beberapa instance aplikasi yang berbagi file SQLite melalui network filesystem.

## Uji scoring engine

```bash
npm test
```

Tes memeriksa prompt umum, prompt terstruktur, keyword stuffing, batas skor, dan sinonim bahasa Inggris.

## Simulasi 60 peserta

Pastikan aplikasi berjalan pada terminal pertama:

```bash
npm run dev
```

Buka terminal kedua:

```bash
npm run test:load
```

Skrip ini membuat 60 sesi anonim dan mengirim satu prompt evaluasi per sesi secara bersamaan. Hasilnya ditampilkan di terminal.

Catatan: uji beban lokal adalah pemeriksaan awal, bukan jaminan kapasitas hosting. Lakukan uji pada lingkungan deployment yang sama dengan hari acara.

## Pengaturan admin

Atur dua variabel berikut di `.env` atau environment hosting:

- `ADMIN_PASSWORD`: kata sandi dashboard.
- `ADMIN_SECRET`: rahasia acak yang panjang untuk menandatangani cookie admin.

Jangan commit `.env` ke Git dan jangan membagikan kata sandi admin kepada peserta.

## Rubrik penilaian

| Dimensi | Bobot |
|---|---:|
| Persona | 15 |
| Task | 20 |
| Context | 20 |
| Format | 15 |
| Examples | 10 |
| Constraints | 10 |
| Kejelasan & Kekhususan | 5 |
| AI Bertanggung Jawab & Verifikasi | 5 |
| **Total** | **100** |

Level:
- 0–39: Perlu Banyak Perbaikan
- 40–59: Pemahaman Dasar
- 60–74: Sedang Berkembang
- 75–89: Baik
- 90–100: Sangat Baik

## Catatan penting tentang penilaian

Mesin ini adalah evaluator berbasis aturan, bukan penilai semantik berbasis model AI. Ia memeriksa frasa, pola instruksi, dan relevansi konteks pada skenario looping. Karena itu:

- Skor adalah feedback formatif untuk latihan, bukan ukuran mutlak kemampuan mahasiswa.
- Sinonim dan pola baru dapat ditambahkan pada `lib/scoring.ts`.
- Sebelum acara, uji dengan prompt dari beberapa tingkat kualitas dan minta fasilitator memeriksa kewajaran hasil.
- Jangan menjanjikan penilaian semantik setara manusia atau Gemini.

## Catatan kapasitas 60 peserta

Tidak ada panggilan Gemini API, sehingga tidak ada kuota API atau antrean model AI. Namun, 60 pengguna tetap mengakses server dan database secara bersamaan. Untuk satu sesi workshop, jalankan pada satu server Node.js dengan CPU/RAM memadai, database pada disk persisten, dan lakukan `npm run test:load` pada server deployment sebelum acara.

Jika platform hosting menggunakan serverless atau beberapa instance, pindahkan penyimpanan ke PostgreSQL terkelola sebelum acara. SQLite lokal tidak dirancang untuk berbagi file database antar-instance serverless.

## Privasi

Aplikasi tidak meminta nama, email, atau NIM. Setiap browser memperoleh ID sesi acak. Admin dapat melihat prompt dan hasil evaluasi untuk keperluan pelaksanaan workshop. Beri tahu peserta mengenai hal tersebut sebelum mereka mulai.
