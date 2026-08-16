"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleGiris = async (e) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Giriş başarılı, HttpOnly Cookie sunucuda set edildi
        window.location.href = "/ogrenciler";
      } else {
        setHata(data.error || "Kullanıcı adı veya şifre hatalı!");
      }
    } catch (err) {
      setHata("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-md w-full p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-800 text-center">
        {/* RESMİ BALANS CİMNASTİK LOGOSU */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-32 h-32 mb-4 drop-shadow-lg flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Balans Cimnastik Akademi Logo"
              className="w-full h-full rounded-full object-cover border-4 border-amber-400 shadow-md"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://ui-avatars.com/api/?name=Balans+Cimnastik&background=0F172A&color=F59E0B&size=140";
              }}
            />
          </div>

          <h1 className="text-2xl font-black text-slate-950 tracking-tight uppercase">
            BALANS CİMNASTİK AKADEMİ
          </h1>
          <p className="text-xs font-black text-amber-600 uppercase tracking-widest mt-1">
            Yönetim & Takip Sistemi
          </p>
        </div>

        {/* HATA MESAJI BİLDİRİMİ */}
        {hata && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl animate-shake">
            ⚠️ {hata}
          </div>
        )}

        {/* GİRİŞ FORMU */}
        <form onSubmit={handleGiris} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Yönetici kullanıcı adınız"
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
        </form>
      </div>
    </div>
  );
}
