import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PiyasaFiyatiLanding } from "@/components/PiyasaFiyatiLanding";

export const metadata: Metadata = {
  title: "İkinci El Piyasa Fiyatı — Otoendeks",
  description: "Aracınızın ikinci el piyasada gerçek satış fiyatını öğrenin. Yapay zeka destekli piyasa analizi yakında geliyor.",
};

export default async function PiyasaFiyatiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let listede = false;
  if (user) {
    const { data } = await supabase
      .from("wait_list")
      .select("id")
      .eq("user_id", user.id)
      .eq("ozellik", "piyasa_fiyati")
      .maybeSingle();
    listede = !!data;
  }

  return <PiyasaFiyatiLanding girisYapilmis={!!user} listede={listede} />;
}
