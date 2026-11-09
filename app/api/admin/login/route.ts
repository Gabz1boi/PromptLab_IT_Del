import { NextRequest, NextResponse } from "next/server";
import { createAdminToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    return NextResponse.json({ error: "ADMIN_PASSWORD belum diatur pada environment." }, { status: 503 });
  }

  const body = await request.json();
  const password = typeof body.password === "string" ? body.password : "";

  if (password.length !== configuredPassword.length || password !== configuredPassword) {
    return NextResponse.json({ error: "Kata sandi admin tidak sesuai." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("promptlab_admin", createAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
