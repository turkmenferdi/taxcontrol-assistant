import { NextRequest, NextResponse } from "next/server";

const OWNER_ONLY_PATHS = ["/dashboard", "/gelen-faturalar", "/giden-faturalar", "/riskli-giderler", "/kdv-ozeti", "/gecici-vergi", "/raporlar"];
const ACCOUNTANT_ONLY_PATHS = ["/muhasebeci", "/musteri-yonetimi", "/takvim"];
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/register"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const session = req.cookies.get("session")?.value;
    if (session) {
      const userRole = req.cookies.get("userRole")?.value ?? "owner";
      return NextResponse.redirect(new URL(userRole === "accountant" ? "/muhasebeci" : "/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) return NextResponse.next();
  if (pathname.startsWith("/_next/") || pathname === "/favicon.ico") return NextResponse.next();

  const session = req.cookies.get("session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const userRole = req.cookies.get("userRole")?.value ?? "owner";

  if (userRole === "accountant" && OWNER_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/muhasebeci", req.url));
  }

  if (userRole === "owner" && ACCOUNTANT_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
