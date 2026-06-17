import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getMarkaBySlug, getTipDetay, getFiyatGecmisi } from "@/lib/kasko";
import { DegerKaybiGrafik } from "@/components/DegerKaybiGrafik";
import { FiyatGecmisiGrafik } from "@/components/FiyatGecmisiGrafik";
import { DetayKartlari } from "@/components/DetayKartlari";
import { MikroFeedback } from "@/components/MikroFeedback";
import { FavoriButonu } from "@/components/FavoriButonu";

export const revalidate = 86400;

function formatTL(value: number): string {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
}

function ayLabel(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  return `${aylar[Number(month) - 1]} ${year}`;
}

async function getPageData(markaSlug: string, tipSlug: string, modelYili: number) {
  const tipKodu = Number(tipSlug.split("-")[0]);
  if (!Number.isFinite(tipKodu) || tipKodu === 0) return null;
  const marka = await getMarkaBySlug(markaSlug);
  if (!marka) return null;
  const [detay, fiyatGecmisi] = await Promise.all([
    getTipDetay(marka.marka_kodu, tipKodu, marka.son_snapshot_month),
    getFiyatGecmisi(marka.marka_kodu, tipKodu, modelYili),
  ]);
  if (!detay) return null;
  return { marka, detay, fiyatGecmisi };
}

