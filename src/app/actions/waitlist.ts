"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function waitListeEkle(ozellik: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "giris_gerekli" };

  const { error } = await supabase
    .from("wait_list")
    .upsert({ user_id: user.id, ozellik }, { onConflict: "user_id,ozellik" });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { ok: true };
}
