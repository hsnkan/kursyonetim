"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function GirisSayfasi() {
  const router = useRouter();

  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [animasyonBasladi, setAnimasyonBasladi] = useState(false);

  const girisYap = async (e) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);

    try {
      // 🛡️ SUNUCU TARAFLI GÜVENLİ GİRİŞ İSTEĞİ
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: kullaniciAdi.trim(),
          password: sifre.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        // 🤸 KADIN & ERKEK SPORCU ANİMASYONUNU BAŞLAT
        setAnimasyonBasladi(true);

        // 3.8 saniyelik gösteri sonrası NFC Yoklama Sayfasına Yönlendir
        setTimeout(() => {
          router.push("/dashboard/yoklama/nfc");
        }, 3800);
      } else {
        setHata(data.error || "Kullanıcı adı veya şifre hatalı!");
        setYukleniyor(false);
      }
    } catch (err) {
      console.error("Giriş Hatası:", err);
      setHata("Sunucuya bağlanırken bir hata oluştu!");
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* 🤸‍♂️🤸‍♀️ KADIN VE ERKEK SPORCULARIN AKICI PARENDE SHOW SAHNESİ */}
      {animasyonBasladi && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center overflow-hidden pointer-events-none">
          {/* ORTADA YAZAN PRESTİJLİ HOŞ GELDİNİZ ROZETİ */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900/90 border-2 border-amber-400/60 text-amber-400 font-black px-8 py-3.5 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.3)] text-sm sm:text-base tracking-widest uppercase flex items-center gap-3 animate-pulse z-20">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span>Balans Cimnastik Paneline Bağlanılıyor...</span>
          </div>

          {/* 🤸‍♀️ 1. KADIN SPORCU (ÖNDEN GEÇEN) */}
          <div className="parende-kadin absolute left-0 flex flex-col items-center">
            <span className="text-[10rem] sm:text-[14rem] filter drop-shadow-[0_15px_35px_rgba(245,158,11,0.8)] select-none">
              🤸‍♀️
            </span>
          </div>

          {/* 🤸‍♂️ 2. ERKEK SPORCU (TAKİP EDEN) */}
          <div className="parende-erkek absolute left-0 flex flex-col items-center">
            <span className="text-[10rem] sm:text-[14rem] filter drop-shadow-[0_15px_35px_rgba(59,130,246,0.8)] select-none">
              🤸‍♂️
            </span>
          </div>

          {/* DÜZELTİLMİŞ KESİNTİSİZ AKICI CSS PARENDE STİLİ */}
          <style jsx>{`
            @keyframes parendeAkici {
              0% {
                transform: translateX(-30vw) translateY(30px) rotate(0deg);
              }
              50% {
                transform: translateX(45vw) translateY(-30px) rotate(720deg);
              }
              100% {
                transform: translateX(125vw) translateY(30px) rotate(1440deg);
              }
            }

            /* Kadın Sporcu Önde */
            .parende-kadin {
              animation: parendeAkici 3.6s linear forwards;
            }

            /* Erkek Sporcu Hafif Gecikmeli ve Takipte */
            .parende-erkek {
              animation: parendeAkici 3.6s linear forwards;
              animation-delay: 0.25s;
              margin-top: 40px;
            }
          `}</style>
        </div>
      )}

      {/* CİMNASTİK TEMALI DİNAMİK ARKA PLAN ÇİZGİLERİ */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M-100,200 C300,50 600,400 1200,100"
            stroke="#f59e0b"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M-50,400 C400,200 800,600 1500,200"
            stroke="#3b82f6"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>

      {/* ORTADAKİ GİRİŞ KART DIŞ GÖVDESİ */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl border-2 border-slate-200 z-10 space-y-6 text-slate-900">
        {/* AMBLEM & BAŞLIK (ORTA ÜST BÖLÜM) */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-amber-400 shadow-xl mb-4 bg-slate-900">
            <Image
              src="/logo.png"
              alt="Balans Cimnastik Akademi Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wider uppercase">
            BALANS CİMNASTİK
          </h1>
          <p className="text-xs font-black text-amber-600 tracking-widest uppercase mt-0.5">
            Akademi Yönetim Paneli
          </p>
        </div>

        {/* HATA BİLDİRİMİ */}
        {hata && (
          <div className="p-3.5 rounded-xl bg-rose-100 border-2 border-rose-400 text-rose-950 font-black text-xs text-center animate-shake">
            ⚠️ {hata}
          </div>
        )}

        {/* GİRİŞ FORMU */}
        <form onSubmit={girisYap} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              required
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              className="w-full p-3.5 rounded-xl border-2 border-slate-300 font-bold text-sm outline-none focus:border-amber-500 bg-slate-50 focus:bg-white text-slate-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              required
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3.5 rounded-xl border-2 border-slate-300 font-bold text-sm outline-none focus:border-amber-500 bg-slate-50 focus:bg-white text-slate-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full mt-2 bg-[#0F172A] hover:bg-slate-800 text-amber-400 font-black py-4 rounded-xl shadow-xl transition-all text-sm tracking-wider uppercase flex items-center justify-center gap-2 border-2 border-amber-400/50"
          >
            {yukleniyor ? "Giriş Yapılıyor..." : "Sisteme Giriş Yap 🚀"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            © Balans Cimnastik Akademi
          </p>
        </div>
      </div>
    </div>
  );
}
