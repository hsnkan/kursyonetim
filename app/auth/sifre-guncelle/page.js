"use client";

import { useState } from "react";

export default function SifreGuncellePage() {
  const [email, setEmail] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHata("");

    if (!email) {
      setHata("E-posta adresi zorunludur.");
      return;
    }

    if (yeniSifre.length < 6) {
      setHata("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (yeniSifre !== yeniSifreTekrar) {
      setHata("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/sifre-sifirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          islem: "sifre_guncelle", // 👈 API'nin beklediği tam işlem parametresi
          email: email.trim().toLowerCase(),
          yeniSifre,
        }),
      });

      const data = await res.json();

      if (data.success || res.ok) {
        // 🚀 Şifre güncellendi; oturum kapatılıp normal giriş ekranına yönlendiriliyor
        window.location.href = "/auth/login?updated=true";
      } else {
        setHata(data.error || "Şifre güncellenirken bir hata oluştu.");
      }
    } catch {
      setHata("Sunucu ile bağlantı kurulamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl mx-auto flex items-center justify-center text-amber-400 text-2xl">
            🔑
          </div>
          <h1 className="text-xl font-black uppercase text-white">
            Yeni Şifre Belirleyin
          </h1>
          <p className="text-xs text-slate-400">
            Geçici şifrenizi güncellemek için e-posta adresinizi ve yeni
            şifrenizi girin.
          </p>
        </div>

        {hata && (
          <div className="p-3 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-xl text-xs font-bold text-center">
            {hata}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
              E-Posta Adresi
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
              Yeni Şifre
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={yeniSifre}
              onChange={(e) => setYeniSifre(e.target.value)}
              placeholder="En az 6 karakter..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
              Yeni Şifre (Tekrar)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={yeniSifreTekrar}
              onChange={(e) => setYeniSifreTekrar(e.target.value)}
              placeholder="Yeni şifrenizi tekrar girin..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
          >
            {loading
              ? "Güncelleniyor..."
              : "Şifremi Güncelle ve Giriş Ekranına Dön"}
          </button>
        </form>
      </div>
    </div>
  );
}
