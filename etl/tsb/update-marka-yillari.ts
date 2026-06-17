import { supabase } from "../shared/supabase-client";

async function main() {
  // En güncel snapshot_month'u bul
  const { data: snap, error: snapErr } = await supabase
    .from("kasko_degerleri")
    .select("snapshot_month")
    .order("snapshot_month", { ascending: false })
    .limit(1)
    .single();
  if (snapErr || !snap) { console.error("snapshot bulunamadı", snapErr); process.exit(1); }
  const snapshotMonth = snap.snapshot_month;
  console.log("snapshot_month:", snapshotMonth);

  // O snapshot'taki tüm marka+yıl kombinasyonlarını çek
  let allRows: { marka_kodu: number; model_yili: number }[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("kasko_degerleri")
      .select("marka_kodu,model_yili")
      .eq("snapshot_month", snapshotMonth)
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); process.exit(1); }
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`${allRows.length} satır okundu.`);

  // Marka bazında unique yılları topla
  const markaYillar = new Map<number, Set<number>>();
  for (const row of allRows) {
    if (!markaYillar.has(row.marka_kodu)) markaYillar.set(row.marka_kodu, new Set());
    markaYillar.get(row.marka_kodu)!.add(row.model_yili);
  }

  // tsb_markalar güncelle
  const updates = [...markaYillar.entries()].map(([marka_kodu, yillar]) => ({
    marka_kodu,
    model_yillari: [...yillar].sort((a, b) => b - a),
  }));

  const { error: upsertErr } = await supabase
    .from("tsb_markalar")
    .upsert(updates, { onConflict: "marka_kodu" });
  if (upsertErr) { console.error("upsert hatası", upsertErr); process.exit(1); }

  console.log(`${updates.length} marka güncellendi.`);
}

main();
