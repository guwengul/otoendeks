import { getMarkalar } from "@/lib/kasko";
import { AramaListesi } from "@/components/AramaListesi";
import { getLogoSlug } from "@/lib/logo";
import { IkonArac } from "@/components/BolumIkon";

export const revalidate = 86400;

export default async function SifirEndeksPage() {
  const markalar = await getMarkalar();
  const simdikiYil = new Date().getFullYear();

  const sirali = markalar
    .filter((m) => m.model_yillari.includes(simdikiYil))
    .sort((a, b) => b.model_yillari.length - a.model_yillari.length);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="mb-2 flex items-center gap-2.5 text-2xl font-semibold text-slate-900">
        <IkonArac size={24} className="text-indigo-600 shrink-0" />
        Sıfır Araç Fiyatları
      </h1>
      <p className="mb-8 text-sm text-slate-600">
        {simdikiYil} model araçların güncel liste fiyatları ve aylık/yıllık değişim oranları.
      </p>
      <AramaListesi
        placeholder="Marka ara..."
        defaultCount={30}
        items={sirali.map((m) => ({
          key: String(m.marka_kodu),
          label: m.marka_adi,
          href: `/sifir-arac/${m.slug}`,
          logoSlug: getLogoSlug(m.marka_adi) ?? undefined,
        }))}
      />
    </main>
  );
}
