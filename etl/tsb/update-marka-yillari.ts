/**
 * tsb_markalar.model_yillari kolonunu kasko_degerleri'ndeki mevcut veriden doldurur.
 * import-tsb.ts'deki model_yillari logiği doğrulanana kadar bu script kullanılabilir.
 *
 * Supabase SQL Editöründe çalıştırmak daha hızlı:
 *
 *   UPDATE tsb_markalar t
 *   SET model_yillari = sub.yillar
 *   FROM (
 *     SELECT marka_kodu,
 *            array_agg(DISTINCT model_yili ORDER BY model_yili DESC) AS yillar
 *     FROM kasko_degerleri
 *     WHERE snapshot_month = (SELECT MAX(snapshot_month) FROM kasko_degerleri)
 *     GROUP BY marka_kodu
 *   ) sub
 *   WHERE t.marka_kodu = sub.marka_kodu;
 */
import { supabase } from "../shared/supabase-client";

async function main() {
  const { data: snap } = await supabase
    .from("kasko_degerleri")
    .select("snapshot_month")
    .order("snapshot_month", { ascending: false })
    .limit(1)
    .single();
  if (!snap) { console.error("snapshot bulunamadı"); process.exit(1); }
  console.log("snapshot_month:", snap.snapshot_month);

  const markaYillar = new Map<number, Set<number>>();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("kasko_degerleri")
      .select("marka_kodu,model_yili")
      .eq("snapshot_month", snap.snapshot_month)
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); process.exit(1); }
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (!markaYillar.has(row.marka_kodu)) markaYillar.set(row.marka_kodu, new Set());
      markaYillar.get(row.marka_kodu)!.add(row.model_yili);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`${markaYillar.size} marka için yıllar toplandı, güncelleniyor...`);
  for (const [marka_kodu, yillar] of markaYillar) {
    const { error } = await supabase
      .from("tsb_markalar")
      .update({ model_yillari: [...yillar].sort((a, b) => b - a) })
      .eq("marka_kodu", marka_kodu);
    if (error) { console.error(`marka_kodu=${marka_kodu} güncelleme hatası:`, error); }
  }
  console.log("Tamamlandı.");
}

main();
