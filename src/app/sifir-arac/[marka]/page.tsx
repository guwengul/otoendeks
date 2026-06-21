import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkaBySlug, getSifirEndeksVeri } from "@/lib/kasko";
import { SifirEndeksListesi } from "@/components/SifirEndeksListesi";
import { createClient } from "@/lib/supabase/server";
import { getLogoSlug } from "@/lib/logo";
import Image from "next/image";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ marka: string }> }) {
  const { marka: slug } = await params;
  const marka = await getMarkaBySlug(slug);
  if (!marka) return {};
  const title = `${marka.marka_adi} Sıfır Araç Fiyatları`;
  const description = `${marka.marka_adi} güncel sıfır araç liste fiyatları, aylık ve yıllık değişim oranları. ${new Date().getFullYear()} model yıl bilgileri.`;
  return {
    title,
    description,
    alternates: { canonical: `https://otoendeks.com/sifir-arac/${slug}` },
    openGraph: { title: `${title} | Otoendeks`, description, url: `https://otoendeks.com/sifir-arac/${slug}` },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${marka.marka_adi} Sıfır Araç Fiyatları`,
    "description": `${marka.marka_adi} güncel sıfır araç fiyat listesi`,
    "itemListElement": veri.current.slice(0, 10).map((tip, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": tip.tip_adi,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/sifir-arac" className="hover:underline">Sıfır Araç Fiyatları</Link>
        {" / "}
        <span className="text-slate-900">{marka.marka_adi}</span>
      </nav>

      <div className="mb-6 flex items-center gap-4">
        {(() => { const logo = getLogoSlug(marka.marka_adi); return logo ? (
          <div className="shrink-0 h-10 w-16 flex items-center">
            <Image src={`/logos/${logo}.svg`} alt={marka.marka_adi} width={64} height={40} className="h-full w-full object-contain opacity-60" />
          </div>
        ) : null; })()}
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {marka.marka_adi} — {modelYili} Model
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {modelYili} model · {marka.son_snapshot_month.slice(0, 7)} verisi
          </p>
        </div>
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
        <>
          <SifirEndeksListesi
            veri={veri}
            markaAdi={marka.marka_adi}
            markaKodu={marka.marka_kodu}
            markaSlug={marka.slug}
            girisYapilmis={!!user}
            izlenenler={izlenenler}
          />
        </>
      )}
    </main>
  );
}
