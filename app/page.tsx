"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight, ArrowLeft, Sparkles, BookOpen, Target,
  RotateCcw, CheckCircle2, AlertCircle, Lightbulb, Copy, Trophy,
  Clock3, ShieldCheck, ChevronRight
} from "lucide-react";

type Attempt = {
  id: string;
  attempt_number: number;
  prompt_text: string;
  total_score: number;
  evaluation_level: string;
  breakdown: Record<string, { score: number; max: number; label: string }>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  evidence: string[];
  rubric_details?: { key: string; label: string; score: number; max: number; criteria: { id: string; label: string; score: number; max: number; evidence: string[] }[] }[];
  created_at?: string;
};

const rubricOrder = [
  ["persona", "Persona"], ["task", "Task"], ["context", "Context"], ["format", "Format"],
  ["examples", "Examples"], ["constraints", "Constraints"], ["clarity", "Kejelasan"], ["responsible_ai", "AI Bertanggung Jawab"]
];

const levelText: Record<string, string> = {
  "Needs Major Improvement": "Perlu Banyak Perbaikan",
  "Basic Understanding": "Pemahaman Dasar",
  "Developing": "Sedang Berkembang",
  "Good": "Baik",
  "Excellent": "Sangat Baik"
};

function scoreColor(score: number) {
  if (score >= 90) return "green";
  if (score >= 75) return "blue";
  if (score >= 60) return "yellow";
  return "red";
}

