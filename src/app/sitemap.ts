import type { MetadataRoute } from "next";
import { getMarkalar, type MarkaDetay } from "@/lib/kasko";
import { slugify } from "@/lib/slug";

const BASE = "https://otoendeks.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getSifirMarkalari(): Promise<string[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sifir_fiyatlar?select=marka_slug&limit=1000`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 86400 } }
  );
  const data = await res.json() as { marka_slug: string }[];
  return [...new Set(data.map((r) => r.marka_slug))];
}

async function getAllTiplerForSnapshot(snapshotMonth: string): Promise<Map<string, { tip_kodu: number; tip_adi: string }[]>> {
  const result = new Map<string, { tip_kodu: number; tip_adi: string }[]>();
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/kasko_degerleri?select=marka_kodu,model_yili,tip_kodu,tip_adi&snapshot_month=eq.${snapshotMonth}&limit=${pageSize}&offset=${offset}`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 86400 } }
    );
    const rows = await res.json() as { marka_kodu: number; model_yili: number; tip_kodu: number; tip_adi: string }[];
    if (rows.length === 0) break;

    for (const row of rows) {
      const key = `${row.marka_kodu}_${row.model_yili}`;
      if (!result.has(key)) result.set(key, []);
      result.get(key)!.push({ tip_kodu: row.tip_kodu, tip_adi: row.tip_adi });
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return result;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [markalar, sifirMarkalari] = await Promise.all([getMarkalar(), getSifirMarkalari()]);

  // Distinct snapshot months → tek fetch per ay
  const snapshotMonths = [...new Set(markalar.map((m) => m.son_snapshot_month))];
  const tipMaps = await Promise.all(snapshotMonths.map(getAllTiplerForSnapshot));
  const tipMap = new Map<string, { tip_kodu: number; tip_adi: string }[]>();
  for (const m of tipMaps) m.forEach((v, k) => tipMap.set(k, v));

  const urls: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/sifir-arac`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/kasko-degeri-nedir`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/kredi`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/piyasa-fiyati`, changeFrequency: "monthly", priority: 0.7 },
  ];

  for (const slug of sifirMarkalari) {
    urls.push({ url: `${BASE}/sifir-arac/${slug}`, changeFrequency: "weekly", priority: 0.7 });
  }

  for (const marka of markalar) {
    urls.push({ url: `${BASE}/kasko-deger/${marka.slug}`, changeFrequency: "weekly", priority: 0.8 });

    for (const yil of marka.model_yillari ?? []) {
      urls.push({ url: `${BASE}/kasko-deger/${marka.slug}/${yil}`, changeFrequency: "weekly", priority: 0.7 });

      const tipler = tipMap.get(`${marka.marka_kodu}_${yil}`) ?? [];
      for (const tip of tipler) {
        urls.push({
          url: `${BASE}/kasko-deger/${marka.slug}/${yil}/${tip.tip_kodu}-${slugify(tip.tip_adi)}`,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  return urls;
}
