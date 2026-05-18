import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email ve şifre gereklidir." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Geçersiz email veya şifre." }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Geçersiz email veya şifre." }, { status: 401 });
  }

  const token = await createSession(user.id);

  const cookieOpts = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  };
  const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  res.cookies.set("session", token, { ...cookieOpts, httpOnly: true });
  res.cookies.set("userRole", user.role, cookieOpts);
  return res;
}
