"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { waitListOnayMailiGonder } from "@/lib/mail";

export async function waitListeEkle(ozellik: string, meta?: Record<string, string>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "giris_gerekli" };

  const { error } = await supabase
    .from("wait_list")
    .upsert({ user_id: user.id, ozellik, meta: meta ?? null }, { onConflict: "user_id,ozellik" });

  if (error) return { error: error.message };
  revalidatePath("/araclarim");

  try {
    if (user.email) await waitListOnayMailiGonder(user.email);
  } catch {}

  return { ok: true };
}

export async function waitListeCik(ozellik: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "giris_gerekli" };

  const { error, count } = await supabase
    .from("wait_list")
    .delete({ count: "exact" })
    .eq("user_id", user.id)
    .eq("ozellik", ozellik);

  if (error) return { error: error.message };
  if (count === 0) return { error: `Silinecek kayit bulunamadi. user_id=${user.id} ozellik=${ozellik}` };
  revalidatePath("/araclarim");
  return { ok: true };
}
