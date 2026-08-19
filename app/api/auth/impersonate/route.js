import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { getBrandingBySalonId } from "@/lib/branding";

export async function POST(request) {
  try {
    // 🛡️ 1. Geliştirici PIN Kontrolü (İsteğin Yetkili Teknik Servisten Geldiğini Doğrula)
    const devPinHeader = request.headers.get("x-developer-pin");
    if (devPinHeader !== process.env.DEVELOPER_PIN) {
      return NextResponse.json(
        { success: false, error: "Geçersiz Geliştirici PIN Kodu!" },
        { status: 401 },
      );
    }

    // 🛡️ JWT Secret Kontrolü
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, error: "Sunucu güvenlik yapılandırması eksik." },
        { status: 500 },
      );
    }

    await dbConnect();
    const { targetUserId } = await request.json();

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Müşteri bulunamadı." },
        { status: 404 },
      );
    }

    // 🕒 2. Destek İzni Bitiş Tarihi Kontrolü
    const bugun = new Date();
    if (
      !targetUser.supportAccessGrantedUntil ||
      new Date(targetUser.supportAccessGrantedUntil) < bugun
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "❌ Müşteri henüz 3 saatlik destek erişim izni vermemiş veya verilen sürenin dolmuş olması sebebiyle erişim kilitlenmiştir!",
        },
        { status: 403 },
      );
    }

    const branding = targetUser?.salonId
      ? await getBrandingBySalonId(targetUser.salonId)
      : null;

    // 🎯 3. Impersonation Token Oluştur (3 Saat Geçerli)
    const supportSessionToken = jwt.sign(
      {
        userId: targetUser._id,
        adSoyad: `${targetUser.adSoyad} (Teknik Destek Oturumu)`,
        email: targetUser.email,
        rol: targetUser.rol,
        salonId: targetUser?.salonId ? String(targetUser.salonId) : null,
        salonAdi: branding?.salonAdi || targetUser.salonAdi,
        isSupportSession: true, // Destek Oturumu Rozeti İçin
      },
      jwtSecret,
      { expiresIn: "3h" }, // 3 Saatlik Oturum
    );

    const response = NextResponse.json({
      success: true,
      message: `Destek Oturumu Başlatıldı: ${targetUser.salonAdi}`,
    });

    response.cookies.set("session_token", supportSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 3, // 3 Saat (10.800 Saniye)
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Impersonate Hata:", error);
    return NextResponse.json(
      { success: false, error: "Destek oturumu başlatılamadı." },
      { status: 500 },
    );
  }
}
