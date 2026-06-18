"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function izlemeEkle(data: {
  marka_kodu: number;
  tip_kodu: number;
  marka_adi: string;
  tip_adi: string;
  marka_slug: string;
  fiyat_kayit: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapılmamış" };

  const { error } = await supabase
    .from("izleme_listesi")
    .upsert({ ...data, user_id: user.id }, { onConflict: "user_id,marka_kodu,tip_kodu" });

  if (error) return { error: error.message };
  revalidatePath("/araclarim");
  return { ok: true };
}

export async function izlemeSil(id: string) {
  const supabase = await createClient();
  await supabase.from("izleme_listesi").delete().eq("id", id);
  revalidatePath("/araclarim");
}

export async function izlemeBildirimiGuncelle(id: string, aktif: boolean) {
  const supabase = await createClient();
  await supabase.from("izleme_listesi").update({ fiyat_bildirimi: aktif }).eq("id", id);
  revalidatePath("/araclarim");
}
