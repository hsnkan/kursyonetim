import { NextResponse } from "next/server";

export function middleware(request) {
  const sessionToken = request.cookies.get("session_token")?.value;
  const { pathname } = request.nextUrl;

  // 🛡️ 1. ARAYÜZ KORUMASI: Giriş yapmamış kullanıcıyı /dashboard sayfalarından login'e (/) at
  if (pathname.startsWith("/dashboard") && !sessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 🛡️ 2. API KORUMASI: Giriş yapmamış kullanıcının yetkisiz API isteklerini reddet (Auth API haricinde)
  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth") &&
    !sessionToken
  ) {
    return NextResponse.json(
      { success: false, error: "Yetkisiz erişim! Lütfen giriş yapın." },
      { status: 401 },
    );
  }

  // 🛡️ 3. Zaten giriş yapmış kullanıcı tekrar Login (/) sayfasına giderse panele at
  if (pathname === "/" && sessionToken) {
    return NextResponse.redirect(
      new URL("/dashboard/yoklama/nfc", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/"],
};
