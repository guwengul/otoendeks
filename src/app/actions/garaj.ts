"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type KullaniciArac = {
  id: string;
  tip_kodu: number;
  marka_adi: string;
  tip_adi: string;
  model_yili: number;
  marka_slug: string;
};

export async function aracEkle(arac: Omit<KullaniciArac, "id">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapılmamış" };

  const { error } = await supabase
    .from("kullanici_araclar")
    .upsert({ ...arac, user_id: user.id }, { onConflict: "user_id,tip_kodu,model_yili" });

  if (error) return { error: error.message };
  revalidatePath("/garajim");
  return { ok: true };
}

export async function aracSil(aracId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("kullanici_araclar")
    .delete()
    .eq("id", aracId);

  if (error) return { error: error.message };
  revalidatePath("/garajim");
}

export async function tarihKaydet(aracId: string, tip: "mtv" | "muayene" | "kasko", tarih: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("arac_tarihler")
    .upsert({ arac_id: aracId, tip, tarih }, { onConflict: "arac_id,tip" });

  if (error) return { error: error.message };
  revalidatePath("/garajim");
}
