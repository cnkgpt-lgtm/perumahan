import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Halaman publik: tanpa login. /admin & API admin dijaga di tiap route via auth().
const PUBLIK = ["/api/auth", "/api/v1", "/api/gambar"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublik =
    pathname === "/" ||
    pathname.startsWith("/kabar") ||
    pathname.startsWith("/iuran") ||
    pathname.startsWith("/kas") ||
    pathname.startsWith("/kuitansi") ||
    pathname.startsWith("/bayar") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/masuk") ||
    PUBLIK.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";
  if (isPublik) return NextResponse.next();

  const token =
    req.cookies.get("__Secure-authjs.session-token")?.value ??
    req.cookies.get("authjs.session-token")?.value;

  if (!token) {
    const url = new URL("/masuk", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico)).*)"],
};
