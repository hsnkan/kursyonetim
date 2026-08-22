"use client";

import { useCallback, useEffect, useState } from "react";
import { OZELLIK_TANIMLARI, VARSAYILAN_OZELLIKLER } from "@/lib/ozellikler";

const BOS_FORM = {
  salonAdi: "",
  isletmeTamAdi: "",
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
  durum: "aktif",
  musteriEmail: "",
  gelistiriciEmail: "",
  kurtarmaEmail: "",
  kurtarmaTelefon: "",
  mailFromName: "",
  mailFromAddress: "",
  kurulumNotu: "",
  teknikDestekAdi: "",
  sistemBaslik: "",
  sistemAciklama: "NFC Yoklama ve Öğrenci Yönetimi",
  kayitFormUstBaslik: "",
  kayitFormAltBaslik: "",
  kayitFormSlogan: "★ ELİT EĞİTİM • GÜÇLÜ GELECEK • SINIRSIZ POTANSİYEL ★",
  raporFooterMetni: "",
  canliSiteUrl: "",
  ozellikler: { ...VARSAYILAN_OZELLIKLER },
};

function Alan({ label, hint, children }) {
  return (
    <div>
      <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

const inputCls =
  "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400";

export default function KurumTeslimTab({ bildirimGoster }) {
  const [form, setForm] = useState(BOS_FORM);
  const [logoOnizleme, setLogoOnizleme] = useState("/logo.png");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediyor, setKaydediyor] = useState(false);
  const [kaynak, setKaynak] = useState("");
  const [teslimListesi, setTeslimListesi] = useState(false);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const res = await fetch("/api/admin/kurum-yapilandirma");
      const data = await res.json();
      if (data.success && data.data) {
        setForm({
          ...BOS_FORM,
          ...data.data,
          ozellikler: {
            ...VARSAYILAN_OZELLIKLER,
            ...(data.data.ozellikler || {}),
          },
        });
        setLogoOnizleme(
          data.data.logoBase64 || data.data.logoSrc || data.data.logoUrl || "/logo.png",
        );
        setKaynak(data.kaynak === "veritabani" ? "Kayıtlı yapılandırma" : "Env varsayılanları");
      }
    } catch (err) {
      console.error(err);
      bildirimGoster("❌ Yapılandırma yüklenemedi.");
    } finally {
      setYukleniyor(false);
    }
  }, [bildirimGoster]);

  useEffect(() => {
    yukle();
  }, [yukle]);

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

  const otomatikDoldur = () => {
    const ad = form.salonAdi.trim();
    if (!ad) return alert("Önce kurum adını girin.");
    const tam = form.isletmeTamAdi.trim() || `${ad} Akademi`;
    setForm((prev) => ({
      ...prev,
      isletmeTamAdi: tam,
      whatsappImza: prev.whatsappImza || `${tam} 🤸‍♀️`,
      teknikDestekAdi: prev.teknikDestekAdi || `${ad} Yazılım Desteği`,
      sistemBaslik: prev.sistemBaslik || `${ad} - Kurs Yönetim Sistemi`,
      raporFooterMetni:
        prev.raporFooterMetni || `${tam} Otomatik Rapor Sistemleri`,
      kayitFormUstBaslik:
        prev.kayitFormUstBaslik || ad.split(" ")[0]?.toUpperCase() || ad.toUpperCase(),
      kayitFormAltBaslik:
        prev.kayitFormAltBaslik ||
        tam.replace(new RegExp(`^${ad}`, "i"), "").trim().toUpperCase() ||
        "AKADEMİ",
      mailFromName: prev.mailFromName || `${ad} Güvenlik`,
    }));
  };

  const kaydet = async (e) => {
    e.preventDefault();
    if (!form.salonAdi.trim()) {
      return alert("Kurum / salon adı zorunludur.");
    }

    setKaydediyor(true);
    try {
      const res = await fetch("/api/admin/kurum-yapilandirma", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          whatsappImza:
            form.whatsappImza.trim() ||
            `${form.isletmeTamAdi || form.salonAdi} 🤸‍♀️`,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        return alert(data.error || "Kayıt başarısız.");
      }
      bildirimGoster("✅ " + data.message);
      setKaynak("Kayıtlı yapılandırma");
      setTeslimListesi(true);
      await yukle();
    } catch {
      alert("Sunucu hatası.");
    } finally {
      setKaydediyor(false);
    }
  };

  if (yukleniyor) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-sm">
        Kurum yapılandırması yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
        <h2 className="text-lg font-black text-amber-400 uppercase flex items-center gap-2">
          🏁 Kurum Teslim Yapılandırması
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Yeni müşteriye teslim etmeden önce tüm marka, iletişim, modül ve form
          metinlerini buradan girin. <strong>Kaydet</strong> dediğinizde panel,
          raporlar, Word kayıt formu ve WhatsApp mesajları bu bilgilerle
          güncellenir. Kaynak: {kaynak}.
        </p>
        <button
          type="button"
          onClick={otomatikDoldur}
          className="mt-2 text-[11px] font-black text-sky-400 hover:text-sky-300 underline cursor-pointer"
        >
          Kurum adından eksik alanları otomatik doldur →
        </button>
      </div>

      <form onSubmit={kaydet} className="space-y-6">
        {/* 1. Kimlik */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase">
            1. Kurum Kimliği
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Alan label="Kurum / Salon Adı *" hint="Navbar ve giriş ekranı">
              <input
                required
                value={form.salonAdi}
                onChange={(e) => setForm({ ...form, salonAdi: e.target.value })}
                className={inputCls}
                placeholder="Örn: X Spor Akademisi"
              />
            </Alan>
            <Alan label="Tam Kurum Adı" hint="KVKK, Word formu, raporlar">
              <input
                value={form.isletmeTamAdi}
                onChange={(e) =>
                  setForm({ ...form, isletmeTamAdi: e.target.value })
                }
                className={inputCls}
                placeholder="Örn: X Spor Akademisi"
              />
            </Alan>
            <Alan label="Alt Başlık">
              <input
                value={form.altBaslik}
                onChange={(e) => setForm({ ...form, altBaslik: e.target.value })}
                className={inputCls}
              />
            </Alan>
            <Alan label="Kısa Kod (opsiyonel)">
              <input
                value={form.kisaKod}
                onChange={(e) => setForm({ ...form, kisaKod: e.target.value })}
                className={inputCls}
                placeholder="xspor"
              />
            </Alan>
            <Alan label="Canlı Site URL" hint="Teslim notu için">
              <input
                value={form.canliSiteUrl}
                onChange={(e) =>
                  setForm({ ...form, canliSiteUrl: e.target.value })
                }
                className={inputCls}
                placeholder="https://..."
              />
            </Alan>
            <Alan label="Tema Rengi">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.temaRengi}
                  onChange={(e) =>
                    setForm({ ...form, temaRengi: e.target.value })
                  }
                  className="h-10 w-14 rounded-lg cursor-pointer"
                />
                <input
                  value={form.temaRengi}
                  onChange={(e) =>
                    setForm({ ...form, temaRengi: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </Alan>
          </div>
        </section>

        {/* 2. Logo */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase">
            2. Logo & Görsel
          </h3>
          <div className="flex flex-wrap items-center gap-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-950">
              <img
                src={logoOnizleme}
                alt="Logo önizleme"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2">
              <input type="file" accept="image/*" onChange={logoYukle} />
              <input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className={inputCls}
                placeholder="/logo.png"
              />
            </div>
          </div>
        </section>

        {/* 3. İletişim */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase">
            3. İletişim Bilgileri
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Alan label="Telefon">
              <input
                value={form.telefon}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                className={inputCls}
              />
            </Alan>
            <Alan label="E-posta">
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </Alan>
            <Alan label="Adres" hint="Tam satır">
              <input
                value={form.adres}
                onChange={(e) => setForm({ ...form, adres: e.target.value })}
                className={inputCls}
              />
            </Alan>
            <Alan label="Web Sitesi">
              <input
                value={form.webSitesi}
                onChange={(e) =>
                  setForm({ ...form, webSitesi: e.target.value })
                }
                className={inputCls}
              />
            </Alan>
            <Alan label="WhatsApp Mesaj İmzası" hint="Duyuru mesajlarının sonu">
              <input
                value={form.whatsappImza}
                onChange={(e) =>
                  setForm({ ...form, whatsappImza: e.target.value })
                }
                className={inputCls}
              />
            </Alan>
          </div>
        </section>

        {/* 4. E-posta */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase">
            4. E-posta & Bildirimler
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Alan label="Gönderen Adı (Resend)">
              <input
                value={form.mailFromName}
                onChange={(e) =>
                  setForm({ ...form, mailFromName: e.target.value })
                }
                className={inputCls}
              />
            </Alan>
            <Alan label="Gönderen Adres (Resend domain)">
              <input
                value={form.mailFromAddress}
                onChange={(e) =>
                  setForm({ ...form, mailFromAddress: e.target.value })
                }
                className={inputCls}
                placeholder="bildirim@domain.com"
              />
            </Alan>
            <Alan label="Müşteri E-postası" hint="Lisans hatırlatması">
              <input
                value={form.musteriEmail}
                onChange={(e) =>
                  setForm({ ...form, musteriEmail: e.target.value })
                }
                className={inputCls}
              />
            </Alan>
            <Alan label="Geliştirici E-postası" hint="Teknik uyarılar">
              <input
                value={form.gelistiriciEmail}
                onChange={(e) =>
                  setForm({ ...form, gelistiriciEmail: e.target.value })
                }
                className={inputCls}
              />
            </Alan>
          </div>
        </section>

        {/* 5. Sistem metinleri */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase">
            5. Sistem & Destek Metinleri
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Alan label="Teknik Destek Adı" hint="Profil / KVKK destek izni">
              <input
                value={form.teknikDestekAdi}
                onChange={(e) =>
                  setForm({ ...form, teknikDestekAdi: e.target.value })
                }
                className={inputCls}
              />
            </Alan>
            <Alan label="Sistem Başlığı" hint="Tarayıcı sekmesi (env yedek)">
              <input
                value={form.sistemBaslik}
                onChange={(e) =>
                  setForm({ ...form, sistemBaslik: e.target.value })
                }
                className={inputCls}
              />
            </Alan>
            <Alan label="Rapor Alt Bilgisi">
              <input
                value={form.raporFooterMetni}
                onChange={(e) =>
                  setForm({ ...form, raporFooterMetni: e.target.value })
                }
                className={inputCls}
              />
            </Alan>
          </div>
        </section>

        {/* 6. Word form */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase">
            6. Sporcu Kayıt Formu (Word)
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Alan label="Üst Başlık (satır 1)">
              <input
                value={form.kayitFormUstBaslik}
                onChange={(e) =>
                  setForm({ ...form, kayitFormUstBaslik: e.target.value })
                }
                className={inputCls}
                placeholder="X SPOR"
              />
            </Alan>
            <Alan label="Alt Başlık (satır 2)">
              <input
                value={form.kayitFormAltBaslik}
                onChange={(e) =>
                  setForm({ ...form, kayitFormAltBaslik: e.target.value })
                }
                className={inputCls}
                placeholder="AKADEMİSİ"
              />
            </Alan>
            <Alan label="Slogan">
              <input
                value={form.kayitFormSlogan}
                onChange={(e) =>
                  setForm({ ...form, kayitFormSlogan: e.target.value })
                }
                className={inputCls}
              />
            </Alan>
          </div>
          <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-lg font-black tracking-widest text-amber-400">
              {form.kayitFormUstBaslik || "KURUM"}
            </p>
            <p className="text-sm font-bold text-white">
              {form.kayitFormAltBaslik || "AKADEMİSİ"}
            </p>
            <p className="text-[10px] text-amber-600 mt-1">
              {form.kayitFormSlogan}
            </p>
          </div>
        </section>

        {/* 7. Modüller */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase">
            7. Aktif Modüller (Sözleşmeye göre)
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(OZELLIK_TANIMLARI).map(([key, tanim]) => (
              <label
                key={key}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-700 bg-slate-950 cursor-pointer hover:border-amber-500/40"
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.ozellikler?.[key])}
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
                  <span className="text-xs font-black text-white block">
                    {tanim.label}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {tanim.aciklama}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* 8. Teslim notu */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase">
            8. Teslim Notları (iç kullanım)
          </h3>
          <textarea
            value={form.kurulumNotu}
            onChange={(e) => setForm({ ...form, kurulumNotu: e.target.value })}
            rows={4}
            className={`${inputCls} resize-y`}
            placeholder="Müşteriye özel notlar, Vercel env hatırlatmaları..."
          />
        </section>

        <div className="flex flex-wrap gap-3 sticky bottom-4 bg-slate-950/90 backdrop-blur p-4 rounded-2xl border border-slate-800">
          <button
            type="submit"
            disabled={kaydediyor}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black px-8 py-3 rounded-xl text-sm cursor-pointer shadow-lg"
          >
            {kaydediyor ? "Kaydediliyor..." : "💾 Kurum Yapılandırmasını Kaydet"}
          </button>
          <button
            type="button"
            onClick={yukle}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl text-sm cursor-pointer"
          >
            Yenile
          </button>
        </div>
      </form>

      {teslimListesi && (
        <div className="bg-emerald-950/40 border-2 border-emerald-500/40 rounded-3xl p-6 space-y-3">
          <h3 className="text-sm font-black text-emerald-400 uppercase">
            ✅ Teslim Öncesi Kontrol Listesi
          </h3>
          <ul className="text-xs text-emerald-100 space-y-2 list-disc pl-5">
            <li>Vercel env: MONGODB_URI, JWT_SECRET, RESEND_API_KEY, SITE_* (yedek)</li>
            <li>
              Müşteri hesabı oluşturuldu mu? (Müşteriler & Lisans sekmesi)
            </li>
            <li>Gruplar ve WhatsApp linkleri tanımlandı mı?</li>
            <li>USB NFC okuyucu test edildi mi?</li>
            {form.canliSiteUrl && (
              <li>
                Canlı adres:{" "}
                <a
                  href={form.canliSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 underline"
                >
                  {form.canliSiteUrl}
                </a>
              </li>
            )}
            <li>Müşteriye giriş e-postası ve geçici şifre verildi mi?</li>
          </ul>
        </div>
      )}
    </div>
  );
}
