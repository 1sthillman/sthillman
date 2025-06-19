# QR Kod ile Sipariş Sistemi

Bu proje, restoranlarda QR kod ile sipariş verme sistemini içerir. Müşteriler masada bulunan QR kodu okutarak sipariş verebilir, garson çağırabilir ve notlar ekleyebilirler.

## Özellikler

- QR kod ile masa tanımlama (URL parametresi ile masa numarası alınır)
- Supabase veritabanı entegrasyonu
- Kategorilere göre ürün listeleme
- Sepet yönetimi (ürün ekleme, çıkarma, miktar değiştirme)
- Sipariş notu ekleme
- Garson çağırma özelliği
- Sipariş onaylama sistemi (garson tarafında)

## Kullanım

1. Müşteri masadaki QR kodu okuttuğunda `qr.html?table=X` sayfasına yönlendirilir (X masa numarası)
2. Müşteri kategorileri görüntüleyebilir, ürünleri sepete ekleyebilir
3. Müşteri siparişini tamamladığında, sipariş sisteme gönderilir
4. Garson siparişi onaylar ve mutfağa iletilir

## Teknik Detaylar

- Frontend: HTML, CSS, JavaScript
- Backend: Supabase (PostgreSQL veritabanı)
- Tablolar: `masalar/siparisler`, `tables/orders`, `kategoriler`, `urunler` 