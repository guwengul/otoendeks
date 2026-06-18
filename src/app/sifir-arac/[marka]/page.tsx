import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkaBySlug, getSifirEndeksVeri } from "@/lib/kasko";
import { SifirEndeksListesi } from "@/components/SifirEndeksListesi";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ marka: string }> }) {
  const { marka: slug } = await params;
  const marka = await getMarkaBySlug(slug);
  if (!marka) return {};
  return {
    title: `${marka.marka_adi} Sıfır Araç Fiyatları | Otoendeks`,
    description: `${marka.marka_adi} güncel model araçların fiyatları ve aylık/yıllık değişimi.`,
  };
}

export default async function SifirEndeksMarkaPage({
  params,
}: {
  params: Promise<{ marka: string }>;
}) {
  const { marka: slug } = await params;
  const marka = await getMarkaBySlug(slug);
  if (!marka) notFound();

  const veri = await getSifirEndeksVeri(marka.marka_kodu, marka.son_snapshot_month);
  const modelYili = Number(marka.son_snapshot_month.slice(0, 4));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let izlenenler = new Set<number>();
  if (user) {
    const { data } = await supabase
      .from("izleme_listesi")
      .select("tip_kodu")
      .eq("user_id", user.id)
      .eq("marka_kodu", marka.marka_kodu);
    izlenenler = new Set((data ?? []).map((r: { tip_kodu: number }) => r.tip_kodu));
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/sifir-arac" className="hover:underline">Sıfır Araç Fiyatları</Link>
        {" / "}
        <span className="text-slate-900">{marka.marka_adi}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          {marka.marka_adi} — {modelYili} Model Güncel Fiyatlar
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {modelYili} model · {marka.son_snapshot_month.slice(0, 7)} verisi
        </p>
      </div>

      {veri.current.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-500 text-sm">{marka.marka_adi} için henüz sıfır araç fiyatı verisi bulunmuyor.</p>
          <Link
            href="/sifir-arac"
            className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
          >
            ← Tüm markalara dön
          </Link>
        </div>
      ) : (
        <SifirEndeksListesi
          veri={veri}
          markaAdi={marka.marka_adi}
          markaKodu={marka.marka_kodu}
          markaSlug={marka.slug}
          girisYapilmis={!!user}
          izlenenler={izlenenler}
        />
      )}
    </main>
  );
}
