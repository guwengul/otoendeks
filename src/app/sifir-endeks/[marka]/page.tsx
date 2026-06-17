import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkaBySlug, getSifirEndeks } from "@/lib/kasko";
import { SifirEndeksTablosu } from "@/components/SifirEndeksTablosu";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ marka: string }> }) {
  const { marka: slug } = await params;
  const marka = await getMarkaBySlug(slug);
  if (!marka) return {};
  return {
    title: `${marka.marka_adi} Sıfır Araç Fiyat Geçmişi | Otoendeks`,
    description: `${marka.marka_adi} güncel model araçların aylık fiyat değişimi.`,
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

  const simdikiYil = new Date().getFullYear();
  const rows = await getSifirEndeks(marka.marka_kodu, simdikiYil);
  if (rows.length === 0) notFound();

  const aylar = [...new Set(rows.map((r) => r.snapshot_month.slice(0, 7)))].sort();
  const sonGuncelleme = aylar[aylar.length - 1];

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
          {marka.marka_adi} — {simdikiYil} Model Fiyat Geçmişi
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          TSB kasko verisi · Son güncelleme: {sonGuncelleme}
        </p>
      </div>

      <SifirEndeksTablosu rows={rows} markaAdi={marka.marka_adi} />
    </main>
  );
}