export default function Home() {
  const [step, setStep] = useState<"home" | "case" | "editor" | "result" | "summary">("home");
  const [prompt, setPrompt] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [latest, setLatest] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then(async (r) => {
        if (!r.ok) throw new Error("Sesi tidak dapat dimuat.");
        return r.json();
      })
      .then((data) => {
        const restored = (data.attempts || []).map((a: any) => ({
          ...a,
          ...a.feedback,
          breakdown: a.rubric_breakdown || a.feedback?.breakdown
        }));
        setAttempts(restored);
        if (restored.length) {
          setLatest(restored[restored.length - 1]);
          setPrompt(restored[restored.length - 1].prompt_text);
        }
        setSessionReady(true);
      })
      .catch(() => {
        setError("Tidak dapat menghubungkan aplikasi ke server. Muat ulang halaman.");
        setSessionReady(true);
      });
  }, []);

  const used = attempts.length;
  const remaining = Math.max(0, 4 - used);
  const first = attempts[0];
  const last = attempts[attempts.length - 1];
  const improvement = first && last ? last.total_score - first.total_score : 0;

  const scoreColorClass = (score: number) => `score-${scoreColor(score)}`;

  async function submitPrompt() {
    setError("");
    if (prompt.trim().length < 20) {
      setError("Tulis prompt minimal 20 karakter agar dapat dievaluasi.");
      return;
    }
    if (used >= 4) {
      setError("Kamu sudah menyelesaikan empat percobaan.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Evaluasi gagal.");
      const item: Attempt = {
        ...data,
        breakdown: data.breakdown,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        suggestions: data.suggestions || [],
        evidence: data.evidence || []
      };
      setAttempts((old) => [...old, item]);
      setLatest(item);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  function startEditing() {
    setError("");
    setStep("editor");
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Browser tidak mengizinkan penyalinan otomatis. Pilih teks lalu salin secara manual.");
    }
  }

  if (!sessionReady) {
    return <main className="loading-screen"><div className="loader" /><p>Menyiapkan ruang latihan...</p></main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); setStep("home"); }}>
          <span className="brand-mark"><Sparkles size={19} /></span>
          <span>Prompt<span className="brand-blue">Lab</span></span>
          <span className="brand-tag">IT DEL</span>
        </a>
        <div className="topbar-right">
          <span className="event-pill"><span className="status-dot" /> EVENT 2 · GSA</span>
          <a className="admin-link" href="/admin">Admin</a>
        </div>
      </header>

      <div className="page-wrap">
        {step === "home" && (
          <section className="hero-section">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> WORKSHOP PROMPT ENGINEERING</div>
              <h1>Tulis prompt lebih baik.<br /><span>Belajar lebih cerdas.</span></h1>
              <p className="hero-desc">Latih kemampuan memberi instruksi kepada Google Gemini melalui tantangan nyata, evaluasi langsung, dan perbaikan bertahap.</p>
              <div className="hero-actions">
                <button className="btn-primary" onClick={() => setStep("case")}>Mulai Tantangan <ArrowRight size={18} /></button>
                <span className="small-note"><ShieldCheck size={15} /> Tanpa API key · Penilaian otomatis</span>
              </div>
              <div className="hero-stats">
                <div><strong>4</strong><span>Kesempatan</span></div>
                <div><strong>100</strong><span>Skor maksimal</span></div>
                <div><strong>8</strong><span>Dimensi penilaian</span></div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="visual-glow" />
              <div className="floating-card card-top"><span className="mini-icon blue"><Target size={17} /></span><div><b>Prompt yang terarah</b><small>Persona · Task · Context · Format</small></div></div>
              <div className="prompt-window">
                <div className="window-bar"><i /><i /><i /><span>promptlab.workspace</span></div>
                <div className="window-content">
                  <span className="code-label">YOUR PROMPT</span>
                  <div className="fake-line long" /><div className="fake-line medium" /><div className="fake-line short" />
                  <div className="window-tags"><span>Persona</span><span>Task</span><span>Context</span></div>
                  <div className="score-preview"><div><small>PREVIEW SCORE</small><strong>--<small>/100</small></strong></div><div className="score-ring"><Sparkles size={21} /></div></div>
                </div>
              </div>
              <div className="floating-card card-bottom"><span className="mini-icon green"><CheckCircle2 size={17} /></span><div><b>Perbaiki dan ulangi</b><small>Feedback untuk setiap percobaan</small></div></div>
            </div>
          </section>
        )}

        {step === "case" && (
          <section className="content-section">
            <button className="back-link" onClick={() => setStep("home")}><ArrowLeft size={16} /> Kembali</button>
            <div className="section-heading"><span className="step-label">TAHAP 01 · BACA KASUS</span><h1>Tantanganmu dimulai di sini.</h1><p>Baca situasinya. Setelah itu, susun prompt versimu sendiri.</p></div>
            <div className="case-card">
              <div className="case-top"><div className="case-icon"><BookOpen size={22} /></div><div><span className="case-kicker">STUDI KASUS 01</span><h2>Mahasiswa Baru yang Kesulitan Memahami Pemrograman</h2></div><span className="case-number">01</span></div>
              <p>Kamu adalah mahasiswa semester pertama Sistem Informasi. Kamu akan menghadapi kuis pemrograman, tetapi masih bingung memahami konsep <b>perulangan (looping)</b>, terutama perbedaan antara <b>for, while, dan do-while</b>.</p>
              <p>Kamu ingin memahami cara kerja setiap jenis perulangan, kapan masing-masing digunakan, serta bagaimana menerapkannya melalui contoh pemrograman sederhana.</p>
              <div className="challenge-box"><Target size={19} /><div><b>Tantangan</b><span>Buat prompt yang mengarahkan Google Gemini untuk berperan sebagai tutor pemrograman pribadi dan membantumu memahami topik tersebut secara efektif.</span></div></div>
              <div className="case-footer"><span><Clock3 size={15} /> 4 percobaan tersedia</span><span><ShieldCheck size={15} /> Tidak perlu API key</span></div>
            </div>
            <div className="bottom-action"><span>Semua peserta mengerjakan kasus yang sama.</span><button className="btn-primary" onClick={() => setStep("editor")}>Saya Paham, Mulai Menulis <ArrowRight size={18} /></button></div>
          </section>
        )}

        {step === "editor" && (
          <section className="content-section">
            <button className="back-link" onClick={() => setStep(used ? "result" : "case")}><ArrowLeft size={16} /> Kembali</button>
            <div className="section-heading"><span className="step-label">TAHAP 02 · RUANG MENULIS</span><h1>Susun prompt terbaikmu.</h1><p>Gunakan kerangka PTCF. Kamu tetap menentukan sendiri kata-kata dan instruksinya.</p></div>
            <div className="editor-layout">
              <aside className="editor-side">
                <div className="side-card">
                  <span className="side-label">KASUS AKTIF</span><h3>Tutor Pemrograman</h3><p>Bantu mahasiswa pemula memahami perulangan for, while, dan do-while.</p>
                  <button className="text-button" onClick={() => setStep("case")}>Baca ulang kasus <ChevronRight size={15} /></button>
                </div>
                <div className="side-card">
                  <span className="side-label">PANDUAN PTCF</span>
                  <div className="ptcf-list">
                    <div><b className="ptcf-letter p">P</b><span><strong>Persona</strong><small>AI berperan sebagai siapa?</small></span></div>
                    <div><b className="ptcf-letter t">T</b><span><strong>Task</strong><small>Apa tugas yang harus dilakukan?</small></span></div>
                    <div><b className="ptcf-letter c">C</b><span><strong>Context</strong><small>Apa latar belakangmu?</small></span></div>
                    <div><b className="ptcf-letter f">F</b><span><strong>Format</strong><small>Bagaimana hasil disajikan?</small></span></div>
                  </div>
                  <div className="side-extra"><b>Tambahkan bila relevan</b><span>Examples · Constraints · Verifikasi</span></div>
                </div>
              </aside>
              <div className="editor-main">
                <div className="editor-card">
                  <div className="editor-card-head"><div><span className="side-label">PROMPT EDITOR</span><h3>{used === 0 ? "Percobaan pertama" : `Revisi percobaan ${used + 1}`}</h3></div><span className="attempt-chip">Percobaan {used + 1}/4</span></div>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={5000} placeholder="Contoh awal: Bertindaklah sebagai tutor pemrograman yang sabar...

Tuliskan prompt dengan bahasamu sendiri. Jelaskan peran AI, tugas, konteks, dan format jawaban yang kamu inginkan." />
                  <div className="editor-meta"><span>{prompt.length.toLocaleString("id-ID")} / 5.000 karakter</span><button className="text-button muted" onClick={() => setPrompt("")}><RotateCcw size={14} /> Hapus teks</button></div>
                  {error && <div className="inline-error"><AlertCircle size={16} /> {error}</div>}
                  <div className="editor-actions"><span className="privacy-note"><ShieldCheck size={15} /> Prompt hanya dapat dilihat oleh pemilik sesi dan admin.</span><button className="btn-primary" disabled={loading || used >= 4} onClick={submitPrompt}>{loading ? <><span className="button-spinner" /> Menilai...</> : <>Nilai Prompt <Sparkles size={17} /></>}</button></div>
                </div>
                <div className="hint-box"><Lightbulb size={17} /><p><b>Ingat:</b> prompt yang baik bukan yang paling panjang. Buat instruksi jelas, relevan, dan dapat ditindaklanjuti.</p></div>
              </div>
            </div>
          </section>
        )}

        {step === "result" && latest && (
          <section className="content-section">
            <button className="back-link" onClick={() => setStep("editor")}><ArrowLeft size={16} /> Kembali ke editor</button>
            <div className="section-heading"><span className="step-label">TAHAP 03 · HASIL EVALUASI</span><h1>Ini hasil prompt-mu.</h1><p>Pahami alasan di balik skor, lalu tentukan bagian yang ingin kamu perbaiki.</p></div>
            <div className="result-overview">
              <div className={`score-card ${scoreColorClass(latest.total_score)}`}>
                <span className="side-label">SKOR PERCOBAAN {latest.attempt_number || used}</span>
                <div className="big-score">{latest.total_score}<small>/100</small></div>
                <span className="level-badge">{levelText[latest.evaluation_level] || latest.evaluation_level}</span>
                <div className="score-track"><span style={{ width: `${latest.total_score}%` }} /></div>
                <small className="score-caption">Skor dihitung dari delapan dimensi rubrik.</small>
              </div>
              <div className="breakdown-card">
                <div className="card-heading"><div><span className="side-label">RINCIAN NILAI</span><h3>Delapan dimensi penilaian</h3></div><span className="tiny-tag">Total 100 poin</span></div>
                <div className="rubric-bars">
                  {rubricOrder.map(([key, label]) => {
                    const item = latest.breakdown?.[key];
                    if (!item) return null;
                    const pct = item.max ? item.score / item.max * 100 : 0;
                    return <div className="rubric-row" key={key}><div className="rubric-label"><span>{label}</span><b>{item.score}<small>/{item.max}</small></b></div><div className="bar-bg"><span style={{ width: `${pct}%` }} /></div></div>;
                  })}
                </div>
              </div>
            </div>
            <div className="feedback-grid">
              <div className="feedback-card positive"><div className="feedback-title"><CheckCircle2 size={19} /><h3>Yang sudah baik</h3></div>{latest.strengths?.length ? <ul>{latest.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p>Belum ada komponen yang memenuhi kriteria penuh. Periksa rekomendasi perbaikan.</p>}</div>
              <div className="feedback-card needs"><div className="feedback-title"><AlertCircle size={19} /><h3>Yang perlu diperbaiki</h3></div>{latest.weaknesses?.length ? <ul>{latest.weaknesses.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p>Semua komponen utama sudah memenuhi kriteria yang diperiksa.</p>}</div>
              <div className="feedback-card suggestions"><div className="feedback-title"><Lightbulb size={19} /><h3>Saran berikutnya</h3></div>{latest.suggestions?.length ? <ul>{latest.suggestions.slice(0, 5).map((x, i) => <li key={i}>{x}</li>)}</ul> : <p>Pertahankan struktur prompt dan verifikasi hasil Gemini.</p>}</div>
            </div>
            <div className="evidence-card"><div className="card-heading"><div><span className="side-label">BUKTI YANG TERDETEKSI</span><h3>Frasa dari prompt-mu</h3></div></div>{latest.evidence?.length ? <div className="evidence-chips">{latest.evidence.map((x, i) => <span key={i}>{x}</span>)}</div> : <p className="muted-text">Belum ada frasa indikator yang terdeteksi.</p>}</div>
            <div className="attempt-history">
              <div className="card-heading"><div><span className="side-label">PERKEMBANGAN</span><h3>Riwayat skor</h3></div><span className="attempt-chip">{used}/4 percobaan</span></div>
              <div className="history-bars">{attempts.map((a) => <div className="history-item" key={a.id}><div className="history-value">{a.total_score}</div><div className="history-track"><span style={{ height: `${Math.max(5, a.total_score)}%` }} /></div><small>P{a.attempt_number}</small></div>)}</div>
              {used > 1 && <p className={`improvement-note ${improvement >= 0 ? "up" : "down"}`}>{improvement >= 0 ? `Naik ${improvement} poin` : `Turun ${Math.abs(improvement)} poin`} dari percobaan pertama.</p>}
            </div>
            <div className="bottom-action result-bottom"><span>{remaining > 0 ? `Masih ada ${remaining} kesempatan untuk memperbaiki prompt.` : "Semua percobaan telah digunakan."}</span><div className="action-group"><button className="btn-secondary" onClick={() => setStep("summary")}>Lihat Ringkasan</button>{remaining > 0 && <button className="btn-primary" onClick={startEditing}>Perbaiki Prompt <ArrowRight size={17} /></button>}</div></div>
          </section>
        )}

        {step === "summary" && (
          <section className="content-section">
            <div className="summary-hero"><div className="summary-trophy"><Trophy size={30} /></div><span className="step-label">RANGKUMAN PERJALANAN</span><h1>Proses belajarmu tercatat.</h1><p>Berikut perkembangan prompt dari percobaan pertama sampai yang terbaru.</p></div>
            <div className="summary-stats">
              <div><span>Skor awal</span><strong>{first?.total_score ?? "—"}</strong></div>
              <div><span>Skor terbaru</span><strong>{last?.total_score ?? "—"}</strong></div>
              <div><span>Perubahan skor</span><strong className={improvement >= 0 ? "positive-number" : "negative-number"}>{first ? `${improvement > 0 ? "+" : ""}${improvement}` : "—"}</strong></div>
            </div>
            <div className="summary-card"><div className="card-heading"><div><span className="side-label">PROMPT TERAKHIR</span><h3>Versi yang kamu hasilkan</h3></div><button className="btn-secondary small" onClick={() => last && copyText(last.prompt_text)}><Copy size={15} /> {copied ? "Tersalin" : "Salin prompt"}</button></div><pre>{last?.prompt_text || "Belum ada prompt."}</pre></div>
            <div className="summary-card"><div className="card-heading"><div><span className="side-label">REFLEKSI</span><h3>Apa yang dapat kamu pelajari?</h3></div></div><p className="reflection-text">Prompt yang efektif dibangun melalui instruksi yang jelas, konteks yang relevan, dan format hasil yang terarah. Gunakan feedback sebagai bahan untuk berpikir dan memperbaiki instruksi, bukan sekadar mengejar angka.</p><div className="summary-foot"><span><CheckCircle2 size={16} /> {used} percobaan tersimpan</span><button className="btn-primary" onClick={() => setStep("home")}>Kembali ke Beranda <ArrowRight size={17} /></button></div></div>
          </section>
        )}
      </div>

      <footer className="footer"><span>PromptLab IT Del</span><span>Latihan Prompt Engineering · Event 2 GSA</span><span>Gunakan AI secara kritis dan bertanggung jawab.</span></footer>
    </main>
  );
}
