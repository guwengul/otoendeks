import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarkaBySlug, getTipDetay, getFiyatGecmisi } from "@/lib/kasko";
import { DegerKaybiGrafik } from "@/components/DegerKaybiGrafik";
import { FiyatGecmisiGrafik } from "@/components/FiyatGecmisiGrafik";
import { DetayKartlari } from "@/components/DetayKartlari";

export const revalidate = 86400;

function formatTL(value: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value) + " TL";
}

function ayLabel(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  return `${aylar[Number(month) - 1]} ${year}`;
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
  const sonPiyasa = fiyatGecmisi.length > 0 ? fiyatGecmisi[fiyatGecmisi.length - 1] : null;

  // 12 ay öncesine en yakın snapshot
  const enflasyonData = (() => {
    if (fiyatGecmisi.length < 2 || !sonPiyasa) return null;
    const sonTarih = new Date(sonPiyasa.snapshot_month);
    const hedef = new Date(sonTarih);
    hedef.setFullYear(hedef.getFullYear() - 1);
    const adaylar = fiyatGecmisi.slice(0, -1); // son hariç
    const ilk = adaylar.reduce((prev, curr) =>
      Math.abs(new Date(curr.snapshot_month).getTime() - hedef.getTime()) <
      Math.abs(new Date(prev.snapshot_month).getTime() - hedef.getTime()) ? curr : prev
    );
    return {
      ilk,
      son: sonPiyasa,
      ilkAyLabel: ayLabel(ilk.snapshot_month),
      sonAyLabel: ayLabel(sonPiyasa.snapshot_month),
    };
  })();

  // Eskime maliyeti: modelYili+1 → modelYili farkı
  const eskimeData = (() => {
    if (!buYilDegeri || !birSonrakiYilDegeri || !sonPiyasa) return null;
    const fark = birSonrakiYilDegeri.deger - buYilDegeri.deger;
    const usdKur = sonPiyasa.deger_tl / sonPiyasa.deger_usd;
    const altinKur = sonPiyasa.deger_tl / sonPiyasa.deger_altin_gram;
    return {
      tl: fark,
      usd: Math.round(fark / usdKur),
      altin: Math.round(fark / altinKur),
      modelYili,
    };
  })();

  const aracAdi = `${marka.marka_adi} ${detay.tip_adi} ${modelYili}`;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:underline">Markalar</Link>{" / "}
        <Link href={`/kasko-deger/${marka.slug}`} className="hover:underline">{marka.marka_adi}</Link>{" / "}
        <Link href={`/kasko-deger/${marka.slug}/${modelYili}`} className="hover:underline">{modelYili}</Link>
        {" / "}<span className="text-gray-900">{detay.tip_adi}</span>
      </nav>

      {/* Ana fiyat kartı */}
      <div className="mb-4 flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 px-6 py-6 text-center">
        <p className="mb-3 text-sm font-medium text-gray-500">
          {marka.marka_adi} {detay.tip_adi} · {modelYili} model · {ayLabel(marka.son_snapshot_month)} TSB
        </p>
        {buYilDegeri ? (
          <p className="text-4xl font-bold text-gray-900">{formatTL(buYilDegeri.deger)}</p>
        ) : (
          <p className="text-sm text-gray-500">{modelYili} model yılı için bu tipte değer bulunamadı.</p>
        )}
      </div>

      {/* İki küçük paylaşılabilir kart */}
      <DetayKartlari
        enflasyon={enflasyonData}
        eskime={eskimeData}
        aracAdi={aracAdi}
      />

      {/* Aylık fiyat geçmişi */}
      <h2 className="mb-3 text-base font-semibold text-gray-900">Aylık Fiyat Geçmişi</h2>
      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <FiyatGecmisiGrafik gecmis={fiyatGecmisi} />
      </div>

      {/* Değer kaybı grafiği ±1 yıl */}
      <h2 className="mb-3 text-base font-semibold text-gray-900">Model Yılına Göre Değer</h2>
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
