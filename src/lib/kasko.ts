const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PAGE_SIZE = 1000;
const REVALIDATE_SECONDS = 86400;

export type Marka = {
  marka_kodu: number;
  marka_adi: string;
  slug: string;
};

export type MarkaDetay = Marka & {
  son_snapshot_month: string;
  model_yillari: number[];
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

async function restFetch<T>(
  table: string,
  params: Record<string, string>,
  range: [number, number],
): Promise<{ data: T[]; total: number }> {
  const qs = new URLSearchParams(params).toString();
  const url = `${SUPABASE_URL}/rest/v1/${table}?${qs}`;

  const res = await fetch(url, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      Prefer: "count=exact",
      Range: `${range[0]}-${range[1]}`,
    },
    // Next.js Data Cache: aynı sorgu 1 gün boyunca Supabase'e gitmeden cache'den dönüyor.
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`Supabase REST hatası (${table}, ${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as T[];
  const contentRange = res.headers.get("content-range"); // örn "0-999/12345"
  const total = contentRange ? Number(contentRange.split("/")[1]) : data.length;
  return { data, total };
}

// Supabase/PostgREST tek istekte en fazla ~1000 satır döner. Toplam satır sayısını
// ilk istekten öğrenip kalan sayfaları PARALEL çekerek sıralı sayfalamadaki yüksek
// gecikmeyi ortadan kaldırıyoruz. kasko_degerleri sorguları zaten marka_kodu/yıl/ay
// ile filtrelendiği için birkaç sayfayı aşmaz.
async function fetchAll<T>(table: string, params: Record<string, string>): Promise<T[]> {
  const first = await restFetch<T>(table, params, [0, PAGE_SIZE - 1]);
  if (first.total <= first.data.length) return first.data;

  const pageCount = Math.ceil(first.total / PAGE_SIZE);
  const remaining = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, i) => {
      const from = (i + 1) * PAGE_SIZE;
      return restFetch<T>(table, params, [from, from + PAGE_SIZE - 1]).then((r) => r.data);
    }),
  );

  return [first.data, ...remaining].flat();
}

// Marka listesi artık 1.43M satırlık kasko_degerleri'ni hiç taramıyor;
// TSB import script'i tarafından güncel tutulan küçük özet tablodan (tsb_markalar) okunuyor.
export async function getMarkalar(): Promise<Marka[]> {
  const rows = await fetchAll<Marka>("tsb_markalar", {
    select: "marka_kodu,marka_adi,slug",
    order: "marka_adi.asc",
  });
  return rows;
}

export async function getMarkaBySlug(slug: string): Promise<MarkaDetay | null> {
  const { data } = await restFetch<MarkaDetay>(
    "tsb_markalar",
    { select: "marka_kodu,marka_adi,slug,son_snapshot_month,model_yillari", slug: `eq.${slug}`, limit: "1" },
    [0, 0],
  );
  if (!data[0]) return null;
  return data[0];
}


export async function getTiplerForMarkaYil(markaKodu: number, modelYili: number, snapshotMonth: string): Promise<Tip[]> {
  return fetchAll<Tip>("kasko_degerleri", {
    select: "tip_kodu,tip_adi,deger",
    marka_kodu: `eq.${markaKodu}`,
    model_yili: `eq.${modelYili}`,
    snapshot_month: `eq.${snapshotMonth}`,
    order: "tip_adi.asc",
  });
}

export async function getTipDetay(markaKodu: number, tipKodu: number, snapshotMonth: string) {
  const rows = await fetchAll<{ tip_adi: string; marka_adi: string; model_yili: number; deger: number }>(
    "kasko_degerleri",
    {
      select: "tip_adi,marka_adi,model_yili,deger",
      marka_kodu: `eq.${markaKodu}`,
      tip_kodu: `eq.${tipKodu}`,
      snapshot_month: `eq.${snapshotMonth}`,
      order: "model_yili.desc",
    },
  );

  if (rows.length === 0) return null;

  return {
    tip_adi: rows[0].tip_adi,
    marka_adi: rows[0].marka_adi,
    gecmis: rows.map((row) => ({ model_yili: row.model_yili, deger: row.deger })) as DegerNoktasi[],
  };
}
