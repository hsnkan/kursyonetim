"use client";

import { useState, useEffect, useCallback } from "react";

export default function BekleyenYuklemeBanner() {
  const [bekleyenler, setBekleyenler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [islemId, setIslemId] = useState(null);

  const yuklemeleriGetir = useCallback(async () => {
    try {
      const res = await fetch("/api/user/bekleyen-yuklemeler");
      const data = await res.json();
      if (data.success) {
        setBekleyenler(data.bekleyenler || []);
      }
    } catch {
      // sessiz geç
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    yuklemeleriGetir();
  }, [yuklemeleriGetir]);

  const islemYap = async (yuklemeId, islem) => {
    const onayMetni =
      islem === "onayla"
        ? "Geliştirici tarafından hazırlanan veri yüklemesi sisteminize uygulanacak. Onaylıyor musunuz?"
        : "Bu veri yükleme talebini reddetmek istediğinize emin misiniz?";

    if (!window.confirm(onayMetni)) return;

    setIslemId(yuklemeId);
    try {
      const res = await fetch("/api/user/bekleyen-yuklemeler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem, yuklemeId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ " + data.message);
        await yuklemeleriGetir();
      } else {
        alert("❌ " + (data.error || "İşlem başarısız."));
      }
    } catch {
      alert("❌ Bağlantı hatası oluştu.");
    } finally {
      setIslemId(null);
    }
  };

  if (loading || bekleyenler.length === 0) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 z-50 sticky top-0 shadow-lg border-b border-blue-500">
      <div className="max-w-7xl mx-auto space-y-3">
        <p className="text-xs font-black uppercase tracking-wider text-blue-100">
          📋 Bekleyen veri yüklemesi — geliştirici onayınızı bekliyor
        </p>
        {bekleyenler.map((b) => (
          <div
            key={b._id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-700/50 rounded-xl p-3 border border-blue-400/30"
          >
            <div className="text-sm">
              <p className="font-black">
                Geliştirici veri yüklemesi yapmak istiyor
              </p>
              <p className="text-blue-100 text-xs mt-1">
                {b.tipEtiket} · {b.kayitSayisi} kayıt
                {b.gelistiriciNotu ? ` · ${b.gelistiriciNotu}` : ""}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={islemId === b._id}
                onClick={() => islemYap(b._id, "onayla")}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs disabled:opacity-50 cursor-pointer"
              >
                ✅ Kabul Et ve Uygula
              </button>
              <button
                type="button"
                disabled={islemId === b._id}
                onClick={() => islemYap(b._id, "reddet")}
                className="bg-slate-900/40 hover:bg-slate-900/60 text-white font-black px-4 py-2 rounded-lg text-xs border border-white/20 disabled:opacity-50 cursor-pointer"
              >
                ✕ Reddet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
