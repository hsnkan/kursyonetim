import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import {
  getAktifKurumSalon,
  kaydetKurumYapilandirma,
  kurumMetinleri,
} from "@/lib/kurumConfig";
import { formatSalonBranding } from "@/lib/branding";
import { getSiteConfig } from "@/lib/siteConfig";
import { VARSAYILAN_OZELLIKLER } from "@/lib/ozellikler";

function bosForm() {
  const env = getSiteConfig();
  return {
    salonAdi: env.isletmeAdi,
    isletmeTamAdi: env.isletmeTamAdi,
    kisaKod: "",
    altBaslik: env.altBaslik,
    logoUrl: env.logoUrl,
    logoBase64: null,
    telefon: "",
    email: "",
    adres: "",
    webSitesi: "",
    whatsappImza: env.whatsappImza,
    temaRengi: env.temaRengi,
    notlar: "",
    durum: "aktif",
    musteriEmail: "",
    gelistiriciEmail: "",
    kurtarmaEmail: "",
    kurtarmaTelefon: "",
    mailFromName: env.mailFromName,
    mailFromAddress: env.mailFromAddress,
    kurulumNotu: "",
    teknikDestekAdi: env.teknikDestekAdi,
    sistemBaslik: env.sistemBaslik,
    sistemAciklama: env.sistemAciklama,
    kayitFormUstBaslik: env.isletmeAdi.split(" ")[0]?.toUpperCase() || "",
    kayitFormAltBaslik: "",
    kayitFormSlogan:
      "★ ELİT EĞİTİM • GÜÇLÜ GELECEK • SINIRSIZ POTANSİYEL ★",
    raporFooterMetni: "",
    canliSiteUrl: "",
    ozellikler: { ...VARSAYILAN_OZELLIKLER },
  };
}

export async function GET(request) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    const salon = await getAktifKurumSalon();
    if (!salon) {
      return NextResponse.json({
        success: true,
        data: bosForm(),
        kaynak: "env",
        metinler: kurumMetinleri(null),
      });
    }

    const formatted = formatSalonBranding(salon);
    return NextResponse.json({
      success: true,
      data: {
        ...formatted,
        logoBase64: salon.logoBase64 || null,
      },
      kaynak: "veritabani",
      metinler: kurumMetinleri(salon),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    const body = await request.json();
    const salon = await kaydetKurumYapilandirma(body);
    const formatted = formatSalonBranding(salon);

    return NextResponse.json({
      success: true,
      message:
        "Kurum yapılandırması kaydedildi. Müşteri paneli yeni marka ayarlarıyla güncellendi.",
      data: {
        ...formatted,
        logoBase64: salon.logoBase64 || null,
      },
      metinler: kurumMetinleri(salon),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
