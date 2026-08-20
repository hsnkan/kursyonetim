export const SAYFA_MODUL_HARITASI = [
  { prefix: "/dashboard/yoklama", anahtar: "nfcYoklama" },
  { prefix: "/dashboard/ogrenciler", anahtar: "ogrenciYonetimi" },
  { prefix: "/dashboard/duyurular", anahtar: "duyurular" },
  { prefix: "/dashboard/raporlar", anahtar: "raporlar" },
  { prefix: "/dashboard/muhasebe", anahtar: "muhasebe" },
  { prefix: "/dashboard/audit", anahtar: "auditLog" },
];

export function pathnameModulAnahtari(pathname) {
  const eslesen = SAYFA_MODUL_HARITASI.find(
    (k) => pathname === k.prefix || pathname.startsWith(`${k.prefix}/`),
  );
  return eslesen?.anahtar || null;
}
