import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkaBySlug, getTipDetay, getFiyatGecmisi } from "@/lib/kasko";
import { DegerKaybiGrafik } from "@/components/DegerKaybiGrafik";
import { FiyatGecmisiGrafik } from "@/components/FiyatGecmisiGrafik";
import { PaylasProvizyonKarti } from "@/components/PaylasProvizyonKarti";

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
  const birSonrakiYilDegeri = detay.gecmis.find((d) => d.model_yili === modelYili + 1);
  const birOncekiYilDegeri = detay.gecmis.find((d) => d.model_yili === modelYili - 1);
  const sonPiyasa = fiyatGecmisi.length > 0 ? fiyatGecmisi[fiyatGecmisi.length - 1] : null;

  function kayipHesapla(yeniDeger: number, eskiDeger: number) {
    if (!sonPiyasa) return null;
    const fark = yeniDeger - eskiDeger;
    const usdKur = sonPiyasa.deger_tl / sonPiyasa.deger_usd;
    const altinKur = sonPiyasa.deger_tl / sonPiyasa.deger_altin_gram;
    return { tl: fark, usd: Math.round(fark / usdKur), altin: Math.round(fark / altinKur) };
  }

  const gecenYilKayip = buYilDegeri && birSonrakiYilDegeri
    ? kayipHesapla(birSonrakiYilDegeri.deger, buYilDegeri.deger) : null;
  const gelecekYilKayip = buYilDegeri && birOncekiYilDegeri
    ? kayipHesapla(buYilDegeri.deger, birOncekiYilDegeri.deger) : null;

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

      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-6 py-5">
        {buYilDegeri ? (
          <div className="text-3xl font-bold text-blue-600">{formatTL(buYilDegeri.deger)}</div>
        ) : (
          <p className="text-sm text-gray-500">{modelYili} model yılı için bu tipte değer bulunamadı.</p>
        )}
      </div>

      <PaylasProvizyonKarti
        gecmis={fiyatGecmisi}
        aracAdi={`${marka.marka_adi} ${detay.tip_adi}`}
        modelYili={modelYili}
      />

      <h2 className="mb-3 text-lg font-semibold text-gray-900">Aylık Fiyat Geçmişi ({modelYili} model)</h2>
      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <FiyatGecmisiGrafik gecmis={fiyatGecmisi} />
      </div>

      <h2 className="mb-3 text-lg font-semibold text-gray-900">Model Yılına Göre Değer Kaybı</h2>
      {(gecenYilKayip || gelecekYilKayip) && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          {gecenYilKayip && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="mb-1 text-xs text-gray-500">Geçen yıl kaybı ({modelYili + 1}→{modelYili})</p>
              <p className="font-semibold text-gray-900">{formatTL(gecenYilKayip.tl)}</p>
              <p className="text-xs text-gray-500">${gecenYilKayip.usd.toLocaleString("tr-TR")} · {gecenYilKayip.altin} gr altın</p>
            </div>
          )}
          {gelecekYilKayip && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="mb-1 text-xs text-gray-500">Gelecek yıl kaybı ({modelYili}→{modelYili - 1})</p>
              <p className="font-semibold text-gray-900">{formatTL(gelecekYilKayip.tl)}</p>
              <p className="text-xs text-gray-500">${gelecekYilKayip.usd.toLocaleString("tr-TR")} · {gelecekYilKayip.altin} gr altın</p>
            </div>
          )}
        </div>
      )}
      <div className="rounded-xl border border-gray-200 p-4">
        <DegerKaybiGrafik
          gecmis={detay.gecmis.filter((d) =>
            d.model_yili >= modelYili - 1 && d.model_yili <= modelYili + 1,
          )}
        />
      </div>
    </main>
  );
}
