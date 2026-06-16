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

const PAGE_SIZE = 1000;

// Supabase/PostgREST varsayılan olarak tek sorguda en fazla ~1000 satır döner.
// Bu yüzden büyük sonuç kümelerinde range() ile sayfalayıp tamamını topluyoruz.
async function fetchAllPages<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

async function getLatestSnapshotMonth(): Promise<string> {
  const { data, error } = await supabase
    .from("kasko_degerleri")
    .select("snapshot_month")
    .order("snapshot_month", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`Kasko verisi bulunamadı: ${error?.message ?? "veri yok"}`);
  }
  return data.snapshot_month;
}

export async function getMarkalar(): Promise<Marka[]> {
  const snapshotMonth = await getLatestSnapshotMonth();

  const rows = await fetchAllPages<{ marka_kodu: number; marka_adi: string }>((from, to) =>
    supabase
      .from("kasko_degerleri")
      .select("marka_kodu, marka_adi")
      .eq("snapshot_month", snapshotMonth)
      .range(from, to),
  );

  const seen = new Map<number, string>();
  for (const row of rows) {
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

  const rows = await fetchAllPages<{ model_yili: number }>((from, to) =>
    supabase
      .from("kasko_degerleri")
      .select("model_yili")
      .eq("marka_kodu", markaKodu)
      .eq("snapshot_month", snapshotMonth)
      .range(from, to),
  );

  return [...new Set(rows.map((row) => row.model_yili))].sort((a, b) => b - a);
}

export async function getTiplerForMarkaYil(markaKodu: number, modelYili: number): Promise<Tip[]> {
  const snapshotMonth = await getLatestSnapshotMonth();

  const rows = await fetchAllPages<Tip>((from, to) =>
    supabase
      .from("kasko_degerleri")
      .select("tip_kodu, tip_adi, deger")
      .eq("marka_kodu", markaKodu)
      .eq("model_yili", modelYili)
      .eq("snapshot_month", snapshotMonth)
      .order("tip_adi", { ascending: true })
      .range(from, to),
  );

  return rows;
}

export async function getTipDetay(markaKodu: number, tipKodu: number) {
  const snapshotMonth = await getLatestSnapshotMonth();

  const rows = await fetchAllPages<{ tip_adi: string; marka_adi: string; model_yili: number; deger: number }>(
    (from, to) =>
      supabase
        .from("kasko_degerleri")
        .select("tip_adi, marka_adi, model_yili, deger")
        .eq("marka_kodu", markaKodu)
        .eq("tip_kodu", tipKodu)
        .eq("snapshot_month", snapshotMonth)
        .order("model_yili", { ascending: false })
        .range(from, to),
  );

  if (rows.length === 0) return null;

  return {
    tip_adi: rows[0].tip_adi,
    marka_adi: rows[0].marka_adi,
    gecmis: rows.map((row) => ({ model_yili: row.model_yili, deger: row.deger })) as DegerNoktasi[],
  };
}
