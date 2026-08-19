import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(request) {
  try {
    // 🛡️ Güvenlik Kontrolü: Ortam değişkeni tanımlı değilse işlemi durdurur
    if (!process.env.JWT_SECRET) {
      console.error(
        "CRITICAL ERROR: JWT_SECRET environment variable is missing!",
      );
      return NextResponse.json(
        { success: false, error: "Sunucu güvenlik yapılandırması eksik." },
        { status: 500 },
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    await dbConnect();

    // 1. Session Token Okuma
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Oturum çerezi bulunamadı. Lütfen tekrar giriş yapın.",
        },
        { status: 401 },
      );
    }

    // 2. Body Okuma ve Gelen Kodu Temizleme
    const body = await request.json();
    let rawCode = body.code || body.twoFactorCode || "";
    const code = String(rawCode).replace(/\s+/g, "").trim();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Lütfen 6 haneli kodu eksiksiz giriniz." },
        { status: 400 },
      );
    }

    // 3. JWT Doğrulama
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, error: "Geçersiz veya süresi dolmuş oturum." },
        { status: 401 },
      );
    }

    // 4. Kullanıcıyı Gizli Anahtarıyla Birlikte Çekme
    const user = await User.findById(decoded.userId).select(
      "+twoFactorSecret +twoFactorEnabled",
    );

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Kurulum anahtarı bulunamadı. QR kodunu tekrar üretin.",
        },
        { status: 400 },
      );
    }

    // 5. Speakeasy İle TOTP Kodunu Doğrulama (window: 2 esnekliği)
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 2,
    });

    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Girdiğiniz 6 haneli kod hatalı veya süresi dolmuş! Lütfen yeni kodu bekleyip tekrar deneyin.",
        },
        { status: 400 },
      );
    }

    // 6. Veritabanında 2FA'yı Aktifleştirme
    user.twoFactorEnabled = true;
    await user.save();

    console.log("✅ 2FA VERİTABANINDA AKTİFLEŞTİRİLDİ:", user.email);

    return NextResponse.json({
      success: true,
      message: "🎉 Google Authenticator başarıyla aktifleştirildi!",
    });
  } catch (error) {
    console.error("2FA Verify Hata Detayı:", error);
    return NextResponse.json(
      { success: false, error: "Sunucu hatası: " + error.message },
      { status: 500 },
    );
  }
}
