import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyAdminToken(request.cookies.get("promptlab_admin")?.value)) {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 401 });
  }

  const participants = await prisma.participant.findMany({
    include: { attempts: { orderBy: { attemptNumber: "asc" } } },
    orderBy: { createdAt: "desc" }
  });

  const rows = participants.map((p) => {
    const first = p.attempts[0];
    const last = p.attempts[p.attempts.length - 1];
    return {
      participant_id: p.id,
      created_at: p.createdAt,
      attempts_used: p.attemptCount,
      initial_score: first?.totalScore ?? null,
      final_score: last?.totalScore ?? null,
      improvement: first && last ? last.totalScore - first.totalScore : null,
      attempts: p.attempts.map((a) => ({
        attempt_number: a.attemptNumber,
        score: a.totalScore,
        prompt_text: a.promptText,
        created_at: a.createdAt,
        feedback: JSON.parse(a.feedback)
      }))
    };
  });

  return NextResponse.json({
    participant_count: participants.length,
    submission_count: participants.reduce((sum, p) => sum + p.attemptCount, 0),
    participants: rows
  });
}
