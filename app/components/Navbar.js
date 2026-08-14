"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const navLinks = [
    {
      name: "NFC Yoklama",
      href: "/dashboard/yoklama/nfc",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0a2 2 0 100-4 2 2 0 000 4zm-8 0a2 2 0 100-4 2 2 0 000 4zm0 0H4m8 0a2 2 0 100-4 2 2 0 000 4zm0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 8V7m0 1v8m0 0v1m0-1c1.11 0 2.08-.402 2.599-1M12 8c-1.11 0-2.08.402-2.599 1M12 8c1.11 0 2.08.402 2.599 1"
          />
        </svg>
      ),
    },
    {
      name: "Öğrenci Yönetimi",
      href: "/dashboard/ogrenciler",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      name: "Duyurular",
      href: "/dashboard/duyurular",
      // Hoparlör / Megafon İkonu
      icon: (
        <svg
          className="w-5 h-5 text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 000-6M5.436 13.683A4.001 4.001 0 017 6h1.832c.41 0 .782-.241.948-.616l.482-1.088A1.99 1.99 0 0112.08 3h.84a1.99 1.99 0 011.818 1.296l.482 1.088c.166.375.538.616.948.616H18a4 4 0 014 4v.135a4 4 0 01-1.39 3.013"
          />
        </svg>
      ),
    },
    {
      name: "Raporlar",
      href: "/dashboard/raporlar",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      name: "Aidat & Kasa Takibi",
      href: "/dashboard/muhasebe",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      name: "Geliştirici Paneli",
      href: "/dashboard/gelistirici",
      icon: (
        <svg
          className="w-5 h-5 text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      ),
    },
  ];

  const cikisYap = async () => {
    try {
      // 🔒 Sunucuda HttpOnly Cookie'yi sil
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Çıkış yaparken hata:", err);
    } finally {
      localStorage.removeItem("isLoggedIn");
      window.location.href = "/";
    }
  };

  return (
    <aside className="w-full md:w-64 bg-[#0F172A] border-r border-slate-800 text-white flex flex-col justify-between shrink-0 min-h-screen sticky top-0 z-40 shadow-2xl">
      <div>
        {/* LOGO & MARKA */}
        <Link
          href="/dashboard/yoklama/nfc"
          className="p-6 border-b border-slate-800 flex items-center space-x-3 group block"
        >
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400 shadow-md group-hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt="Balans Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h2 className="font-black text-amber-400 tracking-wider text-base uppercase leading-tight">
              BALANS
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Yönetim Paneli
            </p>
          </div>
        </Link>

        {/* MENÜ LİNKLERİ */}
        <nav className="p-4 space-y-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const isDev = link.href === "/dashboard/gelistirici";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  active
                    ? isDev
                      ? "bg-purple-700 text-white shadow-lg shadow-purple-700/30 font-black scale-[1.02]"
                      : "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black scale-[1.02]"
                    : isDev
                      ? "text-purple-300 hover:bg-purple-950/40 hover:text-purple-100 border border-purple-900/40"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <span
                  className={
                    active
                      ? "text-white"
                      : isDev
                        ? "text-purple-400"
                        : "text-slate-400"
                  }
                >
                  {link.icon}
                </span>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ALT KISIM: GÜVENLİ ÇIKIŞ BUTONU */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={cikisYap}
          className="w-full flex items-center justify-center space-x-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 font-bold py-3 rounded-xl transition-colors text-sm shadow-sm cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Güvenli Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
