import { supabase } from "../shared/supabase-client";

const START_DATE = "2025-01-01";
const OUNCE_TO_GRAM = 31.1035;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchUsdTry(startDate: string, endDate: string): Promise<Map<string, number>> {
  const url = `https://api.frankfurter.app/${startDate}..${endDate}?from=USD&to=TRY`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`frankfurter HTTP ${res.status}`);
  const json = (await res.json()) as { rates: Record<string, { TRY: number }> };
  const map = new Map<string, number>();
  for (const [date, value] of Object.entries(json.rates)) {
    map.set(date, value.TRY);
  }
  return map;
}

async function fetchGoldUsd(startDate: string, endDate: string): Promise<Map<string, number>> {
  const period1 = Math.floor(new Date(`${startDate}T00:00:00Z`).getTime() / 1000);
  const period2 = Math.floor(new Date(`${endDate}T23:59:59Z`).getTime() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?period1=${period1}&period2=${period2}&interval=1d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`yahoo finance HTTP ${res.status}`);
  const json = (await res.json()) as {
    chart: { result: [{ timestamp: number[]; indicators: { quote: [{ close: (number | null)[] }] } }] };
  };
  const result = json.chart.result[0];
  const map = new Map<string, number>();
  result.timestamp.forEach((ts, i) => {
    const close = result.indicators.quote[0].close[i];
    if (close == null) return;
    const date = new Date(ts * 1000).toISOString().slice(0, 10);
    map.set(date, close);
  });
  return map;
}

async function main() {
  const endDate = todayStr();
  console.log(`USD/TRY ve ons altın çekiliyor: ${START_DATE} -> ${endDate}`);

  const [usdTryMap, goldUsdMap] = await Promise.all([
    fetchUsdTry(START_DATE, endDate),
    fetchGoldUsd(START_DATE, endDate),
  ]);

  console.log(`USD/TRY: ${usdTryMap.size} gün, Ons altın: ${goldUsdMap.size} gün`);

  const rows: { tarih: string; usd_try: number; ons_altin_usd: number; gram_altin_try: number }[] = [];
  for (const [date, usdTry] of usdTryMap) {
    const onsAltinUsd = goldUsdMap.get(date);
    if (onsAltinUsd == null) continue; // her iki kaynakta da olan günler eşleştirilir
    rows.push({
      tarih: date,
      usd_try: usdTry,
      ons_altin_usd: onsAltinUsd,
      gram_altin_try: (onsAltinUsd * usdTry) / OUNCE_TO_GRAM,
    });
  }

  if (rows.length === 0) {
    console.error("Eşleşen gün bulunamadı, DB'ye yazılmıyor.");
    process.exit(1);
  }

  rows.sort((a, b) => a.tarih.localeCompare(b.tarih));
  console.log(`Toplam ${rows.length} eşleşen gün, Supabase'e yazılıyor...`);

  const CHUNK_SIZE = 500;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from("piyasa_degerleri").upsert(chunk, { onConflict: "tarih" });
    if (error) {
      console.error("Upsert hatası:", error);
      process.exit(1);
    }
  }

  console.log("Tamamlandı.");
}

main();
