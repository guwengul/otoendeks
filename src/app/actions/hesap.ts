"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function adSoyadGuncelle(formData: FormData) {
  const supabase = await createClient();
  const adSoyad = (formData.get("ad_soyad") as string).trim();
  const { error } = await supabase.auth.updateUser({ data: { full_name: adSoyad } });
  if (error) return { error: error.message };
  revalidatePath("/hesabim");
  return { ok: true };
}

export async function sifreDegistir(formData: FormData) {
  const yeniSifre = formData.get("yeni_sifre") as string;
  const yeniSifreTekrar = formData.get("yeni_sifre_tekrar") as string;
  if (yeniSifre !== yeniSifreTekrar) return { error: "Şifreler eşleşmiyor." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: yeniSifre });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function hesabiSil() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapılmamış." };

  // Kullanici araclarini sil (cascade ile arac_tarihler de silinir)
  await supabase.from("kullanici_araclar").delete().eq("user_id", user.id);

  // Auth kullanıcısını sil (service role gerektirir — şimdilik signOut yapıp yönlendir)
  await supabase.auth.signOut();
  redirect("/");
}
