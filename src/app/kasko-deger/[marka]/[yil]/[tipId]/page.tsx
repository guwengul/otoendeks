import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkaBySlug, getTipDetay, getFiyatGecmisi } from "@/lib/kasko";
import { DegerKaybiGrafik } from "@/components/DegerKaybiGrafik";
import { FiyatGecmisiGrafik } from "@/components/FiyatGecmisiGrafik";

export const revalidate = 86400;

function formatTL(value: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value) + " TL";
}

export default async function TipDetayPage({
  params,
}: {
  params: Promise<{ marka: string; yil: string; tipId: string }>;
}) {
  const { marka: markaSlug, yil, tipId } = await params;
  const modelYili = Number(yil);
  const tipKodu = Number(tipId);
  if (!Number.isInteger(modelYili) || !Number.isInteger(tipKodu)) notFound();

  const marka = await getMarkaBySlug(markaSlug);
  if (!marka) notFound();

  const [detay, fiyatGecmisi] = await Promise.all([
    getTipDetay(marka.marka_kodu, tipKodu, marka.son_snapshot_month),
    getFiyatGecmisi(marka.marka_kodu, tipKodu, modelYili),
  ]);
  if (!detay) notFound();

  const buYilDegeri = detay.gecmis.find((d) => d.model_yili === modelYili);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:underline">
          Markalar
        </Link>{" "}
        /{" "}
        <Link href={`/kasko-deger/${marka.slug}`} className="hover:underline">
          {marka.marka_adi}
        </Link>{" "}
        /{" "}
        <Link href={`/kasko-deger/${marka.slug}/${modelYili}`} className="hover:underline">
          {modelYili}
        </Link>{" "}
        / <span className="text-gray-900">{detay.tip_adi}</span>
      </nav>

      <h1 className="mb-1 text-2xl font-semibold text-gray-900">
        {marka.marka_adi} {detay.tip_adi}
      </h1>
      <p className="mb-6 text-sm text-gray-600">{modelYili} model kasko değeri</p>

      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 px-6 py-5">
        {buYilDegeri ? (
          <div className="text-3xl font-bold text-blue-600">{formatTL(buYilDegeri.deger)}</div>
        ) : (
          <p className="text-sm text-gray-500">{modelYili} model yılı için bu tipte değer bulunamadı.</p>
        )}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-gray-900">Aylık Fiyat Geçmişi ({modelYili} model)</h2>
      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <FiyatGecmisiGrafik gecmis={fiyatGecmisi} />
      </div>

      <h2 className="mb-3 text-lg font-semibold text-gray-900">Model Yılına Göre Değer Kaybı</h2>
      <div className="rounded-xl border border-gray-200 p-4">
        <DegerKaybiGrafik gecmis={detay.gecmis} />
      </div>
    </main>
  );
}
