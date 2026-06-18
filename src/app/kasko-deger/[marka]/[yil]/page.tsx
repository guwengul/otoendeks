import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkaBySlug, getTiplerForMarkaYil, slugify } from "@/lib/kasko";
import { AramaListesi } from "@/components/AramaListesi";
import { getLogoSlug } from "@/lib/logo";
import Image from "next/image";

export const revalidate = 86400;

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

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
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
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{marka.marka_adi} {modelYili}</h1>
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
