"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/garajim");
}

export async function girisYap(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(redirectTo || "/garajim");
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
