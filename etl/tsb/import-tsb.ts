import * as fs from "fs";
import * as path from "path";
import * as xlsx from "xlsx";
import { supabase } from "../shared/supabase-client";
import { slugify } from "../../src/lib/slug";

const DATA_DIR = path.join(process.cwd(), "TSB Verileri");

type KaskoRow = {
  snapshot_month: string; // YYYY-MM-01
  marka_kodu: number;
  tip_kodu: number;
  marka_adi: string;
  tip_adi: string;
  model_yili: number;
  deger: number;
};

function parseFile(filePath: string, fileName: string): KaskoRow[] {
  const yyyymm = fileName.replace(/\.xlsx$/i, "");
  const year = yyyymm.slice(0, 4);
  const month = yyyymm.slice(4, 6);
  const snapshotMonth = `${year}-${month}-01`;

  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });

  // Satır 0: başlık ("Haziran 2025"), Satır 1: kolon başlıkları (Marka Kodu, Tip Kodu, Marka Adı, Tip Adı, <yıllar...>)
  const headerRow = data[1] as (string | number)[];
  const yearColumns: { colIndex: number; year: number }[] = [];
  for (let i = 4; i < headerRow.length; i++) {
    const year = Number(headerRow[i]);
    if (Number.isInteger(year)) {
      yearColumns.push({ colIndex: i, year });
    }
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
      rows.push({
        snapshot_month: snapshotMonth,
        marka_kodu: markaKodu,
        tip_kodu: tipKodu,
        marka_adi: markaAdi,
        tip_adi: tipAdi,
        model_yili: year,
        deger,
      });
    }
  }

  return rows;
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Klasör bulunamadı: ${DATA_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith(".xlsx"))
    .sort();

  if (files.length === 0) {
    console.error("TSB Verileri klasöründe .xlsx dosyası bulunamadı.");
    process.exit(1);
  }

  let totalRows = 0;
  const markaOzet = new Map<number, { marka_adi: string; son_snapshot_month: string; yillar: Set<number> }>();

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const rows = parseFile(filePath, file);
    console.log(`${file}: ${rows.length} satır`);

    const CHUNK_SIZE = 1000;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from("kasko_degerleri")
        .upsert(chunk, { onConflict: "snapshot_month,marka_kodu,tip_kodu,model_yili" });
      if (error) {
        console.error(`${file}: Upsert hatası -`, error);
        process.exit(1);
      }
    }
    totalRows += rows.length;

    for (const row of rows) {
      const mevcut = markaOzet.get(row.marka_kodu);
      if (!mevcut) {
        markaOzet.set(row.marka_kodu, {
          marka_adi: row.marka_adi,
          son_snapshot_month: row.snapshot_month,
          yillar: new Set([row.model_yili]),
        });
      } else {
        if (row.snapshot_month > mevcut.son_snapshot_month) {
          mevcut.son_snapshot_month = row.snapshot_month;
          mevcut.yillar = new Set([row.model_yili]);
        } else if (row.snapshot_month === mevcut.son_snapshot_month) {
          mevcut.yillar.add(row.model_yili);
        }
      }
    }
  }

  console.log(`Tamamlandı. Toplam ${totalRows} satır işlendi (${files.length} dosya).`);

  const markalarRows = [...markaOzet.entries()].map(([marka_kodu, v]) => ({
    marka_kodu,
    marka_adi: v.marka_adi,
    slug: slugify(v.marka_adi),
    son_snapshot_month: v.son_snapshot_month,
    model_yillari: [...v.yillar].sort((a, b) => b - a),
  }));

  console.log(`tsb_markalar özet tablosu güncelleniyor (${markalarRows.length} marka)...`);
  const { error: markaError } = await supabase
    .from("tsb_markalar")
    .upsert(markalarRows, { onConflict: "marka_kodu" });
  if (markaError) {
    console.error("tsb_markalar upsert hatası -", markaError);
    process.exit(1);
  }
  console.log("tsb_markalar güncellendi.");
}

main();
