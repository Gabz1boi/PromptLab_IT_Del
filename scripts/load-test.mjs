const base = process.env.APP_URL || "http://localhost:3000";
const count = 60;

const samplePrompt = `Bertindaklah sebagai tutor pemrograman yang sabar untuk mahasiswa semester pertama.
Saya sedang mempersiapkan kuis dan masih bingung membedakan for, while, dan do-while.
Jelaskan perbedaan dan kapan setiap jenis perulangan digunakan agar saya memahami konsepnya.
Sajikan dalam bentuk tabel, langkah demi langkah, dan sertakan contoh kode untuk setiap jenis loop.
Gunakan bahasa Indonesia yang sederhana. Periksa kembali akurasi contoh kode dan bimbing saya belajar.`;

async function runOne(index) {
  const sessionResponse = await fetch(`${base}/api/session`);
  if (!sessionResponse.ok) throw new Error(`Peserta ${index}: gagal membuat sesi (${sessionResponse.status})`);
  const cookie = sessionResponse.headers.get("set-cookie");
  if (!cookie) throw new Error(`Peserta ${index}: cookie sesi tidak ditemukan`);

  const evaluateResponse = await fetch(`${base}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookie.split(";")[0] },
    body: JSON.stringify({ prompt: samplePrompt })
  });

  const result = await evaluateResponse.json();
  if (!evaluateResponse.ok) throw new Error(`Peserta ${index}: ${result.error || evaluateResponse.status}`);
  return result.total_score;
}

console.log(`Menjalankan simulasi ${count} peserta secara bersamaan ke ${base}`);
const started = Date.now();
const results = await Promise.allSettled(Array.from({ length: count }, (_, i) => runOne(i + 1)));
const success = results.filter((r) => r.status === "fulfilled");
const failed = results.filter((r) => r.status === "rejected");
const elapsed = ((Date.now() - started) / 1000).toFixed(2);

console.log(`Selesai dalam ${elapsed} detik.`);
console.log(`Berhasil: ${success.length}/${count}`);
console.log(`Gagal: ${failed.length}/${count}`);
if (success.length) {
  const scores = success.map((r) => r.value);
  console.log(`Rentang skor uji: ${Math.min(...scores)}–${Math.max(...scores)}`);
}
if (failed.length) {
  failed.slice(0, 10).forEach((r) => console.error(r.reason));
  process.exitCode = 1;
}
