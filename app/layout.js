import "@/app/globals.css";
import { getSiteConfig } from "@/lib/siteConfig";

const site = getSiteConfig();

export const metadata = {
  title: site.sistemBaslik,
  description: site.sistemAciklama,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body
        suppressHydrationWarning={true}
        className="relative min-h-screen bg-slate-950 text-slate-100 antialiased overflow-x-hidden"
      >
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-center bg-no-repeat bg-contain opacity-10"
          style={{ backgroundImage: `url('${site.logoUrl}')` }}
        />

        {/* İÇERİK KATMANI */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
