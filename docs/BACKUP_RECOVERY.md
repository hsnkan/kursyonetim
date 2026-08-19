# 🛡️ Balans Cimnastik SaaS - Veri Yedekleme, Güvenlik ve Acil Kurtarma Rehberi

Bu doküman, **Balans** SaaS sisteminin yedeklenme süreçlerini, teknik servis / geliştirici müdahale prosedürlerini ve acil durum kurtarma (Disaster Recovery) adımlarını içermektedir.

---

## 🏛️ 1. Mimarinin Temel Unsurları & Güvenlik Değişkenleri

Sistemin çalışabilmesi ve acil durumlarda kurtarılabilmesi için `.env.local` dosyasında bulunması gereken kritik anahtarlar:

* `MONGODB_URI`: Atlas / Veritabanı bağlantı adresi.
* `ADMIN_USERNAME` & `ADMIN_PASSWORD`: Veritabanından bağımsız acil durum master yönetici hesabı.
* `JWT_SECRET`: Çerezlerin ve oturum token'larının kriptografik güvenlik mührü.
* `DEVELOPER_PIN`: Geliştirici paneli (`/admin/kullanicilar`), lisans uzatma ve impersonation yetkilendirme PIN kodu.
* `RESEND_API_KEY`: Otomatik lisans uyarıları ve e-posta ile şifre sıfırlama servisi.
* `CRON_SECRET`: Gece zamanlayıcısı (Cron Job) güvenlik doğrulama anahtarı.

---

## 💾 2. Veritabanı Yedek Alma (Backup Procedures)

### Otomatik Yedekleme (MongoDB Atlas)
1. **Automated Backups:** MongoDB Atlas panelinden günlük ve saatlik snapshot yedekleri otomatik alınmaktadır.
2. **Point-in-Time Recovery (PITR):** Olası veri bozulmalarında veritabanı son 1 dakikaya kadar geriye dönük yüklenebilir.

### Manuel Yedeğin Alınması (CLI)
Geliştirici ortamından yerel veya bulut yedeği almak için terminalde çalıştırılacak komut:
```bash
mongodump --uri="MONGODB_URI_ADRESINIZ" --out=./backups/$(date +%Y-%m-%d)

🔄 3. Adım Adım Teknik Kurtarma Adımları (Recovery Steps)
Senaryo 1: Veritabanı Çöktü veya Yanlışlıkla Veri Silindi (Full DB Restore)
Eğer veritabanındaki veriler bozulursa veya silinirse, alınan en son mongodump yedeğini veritabanına geri yüklemek için şu adımları izleyin:

Terminali açın ve yedek klasörünün bulunduğu dizine gidin.

Aşağıdaki komut ile yedeği veritabanına geri yükleyin (--drop parametresi mevcut hatalı verileri temizler ve yedeği üzerine yazar):

Bash
mongorestore --uri="MONGODB_URI_ADRESINIZ" --drop ./backups/2026-08-18/
npm run dev veya sunucu servisini yeniden başlatarak verilerin geldiğini doğrulayın.

Senaryo 2: .env.local Dosyası Silindi veya Kayboldu
Eğer çevre değişkenleri dosyası silinirse sistem tamamen durur. Sıfırdan ayağa kaldırmak için:

Proje kök dizininde .env.local adında yeni bir dosya oluşturun.

Aşağıdaki şablonu yapıştırıp bilgileri doldurun:

Kod snippet'i
MONGODB_URI=mongodb+srv://KULLANICI:SIFRE@cluster.mongodb.net/balans
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_strong_password_here
JWT_SECRET=your_long_random_jwt_secret_here
DEVELOPER_PIN=your_developer_pin_here
RESEND_API_KEY=re_xxxxxxxx
DEVELOPER_EMAIL=teknik@example.com
CRON_SECRET=your_cron_secret_here
Sunucuyu durdurup yeniden başlatın: npm run dev

Senaryo 3: Müşteri 2FA (Google Authenticator) Erişimi Kayboldu
Çözüm: Müşteri 2FA koduna erişemiyorsa, Gizli Geliştirici Paneline (/admin/kullanicilar) DEVELOPER_PIN ile giriş yapın.

İlgili müşterinin satırındaki 🔓 2FA SIFIRLA butonuna tıklayın. Müşterinin 2FA kilidi veritabanında anında temizlenir ve tekrar kurulum yapabilir.

Senaryo 4: Müşteri Şifresini Unuttu ve E-Posta Erişimi Yok
Self-Service: Müşteri /auth/sifremi-unuttum ekranından Gizli Soru & Cevap adımıyla şifresini kendisi sıfırlayabilir.

Geliştirici Müdahalesi: Müşteri gizli sorusunu da unuttuysa, Gizli Geliştirici Paneli üzerinden 🔑 Şifre Ata butonuna basarak tek kullanımlık geçici şifre tanımlayabilirsiniz.

Senaryo 5: Müşteri Sisteminde Teknik Hata Var (Canlı Test & İnceleme)
Müşteri, kendi panelinden Profil & Güvenlik (/dashboard/profil) sayfasına girip "3 Saatlik Teknik Destek İzni Ver" butonuna basar.

Geliştirici panelinden müşterinin yanındaki 👁️ Giriş butonuna tıklayarak müşteri ekranını canlıda (Impersonation) 3 saat boyunca test edebilirsiniz. 3 saat tamamlandığında izin otomatik iptal olur.

Senaryo 6: Müşteri Lisans Süresi Doldu ve Sistem Kilitlendi
Lisansı biten müşteri giriş yapamaz.

Müşteri ödemeyi yaptıktan sonra Geliştirici Panelinden ilgili müşterinin satırındaki +30G, +365G butonlarını veya Özel Gün İnputunu kullanarak süreyi uzatın. Sistem kilidi anında açılır.

🤖 4. Otomatik Zamanlayıcı (Cron Job) Kontrolü
Sistem her gece 03:00 saatinde /api/cron/check-licenses rotasını tetikler:

Lisans bitimine 30 gün veya daha az kalan müşteriler taranır.

DEVELOPER_EMAIL adresinize müşteri iletişim bilgileriyle birlikte otomatik Lisans Yenileme Hatırlatma E-Postası düşer.