"use client";

import { useEffect, useMemo, useState } from "react";
import {
  acKameraIzniAyarlari,
  detectKameraPlatform,
  getKameraIzniAdimlari,
  queryKameraIzniDurumu,
  tekrarKameraIzniIste,
} from "@/lib/kameraIzniYardim";

export default function KameraIzniRehberi({
  httpsSorunu = false,
  onTekrarDene,
  onKapat,
}) {
  const platform = useMemo(
    () => (typeof window !== "undefined" ? detectKameraPlatform() : null),
    [],
  );
  const adimlar = useMemo(
    () => (platform ? getKameraIzniAdimlari(platform) : []),
    [platform],
  );

  const [izinDurumu, setIzinDurumu] = useState("unknown");
  const [yonlendirmeMesaji, setYonlendirmeMesaji] = useState("");
  const [deneniyor, setDeneniyor] = useState(false);

  useEffect(() => {
    queryKameraIzniDurumu().then(setIzinDurumu);
  }, []);

  const ayarlaraGit = () => {
    if (!platform) return;
    const sonuc = acKameraIzniAyarlari(platform);
    setYonlendirmeMesaji(sonuc.mesaj);
    if (!sonuc.acildi) {
      setYonlendirmeMesaji(
        `${sonuc.mesaj} Aşağıdaki adımları izleyerek kamera iznini açın.`,
      );
    }
  };

  const izniTekrarDene = async () => {
    setDeneniyor(true);
    setYonlendirmeMesaji("");
    const sonuc = await tekrarKameraIzniIste();
    setDeneniyor(false);

    if (sonuc.basarili) {
      onTekrarDene?.();
      return;
    }

    if (sonuc.hata === "NotAllowedError") {
      setYonlendirmeMesaji(
        "İzin hâlâ kapalı. Ayarlara gidin veya aşağıdaki adımları izleyin.",
      );
      ayarlaraGit();
    } else {
      setYonlendirmeMesaji(
        "Kamera açılamadı. Ayarlardan izin verip tekrar deneyin.",
      );
    }
  };

  const izinDurumuMetni =
    izinDurumu === "denied"
      ? "Tarayıcı kamera iznini reddetti"
      : izinDurumu === "granted"
        ? "Kamera izni verilmiş görünüyor"
        : izinDurumu === "prompt"
          ? "Kamera izni henüz sorulmadı"
          : "Kamera izin durumu kontrol ediliyor";

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3 text-left">
      <div>
        <p className="text-xs font-black text-amber-900 uppercase tracking-wide">
          📱 Kamera izin ayarları
        </p>
        {platform && (
          <p className="text-[11px] text-amber-800 font-semibold mt-1">
            {platform.etiket} · {izinDurumuMetni}
          </p>
        )}
      </div>

      {httpsSorunu && (
        <p className="text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 rounded-xl p-2.5">
          Siteyi mutlaka{" "}
          <strong>https://kursyonetim.vercel.app</strong> adresinden açın (http
          veya IP adresi ile kamera çalışmaz).
        </p>
      )}

      <ol className="text-[11px] text-amber-950 font-semibold space-y-1.5 list-decimal list-inside leading-relaxed">
        {adimlar.map((adim, i) => (
          <li key={i}>{adim}</li>
        ))}
      </ol>

      {yonlendirmeMesaji && (
        <p className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded-xl p-2.5">
          {yonlendirmeMesaji}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={ayarlaraGit}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer transition"
        >
          ⚙️ Cihaz kamera izin ayarlarına git
        </button>

        {!httpsSorunu && (
          <button
            type="button"
            onClick={izniTekrarDene}
            disabled={deneniyor}
            className="w-full bg-white hover:bg-slate-50 border-2 border-amber-400 text-amber-950 font-black py-2.5 rounded-xl text-xs cursor-pointer transition disabled:opacity-50"
          >
            {deneniyor ? "Deneniyor..." : "🔄 İzni tekrar dene"}
          </button>
        )}

        {onKapat && (
          <button
            type="button"
            onClick={onKapat}
            className="w-full text-slate-500 hover:text-slate-700 font-bold py-1 text-[11px] cursor-pointer"
          >
            Kapat
          </button>
        )}
      </div>
    </div>
  );
}
