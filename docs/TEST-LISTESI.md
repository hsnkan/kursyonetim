# Kurs Yönetim Sistemi — Tam Test Listesi

**Test ortamı:** `npm run dev` + `.env.local` + MongoDB bağlantısı  
**Hesaplar:** Geliştirici + Balans müşteri (salon yöneticisi)  
**Her madde için:** ✅ Geçti / ❌ Kaldı / ⏭ Atlandı işaretleyin

---

## A. Ortam ve Hazırlık

| # | Test | Beklenen |
|---|------|----------|
| A1 | `npm run dev` hatasız başlıyor | Uygulama `localhost:3000` açılır |
| A2 | `.env.local` eksik değişken yok | JWT, MongoDB, ADMIN, DEVELOPER_PIN tanımlı |
| A3 | Giriş yapılmadan `/dashboard` | `/auth/login` yönlendirmesi |
| A4 | Giriş yapılmadan API (`/api/ogrenciler`) | 401 Yetkisiz |

---

## B. Giriş ve Güvenlik

| # | Test | Beklenen |
|---|------|----------|
| B1 | Yanlış şifre | Hata mesajı, giriş yok |
| B2 | Doğru müşteri girişi | Dashboard'a yönlendirme |
| B3 | İlk giriş zorunlu şifre değişimi | `/auth/sifre-guncelle` |
| B4 | Geliştirici girişi | `/admin/kullanicilar` |
| B5 | 2FA açık kullanıcı | 2FA adımı çıkar |
| B6 | 2FA doğru kod | Giriş tamamlanır |
| B7 | 2FA yanlış kod | Reddedilir |
| B8 | Lisans süresi dolmuş müşteri | Giriş engellenir |
| B9 | Çıkış yap | Oturum kapanır, login'e döner |
| B10 | Şifremi unuttum akışı | E-posta veya güvenlik sorusu çalışır |

---

## C. Marka ve Panel (Balans)

| # | Test | Beklenen |
|---|------|----------|
| C1 | Navbar logo ve salon adı | Balans markası görünür |
| C2 | WhatsApp duyuru imzası | Balans imzası mesajda |
| C3 | Destek oturumu (impersonate) | Sarı uyarı bandı görünür |

---

## D. NFC Yoklama (13,56 MHz + USB)

| # | Test | Beklenen |
|---|------|----------|
| D1 | USB okuyucu takılı, sayfa açık | "Sistem okumaya hazır" |
| D2 | Kayıtlı kart okut | ✅ Yoklama alındı mesajı |
| D3 | Aynı kart aynı gün tekrar | ⚠️ Zaten alınmış uyarısı |
| D4 | Kayıtsız kart okut | ❌ Eşleşmedi hatası |
| D5 | Bugünkü liste | Sporcu gruplara göre listelenir |
| D6 | Öğrenci kaydında USB ile kart tanımla | nfcKartId kaydedilir |
| D7 | Tanımlanan kartla yoklama | Eşleşir |
| D8 | Bilgisayarda USB rehber kutusu | 13,56 MHz adımları görünür |
| D9 | Android telefon (varsa) NFC yedek | Kart okunursa yoklama düşer |
| D10 | iPhone tarayıcı | NFC okuyamaz uyarısı; USB önerilir |

---

## E. Öğrenci Yönetimi

| # | Test | Beklenen |
|---|------|----------|
| E1 | Yeni öğrenci ekle (tüm zorunlu alanlar) | Kayıt oluşur |
| E2 | USB ile NFC kart ata | Kart ID kaydedilir |
| E3 | İsimle arama | Bulunur |
| E4 | Gruba göre filtre | Doğru liste |
| E5 | Öğrenci düzenle (aidat, grup, veli) | Güncellenir |
| E6 | Öğrenci detay — yoklama takvimi | Geçmiş yoklamalar görünür |
| E7 | Word kayıt formu indir | Dosya iner/açılır |
| E8 | WhatsApp hoş geldin (grup linki varsa) | wa.me açılır |
| E9 | Öğrenci dondur / arşivle | Arşivde görünür |
| E10 | Arşivden geri aktif et | Ana listeye döner |
| E11 | Öğrenci sil (test kaydı) | Silinir |

---

## F. Gruplar (Admin veya panel)

| # | Test | Beklenen |
|---|------|----------|
| F1 | Yeni grup oluştur | Listede görünür |
| F2 | Grup günleri + WhatsApp linki | Kaydedilir |
| F3 | Grup düzenle / sil | Çalışır |

---

## G. Duyurular ve WhatsApp

| # | Test | Beklenen |
|---|------|----------|
| G1 | Grup seç | Veli listesi gelir |
| G2 | Hazır şablon seç (Genel, Aidat vb.) | Metin dolar |
| G3 | Metni düzenle | Kaydedilir |
| G4 | Tek veliye WhatsApp gönder | wa.me açılır, Balans imzası var |
| G5 | Çoklu veli seç + toplu gönder | Her biri için link/kayıt |
| G6 | Grup WhatsApp linki | Grup sohbeti açılır |

---

## H. Muhasebe ve Aidat

