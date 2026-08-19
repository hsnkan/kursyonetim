# Yeni İşletme Kurulum Rehberi

Bu proje **tek deployment = tek işletme** mantığıyla çalışır. Balans Cimnastik gibi bir salon canlıda kullanırken, kod tabanı saklanır; yeni bir işletme istediğinde aynı kod **yeni ortam değişkenleri + logo** ile tekrar deploy edilir.

Çoklu salon aynı sunucuda (SaaS) hedeflenmez — her işletme kendi Vercel projesi ve MongoDB veritabanına sahip olur.

---

## 1. Yeni İşletme İçin Değiştirilecekler

| Ne | Nerede |
|----|--------|
| İşletme adı, imza, renk | `.env` → `SITE_*` değişkenleri |
| Logo | `public/logo.png` dosyasını değiştirin |
| Veritabanı | Yeni MongoDB Atlas cluster / database |
| E-posta gönderen | `SITE_MAIL_FROM_*` + Resend domain |
| Geliştirici girişi | `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `DEVELOPER_PIN` |

---

## 2. Kurulum Adımları

```bash
# 1. Projeyi klonlayın veya kopyalayın
npm install

# 2. Ortam dosyasını oluşturun
cp .env.example .env.local
# SITE_* ve güvenlik alanlarını yeni işletmeye göre düzenleyin

# 3. public/logo.png → yeni işletme logosu

# 4. Local test
npm run dev

# 5. Vercel'e deploy + aynı env değişkenlerini Vercel paneline girin
```

---

## 3. Canlı Ortamda İlk Yapılandırma

1. Geliştirici hesabıyla `/admin/kullanicilar` → giriş
2. **Kurs / Salon Kurulumu** → işletme markası (logo, WhatsApp imza, iletişim)
3. **Müşteri Yönetimi** → salon yöneticisi hesabı (365 gün lisans)
4. **Grupları Yönet** → antrenman grupları + WhatsApp grup linkleri
5. Excel veya panelden öğrenci aktarımı
6. USB NFC okuyucu ile yoklama testi

---

## 4. Kodda Sabit Kalmaması Gerekenler

Tüm marka metinleri `lib/siteConfig.js` ve `SITE_*` env üzerinden gelir. Yeni işletme için **kod değiştirmeden** yalnızca:

- `.env` / Vercel Environment Variables
- `public/logo.png`
- Admin panelden salon kaydı

yeterlidir.

Özel istek (farklı modül, farklı rapor şablonu vb.) olursa o zaman kod güncellenir.

---

## 5. Balans vs Yeni İşletme

| | Balans (şimdi) | Yeni işletme |
|--|----------------|--------------|
| Deployment | 1 Vercel projesi | Yeni Vercel projesi |
| Veritabanı | Mevcut Atlas DB | Yeni DB |
| Kod | Bu repo | Aynı repo (fork veya kopya) |
| Marka | `.env` Balans değerleri | `.env` yeni değerler |

---

## 6. Kontrol Listesi

- [ ] `SITE_ISLETME_ADI` ve `SITE_ISLETME_TAM_ADI` güncellendi
- [ ] `public/logo.png` değiştirildi
- [ ] MongoDB yeni cluster / DB
- [ ] JWT_SECRET, DEVELOPER_PIN yeni ve güçlü
- [ ] Vercel env tamam
- [ ] Admin → salon + müşteri hesabı oluşturuldu
- [ ] `docs/TEST-LISTESI.pdf` ile smoke test

---

*Teknik destek: geliştirici paneli + `docs/BACKUP_RECOVERY.md`*
