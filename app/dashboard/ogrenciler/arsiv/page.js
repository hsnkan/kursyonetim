"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import { IconStudents } from "@/app/components/NavIcons";

export default function DondurulanOgrencilerPage() {
  const [pasifOgrenciler, setPasifOgrenciler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aramaMetni, setAramaMetni] = useState("");

  // 1. Dondurulan (Pasif) Öğrencileri Getir
  const pasifOgrencileriGetir = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ogrenciler?durum=pasif");
      const data = await res.json();
      if (data.success) setPasifOgrenciler(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pasifOgrencileriGetir();
  }, []);

  // 2. Dondurulan Öğrenciyi Tekrar Aktif Yap (Kaydını Yenile)
  const ogrenciTekrarAktifYap = async (id, adSoyad) => {
    if (
      !confirm(
        `${adSoyad} isimli öğrenciyi tekrar AKTİF yapmak istediğinize emin misiniz?`,
      )
    )
      return;

    try {
      const res = await fetch(`/api/ogrenciler/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum: "aktif" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("▶️ Öğrenci Tekrar Aktif Yapıldı!");
        pasifOgrencileriGetir();
      }
    } catch (err) {
      alert("Hata oluştu.");
    }
  };

  // 3. Kalıcılarak Sil
  const ogrenciKaliciSil = async (id, adSoyad) => {
    if (
      !confirm(
        `${adSoyad} isimli öğrenciyi veritabanından KALICI OLARAK silmek istediğinize emin misiniz?`,
      )
    )
      return;

    try {
      const res = await fetch(`/api/ogrenciler/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("🗑️ Öğrenci Kalıcı Olarak Silindi!");
        pasifOgrencileriGetir();
      }
    } catch (err) {
      alert("Silme hatası oluştu.");
    }
  };

  // Filtreleme
  const filtrelenmisPasifler = pasifOgrenciler.filter(
    (o) =>
      o.adSoyad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      (o.veliListesi &&
        o.veliListesi.some((v) =>
          v.adSoyad.toLowerCase().includes(aramaMetni.toLowerCase()),
        )),
  );

  return (
    <div className="space-y-6 text-slate-900">
      <PageHeader
        title="Dondurulan & Ayrılan Arşiv"
        subtitle="Dondurulmuş öğrencileri görün, kayıtları tekrar aktifleştirin veya yönetin."
        icon={<IconStudents className="w-6 h-6" />}
      >
        <Link
          href="/dashboard/ogrenciler"
          className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all"
        >
          <span>←</span>
          <span>Aktif Listeye Dön</span>
        </Link>
      </PageHeader>

      {/* LİSTE KARTI VE ARAMA BAR-I */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-3 gap-2">
          <h2 className="text-lg font-black text-slate-900">
            ⏸️ Arşivdeki Öğrenciler ({filtrelenmisPasifler.length})
          </h2>

          <input
            type="text"
            placeholder="Dondurulan öğrenci veya veli ara..."
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 outline-none w-full sm:w-64"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center font-bold text-slate-400">
            Arşiv Yükleniyor...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="p-3">Öğrenci Adı</th>
                  <th className="p-3">Eski Grubu</th>
                  <th className="p-3">Veliler</th>
                  <th className="p-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {filtrelenmisPasifler.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-8 text-center text-slate-400 font-bold"
                    >
                      Dondurulmuş/Pasif öğrenci kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filtrelenmisPasifler.map((o) => (
                    <tr
                      key={o._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-black text-slate-700">
                        {o.adSoyad}
                      </td>
                      <td className="p-3 text-slate-500">{o.grup}</td>
                      <td className="p-3 text-slate-500">
                        {o.veliListesi && o.veliListesi.length > 0
                          ? `${o.veliListesi[0].adSoyad} (${o.veliListesi[0].yakinlikDerecesi})`
                          : "Veli Yok"}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {/* RE-AKTİF YAP BUTONU */}
                        <button
                          onClick={() =>
                            ogrenciTekrarAktifYap(o._id, o.adSoyad)
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-lg text-[10px] shadow-sm"
                        >
                          ▶️ Tekrar Aktif Yap
                        </button>

                        {/* KALICI SİL */}
                        <button
                          onClick={() => ogrenciKaliciSil(o._id, o.adSoyad)}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 font-black px-2.5 py-1.5 rounded-lg text-[10px]"
                        >
                          🗑️ Kalıcı Sil
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
