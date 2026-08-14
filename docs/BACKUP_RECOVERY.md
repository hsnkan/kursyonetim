# 🛡️ Balans Cimnastik Akademi - Veritabanı Yedekleme & Kurtarma Rehberi

Bu doküman, Balans Cimnastik Akademi yönetim sisteminin MongoDB Atlas üzerindeki veritabanı güvenliği ve acil durum kurtarma (Disaster Recovery) adımlarını içerir.

---

## 1. Otomatik Yedekleme (MongoDB Atlas)
Sistem verileri MongoDB Atlas Cloud sunucularında tutulmaktadır.
- **Continuous Backups (Sürekli Yedekleme):** MongoDB Atlas paneli `Database -> Backups` sekmesinden otomatik günlük snapshot'lar alır.
- **Point-in-Time Recovery (PITR):** Olası bir veri kaybında son 7 günün istenilen dakikasına veritabanı geri yüklenebilir.

---

## 2. Manuel Veri Yedekleme (Lokal Çıktı / Export)
Haftalık veya aylık olarak veritabanının yedeğini bilgisayarınıza indirmek için terminalde aşağıdaki komutları çalıştırabilirsiniz:

### Öğrenci Verilerini İndirme:
```bash
mongoexport --uri="mongodb+srv://balanscimnastik:Bj.123456@cluster0.lszoflc.mongodb.net/balans_cimnastik?retryWrites=true&w=majority" --collection=ogrencis --out=ogrenciler_yedek.json

#### Yoklama Verilerini İndirme:
mongoexport --uri="mongodb+srv://balanscimnastik:Bj.123456@cluster0.lszoflc.mongodb.net/balans_cimnastik?retryWrites=true&w=majority" --collection=yoklamas --out=yoklama_yedek.json

##### Acil Durum Veri Geri Yükleme (Restore)

mongoimport --uri="mongodb+srv://balanscimnastik:Bj.123456@cluster0.lszoflc.mongodb.net/balans_cimnastik?retryWrites=true&w=majority" --collection=ogrencis --file=ogrenciler_yedek.json