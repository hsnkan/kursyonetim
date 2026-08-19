# Balans Cimnastik Akademi — Kurs Yönetim Sistemi

Next.js tabanlı salon yönetim paneli: öğrenci kaydı, NFC yoklama, aidat/tahsilat takibi, raporlar.

## Gereksinimler

- Node.js 18+
- MongoDB Atlas (veya yerel MongoDB)
- `.env.local` dosyası (aşağıya bakın)

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcı: [http://localhost:3000](http://localhost:3000) → `/auth/login` sayfasına yönlendirilir.

## Mimari: Tek İşletme, Tekrar Kurulabilir Kod

- **Şu an:** Balans Cimnastik tek deployment olarak kullanır.
- **Yeni işletme:** Aynı kod + yeni `.env` (`SITE_*`) + `public/logo.png` + yeni MongoDB → ayrı Vercel deploy.
- **Detay:** [`docs/YENI-ISLETME-KURULUM.md`](docs/YENI-ISLETME-KURULUM.md)
- **Şablon:** `.env.example`

## Ortam Değişkenleri (`.env.local`)

| Değişken | Açıklama |
|---|---|
| `MONGODB_URI` | MongoDB bağlantı adresi |
| `JWT_SECRET` | Oturum token imzalama anahtarı (uzun, rastgele) |
| `ADMIN_USERNAME` | Acil durum geliştirici kullanıcı adı |
| `ADMIN_PASSWORD` | Acil durum geliştirici şifresi |
| `DEVELOPER_PIN` | Geliştirici paneli / toplu silme PIN kodu |
| `RESEND_API_KEY` | E-posta (şifre sıfırlama, lisans uyarısı) |
| `CRON_SECRET` | Zamanlanmış görevler güvenlik anahtarı |
| `SITE_ISLETME_ADI` | İşletme kısa adı (white-label) |
| `SITE_ISLETME_TAM_ADI` | Tam işletme adı |
| `SITE_LOGO_URL` | Logo yolu (varsayılan `/logo.png`) |
| `SITE_WHATSAPP_IMZA` | WhatsApp mesaj imzası |
| `SITE_TEKNIK_DESTEK_ADI` | Destek oturumu banner metni |
| `SITE_MAIL_FROM_*` | E-posta gönderen adı ve adresi |

**Önemli:** Gizli bilgileri (şifre, PIN, JWT) kaynak koda yazmayın. Yalnızca `.env.local` veya Vercel ortam değişkenlerinde tutun.

## Güvenlik Mimarisi

- **Giriş:** Sunucu tarafı JWT oturumu (`/api/auth/login`), HttpOnly çerez
- **2FA:** Google Authenticator desteği (opsiyonel, kullanıcı bazlı)
- **Middleware:** Korumalı sayfa ve API yönlendirmesi
- **API:** Her endpoint `lib/auth.js` ile JWT doğrulaması yapar
- **Mass assignment:** Öğrenci CRUD whitelist ile korunur
- **Geliştirici işlemleri:** Oturum + `DEVELOPER_PIN` + canlıda toplu silme kapalı

## Önemli Sınırlamalar (ürün vaadi)

- **WhatsApp:** Toplu gönderim kampanyası sunucuda kayıt altına alınır; mesajlar wa.me linki ile açılır (WhatsApp Business API yoksa otomatik arka planda gönderim yapılmaz).
- **Muhasebe:** Aidat/tahsilat paneli; resmi muhasebe defteri veya bilanço değildir.
- **NFC yoklama:** 13,56 MHz NFC kart + USB okuyucu (bilgisayar, ana yöntem). Android Chrome’da yedek telefon NFC okuma. iPhone tarayıcısı NFC kart okumaz.
- **Audit log:** `/dashboard/audit` — tüm kritik işlemler sunucuda kaydedilir.

## Yedekleme

Detaylar: [`docs/BACKUP_RECOVERY.md`](docs/BACKUP_RECOVERY.md)

MongoDB Atlas otomatik snapshot + `mongodump` ile manuel yedek önerilir.

## İlk Admin Kullanıcısı

```bash
node scripts/seed-admin.js
```

Seed script çalıştırıldıktan sonra geçici şifreyi mutlaka değiştirin.
