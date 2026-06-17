import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkaBySlug, getSifirEndeksVeri } from "@/lib/kasko";
import { SifirEndeksListesi } from "@/components/SifirEndeksListesi";

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
  if (veri.current.length === 0) notFound();

  const modelYili = Number(marka.son_snapshot_month.slice(0, 4));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:underline">Kasko Değeri</Link>
        {" / "}
        <Link href="/sifir-endeks" className="hover:underline">Sıfır Endeks</Link>
        {" / "}
        <span className="text-gray-900">{marka.marka_adi}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {marka.marka_adi} — {modelYili} Model Güncel Fiyatlar
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          TSB kasko verisi · {marka.son_snapshot_month.slice(0, 7)}
          {veri.oncekiAy && ` · Aylık: ${veri.oncekiAy.slice(0, 7)} karşılaştırması`}
          {` · Yıllık: ${modelYili - 1} model ${String(modelYili - 1)}-${marka.son_snapshot_month.slice(5, 7)} karşılaştırması`}
        </p>
      </div>

      <SifirEndeksListesi veri={veri} markaAdi={marka.marka_adi} />
    </main>
  );
}
