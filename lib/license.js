export const INITIAL_LICENSE_DAYS = 365;

/** Yerel saat diliminde gün başlangıcı — lisans gün sayımı için */
export function startOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Bitiş tarihine kalan tam gün (takvim günü bazlı) */
export function calculateRemainingLicenseDays(
  licenseEndDate,
  referenceDate = new Date(),
) {
  if (!licenseEndDate) return null;
  const bitis = startOfLocalDay(licenseEndDate);
  const bugun = startOfLocalDay(referenceDate);
  const farkMs = bitis.getTime() - bugun.getTime();
  return Math.round(farkMs / (1000 * 60 * 60 * 24));
}

export function isLicenseExpired(licenseEndDate, referenceDate = new Date()) {
  const kalan = calculateRemainingLicenseDays(licenseEndDate, referenceDate);
  return kalan !== null && kalan < 0;
}

export function isLicenseWarningPeriod(
  licenseEndDate,
  referenceDate = new Date(),
  warningDays = 30,
) {
  const kalan = calculateRemainingLicenseDays(licenseEndDate, referenceDate);
  return kalan !== null && kalan <= warningDays && kalan >= 0;
}

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
  const bitis = startOfLocalDay(fromDate);
  bitis.setDate(bitis.getDate() + INITIAL_LICENSE_DAYS);
  return bitis;
}
