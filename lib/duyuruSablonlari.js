export const DUYURU_SABLON_ANAHTARLARI = [
  "GENEL",
  "ODEME",
  "ARA_TATIL",
  "RESMI_TATIL",
  "KAR_TATILI",
  "YARISMA",
];

export const DUYURU_SABLON_ETIKETLERI = {
  GENEL: "Genel Bilgilendirme",
  ODEME: "Aidat / Ödeme Duyurusu",
  ARA_TATIL: "Ara Tatil Duyurusu",
  RESMI_TATIL: "Resmi Tatil Duyurusu",
  KAR_TATILI: "Kar / Hava Şartı Tatili",
  YARISMA: "Yarışma / Turnuva Dönemi",
};

export function varsayilanDuyuruSablonlari(salonAdi = "Akademimiz") {
  return {
    GENEL: {
      baslik: "Genel Bilgilendirme",
      icerik: `${salonAdi} ailesi olarak tüm sporcularımıza ve velilerimize sağlıklı, başarılı günler dileriz. Güncel antrenman takvimimiz ve duyurularımız hakkında bilgilendirmelerimiz devam edecektir.`,
    },
    ODEME: {
      baslik: "Aidat / Ödeme Duyurusu",
      icerik: `${salonAdi} bünyesinde eğitim alan sporcularımızın aylık kurs aidat ödeme zamanı gelmiştir. Ödemesini gerçekleştiren velilerimiz bu mesajı dikkate almayabilirler. İyi günler dileriz.`,
    },
    ARA_TATIL: {
      baslik: "Ara Tatil Duyurusu",
      icerik:
        "Değerli Velilerimiz, okulların ara tatil dönemine girmesi nedeniyle antrenman saatlerimizde düzenlemeye gidilmiştir. Detaylı antrenman programı gruplarınızda paylaşılacaktır. Tüm sporcularımıza iyi tatiller dileriz.",
    },
    RESMI_TATIL: {
      baslik: "Resmi Tatil Duyurusu",
      icerik:
        "Değerli Velilerimiz, yaklaşan resmi tatil nedeniyle akademimiz belirtilen tarihlerde kapalı olacaktır. Tatil sonrası antrenmanlarımız normal seyriyle devam edecektir. Bilgilerinize sunarız.",
    },
    KAR_TATILI: {
      baslik: "Kar / Hava Şartı Tatili",
      icerik:
        "Değerli Velilerimiz, bölgemizdeki olumsuz hava şartları ve kar yağışı nedeniyle sporcularımızın güvenliği açısından bugün yapılacak tüm antrenmanlarımız iptal edilmiştir. Telafi dersleri hakkında bilgilendirme yapılacaktır.",
    },
    YARISMA: {
      baslik: "Yarışma / Turnuva Dönemi",
      icerik:
        "Değerli Velilerimiz, önümüzdeki yarışma ve turnuva dönemi hazırlıkları kapsamında antrenman tempomuz artırılmıştır. Sporcularımızın antrenman saatlerine ve beslenme düzenlerine hassasiyet göstermenizi rica ederiz.",
    },
  };
}

export function birlestirDuyuruSablonlari(kayitli, salonAdi) {
  const varsayilan = varsayilanDuyuruSablonlari(salonAdi);
  const birlesik = { ...varsayilan };

  for (const key of DUYURU_SABLON_ANAHTARLARI) {
    if (kayitli?.[key]) {
      birlesik[key] = {
        baslik: kayitli[key].baslik || varsayilan[key].baslik,
        icerik: kayitli[key].icerik || varsayilan[key].icerik,
      };
    }
  }

  return birlesik;
}
