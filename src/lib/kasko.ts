import { supabase } from "./supabase";
import { slugify } from "./slug";

export type Marka = {
  marka_kodu: number;
  marka_adi: string;
  slug: string;
};

export type Tip = {
  tip_kodu: number;
  tip_adi: string;
  deger: number;
};

export type DegerNoktasi = {
  model_yili: number;
  deger: number;
};

async function getLatestSnapshotMonth(): Promise<string> {
  const { data, error } = await supabase
    .from("kasko_degerleri")
    .select("snapshot_month")
    .order("snapshot_month", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) throw new Error("Kasko verisi bulunamadı");
  return data.snapshot_month;
}

export async function getMarkalar(): Promise<Marka[]> {
  const snapshotMonth = await getLatestSnapshotMonth();

  const { data, error } = await supabase
    .from("kasko_degerleri")
    .select("marka_kodu, marka_adi")
    .eq("snapshot_month", snapshotMonth);

  if (error) throw error;

  const seen = new Map<number, string>();
  for (const row of data) {
    if (!seen.has(row.marka_kodu)) seen.set(row.marka_kodu, row.marka_adi);
  }

  return [...seen.entries()]
    .map(([marka_kodu, marka_adi]) => ({ marka_kodu, marka_adi, slug: slugify(marka_adi) }))
    .sort((a, b) => a.marka_adi.localeCompare(b.marka_adi, "tr"));
}

export async function getMarkaBySlug(slug: string): Promise<Marka | null> {
  const markalar = await getMarkalar();
  return markalar.find((m) => m.slug === slug) ?? null;
}

export async function getYillarForMarka(markaKodu: number): Promise<number[]> {
  const snapshotMonth = await getLatestSnapshotMonth();

  const { data, error } = await supabase
    .from("kasko_degerleri")
    .select("model_yili")
    .eq("marka_kodu", markaKodu)
    .eq("snapshot_month", snapshotMonth);

  if (error) throw error;

  return [...new Set(data.map((row) => row.model_yili))].sort((a, b) => b - a);
}

export async function getTiplerForMarkaYil(markaKodu: number, modelYili: number): Promise<Tip[]> {
  const snapshotMonth = await getLatestSnapshotMonth();

  const { data, error } = await supabase
    .from("kasko_degerleri")
    .select("tip_kodu, tip_adi, deger")
    .eq("marka_kodu", markaKodu)
    .eq("model_yili", modelYili)
    .eq("snapshot_month", snapshotMonth)
    .order("tip_adi", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getTipDetay(markaKodu: number, tipKodu: number) {
  const snapshotMonth = await getLatestSnapshotMonth();

  const { data, error } = await supabase
    .from("kasko_degerleri")
    .select("tip_adi, marka_adi, model_yili, deger")
    .eq("marka_kodu", markaKodu)
    .eq("tip_kodu", tipKodu)
    .eq("snapshot_month", snapshotMonth)
    .order("model_yili", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  return {
    tip_adi: data[0].tip_adi,
    marka_adi: data[0].marka_adi,
    gecmis: data.map((row) => ({ model_yili: row.model_yili, deger: row.deger })) as DegerNoktasi[],
  };
}
