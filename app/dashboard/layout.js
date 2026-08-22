import Navbar from "@/app/components/Navbar";
import BrandingProvider from "@/app/components/BrandingProvider";
import ModulePageGuard from "@/app/components/ModulePageGuard";
import BekleyenYuklemeBanner from "@/app/components/BekleyenYuklemeBanner";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSupportSessionBannerText } from "@/lib/siteConfig";

export default async function DashboardLayout({ children }) {
  // 🛡️ Oturum çerezinden Destek Girişi (Impersonation) kontrolü
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  let isSupportSession = false;
  let userRole = null;

  if (token) {
    try {
      const decoded = jwt.decode(token);
      isSupportSession = decoded?.isSupportSession || false;
      userRole = decoded?.rol || null;
    } catch (err) {
      // Token decode hatasında sessizce geç
    }
  }

  return (
    <BrandingProvider>
      <ModulePageGuard userRole={userRole} />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* 👁️ MÜŞTERİ MAHREMİYETİ & DESTEK İZNİ UYARI BANDI */}
      {isSupportSession && (
        <div className="bg-amber-500 text-slate-950 font-black text-xs py-2.5 px-4 text-center tracking-wider shadow-lg flex items-center justify-center gap-2 z-50 sticky top-0 uppercase border-b border-amber-600">
          <span className="inline-block w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
          <span>
            {getSupportSessionBannerText()}
          </span>
        </div>
      )}

      <BekleyenYuklemeBanner />

      <div className="flex flex-col md:flex-row flex-1 relative">
        {/* 🤸‍♂️ JİMNASTİK & PERFORMANS DİNAMİK ARKA PLAN ÇİZGİLERİ (SVG PATTERN) */}
        <div className="fixed inset-0 pointer-events-none opacity-15 z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient
                id="gymGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Akıcı Akrobatik Hareket Çizgileri */}
            <path
              d="M-100,200 C300,50 600,400 1200,100"
              stroke="url(#gymGradient)"
              strokeWidth="6"
              fill="none"
            />
            <path
              d="M-50,400 C400,200 800,600 1500,200"
              stroke="url(#gymGradient)"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M100,-50 C500,500 900,100 1600,800"
              stroke="url(#gymGradient)"
              strokeWidth="8"
              fill="none"
            />

            {/* Denge Tahtası & Zemin Çizgileri */}
            <line
              x1="0"
              y1="90%"
              x2="100%"
              y2="90%"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="10 15"
            />
            <line
              x1="0"
              y1="92%"
              x2="100%"
              y2="92%"
              stroke="#3b82f6"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* SOL SIDEBAR */}
        <Navbar />

        {/* SAĞ İÇERİK ALANI */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 z-10 relative">
          {children}
        </main>
      </div>
      </div>
    </BrandingProvider>
  );
}
