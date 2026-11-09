import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluatePrompt } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("promptlab_session")?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Sesi peserta tidak ditemukan. Muat ulang halaman." }, { status: 401 });
    }

    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (prompt.length < 20) {
      return NextResponse.json({ error: "Prompt terlalu singkat. Tulis setidaknya 20 karakter agar dapat dievaluasi." }, { status: 400 });
    }
    if (prompt.length > 5000) {
      return NextResponse.json({ error: "Prompt maksimal 5.000 karakter." }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({ where: { sessionId } });
    if (!participant) {
      return NextResponse.json({ error: "Sesi peserta tidak valid. Muat ulang halaman." }, { status: 401 });
    }

    const evaluation = evaluatePrompt(prompt);

    const saved = await prisma.$transaction(async (tx) => {
      const increment = await tx.participant.updateMany({
        where: { id: participant.id, attemptCount: { lt: 4 } },
        data: { attemptCount: { increment: 1 } }
      });

      if (increment.count !== 1) {
        throw new Error("BATAS_PERCOBAAN");
      }

      const updatedParticipant = await tx.participant.findUniqueOrThrow({
        where: { id: participant.id }
      });
      const attemptNumber = updatedParticipant.attemptCount;
      const result = {
        ...evaluation,
        attempt: attemptNumber
      };

      return tx.attempt.create({
        data: {
          participantId: participant.id,
          attemptNumber,
          promptText: prompt,
          totalScore: evaluation.total_score,
          evaluationLevel: evaluation.evaluation_level,
          rubricBreakdown: JSON.stringify(evaluation.breakdown),
          feedback: JSON.stringify(result)
        }
      });
    });

    return NextResponse.json({
      id: saved.id,
      attempt_number: saved.attemptNumber,
      prompt_text: saved.promptText,
      total_score: saved.totalScore,
      evaluation_level: saved.evaluationLevel,
      ...JSON.parse(saved.feedback),
      created_at: saved.createdAt
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BATAS_PERCOBAAN") {
      return NextResponse.json({ error: "Batas empat percobaan sudah tercapai." }, { status: 429 });
    }
    console.error("Gagal mengevaluasi prompt:", error);
    return NextResponse.json({ error: "Evaluasi gagal disimpan. Periksa koneksi lalu coba lagi." }, { status: 500 });
  }
}
