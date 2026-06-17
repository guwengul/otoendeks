import { getMarkalar } from "@/lib/kasko";
import { AramaListesi } from "@/components/AramaListesi";

export const revalidate = 86400;

export default async function SifirEndeksPage() {
  const markalar = await getMarkalar();
  const sirali = [...markalar].sort((a, b) => b.model_yillari.length - a.model_yillari.length);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Sıfır Araç Fiyat Geçmişi</h1>
      <p className="mb-8 text-sm text-gray-600">
        Güncel model araçların TSB kasko verisiyle aylık fiyat değişimi.
      </p>
      <AramaListesi
        placeholder="Marka ara..."
        defaultCount={30}
        items={sirali.map((m) => ({
          key: String(m.marka_kodu),
          label: m.marka_adi,
          href: `/sifir-endeks/${m.slug}`,
        }))}
      />
    </main>
  );
}
