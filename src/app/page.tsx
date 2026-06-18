import { getMarkalar } from "@/lib/kasko";
import { AramaListesi } from "@/components/AramaListesi";
import { getLogoSlug } from "@/lib/logo";

export const revalidate = 86400;

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

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Kasko Değeri Sorgula</h1>
      <p className="mb-8 text-sm text-slate-600">
        Aracının markasını seç, kasko değerine ve değer kaybı grafiğine ulaş.
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
