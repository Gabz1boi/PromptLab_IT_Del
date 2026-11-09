import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  return process.env.ADMIN_SECRET || "development-only-change-this-secret";
}

export function createAdminToken() {
  const payload = "promptlab-admin";
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyAdminToken(token?: string) {
  if (!token) return false;
  const expected = createAdminToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
