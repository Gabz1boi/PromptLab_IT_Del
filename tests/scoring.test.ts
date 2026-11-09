import { describe, expect, it } from "vitest";
import { evaluatePrompt } from "../lib/scoring";

describe("Hybrid Rule-Based evaluator", () => {
  it("memberi skor rendah pada prompt sangat umum", () => {
    const result = evaluatePrompt("Jelaskan looping.");
    expect(result.total_score).toBeLessThan(40);
  });

  it("mengenali prompt yang terstruktur dan relevan", () => {
    const prompt = `Bertindaklah sebagai tutor pemrograman yang sabar untuk mahasiswa semester pertama.
    Saya sedang mempersiapkan kuis dan masih bingung membedakan for, while, dan do-while.
    Jelaskan perbedaan dan kapan setiap jenis perulangan digunakan agar saya memahami konsepnya.
    Sajikan dalam bentuk tabel, langkah demi langkah, dan sertakan contoh kode untuk setiap jenis loop.
    Gunakan bahasa Indonesia yang sederhana, jangan langsung memberikan jawaban latihan.
    Periksa kembali akurasi contoh kode dan jelaskan jika ada hal yang belum pasti.
    Bimbing saya belajar dan berikan tiga soal untuk menguji pemahaman.`;
    const result = evaluatePrompt(prompt);
    expect(result.total_score).toBeGreaterThan(70);
    expect(result.breakdown.persona.score).toBeGreaterThan(0);
    expect(result.breakdown.task.score).toBeGreaterThan(10);
    expect(result.breakdown.context.score).toBeGreaterThan(10);
  });

  it("tidak memberi skor tinggi pada daftar kata kunci acak", () => {
    const prompt = "tutor, mentor, guru, jelaskan, bandingkan, tabel, contoh, looping, verifikasi, mahasiswa";
    const result = evaluatePrompt(prompt);
    expect(result.total_score).toBeLessThan(45);
  });

  it("membatasi skor total pada rentang 0 sampai 100", () => {
    const result = evaluatePrompt("Bertindaklah sebagai tutor pemrograman. Jelaskan looping.");
    expect(result.total_score).toBeGreaterThanOrEqual(0);
    expect(result.total_score).toBeLessThanOrEqual(100);
    const sum = Object.values(result.breakdown).reduce((a, b) => a + b.score, 0);
    expect(sum).toBe(result.total_score);
  });

  it("mengenali istilah bahasa Indonesia dan Inggris", () => {
    const result = evaluatePrompt("Act as a programming tutor. Explain for and while loops step by step with code examples in simple language.");
    expect(result.breakdown.persona.score).toBeGreaterThan(0);
    expect(result.breakdown.task.score).toBeGreaterThan(0);
    expect(result.breakdown.examples.score).toBeGreaterThan(0);
  });
});
