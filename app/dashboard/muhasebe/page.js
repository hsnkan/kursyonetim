"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/app/components/BrandingProvider";
import { getKursYillari } from "@/lib/kursYillari";

export default function MuhasebePage() {
  const branding = useBranding();
  const simdikiYil = new Date().getFullYear();
  const simdikiAy = new Date().getMonth() + 1;

  // 🗓️ HEDEF VE KIYAS DÖNEM AY/YIL SEÇİM STATE'LERİ
  const [hedefYil, setHedefYil] = useState(simdikiYil);
  const [hedefAy, setHedefAy] = useState(simdikiAy);
  const [kiyasYil, setKiyasYil] = useState(
    simdikiAy === 1 ? simdikiYil - 1 : simdikiYil,
  );
  const [kiyasAy, setKiyasAy] = useState(simdikiAy === 1 ? 12 : simdikiAy - 1);

  const [odemeler, setOdemeler] = useState([]);
  const [sadeceOdemesiGelenler, setSadeceOdemesiGelenler] = useState(false);
  const [loading, setLoading] = useState(true);
  const [islemYapiliyorId, setIslemYapiliyorId] = useState(null);

  // Finansal Aidat ve Kasa Verileri State'i
  const [maliData, setMaliData] = useState({
    hedefBeklenenToplam: 0,
    hedefTahsilEdilen: 0,
    hedefKalanAlacak: 0,
    kiyasTahsilEdilen: 0,
    tahsilatFarki: 0,
    toplamAktifOgrenci: 0,
    odemesiGelenSayisi: 0,
    hedefAylikTrend: Array(12).fill(0),
    kiyasAylikTrend: Array(12).fill(0),
  });

  const aylar = [
    { id: 1, ad: "Ocak" },
    { id: 2, ad: "Şubat" },
    { id: 3, ad: "Mart" },
    { id: 4, ad: "Nisan" },
    { id: 5, ad: "Mayıs" },
    { id: 6, ad: "Haziran" },
    { id: 7, ad: "Temmuz" },
    { id: 8, ad: "Ağustos" },
    { id: 9, ad: "Eylül" },
    { id: 10, ad: "Ekim" },
    { id: 11, ad: "Kasım" },
    { id: 12, ad: "Aralık" },
  ];

  const aylarKisa = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];

  const yillar = getKursYillari();

  const odemeleriGetir = async () => {
    try {
      setLoading(true);
      const query = `hedefYil=${hedefYil}&hedefAy=${hedefAy}&kiyasYil=${kiyasYil}&kiyasAy=${kiyasAy}`;
      const res = await fetch(`/api/muhasebe?${query}`);
      const data = await res.json();

      if (data.success) {
        setOdemeler(data.data || []);
        if (data.dataMali) {
          const hedefTrend =
            data.dataMali.hedefAylikTrend ||
            veridenAylikTrendCikar(data.data || [], hedefYil);
          const kiyasTrend = data.dataMali.kiyasAylikTrend || Array(12).fill(0);

          setMaliData({
            ...data.dataMali,
            hedefAylikTrend: hedefTrend,
            kiyasAylikTrend: kiyasTrend,
          });
        }
      }
    } catch (err) {
      console.error("Ödemeler ve mali veri çekilemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const veridenAylikTrendCikar = (liste, yil) => {
    const trend = Array(12).fill(0);
    liste.forEach((m) => {
      if (m.durum === "odendi" && m.odemeTarihi) {
        const d = new Date(m.odemeTarihi);
        if (d.getFullYear() === Number(yil)) {
          const ayIdx = d.getMonth();
          trend[ayIdx] += Number(m.tutar) || 0;
        }
      }
    });
    return trend;
  };

  useEffect(() => {
    odemeleriGetir();
  }, [hedefYil, hedefAy, kiyasYil, kiyasAy]);

  // ✅ ÖDEME ALINDI OLARAK İŞARETLEME İŞLEVİ
  const odemeAlIsaretle = async (odeme) => {
    if (
      !confirm(
        `${odeme.ogrenciId?.adSoyad || "Sporcu"} için ${formatTL(
          odeme.tutar,
        )} aidat ödemesi tahsil edildi olarak kaydedilsin mi?`,
      )
    )
      return;

    try {
      setIslemYapiliyorId(odeme._id);
      const res = await fetch("/api/muhasebe/odeme-al", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          odemeId: odeme._id,
          ogrenciId: odeme.ogrenciId?._id,
          tutar: odeme.tutar,
          ay: hedefAy,
          yil: hedefYil,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Ödeme başarıyla tahsil edildi olarak kaydedildi!");
        setOdemeler((prev) =>
          prev.filter(
            (o) =>
              o._id !== odeme._id &&
              o.ogrenciId?._id !== odeme.ogrenciId?._id,
          ),
        );
        odemeleriGetir();
      } else {
        alert("✕ Hata: " + (data.error || "İşlem gerçekleştirilemedi."));
      }
    } catch (err) {
      alert("✕ Ödeme kaydedilirken sunucu hatası oluştu!");
    } finally {
      setIslemYapiliyorId(null);
    }
  };

  // 📲 WHATSAPP ÖDEME HATIRLATMA FONKSİYONU + AUDIT LOG KAYDI
  const hatirlatmaGonder = async (odeme) => {
    try {
      const o = odeme.ogrenciId || {};

      let veliTel = o.telefon || o.veliTelefon || "";
      if (
        !veliTel &&
        Array.isArray(o.veliListesi) &&
        o.veliListesi.length > 0
      ) {
        veliTel =
          o.veliListesi[0].telefon || o.veliListesi[0].veliTelefon || "";
      }

      const veliAd = o.veliAdi || o.veliAdSoyad || "Velimiz";
      const ogrenciAd = o.adSoyad || "Sporcumuz";

      if (veliTel) {
        const temizTel = veliTel.replace(/\D/g, "");
        const tel = temizTel.startsWith("90") ? temizTel : `90${temizTel}`;
        const mesaj = `Sayın ${veliAd},\n\n*${ogrenciAd}* isimli öğrencimizin aylık kurs aidat ödeme zamanı gelmiştir. Ödemenizi gerçekleştirdiyseniz bu mesajı dikkate almayınız. İyi günler dileriz.\n\n${branding.whatsappImza}`;

        window.open(
          `https://wa.me/${tel}?text=${encodeURIComponent(mesaj)}`,
          "_blank",
        );

        if (o._id) {
          const yeniLog = {
            islemTipi: "AİDAT_HATIRLATMA",
            detay: `Aidat ödeme hatırlatması WhatsApp üzerinden veliye gönderildi (${formatTL(
              odeme.tutar,
            )})`,
            tarih: new Date(),
          };

          const mevcutLoglar = Array.isArray(o.islemGecmisi)
            ? o.islemGecmisi
            : [];

          await fetch(`/api/ogrenciler/${o._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ islemGecmisi: [...mevcutLoglar, yeniLog] }),
          });
        }

        if (odeme._id && !String(odeme._id).startsWith("sanal_")) {
          await fetch("/api/muhasebe/hatirlatma", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ odemeId: odeme._id }),
          });
          odemeleriGetir();
        }
      } else {
        alert("⚠️ Bu öğrenciye ait kayıtlı telefon numarası bulunamadı!");
      }
    } catch (err) {
      alert("✕ Mesaj gönderilirken bir hata oluştu!");
    }
  };

  const ayAdGetir = (id) => aylar.find((a) => a.id === Number(id))?.ad || "";

  const formatTL = (val) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(val || 0);

  const bekleyenOdemeler = odemeler.filter((m) => m.durum !== "odendi");

  const gosterilecekOdemeler = sadeceOdemesiGelenler
    ? bekleyenOdemeler.filter(
        (m) =>
          String(m._id).startsWith("sanal_") ||
          m.durum === "bekliyor" ||
          m.durum === "gecikti",
      )
    : bekleyenOdemeler;

  // 📈 LİNEER SVG GRAFİK KOORDİNAT HESAPLAMALARI
  const hedefTrend = maliData.hedefAylikTrend || Array(12).fill(0);
  const kiyasTrend = maliData.kiyasAylikTrend || Array(12).fill(0);

  const grafikMax = 1000000;
  const grafikAdim = 50000;
  const yEksenDegerleri = Array.from(
    { length: grafikMax / grafikAdim + 1 },
    (_, i) => i * grafikAdim,
  );

  const svgGenislik = 800;
  const svgYukseklik = 360;
  const marjX = 88;
  const marjY = 24;

  const getX = (index) => marjX + (index * (svgGenislik - marjX - 20)) / 11;
  const getY = (val) =>
    svgYukseklik -
    marjY -
    (Math.min(val, grafikMax) * (svgYukseklik - 2 * marjY)) / grafikMax;

  const formatGrafikTL = (val) =>
    val >= 1000000
      ? "1.000.000"
      : new Intl.NumberFormat("tr-TR").format(val);

  const hedefPath = hedefTrend
    .map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(v)}`)
    .join(" ");

  const kiyasPath = kiyasTrend
    .map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(v)}`)
    .join(" ");

  return (
    <div className="space-y-8 text-slate-900 pb-12 font-sans">
      {/* 💼 SAYFA BAŞLIĞI */}
      <div className="bg-[#0F172A] text-white p-6 md:p-8 rounded-3xl shadow-2xl border-2 border-amber-400/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-wide text-amber-400 flex items-center gap-3 uppercase">
            <span>💼</span> Mali Yönetim & Aidat Takip Portalı
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-300 mt-1">
            İş yeri sahibi mali genel bakış, aidat tahsilatları ve WhatsApp
            hatırlatma kontrol paneli.
          </p>
        </div>
        <div className="bg-amber-400 text-slate-950 px-4 py-2 rounded-2xl text-xs font-black shadow-lg uppercase tracking-wider">
          İş Yeri Yönetim Paneli
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center font-bold text-slate-400">
          Ödemeler ve kasa durumu hesaplanıyor...
        </div>
      ) : (
        <>
          {/* 📊 AİDAT ÖZET KARTLARI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400">
                🎯 Toplam Beklenen Aidat
              </span>
              <p className="text-2xl font-black text-slate-900">
                {formatTL(maliData.hedefBeklenenToplam)}
              </p>
              <p className="text-[11px] font-bold text-slate-500">
                {maliData.toplamAktifOgrenci} Aktif Sporcu
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-emerald-200 shadow-xl space-y-2 bg-emerald-50/30">
              <span className="text-[10px] font-black uppercase text-emerald-800">
                ✅ Kasaya Giren / Tahsil Edilen
              </span>
              <p className="text-2xl font-black text-emerald-600">
                {formatTL(maliData.hedefTahsilEdilen)}
              </p>
              <p className="text-[11px] font-bold text-emerald-700">
                Net Kasaya Giren Tutar
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-rose-200 shadow-xl space-y-2 bg-rose-50/30">
              <span className="text-[10px] font-black uppercase text-rose-800">
                ⏳ Kalan Bekleyen Alacak
              </span>
              <p className="text-2xl font-black text-rose-600">
                {formatTL(maliData.hedefKalanAlacak)}
              </p>
              <p className="text-[11px] font-bold text-rose-700">
                Açık Kalan Toplam Aidat
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-amber-200 shadow-xl space-y-2 bg-amber-50/30">
              <span className="text-[10px] font-black uppercase text-amber-900">
                📱 Ödeme Günü Gelen
              </span>
              <p className="text-2xl font-black text-amber-700">
                {maliData.odemesiGelenSayisi || 0} Sporcu
              </p>
              <p className="text-[11px] font-bold text-amber-800">
                Hatırlatma Bekleyen Kayıtlar
              </p>
            </div>
          </div>

          {/* 💵 KASAYA GİREN TAHSİLAT DÖNEMSEL KARŞILAŞTIRMA PANENELİ (2 ADET AY/YIL FİLTRESİ) */}
          <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-xl space-y-5 bg-emerald-50/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-200 pb-3 gap-2">
              <div>
                <h2 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <span>💵</span> Kasaya Giren Tahsilat Karşılaştırması
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  İki farklı ay/yıl seçerek net kasa tahsilatlarını doğrudan
                  karşılaştırabilirsiniz.
                </p>
              </div>

              <div
                className={`px-4 py-2 rounded-xl text-xs font-black border shadow-sm ${
                  maliData.tahsilatFarki >= 0
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-rose-600 text-white border-rose-700"
                }`}
              >
                {maliData.tahsilatFarki >= 0
                  ? `▲ +${formatTL(maliData.tahsilatFarki)} Fark (Artış)`
                  : `▼ ${formatTL(maliData.tahsilatFarki)} Fark (Azalış)`}
              </div>
            </div>

            {/* 2 ADET AY / YIL SEÇİM KONTROLÜ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. HEDEF DÖNEM FİLTRESİ */}
              <div className="p-4 bg-white rounded-2xl border-2 border-emerald-300 shadow-sm space-y-2">
                <span className="text-[11px] font-black uppercase text-emerald-800 block">
                  1. Hedef Dönem Filtresi (Ay / Yıl)
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={hedefAy}
                    onChange={(e) => setHedefAy(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border-2 border-slate-300 font-bold text-xs p-2 rounded-xl outline-none cursor-pointer focus:border-emerald-500"
                  >
                    {aylar.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.ad}
                      </option>
                    ))}
                  </select>

                  <select
                    value={hedefYil}
                    onChange={(e) => setHedefYil(Number(e.target.value))}
                    className="bg-slate-50 border-2 border-slate-300 font-bold text-xs p-2 rounded-xl outline-none cursor-pointer focus:border-emerald-500"
                  >
                    {yillar.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-2 text-right">
                  <span className="text-xs font-bold text-slate-500">
                    Tahsil Edilen:{" "}
                  </span>
                  <strong className="text-emerald-700 text-base font-black">
                    {formatTL(maliData.hedefTahsilEdilen)}
                  </strong>
                </div>
              </div>

              {/* 2. KIYASLANAN DÖNEM FİLTRESİ */}
              <div className="p-4 bg-white rounded-2xl border-2 border-blue-300 shadow-sm space-y-2">
                <span className="text-[11px] font-black uppercase text-blue-800 block">
                  2. Kıyaslanan Dönem Filtresi (Ay / Yıl)
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={kiyasAy}
                    onChange={(e) => setKiyasAy(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border-2 border-slate-300 font-bold text-xs p-2 rounded-xl outline-none cursor-pointer focus:border-blue-500"
                  >
                    {aylar.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.ad}
                      </option>
                    ))}
                  </select>

                  <select
                    value={kiyasYil}
                    onChange={(e) => setKiyasYil(Number(e.target.value))}
                    className="bg-slate-50 border-2 border-slate-300 font-bold text-xs p-2 rounded-xl outline-none cursor-pointer focus:border-blue-500"
                  >
                    {yillar.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-2 text-right">
                  <span className="text-xs font-bold text-slate-500">
                    Tahsil Edilen:{" "}
                  </span>
                  <strong className="text-blue-700 text-base font-black">
                    {formatTL(maliData.kiyasTahsilEdilen)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* 📈 LİNEER (ÇİZGİLİ) YILLIK KARŞILAŞTIRMA GRAFİK MODÜLÜ */}
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-3 gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>📈</span> Yıllık Lineer Ödeme Karşılaştırma Grafiği
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  Ocak-Aralık arası 12 aylık net tahsilat trendlerinin
                  kıyaslanması
                </p>
              </div>

              {/* YIL SEÇİM KONTROLLERİ */}
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-black text-slate-700">
                    1. Yıl:
                  </span>
                  <select
                    value={hedefYil}
                    onChange={(e) => setHedefYil(Number(e.target.value))}
                    className="bg-white border border-slate-300 font-bold text-xs p-1.5 rounded-xl outline-none cursor-pointer"
                  >
                    {yillar.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-xs font-black text-slate-700">
                    2. Yıl:
                  </span>
                  <select
                    value={kiyasYil}
                    onChange={(e) => setKiyasYil(Number(e.target.value))}
                    className="bg-white border border-slate-300 font-bold text-xs p-1.5 rounded-xl outline-none cursor-pointer"
                  >
                    {yillar.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 🎨 LİNEER SVG GRAFİK ALANI */}
            <div className="p-4 bg-slate-900 rounded-3xl shadow-inner border border-slate-800 text-white overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgGenislik} ${svgYukseklik}`}
                className="w-full h-auto min-w-[600px] overflow-visible"
              >
                {/* Yatay Izgara + Sol Y Ekseni (50.000 – 1.000.000) */}
                {yEksenDegerleri.map((deger) => {
                  const yVal = getY(deger);
                  return (
                    <g key={`y-${deger}`}>
                      <line
                        x1={marjX}
                        y1={yVal}
                        x2={svgGenislik - 20}
                        y2={yVal}
                        stroke={deger === 0 ? "#475569" : "#334155"}
                        strokeDasharray={deger === 0 ? "0" : "4 4"}
                        strokeWidth="1"
                      />
                      <text
                        x={marjX - 8}
                        y={yVal + 4}
                        fill="#94A3B8"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        {formatGrafikTL(deger)}
                      </text>
                    </g>
                  );
                })}

                {/* KIYASLANAN YIL ÇİZGİSİ (MAVİ) */}
                <path
                  d={kiyasPath}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* HEDEF YIL ÇİZGİSİ (YEŞİL) */}
                <path
                  d={hedefPath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* KIYASLANAN YIL NOKTALARI */}
                {kiyasTrend.map((v, i) => (
                  <g key={`kiyas-${i}`} className="group cursor-pointer">
                    <circle
                      cx={getX(i)}
                      cy={getY(v)}
                      r="5"
                      fill="#3B82F6"
                      stroke="#0F172A"
                      strokeWidth="2"
                    />
                    <title>{`${aylarKisa[i]} ${kiyasYil}: ${formatTL(v)}`}</title>
                  </g>
                ))}

                {/* HEDEF YIL NOKTALARI */}
                {hedefTrend.map((v, i) => (
                  <g key={`hedef-${i}`} className="group cursor-pointer">
                    <circle
                      cx={getX(i)}
                      cy={getY(v)}
                      r="6"
                      fill="#10B981"
                      stroke="#0F172A"
                      strokeWidth="2"
                    />
                    <title>{`${aylarKisa[i]} ${hedefYil}: ${formatTL(v)}`}</title>
                  </g>
                ))}

                {/* X Eksenindeki Aylar */}
                {aylarKisa.map((ay, i) => (
                  <text
                    key={i}
                    x={getX(i)}
                    y={svgYukseklik - 8}
                    fill="#94A3B8"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {ay}
                  </text>
                ))}
              </svg>

              {/* LEJANT / AÇIKLAMA BİLGİSİ */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-bold px-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-3 h-1 bg-emerald-500 rounded"></span>
                    {hedefYil} Yılı Trendi:{" "}
                    {formatTL(maliData.hedefTahsilEdilen)}
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <span className="w-3 h-1 bg-blue-500 rounded"></span>
                    {kiyasYil} Yılı Trendi:{" "}
                    {formatTL(maliData.kiyasTahsilEdilen)}
                  </span>
                </div>

                <div
                  className={`px-3 py-1 rounded-xl text-xs font-black ${
                    maliData.tahsilatFarki >= 0
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  {maliData.tahsilatFarki >= 0
                    ? `▲ Yıllık Fark: +${formatTL(maliData.tahsilatFarki)}`
                    : `▼ Yıllık Fark: ${formatTL(maliData.tahsilatFarki)}`}
                </div>
              </div>
            </div>
          </div>

          {/* 📋 ÖDEME GEÇMİŞİ VE AİDAT TAKİP TABLOSU */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden space-y-0">
            <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-base font-black tracking-wide flex items-center gap-2 text-amber-400">
                  <span>📋</span> Ödeme Zamanı Gelenler & Tahsilat Yönetimi
                </h2>
                <p className="text-xs text-slate-300 font-bold mt-0.5">
                  Ödeme günü gelen veya vadesi geçen sporcular listelenir.
                </p>
              </div>

              <button
                onClick={() => setSadeceOdemesiGelenler(!sadeceOdemesiGelenler)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                  sadeceOdemesiGelenler
                    ? "bg-amber-400 text-slate-950 border-amber-500 shadow-lg"
                    : "bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700"
                }`}
              >
                {sadeceOdemesiGelenler
                  ? "Tüm Ödemeleri Göster"
                  : `💳 Sadece Ödemesi Gelenleri Göster (${
                      maliData.odemesiGelenSayisi || 0
                    })`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800 text-white uppercase text-xs font-black tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-slate-700">
                      Öğrenci & Veli Bilgisi
                    </th>
                    <th className="p-4 border-b border-slate-700">
                      Aidat Tutarı
                    </th>
                    <th className="p-4 border-b border-slate-700">
                      Son Ödeme Tarihi
                    </th>
                    <th className="p-4 border-b border-slate-700">
                      Ödeme Durumu
                    </th>
                    <th className="p-4 border-b border-slate-700">
                      Hatırlatma
                    </th>
                    <th className="p-4 border-b border-slate-700 text-right">
                      Aksiyon & İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 text-sm font-bold text-slate-900">
                  {gosterilecekOdemeler.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-8 text-center text-slate-500 font-black"
                      >
                        Gösterilebilecek ödeme kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    gosterilecekOdemeler.map((m) => {
                      const odendiMi = m.durum === "odendi";

                      return (
                        <tr
                          key={m._id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-black text-slate-950 text-base">
                              🎓 {m.ogrenciId?.adSoyad || "Öğrenci Silinmiş"}
                            </div>
                            <div className="text-xs font-bold text-slate-500 mt-0.5">
                              👤 Veli: {m.ogrenciId?.veliAdi || "Belirtilmedi"}
                            </div>
                          </td>
                          <td className="p-4 font-black text-slate-950 text-base">
                            {formatTL(m.tutar)}
                          </td>
                          <td className="p-4 text-slate-800 font-extrabold text-xs">
                            {m.sonOdemeTarihi
                              ? new Date(m.sonOdemeTarihi).toLocaleDateString(
                                  "tr-TR",
                                )
                              : "--.--.----"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-black border inline-block ${
                                odendiMi
                                  ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                                  : "bg-rose-100 text-rose-950 border-rose-300 animate-pulse"
                              }`}
                            >
                              {odendiMi ? "✓ ÖDENDİ" : "⏳ ÖDEME BEKLİYOR"}
                            </span>
                          </td>
                          <td className="p-4">
                            {m.hatirlatmaGonderildi ? (
                              <span className="text-[11px] bg-sky-100 text-sky-950 border border-sky-300 px-2.5 py-1 rounded-full font-black">
                                ✓ Hatırlatıldı (
                                {m.hatirlatmaTarihi
                                  ? new Date(
                                      m.hatirlatmaTarihi,
                                    ).toLocaleDateString("tr-TR")
                                  : "Bugün"}
                                )
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-bold">
                                Gönderilmedi
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {!odendiMi ? (
                                <>
                                  <button
                                    onClick={() => hatirlatmaGonder(m)}
                                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-3 py-2 rounded-xl text-xs shadow-sm transition-colors border border-amber-500 cursor-pointer flex items-center gap-1"
                                  >
                                    <span>📱</span>
                                    <span>Veliye Hatırlat</span>
                                  </button>

                                  <button
                                    disabled={islemYapiliyorId === m._id}
                                    onClick={() => odemeAlIsaretle(m)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1 border border-emerald-700"
                                  >
                                    <span>✅</span>
                                    <span>
                                      {islemYapiliyorId === m._id
                                        ? "Kaydediliyor..."
                                        : "Ödeme Al / İşaretle"}
                                    </span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                  ✓ Kasa Kaydı Tamam
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