function buildOgParams(
  marka: { marka_adi: string; son_snapshot_month: string },
  tipAdi: string,
  modelYili: number,
  fiyat: number | undefined,
  fiyatGecmisi: { snapshot_month: string; deger_tl: number; deger_usd: number; deger_altin_gram: number }[],
  eskimeData: { yeniYil: number; eskiYil: number; yeni: { tl: number; usd: number; altin: number }; eski: { tl: number; usd: number; altin: number } } | null,
): string {
  const sonPiyasa = fiyatGecmisi.length > 0 ? fiyatGecmisi[fiyatGecmisi.length - 1] : null;

  const enflasyonExtra: Record<string, string> = {};
  if (sonPiyasa && fiyatGecmisi.length >= 2) {
    const hedef = new Date(sonPiyasa.snapshot_month);
    hedef.setFullYear(hedef.getFullYear() - 1);
    const adaylar = fiyatGecmisi.slice(0, -1);
    const ilk = adaylar.reduce((p, c) =>
      Math.abs(new Date(c.snapshot_month).getTime() - hedef.getTime()) <
      Math.abs(new Date(p.snapshot_month).getTime() - hedef.getTime()) ? c : p);
    enflasyonExtra.enIlkAy = ayLabel(ilk.snapshot_month);
    enflasyonExtra.enSonAy = ayLabel(sonPiyasa.snapshot_month);
    enflasyonExtra.enTlFark = String(sonPiyasa.deger_tl - ilk.deger_tl);
    enflasyonExtra.enUsdFark = String(sonPiyasa.deger_usd - ilk.deger_usd);
    enflasyonExtra.enAltinFark = String(sonPiyasa.deger_altin_gram - ilk.deger_altin_gram);
  }

  const eskimeExtra: Record<string, string> = {};
  if (eskimeData) {
    eskimeExtra.esYeniYil = String(eskimeData.yeniYil);
    eskimeExtra.esEskiYil = String(eskimeData.eskiYil);
    eskimeExtra.esTlFark = String(eskimeData.eski.tl - eskimeData.yeni.tl);
    eskimeExtra.esUsdFark = String(eskimeData.eski.usd - eskimeData.yeni.usd);
    eskimeExtra.esAltinFark = String(eskimeData.eski.altin - eskimeData.yeni.altin);
  }

  return new URLSearchParams({
    baslik: `${marka.marka_adi} ${tipAdi} · ${modelYili} model`,
    fiyat: fiyat ? formatTL(fiyat) : "",
    donem: ayLabel(marka.son_snapshot_month),
    ...enflasyonExtra,
    ...eskimeExtra,
  }).toString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ marka: string; yil: string; tipSlug: string }>;
}): Promise<Metadata> {
  const { marka: markaSlug, yil, tipSlug } = await params;
  const modelYili = Number(yil);
  const data = await getPageData(markaSlug, tipSlug, modelYili);
  if (!data) return {};

  const { marka, detay, fiyatGecmisi } = data;
  const buYilDegeri = detay.gecmis.find((d) => d.model_yili === modelYili);
  const title = `${marka.marka_adi} ${detay.tip_adi} ${modelYili} Kasko Değeri`;

  const ogQuery = buildOgParams(marka, detay.tip_adi, modelYili, buYilDegeri?.deger, fiyatGecmisi, null);

  return {
    title,
    description: buYilDegeri
      ? `${marka.marka_adi} ${detay.tip_adi} ${modelYili} model kasko değeri: ${formatTL(buYilDegeri.deger)} (${ayLabel(marka.son_snapshot_month)} TSB)`
      : title,
    openGraph: {
      title,
      images: [{ url: `/api/og?${ogQuery}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [`/api/og?${ogQuery}`],
    },
  };
}

export default async function TipDetayPage({
  params,
}: {
  params: Promise<{ marka: string; yil: string; tipSlug: string }>;
}) {
  const { marka: markaSlug, yil, tipSlug } = await params;
  const modelYili = Number(yil);

  const data = await getPageData(markaSlug, tipSlug, modelYili);
  if (!data) notFound();
  const { marka, detay, fiyatGecmisi } = data;

  const buYilDegeri = detay.gecmis.find((d) => d.model_yili === modelYili);
  const birSonrakiYilDegeri = detay.gecmis.find((d) => d.model_yili === modelYili + 1);
  const birOncekiYilDegeri = detay.gecmis.find((d) => d.model_yili === modelYili - 1);
  const sonPiyasa = fiyatGecmisi.length > 0 ? fiyatGecmisi[fiyatGecmisi.length - 1] : null;

  const enflasyonData = (() => {
    if (fiyatGecmisi.length < 2 || !sonPiyasa) return null;
    const hedef = new Date(sonPiyasa.snapshot_month);
    hedef.setFullYear(hedef.getFullYear() - 1);
    const adaylar = fiyatGecmisi.slice(0, -1);
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

  const eskimeData = (() => {
    if (!buYilDegeri || !sonPiyasa) return null;
    const usdKur = sonPiyasa.deger_tl / sonPiyasa.deger_usd;
    const altinKur = sonPiyasa.deger_tl / sonPiyasa.deger_altin_gram;
    if (birSonrakiYilDegeri) {
      return {
        yeni: { tl: birSonrakiYilDegeri.deger, usd: Math.round(birSonrakiYilDegeri.deger / usdKur), altin: Math.round(birSonrakiYilDegeri.deger / altinKur) },
        eski: { tl: buYilDegeri.deger, usd: Math.round(buYilDegeri.deger / usdKur), altin: Math.round(buYilDegeri.deger / altinKur) },
        yeniYil: modelYili + 1,
        eskiYil: modelYili,
      };
    }
    if (birOncekiYilDegeri) {
      return {
        yeni: { tl: buYilDegeri.deger, usd: Math.round(buYilDegeri.deger / usdKur), altin: Math.round(buYilDegeri.deger / altinKur) },
        eski: { tl: birOncekiYilDegeri.deger, usd: Math.round(birOncekiYilDegeri.deger / usdKur), altin: Math.round(birOncekiYilDegeri.deger / altinKur) },
        yeniYil: modelYili,
        eskiYil: modelYili - 1,
      };
    }
    return null;
  })();

  const tipKodu = Number(tipSlug.split("-")[0]);
  const aracAdi = `${marka.marka_adi} ${detay.tip_adi} ${modelYili}`;
  const ogParams = buildOgParams(marka, detay.tip_adi, modelYili, buYilDegeri?.deger, fiyatGecmisi, eskimeData);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:underline">Markalar</Link>{" / "}
        <Link href={`/kasko-deger/${marka.slug}`} className="hover:underline">{marka.marka_adi}</Link>{" / "}
        <Link href={`/kasko-deger/${marka.slug}/${modelYili}`} className="hover:underline">{modelYili}</Link>
        {" / "}<span className="text-gray-900">{detay.tip_adi}</span>
      </nav>

      <div className="mb-4 flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 px-6 py-6 text-center">
        <p className="mb-3 text-sm font-medium text-gray-700">
          {marka.marka_adi} {detay.tip_adi} · {modelYili} model
        </p>
        {buYilDegeri ? (
          <p className="text-4xl font-bold text-gray-900">{formatTL(buYilDegeri.deger)}</p>
        ) : (
          <p className="text-sm text-gray-500">{modelYili} model yılı için bu tipte değer bulunamadı.</p>
        )}
        <p className="mt-3 text-xs text-gray-400">{ayLabel(marka.son_snapshot_month)} TSB verisi</p>
      </div>

      <DetayKartlari
        enflasyon={enflasyonData}
        eskime={eskimeData}
        aracAdi={aracAdi}
        anaFiyat={buYilDegeri?.deger ?? null}
        anaAyLabel={ayLabel(marka.son_snapshot_month)}
        ogParams={ogParams}
      />

      <h2 className="mb-3 text-base font-semibold text-gray-900">Aylık Fiyat Geçmişi</h2>
      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <FiyatGecmisiGrafik gecmis={fiyatGecmisi} />
      </div>

      <h2 className="mb-3 text-base font-semibold text-gray-900">Model Yılına Göre Değer</h2>
      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <DegerKaybiGrafik
          gecmis={detay.gecmis.filter((d) =>
            d.model_yili >= modelYili - 1 && d.model_yili <= modelYili + 1,
          )}
          modelYili={modelYili}
        />
      </div>

      {/* Takip et */}
      <div className="mb-4">
        <FavoriButonu />
      </div>

      {/* Sıfır araç yönlendirme */}
      <div className="mb-8 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
        <p className="mb-1 text-sm font-medium text-gray-700">
          {marka.marka_adi} sıfır araç fiyatlarına bak
        </p>
        <p className="mb-3 text-xs text-gray-400">
          Güncel liste fiyatları ve kampanyalar
        </p>
        <Link
          href={`/sifir-fiyat/${marka.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
        >
          {marka.marka_adi} sıfır fiyatları →
        </Link>
      </div>

      {/* Mikro feedback */}
      <div className="border-t border-gray-100 pt-4">
        <MikroFeedback tipKodu={tipKodu} modelYili={modelYili} />
      </div>
    </main>
  );
}
