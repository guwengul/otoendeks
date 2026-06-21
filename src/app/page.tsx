import type { Metadata } from "next";
import { getMarkalar } from "@/lib/kasko";
import { AramaListesi } from "@/components/AramaListesi";
import { getLogoSlug } from "@/lib/logo";
import { IkonKasko } from "@/components/BolumIkon";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "TSB Kasko Değeri Sorgulama",
  description: "Aracınızın güncel TSB kasko değerini markanıza, model yılınıza ve tipinize göre anında sorgulayın. TL, USD ve altın bazında takip edin.",
  alternates: { canonical: "https://otoendeks.com" },
  openGraph: {
    title: "TSB Kasko Değeri Sorgulama",
    description: "Aracınızın güncel TSB kasko değerini anında sorgulayın. TL, USD ve altın bazında takip edin.",
    url: "https://otoendeks.com",
  },
};

const POPULER_BINEK = new Set([
  "TOYOTA", "VOLKSWAGEN", "RENAULT", "FIAT", "FORD", "HYUNDAI", "OPEL",
  "PEUGEOT", "CITROEN", "DACIA", "HONDA", "SEAT", "SKODA", "BMW",
  "MERCEDES", "AUDI", "KIA", "NISSAN", "MITSUBISHI", "SUZUKI", "VOLVO",
  "SUBARU", "MAZDA", "LAND ROVER", "RANGE ROVER", "JEEP", "MINI", "LEXUS",
  "PORSCHE", "TESLA", "MG", "CUPRA", "TOGG", "TOFAS-FIAT", "ALFA ROMEO",
  "RENAULT (OYAK)", "DS", "SMART", "INFINITI", "JAGUAR",
]);

export default async function Home() {
  const markalar = await getMarkalar();

  // Popüler binek markalar önce, geri kalanlar alfabetik arkada
  const populer = markalar.filter(m => POPULER_BINEK.has(m.marka_adi));
  const diger = markalar.filter(m => !POPULER_BINEK.has(m.marka_adi));
  const sirali = [
    ...populer.sort((a, b) => a.marka_adi.localeCompare(b.marka_adi, "tr")),
    ...diger.sort((a, b) => a.marka_adi.localeCompare(b.marka_adi, "tr")),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Otoendeks",
    "url": "https://otoendeks.com",
    "description": "Türkiye'nin kasko değeri ve sıfır araç fiyat platformu",
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": "https://otoendeks.com/kasko-deger/{search_term_string}" },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="mb-2 flex items-center gap-2.5 text-2xl font-semibold text-slate-900">
        <IkonKasko size={24} className="text-indigo-600 shrink-0" />
        Kasko Değeri Sorgulama
      </h1>
      <p className="mb-8 text-sm text-slate-600">
        Markanızı seçin, aracınızın güncel kasko değerini ve model yılına göre fiyat aralığını görüntüleyin.
      </p>
      <AramaListesi
        placeholder="Marka ara..."
        defaultCount={21}
        items={sirali.map((m) => ({
          key: String(m.marka_kodu),
          label: m.marka_adi,
          href: `/kasko-deger/${m.slug}`,
          logoSlug: getLogoSlug(m.marka_adi) ?? undefined,
        }))}
      />
    </main>
  );
}
