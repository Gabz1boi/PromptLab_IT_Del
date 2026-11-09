import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    let sessionId = request.cookies.get("promptlab_session")?.value;
    let isNew = false;

    if (!sessionId) {
      sessionId = randomUUID();
      isNew = true;
    }

    let participant = await prisma.participant.findUnique({
      where: { sessionId },
      include: { attempts: { orderBy: { attemptNumber: "asc" } } }
    });

    if (!participant) {
      participant = await prisma.participant.create({
        data: { sessionId },
        include: { attempts: true }
      });
      isNew = true;
    }

    const response = NextResponse.json({
      participant_id: participant.id,
      attempts_used: participant.attemptCount,
      max_attempts: 4,
      attempts: participant.attempts.map((a) => ({
        id: a.id,
        attempt_number: a.attemptNumber,
        prompt_text: a.promptText,
        total_score: a.totalScore,
        evaluation_level: a.evaluationLevel,
        rubric_breakdown: JSON.parse(a.rubricBreakdown),
        feedback: JSON.parse(a.feedback),
        created_at: a.createdAt
      }))
    });

    if (isNew) {
      response.cookies.set("promptlab_session", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14
      });
    }

    return response;
  } catch (error) {
    console.error("Gagal memuat sesi:", error);
    return NextResponse.json({ error: "Sesi belum dapat dimuat. Coba muat ulang halaman." }, { status: 500 });
  }
}
