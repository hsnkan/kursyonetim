"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/app/components/PageHeader";
import { IconProfile } from "@/app/components/NavIcons";
import PasswordInput from "@/app/components/PasswordInput";
import GymnastSuccessAnimation, {
  GYMNAST_ANIM_MS,
} from "@/app/components/GymnastSuccessAnimation";

export default function ProfilPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [hesap, setHesap] = useState({
    email: "",
    kurtarmaEmail: "",
    sifreDegistirmeZorunlu: false,
    loading: true,
  });
  const [hesapForm, setHesapForm] = useState({
    email: "",
    kurtarmaEmail: "",
    mevcutSifre: "",
    yeniSifre: "",
    yeniSifreTekrar: "",
  });

  // Lisans Bilgileri State'leri
  const [licenseInfo, setLicenseInfo] = useState({
    kalanGun: null,
    bitisTarihi: "",
    uyariGerekli: false,
    loading: true,
  });

  // 2FA State'leri
  const [qrCode, setQrCode] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

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
            loading: false,
          });
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
            email: data.user.email || "",
            kurtarmaEmail: data.user.kurtarmaEmail || "",
            sifreDegistirmeZorunlu: Boolean(data.user.sifreDegistirmeZorunlu),
            loading: false,
          });
          setHesapForm((prev) => ({
            ...prev,
            email: data.user.email || "",
            kurtarmaEmail: data.user.kurtarmaEmail || "",
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

  const handleHesapKaydet = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const emailDegisti =
      hesapForm.email.trim().toLowerCase() !== hesap.email.toLowerCase();
    const sifreDegisiyor = hesapForm.yeniSifre.length > 0;

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

    if ((emailDegisti || sifreDegisiyor) && !hesapForm.mevcutSifre) {
      setMessage(
        "❌ E-posta veya şifre değiştirmek için mevcut şifrenizi girmelisiniz.",
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: hesapForm.email.trim(),
          kurtarmaEmail: hesapForm.kurtarmaEmail.trim(),
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
        email: data.user.email,
        kurtarmaEmail: data.user.kurtarmaEmail || "",
        sifreDegistirmeZorunlu: Boolean(data.user.sifreDegistirmeZorunlu),
        loading: false,
      });
      setHesapForm((prev) => ({
        ...prev,
        email: data.user.email,
        kurtarmaEmail: data.user.kurtarmaEmail || "",
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
          `✅ Balans Teknik Servis ekibine 3 saatlik inceleme izni başarıyla verildi! (Bitiş: ${data.bitisTarihi || "3 Saat Sonra"})`,
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
        subtitle="Lisans sürenizi, teknik destek izinlerinizi ve Google Authenticator güvenliğinizi yönetin."
        icon={<IconProfile className="w-6 h-6" />}
      />

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
            Giriş e-postanız (kullanıcı adınız), kurtarma e-postanız ve şifrenizi
            buradan yönetin. Şifre sıfırlama bağlantısı{" "}
            <strong>kurtarma e-postanıza</strong> gider; tanımlı değilse giriş
            e-postanıza gönderilir.
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
                  Giriş E-Postası (Kullanıcı Adı)
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
                Kurtarma e-postası tanımlı değil — şifre sıfırlama bağlantısı giriş
                e-postanıza gider.
              </p>
            )}

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

      {/* 💳 1. KART: YILLIK LİSANS VE KULLANIM SÜRESİ DURUMU */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        {!licenseInfo.loading &&
          licenseInfo.uyariGerekli &&
          licenseInfo.kalanGun !== null && (
            <div className="bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 rounded-xl p-4 text-sm font-bold flex items-start gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <div>
                <p>Lisans yenileme uyarısı</p>
                <p className="text-xs font-semibold text-amber-100/90 mt-1">
                  Yazılım lisansınızın bitmesine{" "}
                  <strong>{licenseInfo.kalanGun} gün</strong> kaldı. Kesintisiz
                  kullanım için sistem yöneticinizle iletişime geçin.
                </p>
              </div>
            </div>
          )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              💳 Yazılım Lisans Durumu
            </h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Yıllık kiralama lisansınızın kalan süresi ve aktif bitiş tarihi.
            </p>
          </div>

          {!licenseInfo.loading && licenseInfo.kalanGun !== null && (
            <div
              className={`px-4 py-2 rounded-xl border text-sm font-black flex items-center gap-2 ${
                licenseInfo.kalanGun <= 30
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              <span>⏳ Kalan Süre:</span>
              <span className="text-base">{licenseInfo.kalanGun} Gün</span>
            </div>
          )}
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center text-xs text-slate-300 gap-2">
          <span>
            <strong>Lisans Bitiş Tarihi:</strong>{" "}
            {licenseInfo.loading
              ? "Yükleniyor..."
              : licenseInfo.bitisTarihi || "Tanımsız"}
          </span>
          <span className="text-slate-400 italic">
            * Lisans uzatması ve teknik destek talepleri için sistem
            yöneticinizle iletişime geçin.
          </span>
        </div>
      </div>

      {/* 🛡️ 2. KART: KVKK / TEKNİK DESTEK İZNİ KARTI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🛡️ Balans Yazılım İnceleme İzni (KVKK)
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
          🔑 Balans Yazılım Desteğine 3 Saatlik İzin Ver
        </button>
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
