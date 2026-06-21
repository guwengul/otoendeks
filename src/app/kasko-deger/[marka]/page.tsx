import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getMarkaBySlug } from "@/lib/kasko";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ marka: string }> }): Promise<Metadata> {
  const { marka: markaSlug } = await params;
  const marka = await getMarkaBySlug(markaSlug);
  if (!marka) return {};
  const title = `${marka.marka_adi} Kasko Değeri`;
  const description = `${marka.marka_adi} araçlarının güncel TSB kasko değerlerini model yılına göre sorgulayın. ${marka.model_yillari.slice(-3).reverse().join(", ")} model yılları dahil.`;
  return {
    title,
    description,
    alternates: { canonical: `https://otoendeks.com/kasko-deger/${markaSlug}` },
    openGraph: { title: `${title} | Otoendeks`, description, url: `https://otoendeks.com/kasko-deger/${markaSlug}` },
  };
}

export default async function MarkaPage({ params }: { params: Promise<{ marka: string }> }) {
  const { marka: markaSlug } = await params;
  const marka = await getMarkaBySlug(markaSlug);
  if (!marka) notFound();

  const yillar = marka.model_yillari;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${marka.marka_adi} Kasko Değerleri`,
    "description": `${marka.marka_adi} araçlarının model yılına göre TSB kasko değerleri`,
    "itemListElement": yillar.map((yil, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": `${marka.marka_adi} ${yil} Model`,
      "url": `https://otoendeks.com/kasko-deger/${markaSlug}/${yil}`,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:underline">
          Kasko Değeri
        </Link>{" "}
        / <span className="text-slate-900">{marka.marka_adi}</span>
      </nav>
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">{marka.marka_adi} Kasko Değerleri</h1>
      <p className="mb-6 text-sm text-slate-500">Kasko değerini görmek istediğiniz model yılını seçin.</p>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {yillar.map((yil) => (
          <li key={yil}>
            <Link
              href={`/kasko-deger/${marka.slug}/${yil}`}
              className="block rounded-lg border border-slate-200 bg-white shadow-sm px-4 py-3 text-center text-sm font-medium text-slate-900 transition-colors hover:border-indigo-400 hover:bg-indigo-50"
            >
              {yil}
            </Link>
          </li>
        ))}
      </ul>
      {yillar.length === 0 && <p className="text-sm text-slate-500">Bu marka için veri bulunamadı.</p>}

      {yillar.length > 0 && (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">{marka.marka_adi} Kasko Değeri Nedir?</h2>
          <p className="text-sm leading-relaxed text-slate-500">
            {marka.marka_adi} araçlarının kasko değerleri, Türkiye Sigorta Birliği (TSB) tarafından aylık
            olarak yayımlanan veriler esas alınarak belirlenmektedir. Bu değerler; araç alım-satım
            süreçlerinde referans fiyat, sigorta primlerinin hesaplanmasında ise temel girdi olarak
            kullanılmaktadır. {marka.marka_adi} modelleri için kasko değerleri, enflasyon, döviz
            kurları ve araç arz-talebi doğrultusunda aylık periyotlarla güncellenmektedir.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Otoendeks üzerinden {marka.marka_adi} aracınızın kasko değerini TL, ABD Doları ve
            gram altın bazında takip edebilir; model yılına göre değer farklarını karşılaştırabilirsiniz.
            Güncel değerlere ulaşmak için yukarıdan model yılınızı seçin.
          </p>
        </div>
      )}
    </main>
  );
}
