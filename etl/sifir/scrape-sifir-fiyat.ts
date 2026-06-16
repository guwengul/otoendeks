import * as cheerio from "cheerio";
import { supabase } from "../shared/supabase-client";
import { BRAND_SLUGS } from "./brands";

const BASE_URL = "https://sifiraracal.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const DELAY_MS = 1500;

type SifirRow = {
  marka_slug: string;
  marka_adi: string;
  model_adi: string;
  versiyon: string;
  guc: string | null;
  vites: string | null;
  yakit: string | null;
  liste_fiyati: number | null;
  kampanya_fiyati: number | null;
  source_url: string;
};

function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function cleanText(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") return null;
  return trimmed;
}

async function fetchBrandPage(slug: string): Promise<string> {
  const url = `${BASE_URL}/${slug}-fiyat-listesi`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`${slug}: HTTP ${res.status}`);
  }
  return res.text();
}

function parseBrandPage(slug: string, html: string): SifirRow[] {
  const $ = cheerio.load(html);
  const sourceUrl = `${BASE_URL}/${slug}-fiyat-listesi`;
  const rows: SifirRow[] = [];

  // Marka adı: h1 içinde tek başına yazılı (banner)
  const markaAdi = $("main h1").first().text().trim() || slug;

  $("h5.text-saa-yellow").each((_, h5Elem) => {
    const h5 = $(h5Elem);
    const modelAdi = h5
      .text()
      .replace(/Fiyat Listesi\s*$/i, "")
      .trim();
    if (!modelAdi) return;

    // h5'in doğrudan ebeveyni banner div, tablo container'ı bu div'in bir sonraki kardeşi
    const bannerDiv = h5.parent();
    const tableContainer = bannerDiv.next();
    if (tableContainer.length === 0) return;

    const dataRows = tableContainer.children("div").filter((__, rowEl) => {
      const spans = $(rowEl).children("span");
      if (spans.length !== 6) return false;
      // Header satırı span'ları font-semibold class'ı taşır, data satırları taşımaz
      return $(spans[0]).hasClass("font-semibold") === false;
    });

    dataRows.each((__, rowEl) => {
      const spans = $(rowEl).children("span");
      const versiyon = cleanText($(spans[0]).text());
      if (!versiyon) return;

      rows.push({
        marka_slug: slug,
        marka_adi: markaAdi,
        model_adi: modelAdi,
        versiyon,
        guc: cleanText($(spans[1]).text()),
        vites: cleanText($(spans[2]).text()),
        yakit: cleanText($(spans[3]).text()),
        liste_fiyati: parsePrice($(spans[4]).text()),
        kampanya_fiyati: parsePrice($(spans[5]).text()),
        source_url: sourceUrl,
      });
    });
  });

  return rows;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const allRows: SifirRow[] = [];
  const failedBrands: string[] = [];

  for (const slug of BRAND_SLUGS) {
    try {
      const html = await fetchBrandPage(slug);
      const rows = parseBrandPage(slug, html);
      console.log(`${slug}: ${rows.length} versiyon bulundu`);
      if (rows.length === 0) {
        console.warn(`  uyarı: ${slug} için hiç satır bulunamadı, sayfa yapısı değişmiş olabilir`);
      }
      allRows.push(...rows);
    } catch (err) {
      console.error(
        `${slug}: HATA -`,
        err instanceof Error ? err.message : err,
        (err as { cause?: unknown })?.cause ?? "",
      );
      failedBrands.push(slug);
    }
    await sleep(DELAY_MS);
  }

  if (allRows.length === 0) {
    console.error("Hiç veri toplanamadı, DB'ye yazılmıyor.");
    process.exit(1);
  }

  const seen = new Map<string, SifirRow>();
  let duplicateCount = 0;
  for (const row of allRows) {
    const key = `${row.marka_slug}::${row.model_adi}::${row.versiyon}`;
    if (seen.has(key)) duplicateCount++;
    seen.set(key, row); // aynı anahtarda son görülen satır kazanır
  }
  const dedupedRows = [...seen.values()];
  if (duplicateCount > 0) {
    console.warn(`${duplicateCount} yinelenen (marka+model+versiyon) satırı bulundu, son görülen kayıt kullanıldı.`);
  }

  console.log(`Toplam ${dedupedRows.length} benzersiz satır, Supabase'e yazılıyor...`);

  const CHUNK_SIZE = 500;
  for (let i = 0; i < dedupedRows.length; i += CHUNK_SIZE) {
    const chunk = dedupedRows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from("sifir_fiyatlar")
      .upsert(chunk, { onConflict: "marka_slug,model_adi,versiyon,scrape_date" });
    if (error) {
      console.error("Upsert hatası:", error);
      process.exit(1);
    }
  }

  console.log("Tamamlandı.");
  if (failedBrands.length > 0) {
    console.warn("Başarısız markalar:", failedBrands.join(", "));
  }
}

main();
