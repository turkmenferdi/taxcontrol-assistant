import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, name, role } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email ve şifre gereklidir." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu email zaten kayıtlı." }, { status: 409 });
  }

  const userRole = role === "accountant" ? "accountant" : "owner";
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash, name, role: userRole } });
  const token = await createSession(user.id);

  const cookieOpts = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  };
  const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
  res.cookies.set("session", token, { ...cookieOpts, httpOnly: true });
  res.cookies.set("userRole", user.role, cookieOpts);
  return res;
}
