-- kasko_degerleri (1.4M+ satır) içinde her marka sayfası açılışında tam tablo
-- taraması yapmamak için küçük bir özet tablo. TSB import script'i her
-- çalıştığında bu tabloyu güncel tutar.
create table if not exists tsb_markalar (
  marka_kodu integer primary key,
  marka_adi text not null,
  slug text not null unique,
  son_snapshot_month date not null
);
