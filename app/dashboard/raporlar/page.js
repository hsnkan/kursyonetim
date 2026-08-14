"use client";

import { useEffect, useState, useRef } from "react";

export default function RaporlarPage() {
  const [ogrenciOzet, setOgrenciOzet] = useState(null);
  const [gruplar, setGruplar] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🗓️ İSTATİSTİK FİLTRELEME İÇİN AY VE YIL STATE'LERİ
  const bugun = new Date();
  const [seciliAy, setSeciliAy] = useState(bugun.getMonth() + 1); // 1 - 12
  const [seciliYil, setSeciliYil] = useState(bugun.getFullYear()); // Örn: 2026

  // 🗓️ GÜNLÜK VE GEÇMİŞ TARİHLİ YOKLAMA FİLTRE STATE'LERİ
  const [seciliTarih, setSeciliTarih] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [seciliGrup, setSeciliGrup] = useState("TÜMÜ");
  const [gunlukYoklamalar, setGunlukYoklamalar] = useState([]);
  const [yoklamaLoading, setYoklamaLoading] = useState(false);

  const pdfRef = useRef();

  const AYLAR = [
    { deger: 1, ad: "Ocak" },
    { deger: 2, ad: "Şubat" },
    { deger: 3, ad: "Mart" },
    { deger: 4, ad: "Nisan" },
    { deger: 5, ad: "Mayıs" },
    { deger: 6, ad: "Haziran" },
    { deger: 7, ad: "Temmuz" },
    { deger: 8, ad: "Ağustos" },
    { deger: 9, ad: "Eylül" },
    { deger: 10, ad: "Ekim" },
    { deger: 11, ad: "Kasım" },
    { deger: 12, ad: "Aralık" },
  ];

  const YILLAR = [2024, 2025, 2026, 2027];

  useEffect(() => {
    verileriGetir();
  }, [seciliAy, seciliYil]);

  useEffect(() => {
    gunlukYoklamaGetir();
  }, [seciliTarih]);

  const verileriGetir = async () => {
    try {
      setLoading(true);

      const [aktifRes, pasifRes, grupRes] = await Promise.all([
        fetch("/api/ogrenciler?durum=aktif"),
        fetch("/api/ogrenciler?durum=pasif"),
        fetch("/api/gruplar"),
      ]);

      const aktifData = await aktifRes.json();
      const pasifData = await pasifRes.json();
      const grupData = await grupRes.json();

      if (grupData.success) {
        setGruplar(grupData.data || []);
      }

      // Seçilen Ay ve Yıl Tarih Aralıkları
      const seciliAyBaslangic = new Date(
        seciliYil,
        seciliAy - 1,
        1,
        0,
        0,
        0,
        0,
      );
      const seciliAyBitis = new Date(seciliYil, seciliAy, 0, 23, 59, 59, 999);

      // Bir Önceki Ayın Tarih Aralıkları (Kıyaslama İçin)
      const gecenAyBaslangic = new Date(seciliYil, seciliAy - 2, 1, 0, 0, 0, 0);
      const gecenAyBitis = new Date(
        seciliYil,
        seciliAy - 1,
        0,
        23,
        59,
        59,
        999,
      );

      if (aktifData.success) {
        const aktifler = aktifData.data || [];
        const pasifler = pasifData.data || [];

        // Seçili Ayda Yeni Katılan Sporcular
        const seciliAyYeniKatilan = aktifler.filter((o) => {
          const t = new Date(o.createdAt);
          return t >= seciliAyBaslangic && t <= seciliAyBitis;
        }).length;

        // Seçili Ayda Dondurulan (Pasif Yapılan) Sporcular
        const seciliAyDondurulan = pasifler.filter((o) => {
          const t = new Date(o.updatedAt || o.createdAt);
          return t >= seciliAyBaslangic && t <= seciliAyBitis;
        }).length;

        // Seçili Ayda Ayrılan Sporcular
        const seciliAyAyrilan = pasifler.filter((o) => {
          const t = new Date(o.updatedAt || o.createdAt);
          return t >= seciliAyBaslangic && t <= seciliAyBitis;
        }).length;

        const gecenAyAyrilan = pasifler.filter((o) => {
          const t = new Date(o.updatedAt || o.createdAt);
          return t >= gecenAyBaslangic && t <= gecenAyBitis;
        }).length;

        const ayrilanFark = seciliAyAyrilan - gecenAyAyrilan;

        setOgrenciOzet({
          toplamAktif: aktifler.length,
          toplamDondurulan: pasifler.length,
          seciliAyYeniKatilan,
          seciliAyDondurulan,
          seciliAyAyrilan,
          gecenAyAyrilan,
          ayrilanFark,
        });
      }
    } catch (err) {
      console.error("Rapor verisi çekme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const gunlukYoklamaGetir = async () => {
    setYoklamaLoading(true);
    try {
      const res = await fetch(`/api/yoklama?tarih=${seciliTarih}`);
      const data = await res.json();
      if (data.success) {
        setGunlukYoklamalar(data.data || []);
      } else {
        setGunlukYoklamalar([]);
      }
    } catch (err) {
      console.error("Günlük yoklama çekilemedi:", err);
    } finally {
      setYoklamaLoading(false);
    }
  };

  // 🎯 GRUBA GÖRE FİLTRELENMİŞ YOKLAMA LİSTESİ
  const filtreliYoklamalar = gunlukYoklamalar.filter((y) => {
    if (seciliGrup === "TÜMÜ") return true;
    return (y.grup || "").toLowerCase() === seciliGrup.toLowerCase();
  });

  const tarihFormatla = (tarihStr) => {
    if (!tarihStr) return "";
    const [yil, ay, gun] = tarihStr.split("-");
    const aylar = [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ];
    return `${gun} ${aylar[parseInt(ay) - 1]} ${yil}`;
  };

  // 📄 BİLGİSAYARA GÜNLÜK/GEÇMİŞ YOKLAMA PDF İNDİRME / YAZDIRMA
  const pdfIndir = () => {
    const printContent = document.getElementById("pdf-rapor-alani");
    if (!printContent) return alert("Yazdırılacak yoklama alanı bulunamadı!");

    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Yoklama Raporu - ${tarihFormatla(seciliTarih)}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #0F172A; }
            .header { text-align: center; border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 20px; }
            .header h1 { font-size: 18pt; margin: 0; color: #0F172A; text-transform: uppercase; }
            .header p { font-size: 10pt; color: #B45309; margin: 4px 0 0 0; font-weight: bold; }
            .info-box { background: #F8FAFC; border: 1px solid #CBD5E1; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; font-size: 10pt; font-weight: bold; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #CBD5E1; padding: 8px 10px; text-align: left; font-size: 9.5pt; }
            th { background-color: #0F172A; color: white; text-transform: uppercase; font-size: 9pt; }
            tr:nth-child(even) { background-color: #F1F5F9; }
            .footer { margin-top: 30px; text-align: right; font-size: 8pt; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 8px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">Balans Cimnastik Akademi Otomatik Rapor Sistemleri</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-400"></div>
        <p className="mt-4 text-white font-black text-sm">
          Raporlar Yükleniyor...
        </p>
      </div>
    );

  const seciliAyAdi = AYLAR.find((a) => a.deger === Number(seciliAy))?.ad || "";

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-900">
      {/* 🌟 BAŞLIK */}
      <div className="bg-[#0F172A] text-white p-6 md:p-8 rounded-3xl shadow-2xl border-2 border-amber-400/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-wide text-amber-400 flex items-center gap-3 uppercase">
            <span>📊</span> Raporlama & Katılım Analizleri
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-300 mt-1">
            Ay ve yıl bazlı katılan, dondurulan ve ayrılan sporcu istatistikleri
            ile yoklama PDF raporları.
          </p>
        </div>
      </div>

      {/* 📊 ÜST İSTATİSTİK BALONCUKLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 🟢 1. MEVCUT (AKTİF) ÖĞRENCİ SAYISI */}
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">
            🟢 Mevcut (Aktif) Öğrenci
          </span>
          <p className="text-3xl font-black text-emerald-600">
            {ogrenciOzet?.toplamAktif || 0} Sporcu
          </p>
          <span className="text-[11px] font-bold text-slate-500">
            Aktif Eğitime Devam Edenler
          </span>
        </div>

        {/* 🚀 2. YENİ KATILAN ÖĞRENCİ (SEÇİLİ AY) */}
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-1">
          <span className="text-[10px] font-black uppercase text-blue-600">
            🚀 Yeni Katılan ({seciliAyAdi} {seciliYil})
          </span>
          <p className="text-3xl font-black text-blue-600">
            +{ogrenciOzet?.seciliAyYeniKatilan || 0} Sporcu
          </p>
          <span className="text-[11px] font-bold text-slate-500">
            {seciliAyAdi} Döneminde Katılanlar
          </span>
        </div>

        {/* ⏸️ 3. DONDURULAN ÖĞRENCİ SAYISI (SEÇİLİ AY) */}
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-600">
            ⏸️ Dondurulan ({seciliAyAdi} {seciliYil})
          </span>
          <p className="text-3xl font-black text-amber-600">
            {ogrenciOzet?.seciliAyDondurulan || 0} Sporcu
          </p>
          <span className="text-[11px] font-bold text-slate-500">
            {seciliAyAdi} Döneminde Dondurulanlar
          </span>
        </div>

        {/* 🔴 4. AYRILAN ÖĞRENCİ VE KIYASLAMA SAYISI (SEÇİLİ AY) */}
        <div className="bg-white p-6 rounded-3xl border-2 border-rose-200 shadow-xl space-y-1 bg-rose-50/20">
          <span className="text-[10px] font-black uppercase text-rose-800">
            🔴 Ayrılan Öğrenci ({seciliAyAdi} {seciliYil})
          </span>
          <p className="text-3xl font-black text-rose-600">
            {ogrenciOzet?.seciliAyAyrilan || 0} Sporcu
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-black mt-1">
            <span
              className={`px-2 py-0.5 rounded ${
                (ogrenciOzet?.ayrilanFark || 0) <= 0
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-rose-100 text-rose-900 border border-rose-300"
              }`}
            >
              {(ogrenciOzet?.ayrilanFark || 0) <= 0
                ? `▼ ${Math.abs(ogrenciOzet?.ayrilanFark || 0)} Azaldı`
                : `▲ +${ogrenciOzet?.ayrilanFark} Artış`}
            </span>
            <span className="text-slate-500">
              (Geçen Ay: {ogrenciOzet?.gecenAyAyrilan || 0})
            </span>
          </div>
        </div>
      </div>

      {/* 🗓️ İSTATİSTİK BALONCUKLARININ ALTINDAKİ AY VE YIL FİLTRELEME TAKVİMİ */}
      <div className="bg-white p-5 rounded-3xl border-2 border-amber-400/60 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <div>
            <h3 className="text-xs font-black uppercase text-slate-900">
              İstatistik Filtreleme Dönemi Seçin
            </h3>
            <p className="text-[11px] font-bold text-slate-500">
              Seçilen döneme ait katılan, dondurulan ve ayrılan öğrenci verileri
              yukarıya yansır.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* AY SEÇİCİ */}
          <select
            value={seciliAy}
            onChange={(e) => setSeciliAy(Number(e.target.value))}
            className="p-2.5 rounded-2xl border-2 border-slate-300 font-black text-xs bg-slate-50 text-slate-900 outline-none focus:border-amber-500 cursor-pointer flex-1 sm:flex-none"
          >
            {AYLAR.map((a) => (
              <option key={a.deger} value={a.deger}>
                {a.ad}
              </option>
            ))}
          </select>

          {/* YIL SEÇİCİ */}
          <select
            value={seciliYil}
            onChange={(e) => setSeciliYil(Number(e.target.value))}
            className="p-2.5 rounded-2xl border-2 border-slate-300 font-black text-xs bg-slate-50 text-slate-900 outline-none focus:border-amber-500 cursor-pointer flex-1 sm:flex-none"
          >
            {YILLAR.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🎴 GÜNLÜK VEYA GEÇMİŞ TARİHLİ YOKLAMA FİLTRELEME VE PDF ALANI */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600"></span>
              Günlük & Geçmiş Tarihli Yoklama Raporları
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              İstediğiniz geçmiş veya güncel tarihi seçerek katılım raporunu
              inceleyebilir ve PDF çıktısı alabilirsiniz.
            </p>
          </div>

          <button
            onClick={pdfIndir}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <span>📥</span>
            <span>PDF Raporunu İndir / Yazdır (.pdf)</span>
          </button>
        </div>

        {/* FİLTRELEME SEÇENEKLERİ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">
              📅 Yoklama Tarihi Seçin (Geçmiş / Güncel)
            </label>
            <input
              type="date"
              value={seciliTarih}
              onChange={(e) => setSeciliTarih(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">
              🏆 Gruba Göre Filtrele
            </label>
            <select
              value={seciliGrup}
              onChange={(e) => setSeciliGrup(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer focus:border-blue-600"
            >
              <option value="TÜMÜ">Tüm Grupları Göster</option>
              {gruplar.map((g, idx) => {
                const grupAd = typeof g === "object" ? g.ad : g;
                return (
                  <option key={idx} value={grupAd}>
                    🏆 {grupAd}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* 📄 YAZDIRILACAK VE EKRANDA GÖRÜNECEK PDF İÇERİK ALANI (KVKK UYUMLU) */}
        <div
          id="pdf-rapor-alani"
          ref={pdfRef}
          className="bg-white p-4 rounded-2xl border border-slate-200"
        >
          <div className="header text-center border-b-2 border-slate-900 pb-3 mb-4">
            <h1 className="text-xl font-black uppercase text-slate-900 tracking-wider">
              BALANS CİMNASTİK AKADEMİSİ
            </h1>
            <p className="text-xs font-bold text-amber-600 uppercase mt-0.5">
              SPORCU YOKLAMA VE KATILIM RAPORU
            </p>
          </div>

          <div className="flex justify-between items-center bg-slate-100 p-3 rounded-xl border border-slate-300 text-xs font-black mb-4">
            <div>
              <span>Tarih: </span>
              <span className="text-blue-700">
                {tarihFormatla(seciliTarih)}
              </span>
            </div>
            <div>
              <span>Filtrelenen Grup: </span>
              <span className="text-amber-700">{seciliGrup}</span>
            </div>
            <div>
              <span>Toplam Katılım: </span>
              <span className="text-emerald-700">
                {filtreliYoklamalar.length} Sporcu
              </span>
            </div>
          </div>

          {yoklamaLoading ? (
            <p className="text-center font-bold text-xs text-slate-400 py-8">
              Yoklama verileri yükleniyor...
            </p>
          ) : filtreliYoklamalar.length === 0 ? (
            <p className="text-center font-bold text-xs text-slate-400 py-8">
              Seçilen tarih ve grupta kayıtlı yoklama bulunamadı.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-wider">
                  <th className="p-3 border border-slate-300">#</th>
                  <th className="p-3 border border-slate-300">
                    Öğrenci Ad Soyad
                  </th>
                  <th className="p-3 border border-slate-300">Grup</th>
                  <th className="p-3 border border-slate-300">
                    Kart Okuma Saati
                  </th>
                  <th className="p-3 border border-slate-300 text-center">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-900">
                {filtreliYoklamalar.map((y, idx) => {
                  const saatStr = y.tarih
                    ? new Date(y.tarih).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "--:--";

                  return (
                    <tr key={y._id || idx} className="hover:bg-slate-50">
                      <td className="p-3 border border-slate-200 font-black">
                        {idx + 1}
                      </td>
                      <td className="p-3 border border-slate-200 text-sm font-black text-slate-950">
                        {y.ogrenciAdSoyad || y.adSoyad || "Öğrenci İsmi Yok"}
                      </td>
                      <td className="p-3 border border-slate-200 text-slate-700">
                        {y.grup || "Grup Yok"}
                      </td>
                      <td className="p-3 border border-slate-200 font-mono font-bold text-blue-800">
                        {saatStr}
                      </td>
                      <td className="p-3 border border-slate-200 text-center">
                        <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 px-2.5 py-1 rounded-md text-[10px] font-black">
                          ✓ Katıldı
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
