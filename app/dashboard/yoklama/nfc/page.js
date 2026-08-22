"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBranding } from "@/app/components/BrandingProvider";
import BrandingLogo3D from "@/app/components/BrandingLogo3D";
import { normalizeMobileCardId } from "@/lib/mobileYoklama";
import PageHeader from "@/app/components/PageHeader";
import { IconNfc } from "@/app/components/NavIcons";
import KartKameraTarayici from "@/app/components/KartKameraTarayici";

// 📅 YEREL (TR) TARİH YARDIMCISI (UTC Kaymasını Önler)
const getLocalTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function NfcYoklamaPage() {
  const branding = useBranding();
  const [cardIdInput, setCardIdInput] = useState("");
  const [mesaj, setMesaj] = useState({ tip: "", metin: "" });
  const [yoklamaGecmisi, setYoklamaGecmisi] = useState([]);
  const [gunlukLoading, setGunlukLoading] = useState(false);
  const [kameraAcik, setKameraAcik] = useState(false);

  // 🎯 INPUT ODAK REF'İ (OTOMATİK ODAKLANMA İÇİN)
  const inputRef = useRef(null);
  const urlIslendiRef = useRef(false);

  // 🧹 NFC KART ID TEMİZLEME
  const nfcIdTemizle = normalizeMobileCardId;

  const odagiKoru = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    odagiKoru();

    const handleClickGlobal = () => {
      if (!kameraAcik) odagiKoru();
    };

    window.addEventListener("click", handleClickGlobal);
    return () => {
      window.removeEventListener("click", handleClickGlobal);
    };
  }, [odagiKoru, kameraAcik]);

  // O GÜNÜN TÜM YOKLAMALARINI VERİTABANINDAN ÇEK
  const gunlukYoklamalariGetir = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    gunlukYoklamalariGetir();
  }, [gunlukYoklamalariGetir]);

  // 🎴 KART OKUNDUĞUNDA YOKLAMA İŞLEME FONKSİYONU (useEffect'lerden Önce Tanımlandı)
  const yoklamaIsle = useCallback(
    async (okunanId) => {
      const kartId = nfcIdTemizle(okunanId);

      if (!kartId) return;

      setMesaj({ tip: "", metin: "" });

      try {
        const res = await fetch("/api/yoklama/nfc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: kartId }),
        });

        const data = await res.json();

        if (data.success) {
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
        setCardIdInput("");
        setTimeout(odagiKoru, 100);
      }
    },
    [gunlukYoklamalariGetir, nfcIdTemizle, odagiKoru],
  );

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
  }, [yoklamaIsle, nfcIdTemizle]);

  const kameraKapat = useCallback(() => setKameraAcik(false), []);

  const kameraKodOkundu = useCallback(
    (kartId) => {
      const temiz = nfcIdTemizle(kartId);
      setCardIdInput(temiz);
      yoklamaIsle(temiz);
    },
    [nfcIdTemizle, yoklamaIsle],
  );

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
    <div className="space-y-6 text-slate-900 pb-12 font-sans max-w-4xl mx-auto">
      <div className="flex flex-col items-center text-center pt-2">
        <div className="mb-3">
          <BrandingLogo3D
            logoSrc={branding.logoSrc || "/logo.png"}
            alt={`${branding.salonAdi} Logo`}
            size={128}
            borderColor={branding.temaRengi || "#d97706"}
            unoptimized={Boolean(branding.logoBase64)}
          />
        </div>
        <p
          className="text-sm md:text-base font-black uppercase tracking-[0.2em]"
          style={{ color: branding.temaRengi || "#d97706" }}
        >
          {branding.salonAdi || "Akademi"}
        </p>
        <p className="text-[11px] font-bold text-slate-500 mt-1">
          {branding.altBaslik || "Yoklama Terminali"}
        </p>
      </div>

      <PageHeader
        title="NFC Yoklama"
        subtitle="USB okuyucu ile kart okutun."
        icon={<IconNfc className="w-6 h-6" />}
        badge="Canlı Terminal"
      />

      <KartKameraTarayici
        acik={kameraAcik}
        onKapat={kameraKapat}
        onKodOkundu={kameraKodOkundu}
      />

      <div className="bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-xl">
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

        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setKameraAcik(true);
            }}
            className="flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl border-2 border-slate-300 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 transition-all cursor-pointer group"
            aria-label="Kamera ile kart kodu tara"
          >
            <span className="text-4xl leading-none group-hover:scale-110 transition-transform">
              📷
            </span>
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-600 group-hover:text-amber-700">
              Numarayı Kamera ile Oku
            </span>
          </button>
          <p className="text-[11px] text-slate-600 font-semibold text-center max-w-sm leading-relaxed">
            Kartta yalnızca numara varsa kamerayı kullanın. Bilgisayar ekranından
            okuma güvenilir değildir; test için numarayı üstteki alana yazıp Enter
            basabilirsiniz. Kamera için izinleri açın (iPhone: Ayarlar → Safari →
            Kamera → İzin Ver).
          </p>
        </div>

        {mesaj.metin && (
          <div
            className={`mt-4 p-4 rounded-2xl font-black text-sm border-2 shadow-md transition-all ${
              mesaj.tip === "basari"
                ? "bg-emerald-100 text-emerald-950 border-emerald-400"
                : "bg-rose-100 text-rose-950 border-rose-400"
            }`}
          >
            {mesaj.metin}
          </div>
        )}
      </div>

      {/* BUGÜN GİRİŞ YAPAN SPORCULAR — GRUP BAŞLIKLı */}
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
