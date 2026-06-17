import { getMarkalar } from "@/lib/kasko";
import { AramaListesi } from "@/components/AramaListesi";

export const revalidate = 86400;

export default async function Home() {
  const markalar = await getMarkalar();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Kasko Değeri Sorgula</h1>
      <p className="mb-8 text-sm text-gray-600">
        Aracının markasını seç, kasko değerine ve değer kaybı grafiğine ulaş.
      </p>
      <AramaListesi
        placeholder="Marka ara..."
        items={markalar.map((m) => ({
          key: String(m.marka_kodu),
          label: m.marka_adi,
          href: `/kasko-deger/${m.slug}`,
        }))}
      />
    </main>
  );
}
