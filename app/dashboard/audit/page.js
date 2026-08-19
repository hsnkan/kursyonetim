"use client";

import { useEffect, useState } from "react";

export default function AuditLogPage() {
  const [kayitlar, setKayitlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState("");

  useEffect(() => {
    loglariGetir();
  }, []);

  const loglariGetir = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit?limit=100");
      const data = await res.json();
      if (data.success) setKayitlar(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtreli = kayitlar.filter((k) => {
    if (!filtre) return true;
    const q = filtre.toLowerCase();
    return (
      k.action?.toLowerCase().includes(q) ||
      k.detay?.toLowerCase().includes(q) ||
      k.actorAdSoyad?.toLowerCase().includes(q) ||
      k.entityLabel?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">📜 İşlem Geçmişi</h1>
          <p className="text-sm text-slate-400 mt-1">
            Kim, neyi, ne zaman değiştirdi — sistem audit logu
          </p>
        </div>
        <input
          type="text"
          placeholder="Ara: kullanıcı, işlem, detay..."
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-amber-500"
        />
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-12">Yükleniyor...</p>
      ) : filtreli.length === 0 ? (
        <p className="text-slate-400 text-center py-12">Kayıt bulunamadı.</p>
      ) : (
        <div className="space-y-2">
          {filtreli.map((k) => (
            <div
              key={k._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6"
            >
              <div className="shrink-0">
                <span className="text-[10px] font-black uppercase bg-amber-900/40 text-amber-400 px-2 py-1 rounded-lg">
                  {k.action}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{k.detay}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {k.entityType}
                  {k.entityLabel ? ` · ${k.entityLabel}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-slate-300">{k.actorAdSoyad}</p>
                <p className="text-[10px] text-slate-500">
                  {new Date(k.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
