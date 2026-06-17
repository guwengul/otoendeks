import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkaBySlug, getYillarForMarka } from "@/lib/kasko";

export const revalidate = 86400;

export default async function MarkaPage({ params }: { params: Promise<{ marka: string }> }) {
  const { marka: markaSlug } = await params;
  const marka = await getMarkaBySlug(markaSlug);
  if (!marka) notFound();

  const yillar = await getYillarForMarka(marka.marka_kodu);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:underline">
          Markalar
        </Link>{" "}
        / <span className="text-gray-900">{marka.marka_adi}</span>
      </nav>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">{marka.marka_adi} — Model Yılı Seç</h1>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {yillar.map((yil) => (
          <li key={yil}>
            <Link
              href={`/kasko-deger/${marka.slug}/${yil}`}
              className="block rounded-lg border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-900 transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              {yil}
            </Link>
          </li>
        ))}
      </ul>
      {yillar.length === 0 && <p className="text-sm text-gray-500">Bu marka için veri bulunamadı.</p>}
    </main>
  );
}
