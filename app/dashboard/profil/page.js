"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/app/components/PageHeader";
import { IconProfile } from "@/app/components/NavIcons";
import PasswordInput from "@/app/components/PasswordInput";
import GymnastSuccessAnimation, {
  GYMNAST_ANIM_MS,
} from "@/app/components/GymnastSuccessAnimation";
import { useBranding } from "@/app/components/BrandingProvider";
import LicenseStatusBadge, {
  LicenseWarningBanner,
  dismissLicenseBanner,
  isLicenseBannerDismissed,
} from "@/app/components/LicenseStatusBadge";
import GelistiriciKartvizit from "@/app/components/GelistiriciKartvizit";
import { SECURITY_QUESTIONS } from "@/lib/securityQuestions";

export default function ProfilPage() {
  const branding = useBranding();
  const destekAdi = branding.teknikDestekAdi || "Yazılım Desteği";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [hesap, setHesap] = useState({
    adSoyad: "",
    kullaniciAdi: "",
    email: "",
    kurtarmaEmail: "",
    securityQuestion: "",
    hasSecurityAnswer: false,
    sifreDegistirmeZorunlu: false,
    loading: true,
  });
  const [hesapForm, setHesapForm] = useState({
    adSoyad: "",
    kullaniciAdi: "",
    email: "",
    kurtarmaEmail: "",
    securityQuestion: "",
    gizliCevap: "",
    mevcutSifre: "",
    yeniSifre: "",
    yeniSifreTekrar: "",
  });

  // Lisans Bilgileri State'leri
  const [licenseInfo, setLicenseInfo] = useState({
    kalanGun: null,
    bitisTarihi: "",
    uyariGerekli: false,
    sinirsiz: false,
    loading: true,
  });
  const [licenseBannerDismissed, setLicenseBannerDismissed] = useState(false);

  // 2FA State'leri
  const [qrCode, setQrCode] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  const [veriYukleme, setVeriYukleme] = useState({
    bekleyenler: [],
    izin: { aktif: false, bitis: null },
    loading: true,
  });
  const [veriYuklemeIslemId, setVeriYuklemeIslemId] = useState(null);

  // 💳 Sayfa Yüklendiğinde Lisans Bilgisini Getir
  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const res = await fetch("/api/license/check");
        const data = await res.json();
        if (data.success) {
          setLicenseInfo({
            kalanGun: data.kalanGun,
            bitisTarihi: data.bitisTarihi,
            uyariGerekli: Boolean(data.uyariGerekli),
            sinirsiz: Boolean(data.sinirsiz),
            loading: false,
          });
          setLicenseBannerDismissed(
            isLicenseBannerDismissed(data.bitisTarihi),
          );
        }
      } catch {
        setLicenseInfo((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchLicense();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.success) {
          setHesap({
            adSoyad: data.user.adSoyad || "",
            kullaniciAdi: data.user.kullaniciAdi || "",
            email: data.user.email || "",
            kurtarmaEmail: data.user.kurtarmaEmail || "",
            securityQuestion: data.user.securityQuestion || "",
            hasSecurityAnswer: Boolean(data.user.hasSecurityAnswer),
            sifreDegistirmeZorunlu: Boolean(data.user.sifreDegistirmeZorunlu),
            loading: false,
          });
          setHesapForm((prev) => ({
            ...prev,
            adSoyad: data.user.adSoyad || "",
            kullaniciAdi: data.user.kullaniciAdi || "",
            email: data.user.email || "",
            kurtarmaEmail: data.user.kurtarmaEmail || "",
            securityQuestion: data.user.securityQuestion || "",
          }));
        } else {
          setHesap((prev) => ({ ...prev, loading: false }));
        }
      } catch {
        setHesap((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchVeriYuklemeler = async () => {
      try {
        const res = await fetch("/api/user/bekleyen-yuklemeler");
        const data = await res.json();
        if (data.success) {
          setVeriYukleme({
            bekleyenler: data.bekleyenler || [],
            izin: data.izin || { aktif: false, bitis: null },
            loading: false,
          });
        } else {
          setVeriYukleme((prev) => ({ ...prev, loading: false }));
        }
      } catch {
        setVeriYukleme((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchVeriYuklemeler();
  }, []);

  const handleHesapKaydet = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const kullaniciAdiDegisti =
      hesapForm.kullaniciAdi.trim().toLowerCase() !==
      (hesap.kullaniciAdi || "").trim().toLowerCase();
    const emailDegisti =
      hesapForm.email.trim().toLowerCase() !== hesap.email.toLowerCase();
    const sifreDegisiyor = hesapForm.yeniSifre.length > 0;
    const gizliCevapDegisiyor = hesapForm.gizliCevap.trim().length > 0;
    const gizliSoruDegisti =
      hesapForm.securityQuestion !== (hesap.securityQuestion || "");

    if (sifreDegisiyor) {
      if (hesapForm.yeniSifre.length < 6) {
        setMessage("❌ Yeni şifre en az 6 karakter olmalıdır.");
        setLoading(false);
        return;
      }
      if (hesapForm.yeniSifre !== hesapForm.yeniSifreTekrar) {
        setMessage("❌ Yeni şifreler birbiriyle eşleşmiyor.");
        setLoading(false);
        return;
      }
    }

    if (
      (kullaniciAdiDegisti ||
        emailDegisti ||
        sifreDegisiyor ||
        gizliCevapDegisiyor ||
        gizliSoruDegisti) &&
      !hesapForm.mevcutSifre
    ) {
      setMessage(
        "❌ Kullanıcı adı, e-posta, şifre veya gizli soru değiştirmek için mevcut şifrenizi girmelisiniz.",
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adSoyad: hesapForm.adSoyad.trim(),
          kullaniciAdi: hesapForm.kullaniciAdi.trim(),
          email: hesapForm.email.trim(),
          kurtarmaEmail: hesapForm.kurtarmaEmail.trim(),
          securityQuestion: hesapForm.securityQuestion || undefined,
          gizliCevap: gizliCevapDegisiyor
            ? hesapForm.gizliCevap.trim()
            : undefined,
          mevcutSifre: hesapForm.mevcutSifre || undefined,
          yeniSifre: sifreDegisiyor ? hesapForm.yeniSifre : undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage("❌ " + (data.error || "Güncelleme başarısız."));
        return;
      }

      setHesap({
        adSoyad: data.user.adSoyad,
        kullaniciAdi: data.user.kullaniciAdi || "",
        email: data.user.email,
        kurtarmaEmail: data.user.kurtarmaEmail || "",
        securityQuestion: data.user.securityQuestion || "",
        hasSecurityAnswer: Boolean(data.user.hasSecurityAnswer),
        sifreDegistirmeZorunlu: Boolean(data.user.sifreDegistirmeZorunlu),
        loading: false,
      });
      setHesapForm((prev) => ({
        ...prev,
        adSoyad: data.user.adSoyad,
        kullaniciAdi: data.user.kullaniciAdi || "",
        email: data.user.email,
        kurtarmaEmail: data.user.kurtarmaEmail || "",
        securityQuestion: data.user.securityQuestion || "",
        gizliCevap: "",
        mevcutSifre: "",
        yeniSifre: "",
        yeniSifreTekrar: "",
      }));
      setMessage("✅ " + (data.message || "Hesap bilgileriniz güncellendi."));
    } catch {
      setMessage("❌ Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // 🛠️ 3 Saatlik Teknik Destek İzni Verme
  const handleSupportGrant = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/grant-support", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage(
          `✅ ${destekAdi} ekibine 3 saatlik inceleme izni başarıyla verildi! (Bitiş: ${data.bitisTarihi || "3 Saat Sonra"})`,
        );
      } else {
        setMessage("❌ Hata: " + data.error);
      }
    } catch {
      setMessage("❌ İzin verilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleVeriYuklemeIzinVer = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/bekleyen-yuklemeler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem: "izin_ver" }),
      });
      const data = await res.json();
      if (data.success) {
        const bitisStr = data.bitis
          ? new Date(data.bitis).toLocaleString("tr-TR")
          : "72 saat sonra";
        setVeriYukleme((prev) => ({
          ...prev,
          izin: { aktif: true, bitis: data.bitis },
        }));
        setMessage(
          `✅ 72 saatlik veri yükleme izni tanımlandı. Bu sürede geliştirici Excel yüklemeleri doğrudan uygulanabilir. (Bitiş: ${bitisStr})`,
        );
      } else {
        setMessage("❌ Hata: " + data.error);
      }
    } catch {
      setMessage("❌ İzin verilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleBekleyenYukleme = async (yuklemeId, islem) => {
    const onayMetni =
      islem === "onayla"
        ? "Geliştirici tarafından hazırlanan veri yüklemesi sisteminize uygulanacak. Onaylıyor musunuz?"
        : "Bu veri yükleme talebini reddetmek istediğinize emin misiniz?";

    if (!window.confirm(onayMetni)) return;

    setVeriYuklemeIslemId(yuklemeId);
    setMessage("");
    try {
      const res = await fetch("/api/user/bekleyen-yuklemeler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem, yuklemeId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ " + data.message);
        setVeriYukleme((prev) => ({
          ...prev,
          bekleyenler: prev.bekleyenler.filter((b) => b._id !== yuklemeId),
        }));
      } else {
        setMessage("❌ " + (data.error || "İşlem başarısız."));
      }
    } catch {
      setMessage("❌ Bağlantı hatası oluştu.");
    } finally {
      setVeriYuklemeIslemId(null);
    }
  };

  // 2FA Kurulum Başlat (QR Kod Getir)
  const setup2FA = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.qrCodeUrl);
        setSecretKey(data.secret);
      } else {
        setMessage("❌ QR Kod üretilemedi: " + data.error);
      }
    } catch {
      setMessage("❌ Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // 2FA Kodu Doğrula ve Etkinleştir
  const verify2FA = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (data.success) {
        setIs2FAEnabled(true);
        setQrCode("");
        setMessage("🎉 Google Authenticator başarıyla aktifleştirildi!");
        setSuccessAnim(true);
        setTimeout(() => setSuccessAnim(false), GYMNAST_ANIM_MS);
      } else {
        setMessage("❌ " + data.error);
      }
    } catch {
      setMessage("❌ Doğrulama sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 relative overflow-hidden">
      <GymnastSuccessAnimation active={successAnim} />

      <PageHeader
        title="Hesap, Lisans ve Güvenlik"
        subtitle="Lisans sürenizi, giriş bilgilerinizi, gizli sorunuzu ve güvenlik ayarlarınızı yönetin."
        icon={<IconProfile className="w-6 h-6" />}
      >
        <LicenseStatusBadge licenseInfo={licenseInfo} />
      </PageHeader>

      {!licenseBannerDismissed && (
        <LicenseWarningBanner
          licenseInfo={licenseInfo}
          onDismiss={() => {
            dismissLicenseBanner(licenseInfo.bitisTarihi);
            setLicenseBannerDismissed(true);
          }}
        />
      )}

      {message && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
          {message}
        </div>
      )}

      {/* 👤 HESAP AYARLARI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            👤 Hesap ve Giriş Bilgileri
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
            Giriş kullanıcı adınız, iletişim e-postanız, kurtarma e-postanız,
            gizli sorunuz ve şifrenizi buradan yönetin. Girişte{" "}
            <strong>kullanıcı adınız</strong> kullanılır; e-posta adresi yalnızca
            iletişim ve şifre sıfırlama içindir.
          </p>
        </div>

        {hesap.sifreDegistirmeZorunlu && (
          <div className="bg-amber-500/15 border border-amber-500/30 text-amber-200 rounded-xl p-3 text-xs font-bold">
            ⚠️ Geçici şifre ile giriş yaptınız. Lütfen aşağıdan kalıcı bir şifre
            belirleyin.
          </div>
        )}

        {hesap.loading ? (
          <p className="text-xs text-slate-500">Hesap bilgileri yükleniyor...</p>
        ) : (
          <form onSubmit={handleHesapKaydet} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={hesapForm.adSoyad}
                  onChange={(e) =>
                    setHesapForm({ ...hesapForm, adSoyad: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  Kullanıcı Adı (Giriş)
                </label>
                <input
                  type="text"
                  required
                  value={hesapForm.kullaniciAdi}
                  onChange={(e) =>
                    setHesapForm({
                      ...hesapForm,
                      kullaniciAdi: e.target.value,
                    })
                  }
                  placeholder="ornek: ahmet.yilmaz"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  İletişim E-Postası
                </label>
                <input
                  type="email"
                  required
                  value={hesapForm.email}
                  onChange={(e) =>
                    setHesapForm({ ...hesapForm, email: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  Kurtarma E-Postası
                </label>
                <input
                  type="email"
                  value={hesapForm.kurtarmaEmail}
                  onChange={(e) =>
                    setHesapForm({
                      ...hesapForm,
                      kurtarmaEmail: e.target.value,
                    })
                  }
                  placeholder="ornek@domain.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400 font-mono"
                />
              </div>
            </div>

            {!hesapForm.kurtarmaEmail && (
              <p className="text-[10px] text-amber-400/90 font-semibold">
                Kurtarma e-postası tanımlı değil — şifre sıfırlama bağlantısı
                iletişim e-postanıza gider.
              </p>
            )}

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-300">
                Gizli Soru ve Cevap
              </p>
              <p className="text-[10px] text-slate-500">
                E-posta erişiminiz olmadığında şifre sıfırlamak için kullanılır.
                {hesap.hasSecurityAnswer
                  ? " Mevcut cevabınız kayıtlı; değiştirmek için yeni cevap girin."
                  : " Henüz tanımlı değil."}
              </p>
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  Gizli Soru
                </label>
                <select
                  value={hesapForm.securityQuestion}
                  onChange={(e) =>
                    setHesapForm({
                      ...hesapForm,
                      securityQuestion: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="">— Soru seçin —</option>
                  {SECURITY_QUESTIONS.map((soru) => (
                    <option key={soru} value={soru}>
                      {soru}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  Gizli Cevap
                </label>
                <PasswordInput
                  value={hesapForm.gizliCevap}
                  onChange={(e) =>
                    setHesapForm({
                      ...hesapForm,
                      gizliCevap: e.target.value,
                    })
                  }
                  placeholder={
                    hesap.hasSecurityAnswer
                      ? "Değiştirmek için yeni cevap girin"
                      : "Gizli cevabınızı girin"
                  }
                  inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-300">Şifre Değiştir</p>
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  Mevcut Şifre
                </label>
                <PasswordInput
                  value={hesapForm.mevcutSifre}
                  onChange={(e) =>
                    setHesapForm({
                      ...hesapForm,
                      mevcutSifre: e.target.value,
                    })
                  }
                  placeholder="Değişiklik için gerekli"
                  inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Yeni Şifre
                  </label>
                  <PasswordInput
                    value={hesapForm.yeniSifre}
                    onChange={(e) =>
                      setHesapForm({ ...hesapForm, yeniSifre: e.target.value })
                    }
                    placeholder="En az 6 karakter"
                    inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Yeni Şifre (Tekrar)
                  </label>
                  <PasswordInput
                    value={hesapForm.yeniSifreTekrar}
                    onChange={(e) =>
                      setHesapForm({
                        ...hesapForm,
                        yeniSifreTekrar: e.target.value,
                      })
                    }
                    placeholder="Tekrar girin"
                    inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : "Hesap Bilgilerini Kaydet"}
            </button>
          </form>
        )}
      </div>

      {/* 💳 LİSANS DETAY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            💳 Yazılım Lisans Durumu
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Yıllık kiralama lisansınızın detayları. Özet bilgi sağ üst köşede
            görünür.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center text-xs text-slate-300 gap-2">
          <span>
            <strong>Lisans Bitiş Tarihi:</strong>{" "}
            {licenseInfo.loading
              ? "Yükleniyor..."
              : licenseInfo.bitisTarihi || "Tanımsız"}
          </span>
          {!licenseInfo.loading && licenseInfo.kalanGun !== null && (
            <span
              className={`font-black ${
                licenseInfo.kalanGun <= 30
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              Kalan: {licenseInfo.kalanGun} gün
            </span>
          )}
          <span className="text-slate-400 italic">
            * Lisans uzatması için sistem yöneticinizle iletişime geçin.
          </span>
        </div>
      </div>

      {/* 🛡️ 2. KART: KVKK / TEKNİK DESTEK İZNİ KARTI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🛡️ {destekAdi} İnceleme İzni (KVKK)
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
            Teknik bir sorun yaşadığınızda veya güncelleme kontrolü gerektiğinde
            destek ekibimize <strong>3 saatlik geçici erişim izni</strong>{" "}
            tanımlayabilirsiniz.
          </p>
        </div>
        <button
          onClick={handleSupportGrant}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
        >
          🔑 {destekAdi} — 3 Saatlik İzin Ver
        </button>
      </div>

      {/* 📊 VERİ YÜKLEME İZNİ (KVKK) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📊 Veri Yükleme İzni (KVKK)
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
            Geliştiricinin Excel ile toplu öğrenci veya geçmiş ödeme yüklemesi
            yapabilmesi için <strong>72 saatlik geçici izin</strong>{" "}
            tanımlayabilirsiniz. İzin yoksa yüklemeler onayınıza gönderilir;
            programı açtığınızda kabul edebilirsiniz.
          </p>
        </div>

        {veriYukleme.izin.aktif ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold text-sm">
            ✅ Veri yükleme izni aktif
            {veriYukleme.izin.bitis
              ? ` — Bitiş: ${new Date(veriYukleme.izin.bitis).toLocaleString("tr-TR")}`
              : ""}
          </div>
        ) : (
          <button
            onClick={handleVeriYuklemeIzinVer}
            disabled={loading || veriYukleme.loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
          >
            📤 Geliştiriciye 72 Saatlik Veri Yükleme İzni Ver
          </button>
        )}

        {!veriYukleme.loading && veriYukleme.bekleyenler.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <p className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Bekleyen yüklemeler
            </p>
            {veriYukleme.bekleyenler.map((b) => (
              <div
                key={b._id}
                className="p-4 bg-slate-950 border border-slate-700 rounded-xl space-y-3"
              >
                <div>
                  <p className="font-black text-white text-sm">
                    Geliştirici veri yüklemesi yapmak istiyor
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {b.tipEtiket} · {b.kayitSayisi} kayıt
                    {b.gelistiriciNotu ? ` · ${b.gelistiriciNotu}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={veriYuklemeIslemId === b._id}
                    onClick={() => handleBekleyenYukleme(b._id, "onayla")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-lg text-xs disabled:opacity-50 cursor-pointer"
                  >
                    ✅ Kabul Et ve Uygula
                  </button>
                  <button
                    type="button"
                    disabled={veriYuklemeIslemId === b._id}
                    onClick={() => handleBekleyenYukleme(b._id, "reddet")}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black px-4 py-2 rounded-lg text-xs border border-slate-600 disabled:opacity-50 cursor-pointer"
                  >
                    ✕ Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📱 3. KART: GOOGLE AUTHENTICATOR 2FA KARTI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📱 Google Authenticator (İki Faktörlü Doğrulama - 2FA)
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
            Hesabınızı korumak için Google Authenticator uygulamasını kullanarak
            her girişte 6 haneli güvenlik kodu talep edin.
          </p>
        </div>

        {is2FAEnabled ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold text-sm">
            🔒 Google Authenticator Hesabınızda Aktif!
          </div>
        ) : !qrCode ? (
          <button
            onClick={setup2FA}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
          >
            📲 Google Authenticator Kurulumunu Başlat
          </button>
        ) : (
          <div className="space-y-4 border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-300">
              1. Telefonunuzdaki <strong>Google Authenticator</strong>{" "}
              uygulamasını açıp aşağıdaki QR kodu taratın:
            </p>
            <div className="bg-white p-3 inline-block rounded-xl">
              <img
                src={qrCode}
                alt="Google Auth QR Code"
                className="w-44 h-44"
              />
            </div>
            <p className="text-xs text-slate-400">
              Alternatif Kurulum Anahtarı:{" "}
              <code className="bg-slate-800 text-amber-400 px-2 py-1 rounded">
                {secretKey}
              </code>
            </p>

            <div className="pt-2 space-y-2">
              <p className="text-xs text-slate-300">
                2. Uygulamanın ürettiği 6 haneli doğrulama kodunu girin:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="123456"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-indigo-500 w-40"
                />
                <button
                  onClick={verify2FA}
                  disabled={loading || verifyCode.length < 6}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Onayla & Aktifleştir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 📇 YAZILIM GELİŞTİRİCİ İLETİŞİM */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📇 Yazılım Geliştirici İletişim
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
            Teknik destek, lisans yenileme veya yazılım güncellemeleri için
            geliştiricinizle doğrudan iletişime geçebilirsiniz.
          </p>
        </div>
        <GelistiriciKartvizit variant="musteri" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white">📄 KVKK Bilgilendirme</h2>
        <p className="text-slate-400 text-xs mt-2 leading-relaxed">
          Kişisel verilerinizin işlenmesi hakkında aydınlatma metnini okuyabilirsiniz.
        </p>
        <a
          href="/gizlilik"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs font-bold text-sky-400 hover:text-sky-300 underline"
        >
          KVKK Aydınlatma Metni →
        </a>
      </div>
    </div>
  );
}
