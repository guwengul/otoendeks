import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getMarkaBySlug, getTiplerForMarkaYil, slugify } from "@/lib/kasko";
import { AramaListesi } from "@/components/AramaListesi";
import { getLogoSlug } from "@/lib/logo";
import Image from "next/image";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ marka: string; yil: string }> }): Promise<Metadata> {
  const { marka: markaSlug, yil } = await params;
  const marka = await getMarkaBySlug(markaSlug);
  if (!marka) return {};
  const title = `${marka.marka_adi} ${yil} Model Kasko Değeri`;
  const description = `${marka.marka_adi} ${yil} model araçların güncel TSB kasko değerlerini tip bazında karşılaştırın.`;
  return {
    title,
    description,
    alternates: { canonical: `https://otoendeks.com/kasko-deger/${markaSlug}/${yil}` },
    openGraph: { title: `${title} | Otoendeks`, description, url: `https://otoendeks.com/kasko-deger/${markaSlug}/${yil}` },
  };
}

function formatTL(value: number): string {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
}

export default async function YilPage({
  params,
}: {
  params: Promise<{ marka: string; yil: string }>;
}) {
  const { marka: markaSlug, yil } = await params;
  const modelYili = Number(yil);
  if (!Number.isInteger(modelYili)) notFound();

  const marka = await getMarkaBySlug(markaSlug);
  if (!marka) notFound();

  const tipler = await getTiplerForMarkaYil(marka.marka_kodu, modelYili, marka.son_snapshot_month);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${marka.marka_adi} ${modelYili} Model Kasko Değerleri`,
    "description": `${marka.marka_adi} ${modelYili} model araçların güncel TSB kasko değerleri`,
    "itemListElement": tipler.slice(0, 10).map((tip, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": tip.tip_adi,
      "url": `https://otoendeks.com/kasko-deger/${markaSlug}/${modelYili}/${tip.tip_kodu}-${slugify(tip.tip_adi)}`,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-500">
        <Link href="/" className="hover:underline shrink-0">Kasko Değeri</Link>
        <span className="shrink-0">/</span>
        <Link href={`/kasko-deger/${marka.slug}`} className="hover:underline shrink-0">{marka.marka_adi}</Link>
        <span className="shrink-0">/</span>
        <span className="text-slate-900 shrink-0">{modelYili}</span>
      </nav>
      <div className="mb-6 flex items-center gap-4">
        {(() => { const logo = getLogoSlug(marka.marka_adi); return logo ? (
          <div className="shrink-0 h-10 w-16 flex items-center">
            <Image src={`/logos/${logo}.svg`} alt={marka.marka_adi} width={64} height={40} className="h-full w-full object-contain opacity-60" />
          </div>
        ) : null; })()}
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{marka.marka_adi} {modelYili} Model Kasko Değeri</h1>
          <p className="mt-1 text-sm text-slate-500">Aracınızın tipini seçin.</p>
        </div>
      </div>
      <AramaListesi
        placeholder="Tip ara..."
        tekSutun
        items={tipler.map((tip) => ({
          key: String(tip.tip_kodu),
          label: tip.tip_adi,
          sublabel: formatTL(tip.deger),
          href: `/kasko-deger/${marka.slug}/${modelYili}/${tip.tip_kodu}-${slugify(tip.tip_adi)}`,
        }))}
      />
    </main>
  );
}
