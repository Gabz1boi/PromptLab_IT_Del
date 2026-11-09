"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, Users, FileText, TrendingUp, RefreshCw, Download, ShieldCheck } from "lucide-react";

type Participant = {
  participant_id: string;
  attempts_used: number;
  initial_score: number | null;
  final_score: number | null;
  improvement: number | null;
  attempts: { attempt_number: number; score: number; prompt_text: string; created_at: string }[];
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<{ participant_count: number; submission_count: number; participants: Participant[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadResults() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/results");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Tidak dapat memuat hasil.");
      setData(d);
      setLoggedIn(true);
    } catch (e) {
      setLoggedIn(false);
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Login gagal.");
      await loadResults();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadResults(); }, []);

  function downloadCsv() {
    if (!data) return;
    const rows = [["ID Peserta", "Percobaan", "Skor Awal", "Skor Terakhir", "Perubahan"]];
    data.participants.forEach((p) => rows.push([p.participant_id, String(p.attempts_used), String(p.initial_score ?? ""), String(p.final_score ?? ""), String(p.improvement ?? "")]));
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "promptlab-hasil-peserta.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-shell">
      <header className="topbar"><a className="brand" href="/"><span className="brand-mark">✦</span><span>Prompt<span className="brand-blue">Lab</span></span><span className="brand-tag">ADMIN</span></a><a className="admin-link" href="/">Kembali ke aplikasi</a></header>
      <div className="admin-wrap">
        {!loggedIn ? (
          <div className="login-card">
            <div className="login-icon"><LockKeyhole size={25} /></div>
            <span className="step-label">AREA PENYELENGGARA</span>
            <h1>Dashboard Admin</h1>
            <p>Masukkan kata sandi admin untuk melihat rekap peserta dan hasil latihan.</p>
            <form onSubmit={login}><label>Kata sandi admin</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" required /><button className="btn-primary full" disabled={loading}>{loading ? "Memeriksa..." : "Masuk Dashboard"}</button></form>
            {error && <div className="inline-error"><LockKeyhole size={15} /> {error}</div>}
            <small><ShieldCheck size={14} /> Hasil peserta hanya tersedia untuk admin.</small>
          </div>
        ) : (
          <>
            <div className="admin-heading"><div><span className="step-label">RINGKASAN EVENT 2</span><h1>Dashboard Peserta</h1><p>Pantau partisipasi dan perkembangan skor peserta PromptLab.</p></div><button className="btn-secondary" onClick={loadResults}><RefreshCw size={16} /> Perbarui data</button></div>
            <div className="admin-stats">
              <div><Users size={19} /><span>Jumlah peserta</span><strong>{data?.participant_count ?? 0}</strong></div>
              <div><FileText size={19} /><span>Total pengumpulan</span><strong>{data?.submission_count ?? 0}</strong></div>
              <div><TrendingUp size={19} /><span>Rata-rata skor akhir</span><strong>{data?.participants.length ? Math.round(data.participants.reduce((s, p) => s + (p.final_score ?? 0), 0) / data.participants.filter(p => p.final_score !== null).length || 0) : 0}</strong></div>
            </div>
            <div className="admin-table-card">
              <div className="card-heading"><div><span className="side-label">DATA PESERTA</span><h3>Rekap hasil latihan</h3></div><button className="btn-primary small" onClick={downloadCsv}><Download size={15} /> Ekspor CSV</button></div>
              <div className="table-scroll"><table><thead><tr><th>Peserta (ID anonim)</th><th>Percobaan</th><th>Skor awal</th><th>Skor akhir</th><th>Perubahan</th></tr></thead><tbody>
                {data?.participants.map((p) => <tr key={p.participant_id}><td><span className="participant-id">{p.participant_id.slice(0, 12)}…</span></td><td>{p.attempts_used}/4</td><td>{p.initial_score ?? "—"}</td><td><b>{p.final_score ?? "—"}</b></td><td className={p.improvement !== null && p.improvement >= 0 ? "positive-number" : "negative-number"}>{p.improvement === null ? "—" : `${p.improvement > 0 ? "+" : ""}${p.improvement}`}</td></tr>)}
                {!data?.participants.length && <tr><td colSpan={5} className="empty-table">Belum ada peserta yang mengirim prompt.</td></tr>}
              </tbody></table></div>
              <p className="table-note">ID peserta dibuat otomatis. Aplikasi tidak meminta nama, email, atau nomor identitas mahasiswa.</p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
