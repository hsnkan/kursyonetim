"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NfcKartYoklamaPanel from "@/app/components/NfcKartYoklamaPanel";
import { normalizeMobileCardId } from "@/lib/mobileYoklama";

// 📅 YEREL (TR) TARİH YARDIMCISI (UTC Kaymasını Önler)
const getLocalTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function NfcYoklamaPage() {
  const [cardIdInput, setCardIdInput] = useState("");
  const [ogrenci, setOgrenci] = useState(null);
  const [mesaj, setMesaj] = useState({ tip: "", metin: "" });
  const [loading, setLoading] = useState(false);
  const [yoklamaGecmisi, setYoklamaGecmisi] = useState([]);
  const [gunlukLoading, setGunlukLoading] = useState(false);

  // 🎯 INPUT ODAK REF'İ (OTOMATİK ODAKLANMA İÇİN)
  const inputRef = useRef(null);
  const urlIslendiRef = useRef(false);

  // 🧹 NFC KART ID TEMİZLEME
  const nfcIdTemizle = normalizeMobileCardId;

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
      const bugunTarih = getLocalTodayDate();
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

  // URL PARAMETRESİ İLE GELEN KART ID (iPhone Kestirmeler / QR link)
  useEffect(() => {
    if (urlIslendiRef.current || typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlCardId = urlParams.get("cardId");
    if (urlCardId) {
      urlIslendiRef.current = true;
      const temizUrlCardId = nfcIdTemizle(urlCardId);
      setCardIdInput(temizUrlCardId);
      yoklamaIsle(temizUrlCardId);
    }
  }, [yoklamaIsle]);

  // KART OKUNDUĞUNDA YOKLAMA İŞLEME FONKSİYONU
  const yoklamaIsle = useCallback(async (okunanId) => {
    const hamKartId = okunanId || cardIdInput;
    const kartId = nfcIdTemizle(hamKartId);

    if (!kartId) return;

    setLoading(true);
    setMesaj({ tip: "", metin: "" });

    try {
      const res = await fetch("/api/yoklama/nfc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: kartId }),
      });

      const data = await res.json();

      if (data.success) {
        setOgrenci(data.ogrenci);
        if (data.zatenVar) {
          setMesaj({
            tip: "basari",
            metin:
              data.message ||
              `⚠️ ${data.ogrenci.adSoyad} için bugün zaten yoklama alınmış!`,
          });
        } else {
          setMesaj({
            tip: "basari",
            metin: `✅ ${data.ogrenci.adSoyad} (${data.ogrenci.grup || "Grup Belirtilmedi"}) - Yoklama Başarıyla Alındı!`,
          });
        }

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
  }, [cardIdInput]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      yoklamaIsle(cardIdInput);
    }
  };

  // 📊 GİRİŞ YAPAN SPORCULARI GRUPLARINA GÖRE AYIRAN YARDIMCI
  const gruplanmisYoklamalar = yoklamaGecmisi.reduce((acc, item) => {
    const grupAdi = item.grup || item.ogrenciId?.grup || "Grup Belirtilmemiş";
    if (!acc[grupAdi]) {
      acc[grupAdi] = [];
    }
    acc[grupAdi].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8 text-slate-900 pb-12 font-sans max-w-4xl mx-auto">
      {/* BAŞLIK VE CANLI DURUM PANOLARI */}
      <div className="bg-[#0F172A] text-white p-6 md:p-8 rounded-3xl shadow-2xl border-2 border-amber-400/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-wide text-amber-400 flex items-center gap-3 uppercase">
            <span>🎴</span> Temassız NFC / Kartlı Yoklama
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-300 mt-1">
            13,56 MHz NFC kart + USB okuyucu ile yoklama alın. Kart okutulunca
            işlem anında kaydedilir.
          </p>
        </div>
        <div className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-2xl text-xs font-black shadow-lg flex items-center gap-2 animate-pulse whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-950"></span>
          SİSTEM OKUMAYA HAZIR
        </div>
      </div>

      {/* MOBİL YOKLAMA (iPhone / Android) */}
      <NfcKartYoklamaPanel onKartOkundu={yoklamaIsle} yukleniyor={loading} />

      {/* OPERASYONEL GEREKSİNİM BİLGİLENDİRME ROZETİ */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 font-bold text-xs flex items-center gap-3 shadow-sm">
        <span className="text-xl">💡</span>
        <span>
          <strong>Salon standardı:</strong> Bilgisayar + USB NFC okuyucu (13,56
          MHz). Sayfa açık kalmalı; imleç kart giriş alanındayken okuyucuya kart
          dokundurun. Android telefonda yedek NFC okuma mümkündür; iPhone
          tarayıcısı NFC kart okumaz. Gün sonu için <strong>Raporlar</strong>.
        </span>
      </div>

      {/* OTOMATİK ODAKLANAN HIZLI OKUMA ALANI */}
      <div className="bg-white p-8 rounded-3xl border-2 border-slate-300 shadow-xl text-center space-y-6">
        <div className="inline-flex p-4 rounded-full bg-amber-100 text-amber-900 border-2 border-amber-400 text-3xl">
          📡
        </div>

        <div className="max-w-md mx-auto space-y-3">
          <label className="block text-xs font-black text-slate-500 uppercase">
            USB Okuyucu / Kart ID Girişi (13,56 MHz NFC)
          </label>

          <input
            ref={inputRef}
            type="text"
            value={cardIdInput}
            onChange={(e) => setCardIdInput(nfcIdTemizle(e.target.value))}
            onKeyDown={handleKeyDown}
            placeholder="Kartı okutun..."
            autoFocus
            className="w-full text-center border-4 border-amber-400 focus:border-emerald-500 p-4 rounded-2xl text-xl font-black text-slate-900 bg-amber-50/30 focus:bg-emerald-50/30 outline-none shadow-inner transition-all"
          />

          <p className="text-[11px] font-bold text-slate-400">
            * USB okuyucu kartı okutunca numara buraya yazılır ve yoklama düşer.
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

      {/* 📋 BUGÜN GİRİŞ YAPAN SPORCULARIN GRUP BAŞLIKLI LİSTESİ */}
      <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden space-y-1 p-2">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center rounded-2xl mb-2">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span>📋</span> Bugün Giriş Yapan Sporcular (
              {yoklamaGecmisi.length})
            </h2>
            <p className="text-[10px] text-slate-300 font-bold mt-0.5">
              Tarih: {new Date().toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>

        {gunlukLoading ? (
          <div className="p-8 text-center text-slate-400 font-bold text-xs">
            Günlük yoklama verileri yükleniyor...
          </div>
        ) : Object.keys(gruplanmisYoklamalar).length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold text-xs">
            Bugün henüz kart okutulmadı.
          </div>
        ) : (
          Object.entries(gruplanmisYoklamalar).map(
            ([grupAdi, sporcular], groupIdx) => (
              <div
                key={groupIdx}
                className="border-2 border-slate-200 rounded-2xl overflow-hidden mb-3 shadow-sm"
              >
                {/* GRUP BAŞLIĞI VE SPORCU SAYISI ROZETİ */}
                <div className="bg-slate-100 p-3.5 px-5 flex justify-between items-center border-b border-slate-200">
                  <span className="font-black text-slate-900 text-xs sm:text-sm uppercase flex items-center gap-2">
                    <span className="text-amber-600">🏆</span> {grupAdi}
                  </span>
                  <span className="bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-xl text-[10px] shadow-sm">
                    {sporcular.length} Sporcu Giriş Yaptı
                  </span>
                </div>

                {/* O GRUPTAKİ SPORCULARIN LİSTESİ */}
                <div className="divide-y divide-slate-100 bg-white">
                  {sporcular.map((item, idx) => {
                    const saatStr = item.tarih
                      ? new Date(item.tarih).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : item.saat || "--:--";

                    const adSoyadGoster =
                      item.ogrenciAdSoyad ||
                      item.adSoyad ||
                      item.ogrenciId?.adSoyad ||
                      "Sporcu İsimsiz";

                    return (
                      <div
                        key={item._id || idx}
                        className="p-3.5 px-5 flex justify-between items-center hover:bg-slate-50 font-bold text-xs transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span className="font-black text-slate-950 text-sm">
                            {adSoyadGoster}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-blue-800 font-mono font-black text-xs">
                            {saatStr}
                          </span>
                          <span className="bg-emerald-100 text-emerald-950 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-300">
                            ✓ Katıldı
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}
