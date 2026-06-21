export { slugify } from "@/lib/slug";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PAGE_SIZE = 1000;
const REVALIDATE_SECONDS = 86400;

export type Marka = {
  marka_kodu: number;
  marka_adi: string;
  slug: string;
  model_yillari: number[];
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

export type SifirFiyat = {
  id: number;
  marka_adi: string;
  model_adi: string;
  versiyon: string;
  guc: string;
  vites: string;
  yakit: string;
  liste_fiyati: number;
  kampanya_fiyati: number;
  scrape_date: string;
};

export async function getSifirFiyatlar(markaSlug: string): Promise<SifirFiyat[]> {
  return fetchAll<SifirFiyat>("sifir_fiyatlar", {
    select: "id,marka_adi,model_adi,versiyon,guc,vites,yakit,liste_fiyati,kampanya_fiyati,scrape_date",
    marka_slug: `eq.${markaSlug}`,
    order: "model_adi.asc,liste_fiyati.asc",
  });
}

export type DegerNoktasi = {
  model_yili: number;
  deger: number;
};

export type AylikNoktasi = {
  snapshot_month: string;
  deger_tl: number;
  deger_usd: number;
  deger_altin_gram: number;
};

type PiyasaRow = {
  tarih: string;
  usd_try: number;
  gram_altin_try: number;
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
export async function getMarkalar(): Promise<MarkaDetay[]> {
  const rows = await fetchAll<MarkaDetay>("tsb_markalar", {
    select: "marka_kodu,marka_adi,slug,model_yillari,son_snapshot_month",
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

export async function getFiyatGecmisi(markaKodu: number, tipKodu: number, modelYili: number): Promise<AylikNoktasi[]> {
  const kaskoRows = await fetchAll<{ snapshot_month: string; deger: number }>("kasko_degerleri", {
    select: "snapshot_month,deger",
    marka_kodu: `eq.${markaKodu}`,
    tip_kodu: `eq.${tipKodu}`,
    model_yili: `eq.${modelYili}`,
    order: "snapshot_month.asc",
  });
  if (kaskoRows.length === 0) return [];

  const ilkAy = kaskoRows[0].snapshot_month.slice(0, 7); // "2025-01"

  const piyasaRows = await fetchAll<PiyasaRow>("piyasa_degerleri", {
    select: "tarih,usd_try,gram_altin_try",
    tarih: `gte.${ilkAy}-01`,
    order: "tarih.asc",
  });

  // Her snapshot ayı için o aydaki son piyasa kaydını bul
  const ayPiyasa = new Map<string, PiyasaRow>();
  for (const p of piyasaRows) {
    const ay = p.tarih.slice(0, 7); // "2025-01"
    ayPiyasa.set(ay, p); // sonraki üzerine yazar → ayın son günü kalır
  }

  return kaskoRows.map((k) => {
    const ay = k.snapshot_month.slice(0, 7);
    const piyasa = ayPiyasa.get(ay);
    return {
      snapshot_month: k.snapshot_month,
      deger_tl: k.deger,
      deger_usd: piyasa ? Math.round(k.deger / piyasa.usd_try) : 0,
      deger_altin_gram: piyasa ? Math.round(k.deger / piyasa.gram_altin_try) : 0,
    };
  });
}

type RawKaskoRow = { tip_kodu: number; tip_adi: string; deger: number };

type AracOzellik = {
  tip_kodu: number;
  arac_tipi: string | null;
  model_adi: string | null;
  kasa: string | null;
  yakit: string | null;
  vites: string | null;
  motor_guc_hp: number | null;
  motor_hacmi: string | null;
  cekis: string | null;
};

export type AracSpek = {
  kasa: string | null;
  yakit: string | null;
  vites: string | null;
  motor_guc_hp: number | null;
  motor_hacmi: string | null;
  cekis: string | null;
};

export type SifirEndeksVeri = {
  sonAy: string;
  oncekiAy: string | null;
  current: RawKaskoRow[];
  prevMonthMap: Record<number, number>;
  prevYearMap: Record<number, number>;
  aracTipiMap: Record<number, string>;
  modelAdiMap: Record<number, string>;
  spekMap: Record<number, AracSpek>;
  trendMap: Record<number, number[]>;
};

export async function getSifirEndeksVeri(
  markaKodu: number,
  sonAy: string,
): Promise<SifirEndeksVeri> {
  const modelYili = Number(sonAy.slice(0, 4));

  // Bir önceki ay (2026-06-01 → 2026-05-01)
  const d = new Date(sonAy);
  d.setMonth(d.getMonth() - 1);
  const oncekiAy = d.toISOString().slice(0, 7) + "-01";

  // Bir yıl önceki ay & model yılı
  const yilOncesiAy = String(modelYili - 1) + sonAy.slice(4);
  const yilOncesiModel = modelYili - 1;

  // Son 6 ay için başlangıç tarihi
  const d6 = new Date(sonAy);
  d6.setMonth(d6.getMonth() - 5);
  const altiAyOnce = d6.toISOString().slice(0, 7) + "-01";

  const [current, prevMonth, prevYear, ozellikler, trend6Ay] = await Promise.all([
    fetchAll<RawKaskoRow>("kasko_degerleri", {
      select: "tip_kodu,tip_adi,deger",
      marka_kodu: `eq.${markaKodu}`,
      model_yili: `eq.${modelYili}`,
      snapshot_month: `eq.${sonAy}`,
      order: "tip_adi.asc",
    }),
    fetchAll<RawKaskoRow>("kasko_degerleri", {
      select: "tip_kodu,tip_adi,deger",
      marka_kodu: `eq.${markaKodu}`,
      model_yili: `eq.${modelYili}`,
      snapshot_month: `eq.${oncekiAy}`,
      order: "tip_adi.asc",
    }),
    fetchAll<RawKaskoRow>("kasko_degerleri", {
      select: "tip_kodu,tip_adi,deger",
      marka_kodu: `eq.${markaKodu}`,
      model_yili: `eq.${yilOncesiModel}`,
      snapshot_month: `eq.${yilOncesiAy}`,
      order: "tip_adi.asc",
    }),
    fetchAll<AracOzellik>("arac_ozellikleri", {
      select: "tip_kodu,arac_tipi,model_adi,kasa,yakit,vites,motor_guc_hp,motor_hacmi,cekis",
      marka_kodu: `eq.${markaKodu}`,
    }),
    fetchAll<{ tip_kodu: number; snapshot_month: string; deger: number }>("kasko_degerleri", {
      select: "tip_kodu,snapshot_month,deger",
      marka_kodu: `eq.${markaKodu}`,
      model_yili: `eq.${modelYili}`,
      snapshot_month: `gte.${altiAyOnce}`,
      order: "snapshot_month.asc",
    }),
  ]);

  // tip_kodu başına kronolojik deger dizisi
  const trendByTip = new Map<number, number[]>();
  for (const r of trend6Ay) {
    const arr = trendByTip.get(r.tip_kodu) ?? [];
    arr.push(r.deger);
    trendByTip.set(r.tip_kodu, arr);
  }

  return {
    sonAy,
    oncekiAy: prevMonth.length ? oncekiAy : null,
    current,
    prevMonthMap: Object.fromEntries(prevMonth.map((r) => [r.tip_kodu, r.deger])),
    prevYearMap: Object.fromEntries(prevYear.map((r) => [r.tip_kodu, r.deger])),
    aracTipiMap: Object.fromEntries(ozellikler.filter((r) => r.arac_tipi).map((r) => [r.tip_kodu, r.arac_tipi!])),
    modelAdiMap: Object.fromEntries(ozellikler.filter((r) => r.model_adi).map((r) => [r.tip_kodu, r.model_adi!])),
    spekMap: Object.fromEntries(ozellikler.map((r) => [r.tip_kodu, { kasa: r.kasa, yakit: r.yakit, vites: r.vites, motor_guc_hp: r.motor_guc_hp, motor_hacmi: r.motor_hacmi, cekis: r.cekis }])),
    trendMap: Object.fromEntries(trendByTip.entries()),
  };
}

const TICARI_REGEX =
  /\b(KAMYONET|KAMYON|M[İI]N[İI]BÜS|M[İI]N[İI]BUS|M[İI]D[İI]BÜS|M[İI]D[İI]BUS|OTOBÜS|OTOBUS|PANELVAN|TRANSPORTER|CRAFTER|CARAVELLE|MULTIVAN|SPRINTER|DAILY|DUCATO|BOXER|JUMPER|VIVARO|TRAFIC|MASTER|EXPRESS)\b/i;

export function isTicari(tipAdi: string): boolean {
  return TICARI_REGEX.test(tipAdi);
}

export function extractModelAdi(tipAdi: string, markaAdi: string): string {
  const rest = tipAdi.startsWith(markaAdi) ? tipAdi.slice(markaAdi.length).trim() : tipAdi;
  const words = rest.split(" ");
  const stopIdx = words.findIndex((w, i) => i > 0 && /\d/.test(w));
  if (stopIdx <= 0) return words[0] ?? rest;
  return words.slice(0, stopIdx).join(" ");
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
