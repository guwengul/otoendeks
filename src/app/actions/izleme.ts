"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getSonPiyasa(): Promise<{ usd_try: number; gram_altin_try: number } | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/piyasa_degerleri?order=tarih.desc&limit=1&select=usd_try,gram_altin_try`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, cache: "no-store" }
    );
    const data = await res.json();
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

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

  const piyasa = await getSonPiyasa();
  const usd_kayit = piyasa ? Math.round(data.fiyat_kayit / piyasa.usd_try) : null;
  const altin_kayit = piyasa ? Math.round(data.fiyat_kayit / piyasa.gram_altin_try) : null;

  const { error } = await supabase
    .from("izleme_listesi")
    .upsert(
      { ...data, user_id: user.id, usd_kayit, altin_kayit },
      { onConflict: "user_id,marka_kodu,tip_kodu" }
    );

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
