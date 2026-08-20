"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CLIENT_SITE } from "@/lib/siteConfig.client";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [remember30Days, setRemember30Days] = useState(false);

  // 2FA Adım Yönetimi State'leri
  const [is2FA, setIs2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  // 🛡️ Cihaz İmzası Oluşturucu (30 Günlük Tanıma İçin)
  const getDeviceId = () => {
    if (typeof window === "undefined") return "";
    let devId = localStorage.getItem("balans_device_id");
    if (!devId) {
      devId = "dev_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("balans_device_id", devId);
    }
    return devId;
  };

  // 🔑 1. AŞAMA: Şifreli Giriş İsteği
  const handleGiris = async (e) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          deviceId: getDeviceId(),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setHata(data.error || "Kullanıcı adı veya şifre hatalı!");
        setYukleniyor(false);
        return;
      }

      // 🛡️ 2FA Doğrulaması Gerekiyorsa Ekranı Değiştir
      if (data.requireTwoFactor) {
        setIs2FA(true);
        setTempToken(data.tempToken);
        setYukleniyor(false);
        return;
      }

      // ✅ ROL BAZLI DİNAMİK YÖNLENDİRME (Geliştirici -> /admin, Müşteri -> /dashboard)
      const targetPath = data.redirectTo || "/dashboard/yoklama/nfc";
      window.location.href = targetPath;
    } catch (err) {
      setHata("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
      setYukleniyor(false);
    }
  };

  // 📱 2. AŞAMA: 2FA Kod Doğrulama İsteği
  const handle2FA = async (e) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);

    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken,
          code: twoFactorCode,
          deviceId: getDeviceId(),
          remember30Days,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setHata(data.error || "2FA Kodu hatalı.");
        setYukleniyor(false);
        return;
      }

      // ✅ 2FA Sonrası Rol Bazlı Yönlendirme
      const targetPath = data.redirectTo || "/dashboard/yoklama/nfc";
      window.location.href = targetPath;
    } catch (err) {
      setHata("Doğrulama sırasında bir hata oluştu.");
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-md w-full p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-800 text-center">
        {/* RESMİ BALANS CİMNASTİK LOGOSU */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-32 h-32 mb-4 drop-shadow-lg flex items-center justify-center">
            <img
              src={CLIENT_SITE.logoUrl}
              alt={`${CLIENT_SITE.isletmeTamAdi} Logo`}
              className="w-full h-full rounded-full object-cover border-4 border-amber-400 shadow-md"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(CLIENT_SITE.isletmeAdi)}&background=0F172A&color=F59E0B&size=140`;
              }}
            />
          </div>

          <h1 className="text-2xl font-black text-slate-950 tracking-tight uppercase">
            {CLIENT_SITE.isletmeTamAdi}
          </h1>
          <p className="text-xs font-black text-amber-600 uppercase tracking-widest mt-1">
            {is2FA
              ? "📱 İKİ AŞAMALI DOĞRULAMA (2FA)"
              : "Yönetim & Takip Sistemi"}
          </p>
        </div>

        {/* HATA MESAJI BİLDİRİMİ */}
        {hata && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl animate-shake">
            ⚠️ {hata}
          </div>
        )}

        {/* 1. ADIM: STANDART GİRİŞ FORMU */}
        {!is2FA ? (
          <form onSubmit={handleGiris} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                Kullanıcı Adı / E-Posta
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Yönetici e-posta adresi"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                Şifre
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black py-4 rounded-2xl text-sm transition shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
            >
              <span>{yukleniyor ? "⏳" : "🚀"}</span>
              {yukleniyor ? "Giriş Yapılıyor..." : "Yönetim Paneline Giriş Yap"}
            </button>

            {/* 🔑 ŞİFREMİ UNUTTUM SEÇENEĞİ */}
            <div className="text-center pt-2">
              <a
                href="/auth/sifremi-unuttum"
                className="text-xs font-black text-slate-500 hover:text-amber-600 transition-colors uppercase tracking-wider"
              >
                Şifrenizi mi unuttunuz?
              </a>
            </div>
          </form>
        ) : (
          /* 2. ADIM: GOOGLE AUTHENTICATOR (2FA) FORMU */
          <form onSubmit={handle2FA} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                Google Authenticator Kodu (6 Haneli)
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-amber-600 font-mono text-center tracking-widest text-2xl rounded-xl font-black focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 🗓️ 30 GÜN HATIRLA KUTUCUĞU */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember30"
                checked={remember30Days}
                onChange={(e) => setRemember30Days(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <label
                htmlFor="remember30"
                className="text-xs font-bold text-slate-700 cursor-pointer select-none"
              >
                Bu bilgisayarı 30 gün boyunca hatırla
              </label>
            </div>

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 text-slate-950 font-black py-4 rounded-2xl text-sm transition shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
            >
              <span>{yukleniyor ? "⏳" : "🔒"}</span>
              {yukleniyor ? "KOD DOĞRULANIYOR..." : "KODU DOĞRULA VE GİRİŞ YAP"}
            </button>
          </form>
        )}
      </div>

      {/* 🔒 KVKK VE BİLGİ GÜVENLİĞİ BİLDİRİMİ */}
      <div className="mt-6 text-center max-w-md space-y-2">
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          🔒 Bu sistem 6698 sayılı KVKK standartlarına uygun olarak uçtan uca
          şifrelenmektedir. Oturum verileriniz güvenli HTTP-Only çerez protokolü
          ile korunmaktadır.
        </p>
        <Link
          href="/gizlilik"
          className="text-[11px] font-bold text-amber-600 hover:text-amber-500 underline"
        >
          KVKK Aydınlatma Metnini Oku
        </Link>
      </div>
    </div>
  );
}
