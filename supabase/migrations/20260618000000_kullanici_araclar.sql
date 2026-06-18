-- Kullanıcının kaydettiği araçlar
create table kullanici_araclar (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tip_kodu    int not null,
  marka_adi   text not null,
  tip_adi     text not null,
  model_yili  int not null,
  marka_slug  text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, tip_kodu, model_yili)
);

-- Her araç için önemli tarihler (MTV, muayene, kasko bitiş)
create table arac_tarihler (
  id                  uuid primary key default gen_random_uuid(),
  arac_id             uuid not null references kullanici_araclar(id) on delete cascade,
  tip                 text not null check (tip in ('mtv', 'muayene', 'kasko')),
  tarih               date not null,
  hatirlatici_aktif   bool not null default true,
  created_at          timestamptz not null default now(),
  unique (arac_id, tip)
);

-- Gönderilen hatırlatıcı emailler (tekrar göndermemek için)
create table email_gonderimler (
  id              uuid primary key default gen_random_uuid(),
  arac_tarih_id   uuid not null references arac_tarihler(id) on delete cascade,
  gun_oncesi      int not null check (gun_oncesi in (30, 7, 1)),
  gonderildi_at   timestamptz not null default now(),
  unique (arac_tarih_id, gun_oncesi)
);

-- RLS
alter table kullanici_araclar enable row level security;
alter table arac_tarihler enable row level security;
alter table email_gonderimler enable row level security;

create policy "kullanici kendi araclarini gorur"
  on kullanici_araclar for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "kullanici kendi arac tarihlerini gorur"
  on arac_tarihler for all
  using (
    exists (
      select 1 from kullanici_araclar
      where kullanici_araclar.id = arac_tarihler.arac_id
        and kullanici_araclar.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from kullanici_araclar
      where kullanici_araclar.id = arac_tarihler.arac_id
        and kullanici_araclar.user_id = auth.uid()
    )
  );

-- email_gonderimler sadece service_role okur/yazar (Edge Function)
create policy "service role email gonderimler"
  on email_gonderimler for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
