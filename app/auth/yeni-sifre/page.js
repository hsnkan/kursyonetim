"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/app/components/PasswordInput";

function YeniSifreForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHata("");
    setBasari("");

    if (!token) {
      setHata("Geçersiz veya eksik sıfırlama bağlantısı.");
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
          islem: "token_sifre_guncelle",
          token,
          yeniSifre,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setHata(data.error || "Şifre güncellenemedi.");
        return;
      }

      setBasari(data.message || "Şifreniz güncellendi.");
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch {
      setHata("Sunucu ile bağlantı kurulamadı.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="p-4 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-xl text-xs font-bold text-center space-y-3">
        <p>Sıfırlama bağlantısı geçersiz veya süresi dolmuş.</p>
        <Link
          href="/auth/sifremi-unuttum"
          className="inline-block text-amber-400 underline"
        >
          Yeni bağlantı iste →
        </Link>
      </div>
    );
  }

  return (
    <>
      {email && (
        <p className="text-[11px] text-slate-400 text-center font-mono">
          Hesap: {email}
        </p>
      )}

      {hata && (
        <div className="p-3 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-xl text-xs font-bold text-center">
          {hata}
        </div>
      )}

      {basari && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-xl text-xs font-bold text-center">
          {basari}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
            Yeni Şifre
          </label>
          <PasswordInput
            required
            minLength={6}
            value={yeniSifre}
            onChange={(e) => setYeniSifre(e.target.value)}
            placeholder="En az 6 karakter..."
            inputClassName="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
            Yeni Şifre (Tekrar)
          </label>
          <PasswordInput
            required
            minLength={6}
            value={yeniSifreTekrar}
            onChange={(e) => setYeniSifreTekrar(e.target.value)}
            placeholder="Yeni şifrenizi tekrar girin..."
            inputClassName="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading || Boolean(basari)}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
        >
          {loading ? "Kaydediliyor..." : "Yeni Şifreyi Kaydet"}
        </button>
      </form>
    </>
  );
}

export default function YeniSifrePage() {
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
            E-postanızdaki sıfırlama bağlantısı ile yeni şifrenizi oluşturun.
          </p>
        </div>

        <Suspense
          fallback={
            <p className="text-center text-xs text-slate-500">Yükleniyor...</p>
          }
        >
          <YeniSifreForm />
        </Suspense>

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
