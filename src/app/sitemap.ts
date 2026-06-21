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

async function getTiplerForSitemap(markaKodu: number, modelYili: number, snapshotMonth: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/kasko_degerleri?select=tip_kodu,tip_adi&marka_kodu=eq.${markaKodu}&model_yili=eq.${modelYili}&snapshot_month=eq.${snapshotMonth}&limit=1000`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, next: { revalidate: 86400 } }
  );
  return res.json() as Promise<{ tip_kodu: number; tip_adi: string }[]>;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [markalar, sifirMarkalari] = await Promise.all([getMarkalar(), getSifirMarkalari()]);
  const urls: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/sifir-arac`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/kredi`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/piyasa-fiyati`, changeFrequency: "monthly", priority: 0.7 },
  ];

  for (const slug of sifirMarkalari) {
    urls.push({
      url: `${BASE}/sifir-arac/${slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const marka of markalar) {
    urls.push({
      url: `${BASE}/kasko-deger/${marka.slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    for (const yil of marka.model_yillari ?? []) {
      urls.push({
        url: `${BASE}/kasko-deger/${marka.slug}/${yil}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });

      try {
        const tipler = await getTiplerForSitemap(marka.marka_kodu, yil, marka.son_snapshot_month);
        for (const tip of tipler) {
          urls.push({
            url: `${BASE}/kasko-deger/${marka.slug}/${yil}/${tip.tip_kodu}-${slugify(tip.tip_adi)}`,
            changeFrequency: "monthly",
            priority: 0.6,
          });
        }
      } catch {}
    }
  }

  return urls;
}
