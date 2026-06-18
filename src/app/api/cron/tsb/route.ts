import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as xlsx from "xlsx";
import { slugify } from "@/lib/slug";

export const maxDuration = 60;

// MonthId mapping (TSB API)
const MONTH_IDS: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 1, 11: 11, 12: 12 };

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type KaskoRow = {
  snapshot_month: string;
  marka_kodu: number;
  tip_kodu: number;
  marka_adi: string;
  tip_adi: string;
  model_yili: number;
  deger: number;
};

async function getTsbFileUrl(year: number, month: number): Promise<string | null> {
  const monthId = MONTH_IDS[month];
  const res = await fetch(`https://www.tsb.org.tr/InsuranceData/GetInsuranceDataArchiveFile?Year=${year}&MonthId=${monthId}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) return null;
  const text = await res.text();
  const url = text.replace(/^"|"$/g, "").trim();
  return url ? `https://www.tsb.org.tr${url}` : null;
}

async function downloadAndParse(fileUrl: string, snapshotMonth: string): Promise<KaskoRow[]> {
  const res = await fetch(fileUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`TSB dosya indirme hatası: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const wb = xlsx.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });

  const headerRow = data[1] as (string | number)[];
  const yearColumns: { colIndex: number; year: number }[] = [];
  for (let i = 4; i < headerRow.length; i++) {
    const y = Number(headerRow[i]);
    if (Number.isInteger(y) && y > 1990) yearColumns.push({ colIndex: i, year: y });
  }

  const rows: KaskoRow[] = [];
  for (let r = 2; r < data.length; r++) {
    const row = data[r] as (string | number)[];
    if (!row || row.length === 0) continue;
    const markaKodu = Number(row[0]);
    const tipKodu = Number(row[1]);
    const markaAdi = String(row[2] ?? "").trim();
    const tipAdi = String(row[3] ?? "").trim();
    if (!markaAdi || !Number.isInteger(markaKodu) || !Number.isInteger(tipKodu)) continue;
    for (const { colIndex, year } of yearColumns) {
      const deger = Number(row[colIndex]);
      if (!Number.isFinite(deger) || deger <= 0) continue;
      rows.push({ snapshot_month: snapshotMonth, marka_kodu: markaKodu, tip_kodu: tipKodu, marka_adi: markaAdi, tip_adi: tipAdi, model_yili: year, deger });
    }
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = supabaseAdmin();

    // Hangi ay/yılı deneyelim: bu ay ve geçen ay
    const now = new Date();
    const candidates = [
      { year: now.getFullYear(), month: now.getMonth() + 1 },
      { year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(), month: now.getMonth() === 0 ? 12 : now.getMonth() },
    ];

    const results: string[] = [];

    for (const { year, month } of candidates) {
      const snapshotMonth = `${year}-${String(month).padStart(2, "0")}-01`;

      // Zaten var mı?
      const { count } = await supabase
        .from("kasko_degerleri")
        .select("*", { count: "exact", head: true })
        .eq("snapshot_month", snapshotMonth);
      if (count && count > 0) {
        results.push(`${snapshotMonth}: zaten mevcut (${count} satır)`);
        continue;
      }

      // TSB'den URL al
      const fileUrl = await getTsbFileUrl(year, month);
      if (!fileUrl) {
        results.push(`${snapshotMonth}: TSB'de henüz yok`);
        continue;
      }

      // İndir ve parse et
      const rows = await downloadAndParse(fileUrl, snapshotMonth);
      if (rows.length === 0) {
        results.push(`${snapshotMonth}: parse edildi ama satır yok`);
        continue;
      }

      // Supabase'e yaz
      const CHUNK = 1000;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await supabase
          .from("kasko_degerleri")
          .upsert(rows.slice(i, i + CHUNK), { onConflict: "snapshot_month,marka_kodu,tip_kodu,model_yili" });
        if (error) throw new Error(`kasko_degerleri upsert: ${error.message}`);
      }

      // tsb_markalar güncelle
      const markaMap = new Map<number, { marka_adi: string; son_snapshot_month: string; yillar: Set<number> }>();
      for (const row of rows) {
        const m = markaMap.get(row.marka_kodu);
        if (!m) markaMap.set(row.marka_kodu, { marka_adi: row.marka_adi, son_snapshot_month: snapshotMonth, yillar: new Set([row.model_yili]) });
        else m.yillar.add(row.model_yili);
      }
      const markalarRows = [...markaMap.entries()].map(([marka_kodu, v]) => ({
        marka_kodu,
        marka_adi: v.marka_adi,
        slug: slugify(v.marka_adi),
        son_snapshot_month: snapshotMonth,
        model_yillari: [...v.yillar].sort((a, b) => b - a),
      }));
      const { error: markaError } = await supabase.from("tsb_markalar").upsert(markalarRows, { onConflict: "marka_kodu" });
      if (markaError) throw new Error(`tsb_markalar upsert: ${markaError.message}`);

      results.push(`${snapshotMonth}: ${rows.length} satır yazıldı`);
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
