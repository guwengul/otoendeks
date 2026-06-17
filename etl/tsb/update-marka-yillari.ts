import { supabase } from "../shared/supabase-client";

async function main() {
  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      UPDATE tsb_markalar t
      SET model_yillari = sub.yillar
      FROM (
        SELECT
          marka_kodu,
          array_agg(DISTINCT model_yili ORDER BY model_yili DESC) AS yillar
        FROM kasko_degerleri
        WHERE snapshot_month = (SELECT MAX(snapshot_month) FROM kasko_degerleri)
        GROUP BY marka_kodu
      ) sub
      WHERE t.marka_kodu = sub.marka_kodu
    `,
  });

  if (error) {
    // exec_sql RPC yoksa manuel pagination yöntemi
    console.log("RPC yok, pagination yöntemi deneniyor...");
    await fallback();
    return;
  }
  console.log("model_yillari güncellendi.");
}

async function fallback() {
  const { data: snap } = await supabase
    .from("kasko_degerleri")
    .select("snapshot_month")
    .order("snapshot_month", { ascending: false })
    .limit(1)
    .single();
  if (!snap) { console.error("snapshot bulunamadı"); process.exit(1); }

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

  for (const [marka_kodu, yillar] of markaYillar) {
    await supabase
      .from("tsb_markalar")
      .update({ model_yillari: [...yillar].sort((a, b) => b - a) })
      .eq("marka_kodu", marka_kodu);
  }
  console.log(`${markaYillar.size} marka güncellendi.`);
}

main();
