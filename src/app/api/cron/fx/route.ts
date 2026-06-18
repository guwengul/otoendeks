import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OUNCE_TO_GRAM = 31.1035;

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function fetchUsdTry(startDate: string, endDate: string): Promise<Map<string, number>> {
  const res = await fetch(`https://api.frankfurter.app/${startDate}..${endDate}?from=USD&to=TRY`);
  if (!res.ok) throw new Error(`frankfurter HTTP ${res.status}`);
  const json = (await res.json()) as { rates: Record<string, { TRY: number }> };
  const map = new Map<string, number>();
  for (const [date, value] of Object.entries(json.rates)) map.set(date, value.TRY);
  return map;
}

async function fetchGoldUsd(startDate: string, endDate: string): Promise<Map<string, number>> {
  const period1 = Math.floor(new Date(`${startDate}T00:00:00Z`).getTime() / 1000);
  const period2 = Math.floor(new Date(`${endDate}T23:59:59Z`).getTime() / 1000);
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?period1=${period1}&period2=${period2}&interval=1d`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!res.ok) throw new Error(`yahoo finance HTTP ${res.status}`);
  const json = (await res.json()) as {
    chart: { result: [{ timestamp: number[]; indicators: { quote: [{ close: (number | null)[] }] } }] };
  };
  const result = json.chart.result[0];
  const map = new Map<string, number>();
  result.timestamp.forEach((ts, i) => {
    const close = result.indicators.quote[0].close[i];
    if (close == null) return;
    map.set(new Date(ts * 1000).toISOString().slice(0, 10), close);
  });
  return map;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [usdTryMap, goldUsdMap] = await Promise.all([
      fetchUsdTry(startDate, endDate),
      fetchGoldUsd(startDate, endDate),
    ]);

    const rows: { tarih: string; usd_try: number; ons_altin_usd: number; gram_altin_try: number }[] = [];
    for (const [date, usdTry] of usdTryMap) {
      const onsAltinUsd = goldUsdMap.get(date);
      if (onsAltinUsd == null) continue;
      rows.push({ tarih: date, usd_try: usdTry, ons_altin_usd: onsAltinUsd, gram_altin_try: (onsAltinUsd * usdTry) / OUNCE_TO_GRAM });
    }

    if (rows.length === 0) return NextResponse.json({ error: "Eşleşen gün bulunamadı" }, { status: 500 });

    const supabase = supabaseAdmin();
    const { error } = await supabase.from("piyasa_degerleri").upsert(rows, { onConflict: "tarih" });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, rows: rows.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
