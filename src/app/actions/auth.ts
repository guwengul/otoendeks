"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function turkce(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "E-posta veya şifre hatalı.";
  if (m.includes("email not confirmed")) return "E-posta adresin henüz doğrulanmamış. Gelen kutunu kontrol et.";
  if (m.includes("user already registered") || m.includes("already been registered")) return "Bu e-posta adresi zaten kayıtlı.";
  if (m.includes("password should be at least")) return "Şifre en az 8 karakter olmalı.";
  if (m.includes("unable to validate email")) return "Geçerli bir e-posta adresi gir.";
  if (m.includes("email rate limit")) return "Çok fazla deneme yapıldı. Lütfen bekle.";
  if (m.includes("signup is disabled")) return "Kayıt şu an kapalı.";
  return msg;
}

export async function kayitOl(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const adSoyad = (formData.get("ad_soyad") as string | null)?.trim() || undefined;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: adSoyad } },
  });
  if (error) return { error: turkce(error.message) };

  revalidatePath("/", "layout");
  redirect("/garajim");
}

export async function girisYap(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: turkce(error.message) };

  revalidatePath("/", "layout");
  redirect(redirectTo || "/garajim");
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
