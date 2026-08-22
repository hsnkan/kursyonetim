import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BekleyenVeriYukleme from "@/models/BekleyenVeriYukleme";
import { requireAuth } from "@/lib/auth";
import {
  getDataUploadPermissionStatus,
  grantDataUploadPermission,
} from "@/lib/dataUploadPermission";
import { uygulaBekleyenYukleme } from "@/lib/dataUploadApply";

const TIP_ETIKET = {
  ogrenci_excel: "Toplu öğrenci kaydı (Excel)",
  gecmis_odeme_excel: "Geçmiş ödeme kayıtları (Excel)",
};

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    if (auth.session.rol === "developer") {
      return NextResponse.json({
        success: true,
        bekleyenler: [],
        izin: { aktif: false, bitis: null },
      });
    }

    await dbConnect();
    const salonId = auth.session.salonId;
    if (!salonId) {
      return NextResponse.json({
        success: true,
        bekleyenler: [],
        izin: await getDataUploadPermissionStatus(auth.session.userId),
      });
    }

    const bekleyenler = await BekleyenVeriYukleme.find({
      salonId,
      durum: "bekliyor",
    }).sort({ createdAt: -1 });

    const izin = await getDataUploadPermissionStatus(auth.session.userId);

    return NextResponse.json({
      success: true,
      bekleyenler: bekleyenler.map((b) => ({
        _id: b._id,
        tip: b.tip,
        tipEtiket: TIP_ETIKET[b.tip] || b.tip,
        kayitSayisi: b.ozet?.kayitSayisi || 0,
        gelistiriciNotu: b.gelistiriciNotu,
        createdAt: b.createdAt,
      })),
      izin,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    if (auth.session.rol === "developer") {
      return NextResponse.json(
        { success: false, error: "Bu işlem müşteri hesabı içindir." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { islem, yuklemeId } = body;

    if (islem === "izin_ver") {
      const { until } = await grantDataUploadPermission(auth.session.userId);
      return NextResponse.json({
        success: true,
        message:
          "72 saatlik veri yükleme izni tanımlandı. Bu sürede geliştirici Excel yüklemeleri doğrudan uygulanabilir.",
        bitis: until,
      });
    }

    if (!yuklemeId) {
      return NextResponse.json(
        { success: false, error: "Yükleme ID zorunludur." },
        { status: 400 },
      );
    }

    await dbConnect();
    const kayit = await BekleyenVeriYukleme.findById(yuklemeId);
    if (!kayit || kayit.durum !== "bekliyor") {
      return NextResponse.json(
        { success: false, error: "Bekleyen yükleme bulunamadı veya işlenmiş." },
        { status: 404 },
      );
    }

    if (String(kayit.salonId) !== String(auth.session.salonId)) {
      return NextResponse.json(
        { success: false, error: "Bu yükleme sizin kurumunuza ait değil." },
        { status: 403 },
      );
    }

    if (islem === "reddet") {
      kayit.durum = "reddedildi";
      kayit.onaylayanUserId = auth.session.userId;
      kayit.onayTarihi = new Date();
      kayit.sonucMesaji = "Müşteri tarafından reddedildi.";
      await kayit.save();

      return NextResponse.json({
        success: true,
        message: "Veri yükleme talebi reddedildi.",
      });
    }

    if (islem === "onayla") {
      const sonuc = await uygulaBekleyenYukleme(kayit);
      kayit.durum = "uygulandi";
      kayit.onaylayanUserId = auth.session.userId;
      kayit.onayTarihi = new Date();
      kayit.sonucMesaji = sonuc.message;
      await kayit.save();

      return NextResponse.json({
        success: true,
        message: sonuc.message,
      });
    }

    return NextResponse.json(
      { success: false, error: "Geçersiz işlem." },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
