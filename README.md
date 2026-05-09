# TaxControl — AI-Destekli e-Fatura & Vergi Kontrol Asistanı

KOBİ'ler, freelancer'lar ve muhasebeciler için tahmini KDV ve geçici vergi ön kontrol uygulaması.

> **Yasal Uyarı:** Bu uygulama tahmini bir ön-kontrol aracıdır. Kesin vergi beyanı ve yasal sorumluluk mükellef ve sertifikalı muhasebeciye aittir.

---

## Özellikler

- Dashboard: Aylık KDV özeti, çeyreklik geçici vergi tahmini, risk sayaçları
- Gelen / Giden Fatura listeleri (filtreleme, arama)
- Otomatik gider sınıflandırma motoru (kural tabanlı)
- KDV Özeti: Hesaplanan KDV – İndirilecek KDV → Ödenecek/Devreden KDV
- Geçici Vergi Tahmini: Çeyreklik kâr × vergi oranı
- Muhasebeci inceleme iş akışı (nihai karar ve not)
- Excel rapor indirme (fatura listesi, KDV özeti, geçici vergi)
- Temiz adaptör mimarisi: Mock provider + İşNet NetteFatura iskelet entegrasyonu

---

## Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
cd taxcontrol
npm install
```

### 2. Ortam Değişkenleri

`.env` dosyası zaten oluşturulmuştur. Gerekirse güncelleyin:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="guclu-bir-gizli-anahtar-degistirin"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Veritabanı Oluştur ve Seed Verisi Yükle

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışır.

### 5. Demo Giriş

```
Email:    demo@taxcontrol.io
Sifre:    demo1234
```

---

## Proje Yapısı

```
taxcontrol/
├── prisma/
│   ├── schema.prisma          # Veritabanı şeması
│   ├── seed.ts                # Demo verisi
│   └── migrations/            # Prisma migration dosyaları
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Giriş sayfası
│   │   ├── (dashboard)/       # Ana uygulama sayfaları
│   │   │   ├── page.tsx                  # Dashboard
│   │   │   ├── gelen-faturalar/          # Gelen faturalar
│   │   │   ├── giden-faturalar/          # Giden faturalar
│   │   │   ├── riskli-giderler/          # Riskli giderler
│   │   │   ├── kdv-ozeti/                # KDV özeti
│   │   │   ├── gecici-vergi/             # Geçici vergi tahmini
│   │   │   ├── raporlar/                 # Rapor indirme
│   │   │   └── ayarlar/                  # Firma ayarları
│   │   └── api/
│   │       ├── auth/          # Login, register, logout, me
│   │       ├── company/       # Firma CRUD
│   │       ├── invoices/      # Fatura listesi ve detay
│   │       ├── tax/           # KDV, geçici vergi, dashboard
│   │       ├── provider/sync/ # Fatura senkronizasyonu
│   │       └── reports/       # Excel rapor indirme
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   ├── dashboard/KPICard.tsx
│   │   └── invoices/          # InvoiceTable, ReviewModal, ClassificationBadge
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client (libSQL adapter)
│   │   ├── auth.ts            # Session yönetimi (cookie tabanlı)
│   │   └── utils.ts           # Yardımcı fonksiyonlar
│   ├── services/
│   │   ├── expense-classification.service.ts  # Kural tabanlı gider sınıflandırma
│   │   ├── tax-calculation.service.ts         # KDV ve geçici vergi hesaplama
│   │   └── invoice-sync.service.ts            # Fatura senkronizasyonu
│   ├── providers/
│   │   ├── base-provider.ts      # Soyut adaptör arayüzü
│   │   ├── mock-provider.ts      # Demo/test mock sağlayıcı
│   │   ├── isnet-provider.ts     # İşNet NetteFatura iskelet (TODO'lar ile)
│   │   └── provider-factory.ts   # Sağlayıcı fabrikası
│   └── middleware.ts             # Auth yönlendirme middleware
└── prisma.config.ts              # Prisma 7 konfigürasyonu
```

---

## İşNet NetteFatura Entegrasyonu

`src/providers/isnet-provider.ts` dosyası, İşNet API detaylarının doğrulanmasını bekleyen
TODO yorumları ile birlikte iskelet halinde hazırlanmıştır.

Entegrasyonu tamamlamak için:
1. İşNet NetteFatura API dokümantasyonunu edinin
2. `isnet-provider.ts` içindeki TODO yorumlarını takip edin
3. Ayarlar sayfasından sağlayıcıyı "İşNet NetteFatura" olarak seçin
4. Firma ayarlarına API kimlik bilgilerini ekleyin

Yeni sağlayıcı eklemek için (Paraşüt, Logo vb.):
1. `BaseInvoiceProvider`ı extend eden yeni bir sınıf oluşturun
2. `provider-factory.ts`e yeni sağlayıcıyı ekleyin

---

## Gider Sınıflandırma Motoru

`src/services/expense-classification.service.ts` kural tabanlı motor içerir.

Sınıflandırma kategorileri:
- `deductible` — İndirilebilir
- `non_deductible` — İndirilemez
- `partially_deductible` — Kısmen İndirilebilir
- `accountant_review_required` — Muhasebeci Onayı Gerekli

Her sınıflandırma için Türkçe açıklama üretilir. Motor kesin yasal iddia yapmaz.

---

## Vergi Oranları

`TaxRate` tablosundan okunur (yıl ve şirket tipine göre). Seed verisi 2025-2026 için:
- Şahıs şirketi: %15
- Limited şirket: %25

Oranlar veritabanından güncellenebilir (hardcode değil).

---

## PostgreSQL Geçişi

1. `prisma.config.ts` içindeki `datasource.url`yi PostgreSQL bağlantı dizisi ile güncelleyin
2. `@prisma/adapter-libsql` yerine `@prisma/adapter-pg` ve `pg` paketlerini yükleyin
3. `src/lib/prisma.ts`i yeni adaptörü kullanacak şekilde güncelleyin
4. `npx prisma migrate dev` çalıştırın

---

## Güvenlik Notları

- Sağlayıcı şifreleri frontend'e gönderilmez (sunucu taraflı API routes)
- `providerConfig` alanı üretimde şifrelenmelidir (TODO işareti mevcuttur)
- Session cookie `httpOnly` ve `sameSite: lax` ile korunmaktadır
- API base URL ve sırlar `.env` dosyasında tutulur
