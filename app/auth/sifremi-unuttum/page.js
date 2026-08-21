"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/app/components/PasswordInput";

export default function SifremiUnuttumPage() {
  const router = useRouter();

  // YÖNTEM SEÇİMİ: "email" | "gizli_soru"
  const [yontem, setYontem] = useState("email");

  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(
    "İlk evcil hayvanınızın adı nedir?",
  );
  const [gizliCevap, setGizliCevap] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [mesaj, setMesaj] = useState({ tip: "", metin: "" });
  const [loading, setLoading] = useState(false);

  const SoruSecenekleri = [
    "İlk evcil hayvanınızın adı nedir?",
    "İlkokul öğretmeninizin adı nedir?",
    "Doğduğunuz şehir neresidir?",
    "En sevdiğiniz çocukluk arkadaşınızın adı nedir?",
    "Annenizin kızlık soyadı nedir?",
  ];

  // 1. E-POSTA İLE SIFIRLAMA LİNKİ İSTEĞİ
  const handleEmailReset = async (e) => {
    e.preventDefault();
    setMesaj({ tip: "", metin: "" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sifre-sifirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          islem: "email_link_gonder",
          email,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMesaj({ tip: "hata", metin: data.error || "İşlem başarısız." });
        setLoading(false);
        return;
      }

      setMesaj({
        tip: "basari",
        metin:
          "📧 Sıfırlama bağlantısı e-posta adresinize gönderildi! Lütfen gelen kutunuzu kontrol edin.",
      });
    } catch {
      setMesaj({ tip: "hata", metin: "Sunucu hatası oluştu." });
    } finally {
      setLoading(false);
    }
  };

  // 2. GİZLİ SORU İLE DOĞRUDAN SIFIRLAMA
  const handleGizliSoruReset = async (e) => {
    e.preventDefault();
    setMesaj({ tip: "", metin: "" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sifre-sifirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          islem: "gizli_soru_sifirla",
          email,
          securityQuestion,
          gizliCevap,
          yeniSifre,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMesaj({ tip: "hata", metin: data.error || "İşlem başarısız." });
        setLoading(false);
        return;
      }

      setMesaj({ tip: "basari", metin: "🎉 " + data.message });
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch {
      setMesaj({ tip: "hata", metin: "Sunucu hatası oluştu." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-amber-400 uppercase">
            🔑 Şifremi Unuttum
          </h1>
          <p className="text-xs text-slate-400">
            Hesabınıza yeniden erişmek için aşağıdaki yöntemlerden birini seçin
          </p>
        </div>

        {/* TAB / YÖNTEM SEÇİMİ */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setYontem("email");
              setMesaj({ tip: "", metin: "" });
            }}
            className={`py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              yontem === "email"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📧 E-Posta Bağlantısı
          </button>

          <button
            type="button"
            onClick={() => {
              setYontem("gizli_soru");
              setMesaj({ tip: "", metin: "" });
            }}
            className={`py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              yontem === "gizli_soru"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ❓ Gizli Soru
          </button>
        </div>

        {mesaj.metin && (
          <div
            className={`p-3 text-xs rounded-xl text-center font-bold ${
              mesaj.tip === "hata"
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {mesaj.metin}
          </div>
        )}

        {/* YÖNTEM 1: E-POSTA İLE LİNK GÖNDERME FORMU */}
        {yontem === "email" && (
          <form onSubmit={handleEmailReset} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Kayıtlı E-Posta Adresiniz
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
                placeholder="ornek@domain.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 text-slate-950 font-black py-3 rounded-xl transition-all text-sm cursor-pointer shadow-lg"
            >
              {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
            </button>
          </form>
        )}

        {/* YÖNTEM 2: GİZLİ SORU İLE DOĞRUDAN SIFIRLAMA FORMU */}
        {yontem === "gizli_soru" && (
          <form onSubmit={handleGizliSoruReset} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                E-Posta Adresiniz
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
                placeholder="ornek@domain.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Gizli Sorunuzu Seçin
              </label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
              >
                {SoruSecenekleri.map((soru, index) => (
                  <option key={index} value={soru}>
                    {soru}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Gizli Soru Cevabınız
              </label>
              <input
                type="text"
                required
                value={gizliCevap}
                onChange={(e) => setGizliCevap(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
                placeholder="Cevabınızı yazın..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Yeni Şifreniz
              </label>
              <PasswordInput
                required
                minLength={6}
                value={yeniSifre}
                onChange={(e) => setYeniSifre(e.target.value)}
                placeholder="En az 6 karakter"
                inputClassName="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 text-slate-950 font-black py-3 rounded-xl transition-all text-sm cursor-pointer shadow-lg"
            >
              {loading ? "Sıfırlanıyor..." : "Şifremi Sıfırla"}
            </button>
          </form>
        )}

        {/* ALT LİNK: GİRİŞ EKRANINA DÖN */}
        <div className="text-center pt-2 border-t border-slate-800">
          <Link
            href="/auth/login"
            className="text-xs font-bold text-slate-400 hover:text-amber-400 transition"
          >
            ← Giriş Ekranına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
