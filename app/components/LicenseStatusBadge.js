"use client";

export default function LicenseStatusBadge({ licenseInfo }) {
  if (licenseInfo.loading) {
    return (
      <div className="bg-slate-800/80 border border-slate-600 px-4 py-2.5 rounded-xl text-[10px] font-bold text-slate-400">
        Lisans yükleniyor...
      </div>
    );
  }

  if (licenseInfo.sinirsiz || licenseInfo.kalanGun === null) {
    return null;
  }

  const uyari = licenseInfo.kalanGun <= 30;

  return (
    <div
      className={`px-4 py-2.5 rounded-xl border text-right min-w-[180px] ${
        uyari
          ? "bg-amber-500/15 border-amber-400/40 text-amber-300"
          : "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-wider opacity-80">
        Lisans Süresi
      </p>
      <p className="text-lg font-black leading-tight">
        {licenseInfo.kalanGun} Gün
      </p>
      <p className="text-[10px] font-semibold mt-0.5 opacity-90">
        Bitiş: {licenseInfo.bitisTarihi || "—"}
      </p>
    </div>
  );
}

export function LicenseWarningBanner({ licenseInfo, onDismiss }) {
  if (
    licenseInfo.loading ||
    licenseInfo.sinirsiz ||
    !licenseInfo.uyariGerekli ||
    licenseInfo.kalanGun === null ||
    licenseInfo.kalanGun > 30
  ) {
    return null;
  }

  return (
    <div className="relative bg-amber-500/15 border-2 border-amber-500/40 text-amber-100 rounded-xl p-4 text-sm font-bold flex items-start gap-3 pr-12">
      <span className="text-xl shrink-0">⚠️</span>
      <div>
        <p>Lisans yenileme uyarısı</p>
        <p className="text-xs font-semibold text-amber-100/90 mt-1">
          Yazılım lisansınızın bitmesine{" "}
          <strong>{licenseInfo.kalanGun} gün</strong> kaldı (Bitiş:{" "}
          {licenseInfo.bitisTarihi}). Kesintisiz kullanım için sistem
          yöneticinizle iletişime geçin.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 font-black text-sm cursor-pointer"
        aria-label="Uyarıyı kapat"
      >
        ✕
      </button>
    </div>
  );
}

export function getLicenseDismissKey(bitisTarihi) {
  return `license_warn_dismiss_${bitisTarihi || "unknown"}`;
}

export function isLicenseBannerDismissed(bitisTarihi) {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(getLicenseDismissKey(bitisTarihi)) === "1";
}

export function dismissLicenseBanner(bitisTarihi) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(getLicenseDismissKey(bitisTarihi), "1");
}
