"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBranding } from "@/app/components/BrandingProvider";
import BrandingLogo3D from "@/app/components/BrandingLogo3D";
import { modulErisilebilir, varsayilanDashboardYolu } from "@/lib/ozellikler";
import {
  IconNfc,
  IconStudents,
  IconAnnounce,
  IconReports,
  IconFinance,
  IconAudit,
  IconProfile,
  IconDev,
  IconLogout,
} from "@/app/components/NavIcons";

export default function Navbar() {
  const pathname = usePathname();
  const branding = useBranding();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setUserRole(data.user.rol || data.user.role);
        }
      } catch {
        // Rol çekilemezse müşteri olarak varsay
      }
    };
    checkUserRole();
  }, []);

  const isActive = (path) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const navLinks = [
    {
      name: "NFC Yoklama",
      href: "/dashboard/yoklama/nfc",
      ozellik: "nfcYoklama",
      icon: <IconNfc />,
    },
    {
      name: "Öğrenci Yönetimi",
      href: "/dashboard/ogrenciler",
      ozellik: "ogrenciYonetimi",
      icon: <IconStudents />,
    },
    {
      name: "Duyurular",
      href: "/dashboard/duyurular",
      ozellik: "duyurular",
      icon: <IconAnnounce />,
    },
    {
      name: "Raporlar",
      href: "/dashboard/raporlar",
      ozellik: "raporlar",
      icon: <IconReports />,
    },
    {
      name: "Aidat & Kasa Takibi",
      href: "/dashboard/muhasebe",
      ozellik: "muhasebe",
      icon: <IconFinance />,
    },
    {
      name: "İşlem Geçmişi",
      href: "/dashboard/audit",
      ozellik: "auditLog",
      icon: <IconAudit />,
    },
    {
      name: "Profil & Güvenlik",
      href: "/dashboard/profil",
      icon: <IconProfile />,
    },
    ...(userRole === "developer"
      ? [
          {
            name: "Geliştirici Paneli",
            href: "/admin/kullanicilar",
            isDev: true,
            icon: <IconDev />,
          },
        ]
      : []),
  ].filter(
    (link) =>
      !link.ozellik ||
      modulErisilebilir(
        { rol: userRole },
        branding.ozellikler,
        link.ozellik,
      ),
  );

  const cikisYap = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Çıkış yaparken hata:", err);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  const anaSayfaYolu =
    userRole === "developer"
      ? "/admin/kullanicilar"
      : varsayilanDashboardYolu(branding.ozellikler);

  return (
    <aside className="w-full md:w-64 bg-[#0F172A] border-r border-slate-800 text-white flex flex-col justify-between shrink-0 min-h-screen sticky top-0 z-40 shadow-2xl">
      <div>
        <Link
          href={anaSayfaYolu}
          className="p-6 border-b border-slate-800 flex items-center space-x-3 group block"
        >
          <div className="group-hover:scale-105 transition-transform">
            <BrandingLogo3D
              logoSrc={branding.logoSrc || "/logo.png"}
              alt={`${branding.salonAdi} Logo`}
              size={56}
              borderColor={branding.temaRengi || "#f59e0b"}
              unoptimized={Boolean(branding.logoBase64)}
            />
          </div>
          <div>
            <h2
              className="font-black tracking-wider text-base uppercase leading-tight"
              style={{ color: branding.temaRengi || "#f59e0b" }}
            >
              {(branding.salonAdi || "BALANS").split(" ")[0]}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {branding.altBaslik || "Yönetim Paneli"}
            </p>
          </div>
        </Link>

        <nav className="p-4 space-y-1.5">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const isDev = link.isDev;
            const activeBorder = isDev ? "border-purple-400" : "border-amber-400";
            const activeIcon = isDev ? "text-purple-300" : "text-amber-400";

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 border-2 ${
                  active
                    ? `${activeBorder} bg-slate-800/70 shadow-lg shadow-black/20`
                    : "border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white hover:border-slate-700/80"
                }`}
              >
                <span className={active ? activeIcon : "text-slate-500"}>
                  {link.icon}
                </span>
                <span
                  className={`font-bold leading-snug px-2 py-0.5 rounded-lg border-2 transition-all ${
                    active
                      ? `${activeBorder} text-white font-black bg-slate-900/40`
                      : "border-transparent"
                  }`}
                >
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={cikisYap}
          className="w-full flex items-center justify-center space-x-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 font-bold py-3 rounded-xl transition-colors text-sm shadow-sm cursor-pointer"
        >
          <IconLogout />
          <span>Güvenli Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
