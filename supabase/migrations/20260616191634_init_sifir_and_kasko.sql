-- Sıfır araç fiyatları (sifiraracal.com scrape, günlük snapshot)
create table if not exists sifir_fiyatlar (
  id bigint generated always as identity primary key,
  marka_slug text not null,
  marka_adi text not null,
  model_adi text not null,
  versiyon text not null,
  guc text,
  vites text,
  yakit text,
  liste_fiyati numeric,
  kampanya_fiyati numeric,
  source_url text not null,
  scrape_date date not null default current_date,
  scraped_at timestamptz not null default now(),
  unique (marka_slug, model_adi, versiyon, scrape_date)
);

create index if not exists idx_sifir_fiyatlar_marka on sifir_fiyatlar (marka_slug);
create index if not exists idx_sifir_fiyatlar_scrape_date on sifir_fiyatlar (scrape_date);

-- TSB (Türkiye Sigorta Birliği) kasko değerleri, aylık snapshot, model yılı bazında uzun format
create table if not exists kasko_degerleri (
  id bigint generated always as identity primary key,
  snapshot_month date not null,
  marka_kodu integer not null,
  tip_kodu integer not null,
  marka_adi text not null,
  tip_adi text not null,
  model_yili integer not null,
  deger numeric not null,
  created_at timestamptz not null default now(),
  unique (snapshot_month, marka_kodu, tip_kodu, model_yili)
);

create index if not exists idx_kasko_degerleri_tip on kasko_degerleri (marka_kodu, tip_kodu);
create index if not exists idx_kasko_degerleri_snapshot on kasko_degerleri (snapshot_month);
