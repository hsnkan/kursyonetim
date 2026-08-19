import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireRole } from "@/lib/auth";
import { calculateAdjustedLicenseEnd } from "@/lib/license";

export async function POST(request) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { userId } = body;
    const gunDegisimi = Number(body.gunDegisimi ?? body.eklenecekGun);

    if (!userId || !Number.isFinite(gunDegisimi) || gunDegisimi === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Kullanıcı ID ve gün değişimi zorunludur (pozitif: uzat, negatif: kısalt).",
        },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    const sonuc = calculateAdjustedLicenseEnd(user, gunDegisimi);
    if (sonuc.error) {
      return NextResponse.json(
        {
          success: false,
          error: sonuc.error,
          minimumEndDate: sonuc.minimumEndDate,
        },
        { status: 400 },
      );
    }

    user.licenseEndDate = sonuc.yeniBitis;
    user.licenseWarningSent = false;
    await user.save();

    const islemMetni =
      gunDegisimi > 0
        ? `+${gunDegisimi} gün uzatıldı`
        : `${Math.abs(gunDegisimi)} gün kısaltıldı`;

    return NextResponse.json({
      success: true,
      message: `'${user.salonAdi || user.email}' lisansı ${sonuc.yeniBitis.toLocaleDateString("tr-TR")} tarihine ayarlandı (${islemMetni}).`,
      licenseEndDate: sonuc.yeniBitis,
      minimumEndDate: sonuc.minimumEndDate,
    });
  } catch (error) {
    console.error("Lisans ayarlama hatası:", error);
    return NextResponse.json(
      { success: false, error: "Lisans ayarlanırken sunucu hatası oluştu." },
      { status: 500 },
    );
  }
}
