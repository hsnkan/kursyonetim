import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    // 🛡️ 1. OTURUM VE YETKİ KONTROLÜ
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen giriş yapın." },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);

    // Sadece 'developer' veya 'super_admin' rolüne izin verilir
    if (decoded.rol !== "developer" && decoded.rol !== "super_admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Bu işlemi yapmak için geliştirici yetkisi gereklidir.",
        },
        { status: 403 },
      );
    }

    // 📩 2. FRONTEND'DEN GELEN KULLANICI ID'SI
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Sıfırlanacak kullanıcı ID'si belirtilmelidir.",
        },
        { status: 400 },
      );
    }

    await dbConnect();

    // 🔓 3. YALNIZCA HEDEF KULLANICININ 2FA KİLİDİNİ SIFIRLAMA
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          trustedDevices: [],
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `🎉 ${updatedUser.adSoyad || updatedUser.email} kullanıcısının 2FA kilidi başarıyla sıfırlandı!`,
    });
  } catch (error) {
    console.error("2FA Sıfırlama Hata:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Sıfırlama işlemi sırasında sunucu hatası oluştu.",
      },
      { status: 500 },
    );
  }
}
