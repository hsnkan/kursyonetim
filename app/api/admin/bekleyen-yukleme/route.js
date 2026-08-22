import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BekleyenVeriYukleme from "@/models/BekleyenVeriYukleme";
import { requireRole } from "@/lib/auth";
import { getAktifKurumSalon } from "@/lib/kurumConfig";
import { hasActiveDataUploadPermission } from "@/lib/dataUploadPermission";
import {
  uygulaGecmisOdemeYukleme,
  uygulaOgrenciExcelYukleme,
} from "@/lib/dataUploadApply";

const TIP_ETIKET = {
  ogrenci_excel: "Toplu öğrenci kaydı (Excel)",
  gecmis_odeme_excel: "Geçmiş ödeme kayıtları (Excel)",
};

export async function GET(request) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    await dbConnect();
    const salon = await getAktifKurumSalon();
    if (!salon) {
      return NextResponse.json({ success: true, data: [], izinAktif: false });
    }

    const bekleyenler = await BekleyenVeriYukleme.find({
      salonId: salon._id,
      durum: { $in: ["bekliyor", "onaylandi"] },
    }).sort({ createdAt: -1 });

    const izinAktif = await hasActiveDataUploadPermission(salon._id);

    return NextResponse.json({
      success: true,
      data: bekleyenler,
      izinAktif,
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
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await request.json();
    const { tip, payload, gelistiriciNotu } = body;

    if (!tip || !payload) {
      return NextResponse.json(
        { success: false, error: "Yükleme tipi ve veri zorunludur." },
        { status: 400 },
      );
    }

    const salon = await getAktifKurumSalon();
    if (!salon) {
      return NextResponse.json(
        {
          success: false,
          error: "Önce Kurum Teslim Yapılandırmasından aktif kurum kaydedin.",
        },
        { status: 400 },
      );
    }

    let kayitSayisi = 0;
    if (tip === "ogrenci_excel") {
      kayitSayisi = (payload.yuklenecekler || []).length;
    } else if (tip === "gecmis_odeme_excel") {
      kayitSayisi = (payload.odemeler || []).length;
    } else {
      return NextResponse.json(
        { success: false, error: "Geçersiz yükleme tipi." },
        { status: 400 },
      );
    }

    if (kayitSayisi === 0) {
      return NextResponse.json(
        { success: false, error: "Excel dosyasında işlenecek kayıt bulunamadı." },
        { status: 400 },
      );
    }

    const izinAktif = await hasActiveDataUploadPermission(salon._id);

    if (izinAktif) {
      const sonuc =
        tip === "ogrenci_excel"
          ? await uygulaOgrenciExcelYukleme(payload.yuklenecekler)
          : await uygulaGecmisOdemeYukleme(payload.odemeler);

      return NextResponse.json({
        success: true,
        mod: "hemen_uygulandi",
        message: sonuc.message,
        izinAktif: true,
      });
    }

    const bekleyen = await BekleyenVeriYukleme.create({
      salonId: salon._id,
      tip,
      payload,
      gelistiriciNotu: gelistiriciNotu || "",
      ozet: {
        kayitSayisi,
        aciklama: TIP_ETIKET[tip] || tip,
      },
      durum: "bekliyor",
    });

    return NextResponse.json({
      success: true,
      mod: "musteri_onayi_bekliyor",
      message: `${kayitSayisi} kayıtlık ${TIP_ETIKET[tip]} müşteri onayına gönderildi. Müşteri paneli açıldığında kabul edebilir; sizinle iletişime gerek kalmaz.`,
      data: bekleyen,
      izinAktif: false,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
