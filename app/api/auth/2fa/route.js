import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import { getBrandingBySalonId } from "@/lib/branding";

export async function POST(request) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    const { tempToken, code, deviceId, remember30Days } = await request.json();

    if (!tempToken || !code) {
      return NextResponse.json(
        { success: false, error: "Token ve doğrulama kodu zorunludur." },
        { status: 400 },
      );
    }

    // 1. Temp Token Doğrulama
    let decoded;
    try {
      decoded = jwt.verify(tempToken, jwtSecret);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Oturum süresi doldu. Lütfen tekrar giriş yapın.",
        },
        { status: 401 },
      );
    }

    if (decoded.step !== "2fa_pending") {
      return NextResponse.json(
        { success: false, error: "Geçersiz doğrulama adımı." },
        { status: 400 },
      );
    }

    await dbConnect();

    // 2. Kullanıcıyı Bulma (Hem ID hem Email ile garantiye alıyoruz)
    const user = await User.findById(decoded.userId).select(
      "+twoFactorSecret +trustedDevices",
    );

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı veya 2FA anahtarı bulunamadı." },
        { status: 404 },
      );
    }

    // 3. 6 Haneli Kodu Doğrulama (TOTP)
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code.trim(),
      window: 1, // Zaman kaymaları için 30 sn esneklik
    });

    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          error: "Girdiğiniz 2FA kodu hatalı veya süresi dolmuş.",
        },
        { status: 400 },
      );
    }

    // 4. 30 Günlük Güvenli Cihaz Kaydı (Seçildiyse)
    if (remember30Days && deviceId) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      user.trustedDevices = user.trustedDevices || [];
      user.trustedDevices.push({ deviceId, expiresAt });
      await user.save();
    }

    // 5. Oturum Token'ı (Session Token) Oluşturma
    const branding = user?.salonId
      ? await getBrandingBySalonId(user.salonId)
      : null;

    const sessionToken = jwt.sign(
      {
        userId: user._id,
        adSoyad: user.adSoyad,
        email: user.email,
        rol: user.rol || "salon_yoneticisi",
        salonId: user?.salonId ? String(user.salonId) : null,
        salonAdi: branding?.salonAdi || user.salonAdi,
      },
      jwtSecret,
      { expiresIn: "7d" },
    );

    const response = NextResponse.json({
      success: true,
      message: "Doğrulama başarılı",
      redirectTo: "/dashboard/yoklama/nfc",
    });

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("2FA API Hata:", error);
    return NextResponse.json(
      { success: false, error: "Doğrulama sırasında sunucu hatası oluştu." },
      { status: 500 },
    );
  }
}
