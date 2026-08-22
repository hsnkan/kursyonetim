"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import SalonKurulumTab from "./SalonKurulumTab";
import KurumTeslimTab from "./KurumTeslimTab";
import { calculateRemainingLicenseDays } from "@/lib/license";

export default function SuperAdminDashboard() {
  const HEFTANIN_GUNLERI = [
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
    "Pazar",
  ];

  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [aktifSekme, setAktifSekme] = useState("kullanicilar");

  // MÜŞTERİ STATE'LERİ
  const [users, setUsers] = useState([]);
  const [duzenlenecekUser, setDuzenlenecekUser] = useState(null);

  const [yeniMusteriModal, setYeniMusteriModal] = useState(false);
  const [yeniMusteriForm, setYeniMusteriForm] = useState({
    salonId: "",
    salonAdi: "",
    adSoyad: "",
    kullaniciAdi: "",
    email: "",
    sabitSifre: "",
  });

  const [salonlar, setSalonlar] = useState([]);

  const [duzenleForm, setDuzenleForm] = useState({
    userId: "",
    salonAdi: "",
    adSoyad: "",
    kullaniciAdi: "",
    email: "",
    geciciSifre: "",
  });

  const [customDays, setCustomDays] = useState({});

  // GRUP STATE'LERİ
  const [gruplar, setGruplar] = useState([]);
  const [yeniGrupAdi, setYeniGrupAdi] = useState("");
  const [secilenDersGunleri, setSecilenDersGunleri] = useState([]);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [duzenleneceGrup, setDuzenleneceGrup] = useState(null);

  const [bekleyenYuklemeler, setBekleyenYuklemeler] = useState([]);
  const [veriYuklemeIzinAktif, setVeriYuklemeIzinAktif] = useState(false);

  useEffect(() => {
    kullanicilariGetir();
    gruplariGetir();
    salonlariGetir();
  }, []);

  useEffect(() => {
    if (aktifSekme !== "excel") return;
    bekleyenYuklemeleriGetir();
  }, [aktifSekme]);

  const bekleyenYuklemeleriGetir = async () => {
    try {
      const res = await fetch("/api/admin/bekleyen-yukleme");
      const data = await res.json();
      if (data.success) {
        setBekleyenYuklemeler(data.data || []);
        setVeriYuklemeIzinAktif(Boolean(data.izinAktif));
      }
    } catch {
      // sessiz geç
    }
  };

  const salonlariGetir = async () => {
    try {
      const res = await fetch("/api/admin/salonlar");
      const data = await res.json();
      if (data.success) setSalonlar(data.data || []);
    } catch (err) {
      console.error("Salonlar çekilemedi:", err);
    }
  };

  const bildirimGoster = (metin) => {
    setMesaj(metin);
    setTimeout(() => setMesaj(""), 5000);
  };

  // 🚪 GÜVENLİ ÇIKIŞ (Ortak Login Sayfasına Yönlendirir)
  const handleCikis = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Çıkış yapılırken hata:", e);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  // --- MÜŞTERİ İŞLEMLERİ ---
  const kullanicilariGetir = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (err) {
      console.error("Kullanıcılar çekilemedi:", err);
    }
  };

  const handleYeniMusteriEkle = async (e) => {
    e.preventDefault();
    setYukleniyor(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...yeniMusteriForm,
          sifreDegistirmeZorunlu: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        bildirimGoster(
          `🎉 '${yeniMusteriForm.salonAdi}' başarıyla oluşturuldu!`,
        );
        setYeniMusteriModal(false);
        setYeniMusteriForm({
          salonId: "",
          salonAdi: "",
          adSoyad: "",
          kullaniciAdi: "",
          email: "",
          sabitSifre: "",
        });
        kullanicilariGetir();
      } else {
        alert("✕ Hata: " + data.error);
      }
    } catch {
      alert("Müşteri oluşturulurken sunucu hatası.");
    } finally {
      setYukleniyor(false);
    }
  };

  const handleLisansAyarla = async (userId, salonAdi, gun) => {
    const gunDegisimi = Number(gun);
    if (!Number.isFinite(gunDegisimi) || gunDegisimi === 0) {
      return alert("Lütfen geçerli bir gün sayısı giriniz (+ uzatır, - kısaltır).");
    }

    const islemMetni =
      gunDegisimi > 0
        ? `+${gunDegisimi} gün uzatılsın`
        : `${Math.abs(gunDegisimi)} gün kısaltılsın`;

    if (
      !confirm(
        `💳 '${salonAdi}' müşterisinin lisansı ${islemMetni} mı?\n\nNot: İlk kayıt tarihinden itibaren 365 günün altına indirilemez.`,
      )
    )
      return;

    try {
      setYukleniyor(true);
      const res = await fetch("/api/admin/license/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, gunDegisimi }),
      });

      const data = await res.json();
      if (data.success) {
        bildirimGoster(`✅ ${data.message}`);
        setCustomDays((prev) => ({ ...prev, [userId]: "" }));
        kullanicilariGetir();
      } else {
        alert("✕ Hata: " + data.error);
      }
    } catch {
      alert("Sunucu hatası.");
    } finally {
      setYukleniyor(false);
    }
  };

  const formatLisansBitis = (licenseEndDate) => {
    if (!licenseEndDate) return "—";
    const bitis = new Date(licenseEndDate);
    const kalanGun = calculateRemainingLicenseDays(licenseEndDate);
    const tarih = bitis.toLocaleDateString("tr-TR");
    if (kalanGun === null) return tarih;
    if (kalanGun < 0) return `${tarih} (süresi dolmuş)`;
    return `${tarih} (${kalanGun} gün kaldı)`;
  };

  // ✏️ KULLANICI BİLGİLERİ VE ŞİFRE DÜZENLEME
  const handleKullaniciGuncelle = async (e) => {
    e.preventDefault();
    setYukleniyor(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duzenleForm),
      });

      const data = await res.json();
      if (data.success) {
        bildirimGoster(`✅ Kullanıcı bilgileri başarıyla güncellendi!`);
        setDuzenlenecekUser(null);
        kullanicilariGetir();
      } else {
        alert("Hata: " + data.error);
      }
    } catch {
      alert("Sunucu hatası.");
    } finally {
      setYukleniyor(false);
    }
  };

  const handle2FASifirla = async (user) => {
    if (
      !confirm(
        `⚠️ '${user.salonAdi || user.email}' için 2FA kilidini kaldırmak istediğinize emin misiniz?`,
      )
    )
      return;

    try {
      setYukleniyor(true);
      const res = await fetch("/api/admin/reset-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();

      if (data.success) {
        bildirimGoster(`🔓 2FA kilidi başarıyla kaldırıldı!`);
        kullanicilariGetir();
      } else {
        alert("✕ Hata: " + data.error);
      }
    } catch {
      alert("2FA sıfırlanamadı.");
    } finally {
      setYukleniyor(false);
    }
  };

  const handleDestekGirisi = async (targetUserId) => {
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = "/dashboard/yoklama/nfc";
      } else {
        alert("❌ " + data.error);
      }
    } catch {
      alert("Destek oturumu başlatılamadı.");
    }
  };

  // --- GRUP İŞLEMLERİ ---
  const gruplariGetir = async () => {
    try {
      const res = await fetch("/api/gruplar");
      const data = await res.json();
      if (data.success) setGruplar(data.data || []);
    } catch (err) {
      console.error("Gruplar çekilemedi:", err);
    }
  };

  const yeniGrupKaydet = async (e) => {
    e.preventDefault();
    if (!yeniGrupAdi.trim()) return alert("Grup adı giriniz.");
    if (secilenDersGunleri.length === 0)
      return alert("En az 1 ders günü seçiniz.");

    setYukleniyor(true);
    try {
      const res = await fetch("/api/gruplar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad: yeniGrupAdi.trim(),
          dersGunleri: secilenDersGunleri,
          whatsappLink: whatsappLink.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        bildirimGoster("🎉 Yeni Grup Eklendi!");
        setYeniGrupAdi("");
        setSecilenDersGunleri([]);
        setWhatsappLink("");
        gruplariGetir();
      } else {
        alert("✕ " + (data.error || "Grup eklenemedi"));
      }
    } catch {
      alert("Grup oluşturulurken hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  const grupGuncelle = async (e) => {
    e.preventDefault();
    if (!duzenleneceGrup) return;
    setYukleniyor(true);
    try {
      const res = await fetch("/api/gruplar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duzenleneceGrup),
      });
      const data = await res.json();
      if (data.success) {
        bildirimGoster("✅ Grup Güncellendi!");
        setDuzenleneceGrup(null);
        gruplariGetir();
      } else {
        alert("✕ " + data.error);
      }
    } catch {
      alert("Sunucu hatası.");
    } finally {
      setYukleniyor(false);
    }
  };

  const grupSil = async (grup) => {
    if (!confirm(`'${grup.ad}' grubunu silmek istediğinize emin misiniz?`))
      return;
    setYukleniyor(true);
    try {
      const res = await fetch(`/api/gruplar?id=${grup._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        bildirimGoster(`🗑️ '${grup.ad}' silindi.`);
        gruplariGetir();
      } else {
        alert("✕ " + data.error);
      }
    } catch {
      alert("Grup silinemedi.");
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

  // --- EXCEL İŞLEMLERİ ---
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
    XLSX.writeFile(wb, "Balans_Ogrenci_Yukleme_Sablonu.xlsx");
  };

  const ornekOdemeExcelIndir = () => {
    const ornekVeri = [
      {
        "Öğrenci Adı Soyadı": "Zeynep Kaya",
        Yıl: 2026,
        Ay: 10,
        "Ödeme Tutarı": 2000,
        Açıklama: "Ekim 2026 Aidat Ödemesi",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(ornekVeri);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Geçmiş Ödeme Şablonu");
    XLSX.writeFile(wb, "Balans_Gecmis_Odeme_Sablonu.xlsx");
  };

  const excelTopluOgrenciYukle = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setYukleniyor(true);
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

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

        const res = await fetch("/api/admin/bekleyen-yukleme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tip: "ogrenci_excel",
            payload: { yuklenecekler },
          }),
        });
        const resData = await res.json();
        if (resData.success) {
          if (resData.mod === "hemen_uygulandi") {
            bildirimGoster(`🚀 ${resData.message}`);
          } else {
            bildirimGoster(`📋 ${resData.message}`);
          }
          bekleyenYuklemeleriGetir();
        } else alert(`✕ ${resData.error}`);
      } catch {
        alert("Excel okunurken hata oluştu.");
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
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const odemeler = data.map((item) => ({
          adSoyad: item["Öğrenci Adı Soyadı"] || item["adSoyad"] || "",
          yil: Number(item["Yıl"]) || Number(item["yil"]),
          ay: Number(item["Ay"]) || Number(item["ay"]),
          tutar: Number(item["Ödeme Tutarı"]) || Number(item["tutar"]),
          aciklama: item["Açıklama"] || item["aciklama"] || "",
        }));

        const res = await fetch("/api/admin/bekleyen-yukleme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tip: "gecmis_odeme_excel",
            payload: { odemeler },
          }),
        });
        const resData = await res.json();
        if (resData.success) {
          if (resData.mod === "hemen_uygulandi") {
            bildirimGoster(`💳 ${resData.message}`);
          } else {
            bildirimGoster(`📋 ${resData.message}`);
          }
          bekleyenYuklemeleriGetir();
        } else alert(`✕ ${resData.error}`);
      } catch {
        alert("Dosya okunamadı.");
      } finally {
        setYukleniyor(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ÜST BAŞLIK, ÇIKIŞ VE SEKME MENÜSÜ */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-amber-400 uppercase flex items-center gap-2">
                👑 Geliştirici & Teknik Servis Paneli
              </h1>
              <p className="text-xs text-slate-400">
                Müşteri Yönetimi, Şifre ve Kullanıcı Adı Düzenleme, 2FA
                Sıfırlama
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setYeniMusteriModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>➕</span> Yeni Müşteri Ekle
              </button>

              {/* 🚪 GÜVENLİ ÇIKIŞ BUTONU */}
              <button
                onClick={handleCikis}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center gap-1"
              >
                🚪 Güvenli Çıkış
              </button>
            </div>
          </div>

          {/* TAB SEÇİMLERİ */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setAktifSekme("kullanicilar")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                aktifSekme === "kullanicilar"
                  ? "bg-amber-500 text-slate-950 shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              👥 Müşteriler & Lisans Yönetimi
            </button>

            <button
              onClick={() => setAktifSekme("kurum-teslim")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                aktifSekme === "kurum-teslim"
                  ? "bg-rose-600 text-white shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🏁 Kurum Teslim Yapılandırması
            </button>

            <button
              onClick={() => setAktifSekme("kurs-kurulum")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                aktifSekme === "kurs-kurulum"
                  ? "bg-sky-600 text-white shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🏢 Kurs / Salon Kurulumu
            </button>

            <button
              onClick={() => setAktifSekme("gruplar")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                aktifSekme === "gruplar"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🏆 Grupları Yönet
            </button>

            <button
              onClick={() => setAktifSekme("excel")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                aktifSekme === "excel"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              📁 Excel Yükleme & Şablonlar
            </button>
          </div>
        </div>

        {mesaj && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-2xl text-sm font-bold animate-pulse">
            {mesaj}
          </div>
        )}

        {aktifSekme === "kurum-teslim" && (
          <KurumTeslimTab bildirimGoster={bildirimGoster} />
        )}

        {/* ================= SEKME: KURS / SALON KURULUMU ================= */}
        {aktifSekme === "kurs-kurulum" && (
          <SalonKurulumTab bildirimGoster={bildirimGoster} />
        )}

        {/* ================= SEKME 1: MÜŞTERİ YÖNETİMİ & LİSANS ================= */}
        {aktifSekme === "kullanicilar" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-4">Salon / İşletme</th>
                  <th className="p-4">Kullanıcı Adı / Yetkili</th>
                  <th className="p-4">Şifre Durumu</th>
                  <th className="p-4">2FA Durumu</th>
                  <th className="p-4">Lisans Bitiş</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-white">{u.salonAdi}</td>
                    <td className="p-4 font-mono text-xs">
                      <span className="text-amber-400 font-mono block">
                        {u.kullaniciAdi || u.adSoyad || "—"}
                      </span>
                      <span className="text-slate-400">{u.adSoyad}</span>
                      <span className="text-slate-500 text-[10px] block">
                        {u.email}
                      </span>
                      {u.kurtarmaEmail ? (
                        <span className="text-sky-400/80 block mt-1 text-[10px]">
                          Kurtarma: {u.kurtarmaEmail}
                        </span>
                      ) : (
                        <span className="text-slate-600 block mt-1 text-[10px] italic">
                          Kurtarma e-postası yok
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.sifreDegistirmeZorunlu ? (
                        <span className="text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                          ⚠️ İlk Giriş Bekleniyor
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                          ✅ Güncel
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.twoFactorEnabled ? (
                        <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          🔒 Aktif
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">Pasif</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-sky-300 block">
                        {formatLisansBitis(u.licenseEndDate)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Min. 365 gün (ilk kayıt)
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() =>
                            handleLisansAyarla(u._id, u.salonAdi || u.email, 30)
                          }
                          disabled={yukleniyor}
                          className="bg-amber-600/80 hover:bg-amber-500 text-slate-950 font-black px-2 py-1.5 rounded-lg text-[10px] transition cursor-pointer shadow-md"
                        >
                          +30G
                        </button>

                        <button
                          onClick={() =>
                            handleLisansAyarla(u._id, u.salonAdi || u.email, -30)
                          }
                          disabled={yukleniyor}
                          className="bg-rose-700/80 hover:bg-rose-600 text-white font-black px-2 py-1.5 rounded-lg text-[10px] transition cursor-pointer shadow-md"
                        >
                          -30G
                        </button>

                        <button
                          onClick={() =>
                            handleLisansAyarla(u._id, u.salonAdi || u.email, 365)
                          }
                          disabled={yukleniyor}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-2 py-1.5 rounded-lg text-[10px] transition cursor-pointer shadow-md"
                        >
                          +365G
                        </button>

                        <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5 ml-1">
                          <input
                            type="number"
                            placeholder="±Gün"
                            value={customDays[u._id] || ""}
                            onChange={(e) =>
                              setCustomDays({
                                ...customDays,
                                [u._id]: e.target.value,
                              })
                            }
                            className="w-16 bg-transparent text-white font-mono text-center text-xs outline-none font-bold"
                          />
                          <button
                            onClick={() =>
                              handleLisansAyarla(
                                u._id,
                                u.salonAdi || u.email,
                                customDays[u._id],
                              )
                            }
                            disabled={yukleniyor || !customDays[u._id]}
                            className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold px-2 py-1 rounded text-[10px] transition cursor-pointer"
                          >
                            Uygula
                          </button>
                        </div>

                        {/* ✏️ DÜZENLE VE ŞİFRE ATA BUTONU */}
                        <button
                          onClick={() => {
                            setDuzenlenecekUser(u);
                            setDuzenleForm({
                              userId: u._id,
                              salonAdi: u.salonAdi || "",
                              adSoyad: u.adSoyad || "",
                              kullaniciAdi: u.kullaniciAdi || "",
                              email: u.email || "",
                              geciciSifre: "",
                            });
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-black px-2.5 py-1.5 rounded-xl text-[10px] transition cursor-pointer ml-1"
                        >
                          ✏️ Düzenle / Şifre
                        </button>

                        {u.twoFactorEnabled && (
                          <button
                            onClick={() => handle2FASifirla(u)}
                            disabled={yukleniyor}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-black px-2.5 py-1.5 rounded-xl text-[10px] transition cursor-pointer shadow-md"
                          >
                            🔓 2FA
                          </button>
                        )}

                        <button
                          onClick={() => handleDestekGirisi(u._id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-2.5 py-1.5 rounded-xl text-[10px] transition cursor-pointer"
                        >
                          👁️ Giriş
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= SEKME 2: GRUP YÖNETİMİ ================= */}
        {aktifSekme === "gruplar" && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6">
            <h2 className="text-lg font-black text-amber-400 border-b border-slate-800 pb-3">
              🏆 Tanımlı Gruplar ({gruplar.length})
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {gruplar.map((g) => (
                <div
                  key={g._id}
                  className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                >
                  <div>
                    <h3 className="font-black text-sm text-white">🏆 {g.ad}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-[10px] font-black text-purple-400 bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded-md">
                        Ders Günleri: {g.dersGunleri?.join(", ") || "Tanımsız"}
                      </span>
                      {g.whatsappLink ? (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-md">
                          🔗 WhatsApp Link Var
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-rose-400 bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded-md">
                          ⚠️ Link Yok
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setDuzenleneceGrup(JSON.parse(JSON.stringify(g)))
                      }
                      className="bg-purple-600 hover:bg-purple-500 text-white font-black px-3.5 py-2 rounded-xl text-xs cursor-pointer"
                    >
                      ✏️ Düzenle
                    </button>
                    <button
                      onClick={() => grupSil(g)}
                      className="bg-rose-950/60 text-rose-400 border border-rose-800 hover:bg-rose-900 font-black px-3 py-2 rounded-xl text-xs cursor-pointer"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <p className="text-xs font-black uppercase text-slate-400">
                ➕ Yeni Grup Ekle:
              </p>
              <form onSubmit={yeniGrupKaydet} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Grup Adı ve Saati..."
                    value={yeniGrupAdi}
                    onChange={(e) => setYeniGrupAdi(e.target.value)}
                    className="p-3 rounded-xl border border-slate-700 font-bold text-xs bg-slate-950 text-white outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="WhatsApp Davet Linki..."
                    value={whatsappLink}
                    onChange={(e) => setWhatsappLink(e.target.value)}
                    className="p-3 rounded-xl border border-slate-700 font-bold text-xs bg-slate-950 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {HEFTANIN_GUNLERI.map((gun) => {
                    const secili = secilenDersGunleri.includes(gun);
                    return (
                      <button
                        key={gun}
                        type="button"
                        onClick={() => dersGunuToggle(gun, false)}
                        className={`p-2.5 rounded-xl text-xs font-black border transition flex justify-between cursor-pointer ${
                          secili
                            ? "bg-purple-600 text-white border-purple-500"
                            : "bg-slate-950 text-slate-400 border-slate-800"
                        }`}
                      >
                        <span>{gun}</span>
                        <span>{secili ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="submit"
                  disabled={yukleniyor}
                  className="px-6 py-3 rounded-xl text-xs font-black bg-purple-600 text-white shadow-md cursor-pointer hover:bg-purple-500"
                >
                  Yeni Grubu Kaydet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= SEKME 3: EXCEL AKTARIMLARI ================= */}
        {aktifSekme === "excel" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-blue-500/30 p-5 rounded-3xl shadow-xl space-y-3">
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider">
                🛡️ Müşteri Onaylı Veri Yükleme
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Excel yüklemeleri müşteri onayına tabidir. Müşteri{" "}
                <strong>Profil → Veri Yükleme İzni</strong> bölümünden 72
                saatlik izin verirse yükleme anında uygulanır; aksi halde
                kuyruğa alınır ve müşteri programı açtığında kabul edebilir.
              </p>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black ${
                  veriYuklemeIzinAktif
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {veriYuklemeIzinAktif
                  ? "✅ Müşteri veri yükleme izni aktif — yüklemeler doğrudan uygulanır"
                  : "⏳ Müşteri izni yok — yüklemeler onay kuyruğuna gider"}
              </div>
              {bekleyenYuklemeler.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <p className="text-[11px] font-black uppercase text-slate-500">
                    Onay bekleyen yüklemeler ({bekleyenYuklemeler.length})
                  </p>
                  {bekleyenYuklemeler.map((b) => (
                    <div
                      key={b._id}
                      className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800"
                    >
                      {b.ozet?.aciklama || b.tip} · {b.ozet?.kayitSayisi || 0}{" "}
                      kayıt ·{" "}
                      <span className="text-amber-400 font-bold">
                        {b.durum === "bekliyor" ? "Müşteri onayı bekliyor" : b.durum}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-lg font-black text-amber-400">
                  🎓 Toplu Öğrenci Kaydı (.xlsx)
                </h2>
                <button
                  onClick={ornekOgrenciExcelIndir}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  📥 Şablon İndir
                </button>
              </div>
              <div className="border-2 border-dashed border-purple-500/30 p-6 rounded-2xl text-center bg-purple-950/10">
                <label className="cursor-pointer bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-3.5 rounded-xl text-xs inline-block shadow-md">
                  📁 Öğrenci Excel Dosyasını Yükle
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

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-lg font-black text-emerald-400">
                  💳 Geçmiş Ödeme Kasası (.xlsx)
                </h2>
                <button
                  onClick={ornekOdemeExcelIndir}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  📥 Şablon İndir
                </button>
              </div>
              <div className="border-2 border-dashed border-emerald-500/30 p-6 rounded-2xl text-center bg-emerald-950/10">
                <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3.5 rounded-xl text-xs inline-block shadow-md">
                  📁 Geçmiş Ödeme Excel Dosyasını Yükle
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
        )}

        {/* ➕ YENİ MÜŞTERİ / SALON EKLEME MODALI */}
        {yeniMusteriModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl relative">
              <button
                onClick={() => setYeniMusteriModal(false)}
                className="absolute top-4 right-4 font-black text-xl text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>

              <h3 className="text-lg font-black text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                ➕ Yeni Müşteri / Salon Hesabı Oluştur
              </h3>

              <form onSubmit={handleYeniMusteriEkle} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                    Tanımlı Kurs / Salon Seç *
                  </label>
                  <select
                    required
                    value={yeniMusteriForm.salonId}
                    onChange={(e) => {
                      const secilen = salonlar.find(
                        (s) => s._id === e.target.value,
                      );
                      setYeniMusteriForm({
                        ...yeniMusteriForm,
                        salonId: e.target.value,
                        salonAdi: secilen?.salonAdi || "",
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500 font-bold cursor-pointer"
                  >
                    <option value="">— Önce Kurs/Salon Kurulumu sekmesinden salon oluşturun —</option>
                    {salonlar
                      .filter((s) => s.durum !== "pasif")
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.salonAdi} ({s.durum})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                    Salon / İşletme Adı
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Seçilen salondan otomatik dolar"
                    value={yeniMusteriForm.salonAdi}
                    onChange={(e) =>
                      setYeniMusteriForm({
                        ...yeniMusteriForm,
                        salonAdi: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                      Kullanıcı Adı (Giriş)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ahmet.yilmaz"
                      value={yeniMusteriForm.kullaniciAdi}
                      onChange={(e) =>
                        setYeniMusteriForm({
                          ...yeniMusteriForm,
                          kullaniciAdi: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                      İletişim E-Postası
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="salon@balans.com"
                      value={yeniMusteriForm.email}
                      onChange={(e) =>
                        setYeniMusteriForm({
                          ...yeniMusteriForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                      Yetkili Ad Soyad
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ahmet Yılmaz"
                      value={yeniMusteriForm.adSoyad}
                      onChange={(e) =>
                        setYeniMusteriForm({
                          ...yeniMusteriForm,
                          adSoyad: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                      Geçici Şifre
                    </label>
                    <input
                      type="text"
                      required
                      minLength={6}
                      placeholder="Balans2026!"
                      value={yeniMusteriForm.sabitSifre}
                      onChange={(e) =>
                        setYeniMusteriForm({
                          ...yeniMusteriForm,
                          sabitSifre: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500 font-black"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-bold">
                      Lisans süresi: <span className="text-emerald-400">365 gün (1 yıl)</span> — kurulumda otomatik atanır
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-medium">
                  🔒 **Not:** Yeni kullanıcı oluşturulduğunda ilk girişte
                  zorunlu olarak şifresini değiştirmesi istenecektir.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setYeniMusteriModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={yukleniyor}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md cursor-pointer"
                  >
                    {yukleniyor ? "Oluşturuluyor..." : "Müşteriyi Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ✏️ KULLANICI DÜZENLE / ŞİFRE DEĞİŞTİR MODALI */}
        {duzenlenecekUser && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative">
              <button
                onClick={() => setDuzenlenecekUser(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
              <h3 className="text-lg font-black text-amber-400">
                ✏️ Kullanıcı Bilgilerini & Şifresini Düzenle
              </h3>
              <form onSubmit={handleKullaniciGuncelle} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                    Salon / İşletme Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={duzenleForm.salonAdi}
                    onChange={(e) =>
                      setDuzenleForm({
                        ...duzenleForm,
                        salonAdi: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-amber-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                    Yetkili Ad Soyad
                  </label>
                  <input
                    type="text"
                    required
                    value={duzenleForm.adSoyad}
                    onChange={(e) =>
                      setDuzenleForm({
                        ...duzenleForm,
                        adSoyad: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-amber-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                    Kullanıcı Adı (Giriş)
                  </label>
                  <input
                    type="text"
                    required
                    value={duzenleForm.kullaniciAdi}
                    onChange={(e) =>
                      setDuzenleForm({
                        ...duzenleForm,
                        kullaniciAdi: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-amber-400 font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-amber-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                    İletişim E-Postası
                  </label>
                  <input
                    type="email"
                    required
                    value={duzenleForm.email}
                    onChange={(e) =>
                      setDuzenleForm({ ...duzenleForm, email: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-amber-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                    Yeni Geçici Şifre (Değiştirmeyecekseniz boş bırakın)
                  </label>
                  <input
                    type="text"
                    placeholder="Yeni geçici şifre..."
                    value={duzenleForm.geciciSifre}
                    onChange={(e) =>
                      setDuzenleForm({
                        ...duzenleForm,
                        geciciSifre: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setDuzenlenecekUser(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={yukleniyor}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                  >
                    {yukleniyor ? "Kaydediliyor..." : "Bilgileri Güncelle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ✏️ GRUP DÜZENLE MODAL */}
        {duzenleneceGrup && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl relative text-slate-100">
              <button
                onClick={() => setDuzenleneceGrup(null)}
                className="absolute top-4 right-4 font-black text-xl text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
              <h3 className="text-lg font-black border-b border-slate-800 pb-2 text-purple-400">
                ✏️ Grup Bilgilerini & Ders Günlerini Düzenle
              </h3>
              <form onSubmit={grupGuncelle} className="space-y-4">
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
                  className="w-full p-3 rounded-xl border border-slate-700 font-bold text-xs bg-slate-950 text-white outline-none focus:border-purple-500"
                />
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
                  className="w-full p-3 rounded-xl border border-slate-700 font-bold text-xs bg-slate-950 text-white outline-none focus:border-purple-500"
                />
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
                        className={`p-2.5 rounded-xl text-xs font-black border transition flex justify-between cursor-pointer ${
                          secili
                            ? "bg-purple-600 text-white border-purple-500"
                            : "bg-slate-950 text-slate-400 border-slate-800"
                        }`}
                      >
                        <span>{gun}</span>
                        <span>{secili ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDuzenleneceGrup(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={yukleniyor}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-md cursor-pointer"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
