import { NextRequest, NextResponse } from "next/server";

const OWNER_ONLY_PATHS = ["/dashboard", "/gelen-faturalar", "/giden-faturalar", "/riskli-giderler", "/kdv-ozeti", "/gecici-vergi", "/raporlar"];
const ACCOUNTANT_ONLY_PATHS = ["/muhasebeci", "/musteri-yonetimi", "/takvim"];
const PUBLIC_PATHS = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("session")?.value;
  const userRole = req.cookies.get("userRole")?.value ?? "owner";

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    if (session) {
      return NextResponse.redirect(new URL(userRole === "accountant" ? "/muhasebeci" : "/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (userRole === "accountant" && OWNER_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/muhasebeci", req.url));
  }

  if (userRole === "owner" && ACCOUNTANT_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/gelen-faturalar",
    "/giden-faturalar",
    "/riskli-giderler",
    "/kdv-ozeti",
    "/gecici-vergi",
    "/raporlar",
    "/ayarlar",
    "/muhasebeci/:path*",
    "/musteri-yonetimi",
    "/takvim",
    "/login",
  ],
};
