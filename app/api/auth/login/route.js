import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // 🛡️ Sadece Ortam Değişkenlerinden (Environment Variables) Güvenli Okuma
    // KOD İÇERİSİNDE HİÇBİR SABİT ŞİFRE/YEDEK DEĞER BULUNMAZ
    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    // Sunucu yapılandırması eksikse güvenlik için işlemi durdur
    if (!envUser || !envPass || !jwtSecret) {
      console.error(
        "GÜVENLİK UYARISI: .env içerisinde ADMIN_USERNAME, ADMIN_PASSWORD veya JWT_SECRET eksik!",
      );
      return NextResponse.json(
        { success: false, error: "Sunucu güvenlik yapılandırması eksik." },
        { status: 500 },
      );
    }

    // Doğrulama
    if (username === envUser && password === envPass) {
      const response = NextResponse.json({
        success: true,
        message: "Giriş başarılı",
      });

      // 🛡️ Tarayıcı JavaScript'inin erişemediği HttpOnly Cookie tanımla (KVKK & XSS Koruması)
      response.cookies.set("session_token", jwtSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 Gün
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Kullanıcı adı veya şifre hatalı!" },
      { status: 401 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Giriş işlemi sırasında sunucu hatası oluştu." },
      { status: 500 },
    );
  }
}
