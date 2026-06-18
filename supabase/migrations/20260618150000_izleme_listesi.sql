create table izleme_listesi (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  marka_kodu       int not null,
  tip_kodu         int not null,
  marka_adi        text not null,
  tip_adi          text not null,
  marka_slug       text not null,
  fiyat_kayit      numeric not null,
  fiyat_bildirimi  bool not null default true,
  created_at       timestamptz not null default now(),
  unique (user_id, marka_kodu, tip_kodu)
);

alter table izleme_listesi enable row level security;

create policy "kullanici kendi izlemelerini gorur"
  on izleme_listesi for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
