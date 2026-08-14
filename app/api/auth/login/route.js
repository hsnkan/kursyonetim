import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Environment değişkenlerinden veya varsayılandan güvenli doğrula
    const envUser = process.env.ADMIN_USERNAME || "admin";
    const envPass = process.env.ADMIN_PASSWORD || "balans123";

    if (username === envUser && password === envPass) {
      const response = NextResponse.json({
        success: true,
        message: "Giriş başarılı",
      });

      // 🛡️ Tarayıcı JavaScript'inin erişemediği HttpOnly Cookie tanımla
      response.cookies.set(
        "session_token",
        process.env.JWT_SECRET || "balans_oturum_token_2026",
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 Gün geçerli
        },
      );

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
