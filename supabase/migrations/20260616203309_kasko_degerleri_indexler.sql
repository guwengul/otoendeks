-- getYillarForMarka (marka_kodu + snapshot_month) ve getTiplerForMarkaYil
-- (marka_kodu + model_yili + snapshot_month) sorgularını hızlandırmak için.
create index if not exists idx_kasko_marka_snapshot
  on kasko_degerleri (marka_kodu, snapshot_month);

create index if not exists idx_kasko_marka_yil_snapshot
  on kasko_degerleri (marka_kodu, model_yili, snapshot_month);
