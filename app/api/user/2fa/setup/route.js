import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getSiteConfig } from "@/lib/siteConfig";

export async function POST() {
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
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Oturum bulunamadı." },
        { status: 401 },
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Oturum süreniz dolmuş, lütfen tekrar giriş yapın.",
        },
        { status: 401 },
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    // 🔑 Speakeasy ile base32 formatında Tam Uyumlu Secret üretimi
    const site = getSiteConfig();
    const secret = speakeasy.generateSecret({
      name: `${site.isletmeAdi} (${user.email || user.username})`,
      issuer: site.isletmeAdi,
    });

    // 🔒 Speakeasy'nin doğrulayabilmesi için base32 formatındaki string'i veritabanına kaydediyoruz
    user.twoFactorSecret = secret.base32;
    await user.save();

    // QR Kodu Google Authenticator için Data URL formatına çevirme
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return NextResponse.json({
      success: true,
      qrCodeUrl,
      secret: secret.base32,
    });
  } catch (error) {
    console.error("2FA Setup API Hatası:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
