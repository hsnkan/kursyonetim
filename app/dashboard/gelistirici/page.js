"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function GelistiriciPage() {
  const GIZLI_PIN = "2026"; // Geliştirici Giriş PIN Kodu

  const HEFTANIN_GUNLERI = [
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
    "Pazar",
  ];

  const [pin, setPin] = useState("");
  const [yetkili, setYetkili] = useState(false);
  const [pinHata, setPinHata] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState(null);

  // Geliştirici Grup Yönetim State'leri
  const [gruplar, setGruplar] = useState([]);
  const [yeniGrupAdi, setYeniGrupAdi] = useState("");
  const [secilenDersGunleri, setSecilenDersGunleri] = useState([]);
  const [whatsappLink, setWhatsappLink] = useState("");

  // Düzenleme Modalı State'i
  const [duzenleneceGrup, setDuzenleneceGrup] = useState(null);

  useEffect(() => {
    if (yetkili) {
      gruplariGetir();
    }
  }, [yetkili]);

  const gruplariGetir = async () => {
    try {
      const res = await fetch("/api/gruplar");
      const data = await res.json();
      if (data.success) {
        setGruplar(data.data || []);
      }
    } catch (err) {
      console.error("Gruplar çekilemedi:", err);
    }
  };

  const pinKontrolEt = (e) => {
    e.preventDefault();
    if (pin.trim() === GIZLI_PIN) {
      setYetkili(true);
      setPinHata(false);
    } else {
      setPinHata(true);
      setPin("");
    }
  };

  const bildirimGoster = (tip, metin) => {
    setMesaj({ tip, metin });
    setTimeout(() => {
      setMesaj(null);
    }, 5000);
  };

  // 🏆 YENİ GRUP OLUŞTURMA
  const yeniGrupKaydet = async (e) => {
    e.preventDefault();
    if (!yeniGrupAdi.trim())
      return bildirimGoster("hata", "Lütfen grup adını giriniz!");
    if (secilenDersGunleri.length === 0)
      return bildirimGoster("hata", "Lütfen en az 1 ders günü seçiniz!");

    setYukleniyor(true);
    try {
      const res = await fetch("/api/gruplar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-developer-pin": pin,
        },
        body: JSON.stringify({
          ad: yeniGrupAdi.trim(),
          dersGunleri: secilenDersGunleri,
          whatsappLink: whatsappLink.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        bildirimGoster("basari", "🎉 Yeni Grup Başarıyla Eklendi!");
        setYeniGrupAdi("");
        setSecilenDersGunleri([]);
        setWhatsappLink("");
        gruplariGetir();
      } else {
        bildirimGoster("hata", "✕ " + (data.error || "Grup eklenemedi"));
      }
    } catch (err) {
      bildirimGoster("hata", "✕ Grup oluşturulurken hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  // ✏️ MEVCUT GRUBU GÜNCELLEME
  const grupGuncelle = async (e) => {
    e.preventDefault();
    if (!duzenleneceGrup) return;

    setYukleniyor(true);
    try {
      const res = await fetch("/api/gruplar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-developer-pin": pin,
        },
        body: JSON.stringify(duzenleneceGrup),
      });
      const data = await res.json();

      if (data.success) {
        bildirimGoster(
          "basari",
          "✅ Grup Bilgileri ve Ders Günleri Güncellendi!",
        );
        setDuzenleneceGrup(null);
        gruplariGetir();
      } else {
        bildirimGoster("hata", "✕ " + (data.error || "Grup güncellenemedi"));
      }
    } catch (err) {
      bildirimGoster("hata", "✕ Grup güncellenirken sunucu hatası oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  // 🗑️ GRUP SİLME FONKSİYONU
  const grupSil = async (grup) => {
    if (
      !confirm(
        `'${grup.ad}' grubunu kalıcı olarak silmek istediğinize emin misiniz?`,
      )
    )
      return;

    setYukleniyor(true);
    try {
      const res = await fetch(`/api/gruplar?id=${grup._id}`, {
        method: "DELETE",
        headers: {
          "x-developer-pin": pin,
        },
      });
      const data = await res.json();

      if (data.success) {
        bildirimGoster(
          "basari",
          `🗑️ '${grup.ad}' grubu veritabanından silindi.`,
        );
        gruplariGetir();
      } else {
        bildirimGoster("hata", "✕ " + (data.error || "Grup silinemedi"));
      }
    } catch (err) {
      bildirimGoster("hata", "✕ Grup silinirken hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  const dersGunuToggle = (gun, isEdit = false) => {
    if (isEdit && duzenleneceGrup) {
      const mevcut = duzenleneceGrup.dersGunleri || [];
      const yeniGunler = mevcut.includes(gun)
        ? mevcut.filter((g) => g !== gun)
        : [...mevcut, gun];
      setDuzenleneceGrup({ ...duzenleneceGrup, dersGunleri: yeniGunler });
    } else {
      if (secilenDersGunleri.includes(gun)) {
        setSecilenDersGunleri(secilenDersGunleri.filter((g) => g !== gun));
      } else {
        setSecilenDersGunleri([...secilenDersGunleri, gun]);
      }
    }
  };

  // 🧹 SİSTEM VERİ SIFIRLAMA İŞLEMLERİ
  const veriSil = async (islem, onayMetni) => {
    if (!confirm(onayMetni)) return;

    if (islem === "tum_verileri_sifirla") {
      if (
        !confirm(
          "⚠️ SON UYARI: Öğrenciler, yoklamalar ve TÜM aidat kasa kayıtları kalıcı olarak silinecektir. Devam edilsin mi?",
        )
      )
        return;
    }

    setYukleniyor(true);
    try {
      const res = await fetch(`/api/gelistirici?islem=${islem}`, {
        method: "DELETE",
        headers: {
          "x-developer-pin": pin,
        },
      });
      const data = await res.json();

      if (data.success) {
        bildirimGoster("basari", `✅ ${data.message}`);
      } else {
        bildirimGoster("hata", `✕ ${data.error}`);
      }
    } catch (err) {
      bildirimGoster("hata", "✕ İşlem gerçekleştirilirken hata oluştu!");
    } finally {
      setYukleniyor(false);
    }
  };

  // 📊 EXCEL ŞABLONLARI İNDİRME
  const ornekOgrenciExcelIndir = () => {
    const ornekVeri = [
      {
        "Öğrenci Adı Soyadı": "Zeynep Kaya",
        Grup: gruplar[0]?.ad || "Salı–Perşembe 17:00–18:00",
        "Veli Adı": "Ayşe Kaya",
        Yakınlık: "Anne",
        "Veli Telefon": "05321112233",
        "Kan Grubu": "0 Rh+",
        "Lisanslı mı": "Evet",
        "Aylık Ücret": 2000,
        "Ödeme Günü": 1,
        "NFC Kart ID": "12345678",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(ornekVeri);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Öğrenci Kayıt Şablonu");
    XLSX.writeFile(wb, "Balans_Cimnastik_Ogrenci_Yukleme_Sablonu.xlsx");
  };

  const ornekOdemeExcelIndir = () => {
    const ornekVeri = [
      {
        "Öğrenci Adı Soyadı": "Zeynep Kaya",
        Yıl: 2025,
        Ay: 10,
        "Ödeme Tutarı": 2000,
        Açıklama: "Ekim 2025 Aidat Ödemesi",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(ornekVeri);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Geçmiş Ödeme Şablonu");
    XLSX.writeFile(wb, "Balans_Cimnastik_Gecmis_Odeme_Sablonu.xlsx");
  };

  // 📊 EXCEL YÜKLEME
  const excelTopluOgrenciYukle = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setYukleniyor(true);
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setYukleniyor(false);
          return bildirimGoster("hata", "✕ Excel dosyası boş!");
        }

        const yuklenecekler = data.map((item) => ({
          adSoyad: item["Öğrenci Adı Soyadı"] || item["adSoyad"] || "",
          grup: item["Grup"] || item["grup"] || "Salı–Perşembe 17:00–18:00",
          kanGrubu: item["Kan Grubu"] || "0 Rh+",
          lisansliMi: String(item["Lisanslı mı"]).toLowerCase() === "evet",
          aylikUcret: Number(item["Aylık Ücret"]) || 2000,
          odemeGunu: Number(item["Ödeme Günü"]) || 1,
          nfcKartId: item["NFC Kart ID"]
            ? String(item["NFC Kart ID"])
            : undefined,
          veliListesi: [
            {
              adSoyad: item["Veli Adı"] || "Veli",
              yakinlikDerecesi: item["Yakınlık"] || "Anne",
              telefon: String(item["Veli Telefon"] || "05000000000"),
            },
          ],
        }));

        const res = await fetch("/api/gelistirici", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-developer-pin": pin,
          },
          body: JSON.stringify({ yuklenecekler }),
        });

        const resData = await res.json();
        if (resData.success) {
          bildirimGoster("basari", `🚀 ${resData.message}`);
        } else {
          bildirimGoster("hata", `✕ ${resData.error}`);
        }
      } catch (err) {
        bildirimGoster("hata", "✕ Excel okunurken hata oluştu!");
      } finally {
        setYukleniyor(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const excelGecmisOdemeYukle = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setYukleniyor(true);
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setYukleniyor(false);
          return bildirimGoster("hata", "✕ Ödeme dosyası boş!");
        }

        const odemeler = data.map((item) => ({
          adSoyad: item["Öğrenci Adı Soyadı"] || item["adSoyad"] || "",
          yil: Number(item["Yıl"]) || Number(item["yil"]),
          ay: Number(item["Ay"]) || Number(item["ay"]),
          tutar: Number(item["Ödeme Tutarı"]) || Number(item["tutar"]),
          aciklama: item["Açıklama"] || item["aciklama"] || "",
        }));

        const res = await fetch("/api/gelistirici", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-developer-pin": pin,
          },
          body: JSON.stringify({
            islem: "gecmis_odeme_yukle",
            odemeler,
          }),
        });

        const resData = await res.json();
        if (resData.success) {
          bildirimGoster("basari", `💳 ${resData.message}`);
        } else {
          bildirimGoster("hata", `✕ ${resData.error}`);
        }
      } catch (err) {
        bildirimGoster("hata", "✕ Ödeme dosyası okunurken hata oluştu!");
      } finally {
        setYukleniyor(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  if (!yetkili) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border-2 border-purple-500/40 rounded-3xl shadow-2xl text-white space-y-6 text-center font-sans">
        <div className="w-16 h-16 bg-purple-950 border-2 border-purple-500 rounded-2xl mx-auto flex items-center justify-center text-purple-400 text-2xl shadow-lg">
          🔑
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Geliştirici Paneli</h1>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Bu alana sadece sistem geliştiricisi erişebilir. Lütfen PIN girin.
          </p>
        </div>

        <form onSubmit={pinKontrolEt} className="space-y-4">
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN Kodu..."
            className="w-full p-4 border-2 border-slate-700 focus:border-purple-500 rounded-2xl text-center text-2xl font-black text-white bg-slate-950 outline-none tracking-widest"
            autoFocus
          />

          {pinHata && (
            <p className="text-rose-400 text-xs font-bold animate-pulse">
              ⚠️ Hatalı PIN Girdiniz!
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            Panele Giriş Yap
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 text-slate-900 pb-12 font-sans">
      <div className="bg-[#0F172A] text-white p-6 rounded-3xl shadow-2xl border border-purple-500/30 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-purple-400 flex items-center gap-2">
            <span>⚙️</span> Geliştirici & Sistem Yöneticisi Paneli
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Sistem sıfırlama, grup ekleme/düzenleme/silme ve geçmiş ödeme kasası
            entegrasyonu.
          </p>
        </div>
        <span className="bg-purple-950 text-purple-300 border border-purple-700 px-3 py-1.5 rounded-xl font-mono text-xs font-black">
          ROOT / DEV
        </span>
      </div>

      {mesaj && (
        <div
          className={`p-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all ${
            mesaj.tip === "basari" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {mesaj.metin}
        </div>
      )}

      {/* 🏆 GRUP YÖNETİMİ (EKLEME, DÜZENLEME VE SİLME) */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-6">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
          <span>🏆</span> Grupları Yönet (Ders Günleri Düzenleme & Silme)
        </h2>

        {/* 1. MEVCUT GRUPLAR LİSTESİ VE DÜZENLE/SİL BUTONLARI */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase text-slate-500">
            Sistemdeki Tanımlı Gruplar ({gruplar.length}):
          </p>
          <div className="grid grid-cols-1 gap-3">
            {gruplar.map((g) => (
              <div
                key={g._id}
                className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
              >
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    🏆 {g.ad}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-md">
                      Ders Günleri: {g.dersGunleri?.join(", ") || "Tanımsız"}
                    </span>
                    {g.whatsappLink ? (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                        🔗 WhatsApp Katılım Linki Var
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        ⚠️ Link Yok
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDuzenleneceGrup(JSON.parse(JSON.stringify(g)))
                    }
                    className="bg-purple-600 hover:bg-purple-700 text-white font-black px-3.5 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    ✏️ Düzenle
                  </button>

                  <button
                    type="button"
                    onClick={() => grupSil(g)}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 font-black px-3 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. SIFIRDAN YENİ GRUP EKLEME FORMU */}
        <div className="pt-4 border-t-2 border-slate-100">
          <p className="text-xs font-black uppercase text-slate-700 mb-3">
            ➕ Yeni Grup & Ders Günleri Ekle:
          </p>
          <form onSubmit={yeniGrupKaydet} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Grup Adı ve Saati *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Özel Yetenek Grubu (15:00 - 16:30)"
                  value={yeniGrupAdi}
                  onChange={(e) => setYeniGrupAdi(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-slate-300 font-bold text-xs bg-slate-50 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  📲 Gruba Özel WhatsApp Davet Linki
                </label>
                <input
                  type="text"
                  placeholder="https://chat.whatsapp.com/..."
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-slate-300 font-bold text-xs bg-slate-50 outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                Ders Günlerini Seçiniz *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {HEFTANIN_GUNLERI.map((gun) => {
                  const secili = secilenDersGunleri.includes(gun);
                  return (
                    <button
                      key={gun}
                      type="button"
                      onClick={() => dersGunuToggle(gun, false)}
                      className={`p-2.5 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-between cursor-pointer ${
                        secili
                          ? "bg-purple-600 text-white border-purple-700 shadow-md"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{gun}</span>
                      <span>{secili ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={yukleniyor}
                className="px-6 py-3 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer"
              >
                Yeni Grubu Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ✏️ GRUP DÜZENLEME MODALI */}
      {duzenleneceGrup && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-900 max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 relative">
            <button
              onClick={() => setDuzenleneceGrup(null)}
              className="absolute top-4 right-4 font-black text-xl text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-black border-b border-slate-200 pb-2">
              ✏️ Grup Bilgilerini & Ders Günlerini Düzenle
            </h3>

            <form onSubmit={grupGuncelle} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Grup Adı
                </label>
                <input
                  type="text"
                  required
                  value={duzenleneceGrup.ad || ""}
                  onChange={(e) =>
                    setDuzenleneceGrup({
                      ...duzenleneceGrup,
                      ad: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl border-2 border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  📲 WhatsApp Davet Linki
                </label>
                <input
                  type="text"
                  placeholder="https://chat.whatsapp.com/..."
                  value={duzenleneceGrup.whatsappLink || ""}
                  onChange={(e) =>
                    setDuzenleneceGrup({
                      ...duzenleneceGrup,
                      whatsappLink: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl border-2 border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                  Ders Günleri Seçimi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {HEFTANIN_GUNLERI.map((gun) => {
                    const secili = (duzenleneceGrup.dersGunleri || []).includes(
                      gun,
                    );
                    return (
                      <button
                        key={gun}
                        type="button"
                        onClick={() => dersGunuToggle(gun, true)}
                        className={`p-2.5 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-between cursor-pointer ${
                          secili
                            ? "bg-purple-600 text-white border-purple-700 shadow-md"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{gun}</span>
                        <span>{secili ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDuzenleneceGrup(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={yukleniyor}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIFIRLAMA VE EXCEL BÖLÜMLERİ */}
      <div className="bg-rose-950/10 p-6 rounded-3xl border-2 border-rose-600 shadow-xl space-y-4">
        <h2 className="text-lg font-black text-rose-700 flex items-center gap-2">
          <span>🔥</span> STEP 1: Tüm Sistemi & Test Verilerini Sıfırla
        </h2>
        <button
          disabled={yukleniyor}
          onClick={() =>
            veriSil(
              "tum_verileri_sifirla",
              "⚠️ DİKKAT: Veritabanındaki TÜM Öğrenciler, Yoklamalar ve Kasa Ödemeleri Kalıcı Olarak SİLİNECEKTİR. Devam edilsin mi?",
            )
          }
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl text-sm uppercase shadow-lg border-2 border-rose-700 cursor-pointer"
        >
          🧹 TÜM SİSTEM VERİLERİNİ TEMİZLE VE SIFIRLA
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-3 gap-2">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>🎓</span> STEP 2: Toplu Öğrenci Kaydı İçe Aktar (.xlsx)
          </h2>
          <button
            type="button"
            onClick={ornekOgrenciExcelIndir}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>📥</span>
            <span>Öğrenci Excel Şablonu İndir</span>
          </button>
        </div>
        <div className="border-2 border-dashed border-purple-300 p-6 rounded-2xl text-center bg-purple-50/40">
          <label className="cursor-pointer bg-purple-700 hover:bg-purple-800 text-white font-black px-6 py-3.5 rounded-xl text-xs inline-block shadow-md">
            <span>📁 Öğrenci Excel Dosyasını Yükle</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              disabled={yukleniyor}
              onChange={excelTopluOgrenciYukle}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border-2 border-emerald-200 shadow-xl space-y-4 bg-emerald-50/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-200 pb-3 gap-2">
          <h2 className="text-lg font-black text-emerald-950 flex items-center gap-2">
            <span>💳</span> STEP 3: Geçmiş Ödemeleri Kasa İçin İçe Aktar (.xlsx)
          </h2>
          <button
            type="button"
            onClick={ornekOdemeExcelIndir}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>📥</span>
            <span>Ödeme Excel Şablonu İndir</span>
          </button>
        </div>
        <div className="border-2 border-dashed border-emerald-300 p-6 rounded-2xl text-center bg-white">
          <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3.5 rounded-xl text-xs inline-block shadow-md">
            <span>📁 Geçmiş Ödeme Excel Dosyasını Yükle</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              disabled={yukleniyor}
              onChange={excelGecmisOdemeYukle}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
