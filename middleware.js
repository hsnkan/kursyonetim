import { NextResponse } from "next/server";

// Edge Runtime uyumlu basit JWT payload decode fonksiyonu
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request) {
  const sessionToken = request.cookies.get("session_token")?.value;
  const { pathname } = request.nextUrl;

  const payload = sessionToken ? decodeJwtPayload(sessionToken) : null;
  const userRole = payload?.rol;
  const tokenExpired =
    payload?.exp && payload.exp * 1000 < Date.now();
  const validSession = sessionToken && payload && !tokenExpired;

  // Hedef yönlendirme adresi: Developer ise admin paneli, Müşteri ise dashboard
  const defaultRedirectPath =
    userRole === "developer" ? "/admin/kullanicilar" : "/dashboard/yoklama/nfc";

  // 1. KÖK DİZİN (/) KONTROLÜ
  if (pathname === "/") {
    if (validSession) {
      return NextResponse.redirect(new URL(defaultRedirectPath, request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 👑 2. GELİŞTİRİCİ PANELİ KORUMASI: Sadece 'developer' rolü girebilir
  if (pathname.startsWith("/admin")) {
    if (!validSession || userRole !== "developer") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // 🛡️ 3. MÜŞTERİ / SALON YÖNETİCİSİ PANEL KORUMASI
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/ogrenciler") ||
    pathname.startsWith("/muhasebe");

  if (isProtectedPage && !validSession) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 🛡️ 4. API KORUMASI: /api/auth, /api/cron ve /api/admin/verify-pin muaf tutuldu
  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/cron") &&
    !validSession
  ) {
    return NextResponse.json(
      { success: false, error: "Yetkisiz erişim! Lütfen giriş yapın." },
      { status: 401 },
    );
  }

  // 🛡️ 5. ZATEN GİRİŞ YAPMIŞ KULLANICI /auth/login'E GİDERSE
  // Kullanıcı açıkça login sayfasına giriyorsa ve aktif oturumu varsa ilgili paneline yönlendirilir
  if (pathname === "/auth/login" && validSession) {
    return NextResponse.redirect(new URL(defaultRedirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/ogrenciler/:path*",
    "/muhasebe/:path*",
    "/api/:path*",
    "/",
    "/auth/login",
  ],
};