| # | Test | Beklenen |
|---|------|----------|
| H1 | Özet kartlar (beklenen/tahsil/kalan) | Rakamlar mantıklı |
| H2 | Ay/yıl filtresi değiştir | Liste güncellenir |
| H3 | Karşılaştırma dönemi | İki dönem yan yana |
| H4 | "Ödeme Al" | Tahsilat kaydı, listeden düşer |
| H5 | Ödenen öğrenci tekrar listede görünmez | Gizlenir |
| H6 | WhatsApp aidat hatırlatma | wa.me + mesaj metni |
| H7 | 12 aylık grafik | Sol eksen 50.000 adımlarla 1.000.000'a kadar |
| H8 | Grafikte veri | Seçilen dönemlere göre çizgiler |

---

## I. Raporlar

| # | Test | Beklenen |
|---|------|----------|
| I1 | Aylık istatistik kartları | Aktif/yeni/dondurulan/ayrılan |
| I2 | Tarih + grup filtreli yoklama raporu | Doğru kayıtlar |
| I3 | Yazdır / PDF | Önizleme düzgün |
| I4 | Antrenör ekle / sil | Raporda imza listesi güncellenir |

---

## J. İşlem Geçmişi (Audit)

| # | Test | Beklenen |
|---|------|----------|
| J1 | Öğrenci ekleme sonrası kayıt | Audit'te görünür |
| J2 | NFC yoklama sonrası | YOKLAMA_NFC kaydı |
| J3 | Ödeme alma sonrası | Tahsilat kaydı |
| J4 | WhatsApp kampanyası sonrası | Kampanya kaydı |
| J5 | Arama kutusu | İsim/işlem bulunur |

---

## K. Profil ve Lisans (Müşteri)

| # | Test | Beklenen |
|---|------|----------|
| K1 | Kalan lisans günü | Profilde görünür |
| K2 | 2FA kurulum (QR + doğrulama) | Aktif olur |
| K3 | Destek erişim izni ver (3 saat) | Süre kaydedilir |
| K4 | Geliştirici impersonate (izin varken) | Destek oturumu açılır |
| K5 | İzin süresi dolunca impersonate | Reddedilir |

---

## L. Geliştirici Paneli (`/admin/kullanicilar`)

| # | Test | Beklenen |
|---|------|----------|
| L1 | Kurs/Salon Kurulumu — yeni salon | Logo, isim, WhatsApp imza kaydı |
| L2 | Salon düzenle / durum aktif | Güncellenir |
| L3 | Yeni müşteri — salon seç + oluştur | 365 gün lisans otomatik |
| L4 | Lisans +30 gün | Uzar |
| L5 | Lisans −30 gün | Kısalır |
| L6 | Lisans −365 gün (1 yıl altı) | ❌ Reddedilir |
| L7 | Müşteri düzenle / geçici şifre | Güncellenir |
| L8 | 2FA sıfırlama | Müşteri 2FA kilitlenmesi çözülür |
| L9 | Excel şablon indir | Dosya iner |
| L10 | Excel ile toplu öğrenci yükle (test) | Kayıtlar oluşur |
| L11 | Geçmiş ödeme Excel yükle (test) | Ödeme kayıtları |

---

## M. API ve Güvenlik (curl veya Postman)

| # | Test | Beklenen |
|---|------|----------|
| M1 | Oturumsuz POST `/api/ogrenciler` | 401 |
| M2 | Oturumsuz POST `/api/yoklama/nfc` | 401 |
| M3 | Oturumsuz GET `/api/admin/users` | 401 |
| M4 | Müşteri rolü ile `/api/admin/salonlar` | 403 |
| M5 | `npm run build` | Hatasız tamamlanır |

---

## N. Kenar Durumları

| # | Test | Beklenen |
|---|------|----------|
| N1 | Boş duyuru metni ile gönder | Uyarı |
| N2 | Telefonsuz veliye WhatsApp | Uyarı / atlanır |
| N3 | Aynı e-posta ile ikinci kullanıcı | Reddedilir |
| N4 | Çok hızlı ardışık kart okutma | Çift kayıt oluşmaz |
| N5 | Farklı tarayıcıda oturum | Her ikisi de çalışır veya biri düşer (not alın) |

---

## O. Canlıya Alma Öncesi (Vercel)

| # | Test | Beklenen |
|---|------|----------|
| O1 | Production build | Başarılı |
| O2 | HTTPS üzerinde giriş | Çalışır |
| O3 | Ortam değişkenleri Vercel'de | Tümü tanımlı |
| O4 | MongoDB Atlas bağlantısı | Canlı veri okunur/yazılır |

---

## Önerilen Test Sırası (1 Gün)

1. **A → B** — Ortam ve giriş
2. **L1–L3** — Salon + müşteri kurulumu
3. **F** — Gruplar
4. **E + D** — Öğrenci + NFC yoklama (USB)
5. **G + H** — Duyuru + muhasebe
6. **I + J** — Rapor + audit
7. **K + L4–L8** — Profil, lisans, destek
8. **M + N + O** — API, kenar durum, build

---

## Test Kayıt Formu

| Bölüm | Geçti | Kaldı | Not |
|-------|-------|-------|-----|
| A | | | |
| B | | | |
| C | | | |
| D | | | |
| E | | | |
| F | | | |
| G | | | |
| H | | | |
| I | | | |
| J | | | |
| K | | | |
| L | | | |
| M | | | |
| N | | | |
| O | | | |

**Tarih:** _______________  
**Test eden:** _______________  
**Ortam:** local / production

---

*Balans Cimnastik Akademi — Kurs Yönetim Sistemi*
