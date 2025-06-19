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
- Gerçek zamanlı veri senkronizasyonu

## Sipariş Akışı

1. Müşteri QR kodu okutarak masaya özel sipariş sayfasını açar
2. Müşteri ürünleri sepete ekler ve siparişi gönderir
3. Masa durumu "qr_siparis" olarak güncellenir
4. Garson QR ile oluşturulan siparişi görür ve onaylar
5. Onaylanan sipariş mutfağa iletilir ve masa durumu "dolu" olarak güncellenir
6. Mutfak siparişi hazırlar ve "hazır" durumuna getirir
7. Garson siparişi teslim alır ve servis eder
8. Ödeme alındıktan sonra masa "boş" durumuna geçer

## Güncellemeler

### Son Güncelleme (19.06.2025)

- Garson çağırma butonu iyileştirildi:
  - Turuncu renk yapıldı
  - "Garson Çağır" yazısı eklendi
- Butonlara tıklama hissiyatı eklendi
- Sipariş gönderme işlemi düzeltildi
- Masa durumu güncelleme fonksiyonu optimize edildi
- Supabase veritabanı entegrasyonu iyileştirildi

## Test Sonuçları

- QR kod ile sipariş oluşturma başarıyla çalışıyor
- Masa durumu "qr_siparis" olarak güncelleniyor
- Garson çağırma özelliği çalışıyor
- Adisyon uygulamasında QR siparişleri görüntülenebiliyor
- Garson QR siparişlerini onaylayabiliyor 