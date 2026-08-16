import { NextResponse } from "next/server";

export function middleware(request) {
  const sessionToken = request.cookies.get("session_token")?.value;
  const { pathname } = request.nextUrl;

  // 🛡️ 1. ARAYÜZ KORUMASI: Giriş yapmamış kullanıcıyı panellerden Login'e yönlendir
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/ogrenciler") ||
    pathname.startsWith("/muhasebe");

  if (isProtectedPage && !sessionToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 🛡️ 2. API KORUMASI: Giriş yapmamış kullanıcının yetkisiz API isteklerini engelle
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

  // 🛡️ 3. Zaten giriş yapmış kullanıcı tekrar Login sayfasına giderse Panele at
  const isLoginPage = pathname === "/" || pathname === "/auth/login";
  if (isLoginPage && sessionToken) {
    return NextResponse.redirect(
      new URL("/dashboard/yoklama/nfc", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ogrenciler/:path*",
    "/muhasebe/:path*",
    "/api/:path*",
    "/",
    "/auth/login",
  ],
};
