export const INITIAL_LICENSE_DAYS = 365;

export function getMinimumLicenseEndDate(user) {
  const created = user?.createdAt ? new Date(user.createdAt) : new Date();
  const min = new Date(created);
  min.setDate(min.getDate() + INITIAL_LICENSE_DAYS);
  min.setHours(23, 59, 59, 999);
  return min;
}

export function calculateAdjustedLicenseEnd(user, gunDegisimi) {
  const delta = Number(gunDegisimi);

  if (!Number.isFinite(delta) || delta === 0) {
    return { error: "Geçerli bir gün sayısı giriniz (pozitif veya negatif)." };
  }

  const bugun = new Date();
  const mevcutBitis =
    user.licenseEndDate && new Date(user.licenseEndDate) > bugun
      ? new Date(user.licenseEndDate)
      : new Date(bugun);

  const yeniBitis = new Date(mevcutBitis);
  yeniBitis.setDate(yeniBitis.getDate() + delta);

  const minBitis = getMinimumLicenseEndDate(user);
  if (yeniBitis < minBitis) {
    return {
      error: `Lisans süresi ilk kayıt tarihinden itibaren ${INITIAL_LICENSE_DAYS} günün altına indirilemez. Minimum bitiş: ${minBitis.toLocaleDateString("tr-TR")}`,
      minimumEndDate: minBitis,
    };
  }

  return { yeniBitis, delta, minimumEndDate: minBitis };
}

export function createInitialLicenseEndDate(fromDate = new Date()) {
  const bitis = new Date(fromDate);
  bitis.setDate(bitis.getDate() + INITIAL_LICENSE_DAYS);
  return bitis;
}
