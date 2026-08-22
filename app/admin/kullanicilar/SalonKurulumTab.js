"use client";

import { useEffect, useState } from "react";
import { OZELLIK_TANIMLARI, VARSAYILAN_OZELLIKLER } from "@/lib/ozellikler";

const BOS_FORM = {
  salonAdi: "",
  kisaKod: "",
  altBaslik: "Akademi Yönetim Paneli",
  logoUrl: "/logo.png",
  logoBase64: null,
  telefon: "",
  email: "",
  adres: "",
  webSitesi: "",
  whatsappImza: "",
  temaRengi: "#f59e0b",
  notlar: "",
  durum: "taslak",
  musteriEmail: "",
  gelistiriciEmail: "",
  kurtarmaEmail: "",
  kurtarmaTelefon: "",
  mailFromName: "",
  mailFromAddress: "",
  kurulumNotu: "",
  ozellikler: { ...VARSAYILAN_OZELLIKLER },
};

export default function SalonKurulumTab({ bildirimGoster }) {
  const [salonlar, setSalonlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [form, setForm] = useState(BOS_FORM);
  const [duzenleId, setDuzenleId] = useState(null);
  const [logoOnizleme, setLogoOnizleme] = useState("/logo.png");

  useEffect(() => {
    salonlariGetir();
  }, []);

  const salonlariGetir = async () => {
    try {
      const res = await fetch("/api/admin/salonlar");
      const data = await res.json();
      if (data.success) setSalonlar(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const formSifirla = () => {
    setForm(BOS_FORM);
    setDuzenleId(null);
    setLogoOnizleme("/logo.png");
  };

  const salonDuzenle = (salon) => {
    setDuzenleId(salon._id);
    setForm({
      salonAdi: salon.salonAdi || "",
      kisaKod: salon.kisaKod || "",
      altBaslik: salon.altBaslik || "Akademi Yönetim Paneli",
      logoUrl: salon.logoUrl || "/logo.png",
      logoBase64: salon.logoBase64 || null,
      telefon: salon.telefon || "",
      email: salon.email || "",
      adres: salon.adres || "",
      webSitesi: salon.webSitesi || "",
      whatsappImza: salon.whatsappImza || "",
      temaRengi: salon.temaRengi || "#f59e0b",
      notlar: salon.notlar || "",
      durum: salon.durum || "taslak",
      musteriEmail: salon.musteriEmail || "",
      gelistiriciEmail: salon.gelistiriciEmail || "",
      kurtarmaEmail: salon.kurtarmaEmail || "",
      kurtarmaTelefon: salon.kurtarmaTelefon || "",
      mailFromName: salon.mailFromName || "",
      mailFromAddress: salon.mailFromAddress || "",
      kurulumNotu: salon.kurulumNotu || "",
      ozellikler: {
        ...VARSAYILAN_OZELLIKLER,
        ...(salon.ozellikler || {}),
      },
    });
    setLogoOnizleme(
      salon.logoBase64 || salon.logoUrl || "/logo.png",
    );
  };

  const logoYukle = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) {
      alert("Logo dosyası 500 KB'dan küçük olmalıdır.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setForm((prev) => ({ ...prev, logoBase64: base64 }));
      setLogoOnizleme(base64);
    };
    reader.readAsDataURL(file);
  };

  const kaydet = async (e) => {
    e.preventDefault();
    if (!form.salonAdi.trim()) {
      return alert("Salon/kurs adı zorunludur.");
    }

    setYukleniyor(true);
    try {
      const payload = {
        ...form,
        whatsappImza:
          form.whatsappImza.trim() ||
          `${form.salonAdi.trim()} 🤸‍♀️`,
      };

      const res = await fetch(
        duzenleId ? `/api/admin/salonlar/${duzenleId}` : "/api/admin/salonlar",
        {
          method: duzenleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (data.success) {
        bildirimGoster(
          duzenleId
            ? `✅ '${form.salonAdi}' salon ayarları güncellendi.`
            : `🎉 '${form.salonAdi}' salonu oluşturuldu. Müşteri eklerken bu salonu seçebilirsiniz.`,
        );
        formSifirla();
        salonlariGetir();
      } else {
        alert(data.error || "Kayıt başarısız.");
      }
    } catch {
      alert("Sunucu hatası.");
    } finally {
      setYukleniyor(false);
    }
  };

  const salonSil = async (salon) => {
    if (
      !confirm(
        `'${salon.salonAdi}' salon kaydını silmek istediğinize emin misiniz?`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/salonlar/${salon._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        bildirimGoster("🗑️ Salon kaydı silindi.");
        salonlariGetir();
        if (duzenleId === salon._id) formSifirla();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Silme hatası.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* FORM */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-black text-amber-400 uppercase">
          {duzenleId ? "✏️ Salon Düzenle" : "➕ Yeni Kurs / Salon Kur"}
        </h2>
        <p className="text-xs text-slate-400">
          Amblem, iletişim bilgileri ve WhatsApp imzasını girerek yeni bir kurs
          için sistemi hazır hale getirin.
        </p>

        <form onSubmit={kaydet} className="space-y-3">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase">
              Salon / Kurs Adı *
            </label>
            <input
              required
              value={form.salonAdi}
              onChange={(e) =>
                setForm({ ...form, salonAdi: e.target.value })
              }
              placeholder="Örn: Atlas Jimnastik Kadıköy"
              className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase">
                Kısa Kod
              </label>
              <input
                value={form.kisaKod}
                onChange={(e) =>
                  setForm({ ...form, kisaKod: e.target.value })
                }
                placeholder="atlas-kadikoy"
                className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase">
                Durum
              </label>
              <select
                value={form.durum}
                onChange={(e) =>
                  setForm({ ...form, durum: e.target.value })
                }
                className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-amber-500"
              >
                <option value="taslak">Taslak</option>
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase">
              Alt Başlık (Panel)
            </label>
            <input
              value={form.altBaslik}
              onChange={(e) =>
                setForm({ ...form, altBaslik: e.target.value })
              }
              className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase">
              Amblem / Logo
            </label>
            <div className="mt-2 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500 bg-slate-950 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoOnizleme}
                  alt="Logo önizleme"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={logoYukle}
                className="text-xs text-slate-300"
              />
            </div>
            <input
              value={form.logoUrl}
              onChange={(e) => {
                setForm({ ...form, logoUrl: e.target.value });
                if (!form.logoBase64) setLogoOnizleme(e.target.value);
              }}
              placeholder="veya logo URL: /logo.png"
              className="w-full mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase">
                Telefon
              </label>
              <input
                value={form.telefon}
                onChange={(e) =>
                  setForm({ ...form, telefon: e.target.value })
                }
                className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase">
                E-posta
              </label>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase">
              Adres
            </label>
            <input
              value={form.adres}
              onChange={(e) => setForm({ ...form, adres: e.target.value })}
              className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase">
              WhatsApp Mesaj İmzası
            </label>
            <input
              value={form.whatsappImza}
              onChange={(e) =>
                setForm({ ...form, whatsappImza: e.target.value })
              }
              placeholder="Atlas Jimnastik 🤸‍♀️"
              className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase">
              Tema Rengi
            </label>
            <input
              type="color"
              value={form.temaRengi}
              onChange={(e) =>
                setForm({ ...form, temaRengi: e.target.value })
              }
              className="w-full mt-1 h-10 rounded-xl cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase">
              Geliştirici Notları
            </label>
            <textarea
              rows={2}
              value={form.notlar}
              onChange={(e) => setForm({ ...form, notlar: e.target.value })}
              className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-amber-500"
            />
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h3 className="text-sm font-black text-sky-400 uppercase">
              📧 İletişim & Kurtarma
            </h3>
            <p className="text-[11px] text-slate-500">
              Teslim öncesi müşteri ve teknik iletişim bilgilerini girin. Lisans
              uyarısı bu adreslere gider. Kullanıcı şifre sıfırlama e-postasını
              kendi profilinden tanımlar.
            </p>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase">
                Müşteri / Salon E-postası
              </label>
              <input
                type="email"
                value={form.musteriEmail}
                onChange={(e) =>
                  setForm({ ...form, musteriEmail: e.target.value })
                }
                placeholder="salon@ornek.com"
                className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase">
                Geliştirici E-postanız
              </label>
              <input
                type="email"
                value={form.gelistiriciEmail}
                onChange={(e) =>
                  setForm({ ...form, gelistiriciEmail: e.target.value })
                }
                placeholder="teknik@sizin.com"
                className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-sky-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase">
                  Kurtarma E-postası
                </label>
                <input
                  type="email"
                  value={form.kurtarmaEmail}
                  onChange={(e) =>
                    setForm({ ...form, kurtarmaEmail: e.target.value })
                  }
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase">
                  Kurtarma Telefon
                </label>
                <input
                  value={form.kurtarmaTelefon}
                  onChange={(e) =>
                    setForm({ ...form, kurtarmaTelefon: e.target.value })
                  }
                  placeholder="05xx xxx xx xx"
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase">
                  E-posta Gönderen Adı
                </label>
                <input
                  value={form.mailFromName}
                  onChange={(e) =>
                    setForm({ ...form, mailFromName: e.target.value })
                  }
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase">
                  E-posta Gönderen Adres
                </label>
                <input
                  type="email"
                  value={form.mailFromAddress}
                  onChange={(e) =>
                    setForm({ ...form, mailFromAddress: e.target.value })
                  }
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase">
                Kurulum / Teslim Notu
              </label>
              <textarea
                rows={2}
                value={form.kurulumNotu}
                onChange={(e) =>
                  setForm({ ...form, kurulumNotu: e.target.value })
                }
                placeholder="Anlaşma paketi, özel istekler, teslim tarihi..."
                className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h3 className="text-sm font-black text-emerald-400 uppercase">
              🧩 Sözleşmeye Göre Modüller
            </h3>
            <p className="text-[11px] text-slate-500">
              Tüm modüller kodda mevcut; işaretlenmeyenler müşteri panelinde
              gizlenir.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(OZELLIK_TANIMLARI).map(([key, tanim]) => (
                <label
                  key={key}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-emerald-700"
                >
                  <input
                    type="checkbox"
                    checked={form.ozellikler[key] !== false}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ozellikler: {
                          ...form.ozellikler,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-black text-white">
                      {tanim.label}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {tanim.aciklama}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={yukleniyor}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase cursor-pointer"
            >
              {yukleniyor
                ? "Kaydediliyor..."
                : duzenleId
                  ? "Güncelle"
                  : "Salon Oluştur"}
            </button>
            {duzenleId && (
              <button
                type="button"
                onClick={formSifirla}
                className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-black text-xs cursor-pointer"
              >
                İptal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LİSTE */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-black text-white">
            📋 Tanımlı Kurs / Salonlar ({salonlar.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-800 max-h-[720px] overflow-y-auto">
          {salonlar.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm font-bold">
              Henüz salon tanımı yok. Soldan yeni kurs ekleyin.
            </p>
          ) : (
            salonlar.map((s) => (
              <div
                key={s._id}
                className="p-4 flex items-start gap-4 hover:bg-slate-800/40 transition"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-600 shrink-0 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.logoBase64 || s.logoUrl || "/logo.png"}
                    alt={s.salonAdi}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-white">{s.salonAdi}</h4>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        s.durum === "aktif"
                          ? "bg-emerald-900 text-emerald-300"
                          : s.durum === "taslak"
                            ? "bg-amber-900 text-amber-300"
                            : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {s.durum}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {s.altBaslik}
                    {s.kisaKod ? ` · ${s.kisaKod}` : ""}
                  </p>
                  {s.telefon && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      📞 {s.telefon}
                    </p>
                  )}
                  {s.musteriEmail && (
                    <p className="text-[11px] text-slate-500">
                      ✉️ {s.musteriEmail}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => salonDuzenle(s)}
                    className="text-xs font-black bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => salonSil(s)}
                    className="text-xs font-black bg-rose-900/40 hover:bg-rose-900 text-rose-300 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
