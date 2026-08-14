"use client";

import { useState, useEffect, useRef } from "react";

export default function NfcYoklamaPage() {
  const [cardIdInput, setCardIdInput] = useState("");
  const [ogrenci, setOgrenci] = useState(null);
  const [mesaj, setMesaj] = useState({ tip: "", metin: "" });
  const [loading, setLoading] = useState(false);
  const [yoklamaGecmisi, setYoklamaGecmisi] = useState([]);
  const [gunlukLoading, setGunlukLoading] = useState(false);

  // 🎯 INPUT ODAK REF'İ (OTOMATİK ODAKLANMA İÇİN)
  const inputRef = useRef(null);

  const odagiKoru = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    odagiKoru();

    const handleClickGlobal = () => {
      odagiKoru();
    };

    window.addEventListener("click", handleClickGlobal);
    return () => {
      window.removeEventListener("click", handleClickGlobal);
    };
  }, []);

  // O GÜNÜN TÜM YOKLAMALARINI VERİTABANINDAN ÇEK
  useEffect(() => {
    gunlukYoklamalariGetir();
  }, []);

  const gunlukYoklamalariGetir = async () => {
    setGunlukLoading(true);
    try {
      const bugunTarih = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/yoklama?tarih=${bugunTarih}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setYoklamaGecmisi(data.data);
      } else {
        setYoklamaGecmisi([]);
      }
    } catch (err) {
      console.error("Günlük yoklamalar çekilemedi:", err);
    } finally {
      setGunlukLoading(false);
    }
  };

  // URL PARAMETRESİ İLE GELEN KART ID KONTROLÜ (iOS Kestirmeler / QR İçin)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCardId = urlParams.get("cardId");
      if (urlCardId) {
        setCardIdInput(urlCardId);
        yoklamaIsle(urlCardId);
      }
    }
  }, []);

  // KART OKUNDUĞUNDA YOKLAMA İŞLEME FONKSİYONU
  const yoklamaIsle = async (okunanId) => {
    const kartId = okunanId || cardIdInput;
    if (!kartId.trim()) return;

    setLoading(true);
    setMesaj({ tip: "", metin: "" });

    try {
      const res = await fetch("/api/yoklama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: kartId.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setOgrenci(data.ogrenci);
        setMesaj({
          tip: "basari",
          metin: `✅ ${data.ogrenci.adSoyad} (${data.ogrenci.grup || "Grup Belirtilmedi"}) - Yoklama Başarıyla Alındı!`,
        });

        // O günün yoklamalarını yenile
        gunlukYoklamalariGetir();
      } else {
        setOgrenci(null);
        setMesaj({
          tip: "hata",
          metin: `❌ ${data.error || "Kart sistemde eşleşmedi veya öğrenci bulunamadı!"}`,
        });
      }
    } catch (err) {
      setMesaj({
        tip: "hata",
        metin: "✕ Sunucu bağlantı hatası oluştu!",
      });
    } finally {
      setLoading(false);
      setCardIdInput("");
      setTimeout(odagiKoru, 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      yoklamaIsle(cardIdInput);
    }
  };

  // 📄 GÜN SONU PDF ÇIKTISI ALMA / BİLGİSAYARA İNDİRME FONKSİYONU
  const pdfIndir = () => {
    const bugunStr = new Date().toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Gün Sonu Yoklama Raporu - ${bugunStr}</title>
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
          <div class="header">
            <h1>BALANS CİMNASTİK AKADEMİSİ</h1>
            <p>GÜN SONU SPORCU YOKLAMA VE KATILIM RAPORU</p>
          </div>

          <div class="info-box">
            <span>📅 Tarih: <strong>${bugunStr}</strong></span>
            <span>🏆 Toplam Katılım: <strong>${yoklamaGecmisi.length} Sporcu</strong></span>
          </div>

          ${
            yoklamaGecmisi.length === 0
              ? "<p style='text-align:center; padding:20px; font-weight:bold;'>Bugün kayıtlı yoklama bulunmamaktadır.</p>"
              : `
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Öğrenci Ad Soyad</th>
                    <th>Cimnastik Grubu</th>
                    <th>Kart Okuma Saati</th>
                    <th style="text-align:center;">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  ${yoklamaGecmisi
                    .map((y, idx) => {
                      const saatStr = y.tarih
                        ? new Date(y.tarih).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : y.saat || "--:--";

                      return `
                        <tr>
                          <td><strong>${idx + 1}</strong></td>
                          <td><strong>${y.ogrenciAdSoyad || y.adSoyad || "Sporcu İsimsiz"}</strong></td>
                          <td>${y.grup || "Grup Yok"}</td>
                          <td style="font-family: monospace; font-weight: bold; color: #1E3A8A;">${saatStr}</td>
                          <td style="text-align:center; font-weight:bold; color:#047857;">✓ Katıldı</td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            `
          }

          <div class="footer">
            Balans Cimnastik Akademi Otomatik NFC Yoklama Sistemi
          </div>
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

  return (
    <div className="space-y-8 text-slate-900 pb-12 font-sans max-w-4xl mx-auto">
      {/* BAŞLIK VE CANLI DURUM PANOLARI */}
      <div className="bg-[#0F172A] text-white p-6 md:p-8 rounded-3xl shadow-2xl border-2 border-amber-400/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-wide text-amber-400 flex items-center gap-3 uppercase">
            <span>🎴</span> Temassız NFC / Kartlı Yoklama
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-300 mt-1">
            Kartı cihaza veya okuyucuya yaklaştırınız. Ekrana tıklamanıza gerek
            yoktur, sistem sürekli okumaya hazırdır.
          </p>
        </div>
        <div className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-2xl text-xs font-black shadow-lg flex items-center gap-2 animate-pulse whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-950"></span>
          SİSTEM OKUMAYA HAZIR
        </div>
      </div>

      {/* OPERASYONEL GEREKSİNİM BİLGİLENDİRME ROZETİ */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 font-bold text-xs flex items-center gap-3 shadow-sm">
        <span className="text-xl">⚠️</span>
        <span>
          <strong>Çalışma Koşulları:</strong> Temassız okumanın sorunsuz
          çalışması için USB/NFC okuyucunun bilgisayara bağlı olması, öğrenci
          kartlarının Öğrenci Düzenle menüsünden tanımlanmış olması ve bu
          tarayıcı sekmesinin açık tutulması gerekir.
        </span>
      </div>

      {/* OTOMATİK ODAKLANAN HIZLI OKUMA ALANI */}
      <div className="bg-white p-8 rounded-3xl border-2 border-slate-300 shadow-xl text-center space-y-6">
        <div className="inline-flex p-4 rounded-full bg-amber-100 text-amber-900 border-2 border-amber-400 text-3xl">
          📡
        </div>

        <div className="max-w-md mx-auto space-y-3">
          <label className="block text-xs font-black text-slate-500 uppercase">
            Sürekli Aktif NFC / Kart ID Girişi
          </label>

          <input
            ref={inputRef}
            type="text"
            value={cardIdInput}
            onChange={(e) => setCardIdInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Kartı okutun..."
            autoFocus
            className="w-full text-center border-4 border-amber-400 focus:border-emerald-500 p-4 rounded-2xl text-xl font-black text-slate-900 bg-amber-50/30 focus:bg-emerald-50/30 outline-none shadow-inner transition-all"
          />

          <p className="text-[11px] font-bold text-slate-400">
            * İmleç otomatik olarak bu alandadır. Kart dokundurulduğunda işlem
            anında tamamlanır.
          </p>
        </div>

        {/* BİLDİRİM VE DURUM MESAJLARI */}
        {mesaj.metin && (
          <div
            className={`p-4 rounded-2xl font-black text-sm border-2 shadow-md transition-all ${
              mesaj.tip === "basari"
                ? "bg-emerald-100 text-emerald-950 border-emerald-400"
                : "bg-rose-100 text-rose-950 border-rose-400"
            }`}
          >
            {mesaj.metin}
          </div>
        )}
      </div>

      {/* SON OKUNAN SPORCU DETAY KARTI */}
      {ogrenci && (
        <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between border-2 border-emerald-400">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-200">
              Son Derse Katılan Sporcu
            </span>
            <h2 className="text-2xl font-black">{ogrenci.adSoyad}</h2>
            <p className="text-xs font-bold text-emerald-100">
              Cimnastik Grubu:{" "}
              <strong>{ogrenci.grup || "Grup Belirtilmedi"}</strong>
            </p>
          </div>
          <span className="text-4xl bg-emerald-700 p-3 rounded-2xl border border-emerald-400">
            🤸‍♀️
          </span>
        </div>
      )}

      {/* 📋 O GÜN GİRİŞ YAPANLARIN LISTESİ VE GÜN SONU PDF BUTONU */}
      <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-amber-400">
              <span>📋</span> Bugün Kart Okutan Sporcular (
              {yoklamaGecmisi.length})
            </h2>
            <p className="text-[10px] text-slate-300 font-bold mt-0.5">
              Tarih: {new Date().toLocaleDateString("tr-TR")}
            </p>
          </div>

          <button
            onClick={pdfIndir}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <span>📥</span>
            <span>Gün Sonu PDF Çıktısı Al (.pdf)</span>
          </button>
        </div>

        <div className="divide-y-2 divide-slate-100">
          {gunlukLoading ? (
            <div className="p-8 text-center text-slate-400 font-bold text-xs">
              Günlük yoklama verileri yükleniyor...
            </div>
          ) : yoklamaGecmisi.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-xs">
              Bugün henüz kart okutulmadı.
            </div>
          ) : (
            yoklamaGecmisi.map((item, idx) => {
              const saatStr = item.tarih
                ? new Date(item.tarih).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : item.saat || "--:--";

              return (
                <div
                  key={item._id || idx}
                  className="p-4 flex justify-between items-center hover:bg-slate-50 font-bold text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-black text-slate-950 text-sm">
                        {item.ogrenciAdSoyad ||
                          item.adSoyad ||
                          "Sporcu İsimsiz"}
                      </span>
                      <span className="text-slate-500 ml-2">
                        ({item.grup || "Grup Yok"})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-blue-800 font-mono font-black">
                      {saatStr}
                    </span>
                    <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-300">
                      ✓ Katıldı
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
