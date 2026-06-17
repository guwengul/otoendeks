import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkaBySlug, getTiplerForMarkaYil } from "@/lib/kasko";
import { AramaListesi } from "@/components/AramaListesi";

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
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:underline">
          Markalar
        </Link>{" "}
        /{" "}
        <Link href={`/kasko-deger/${marka.slug}`} className="hover:underline">
          {marka.marka_adi}
        </Link>{" "}
        / <span className="text-gray-900">{modelYili}</span>
      </nav>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        {marka.marka_adi} {modelYili} — Tip Seç
      </h1>
      <AramaListesi
        placeholder="Tip ara..."
        items={tipler.map((tip) => ({
          key: String(tip.tip_kodu),
          label: tip.tip_adi,
          sublabel: formatTL(tip.deger),
          href: `/kasko-deger/${marka.slug}/${modelYili}/${tip.tip_kodu}`,
        }))}
      />
    </main>
  );
}
