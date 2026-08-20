/** Kurs verisi yıl aralığı: bugünden 2 yıl önce → gelecek yıllar (dinamik). */
export function getKursYillari(gelecekYilSayisi = 5) {
  const simdi = new Date().getFullYear();
  const years = [];
  for (let y = simdi - 2; y <= simdi + gelecekYilSayisi; y++) {
    years.push(y);
  }
  return years;
}
