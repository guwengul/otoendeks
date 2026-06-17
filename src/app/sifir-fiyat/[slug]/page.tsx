import { notFound } from "next/navigation";
import Link from "next/link";
import { getSifirFiyatlar, getMarkaBySlug } from "@/lib/kasko";
import { SifirFiyatListesi } from "@/components/SifirFiyatListesi";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const marka = await getMarkaBySlug(slug);
  if (!marka) return {};
  return {
    title: `${marka.marka_adi} Sıfır Araç Fiyatları | Otoendeks`,
    description: `${marka.marka_adi} güncel sıfır araç liste fiyatları ve versiyon karşılaştırması.`,
  };
}

export default async function SifirFiyatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [marka, rows] = await Promise.all([
    getMarkaBySlug(slug),
    getSifirFiyatlar(slug),
  ]);

  if (!marka) notFound();
  if (rows.length === 0) notFound();

  const scrapeDate = rows[0].scrape_date;
  const tarihLabel = new Date(scrapeDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:underline">Kasko Değeri</Link>
        {" / "}
        <Link href={`/kasko-deger/${marka.slug}`} className="hover:underline">{marka.marka_adi}</Link>
        {" / "}
        <span className="text-gray-900">Sıfır Fiyatları</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{marka.marka_adi} Sıfır Araç Fiyatları</h1>
        <p className="mt-1 text-sm text-gray-500">
          {rows.length} versiyon · Güncelleme: {tarihLabel}
        </p>
      </div>

      <SifirFiyatListesi rows={rows} />

      <p className="mt-8 text-center text-xs text-gray-400">
        Fiyatlar sifiraracal.com kaynaklıdır, resmi bayi fiyatlarıyla farklılık gösterebilir.
      </p>
    </main>
  );
}
