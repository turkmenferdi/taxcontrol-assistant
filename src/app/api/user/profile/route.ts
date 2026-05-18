import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { user } = session;
  return NextResponse.json({ name: user.name, email: user.email, role: user.role });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { name, currentPassword, newPassword } = await req.json();
  const updates: Record<string, unknown> = {};

  if (name !== undefined) updates.name = name;

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Mevcut şifre gerekli" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Şifre en az 6 karakter olmalı" }, { status: 400 });
    updates.passwordHash = await hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  await prisma.user.update({ where: { id: session.user.id }, data: updates });
  return NextResponse.json({ ok: true });
}
