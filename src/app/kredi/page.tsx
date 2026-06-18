import type { Metadata } from "next";
import { KrediHesaplama } from "@/components/KrediHesaplama";
import { IkonKredi } from "@/components/BolumIkon";

export const metadata: Metadata = {
  title: "Kredi Hesaplama — Taşıt & İhtiyaç Kredisi | Otoendeks",
  description: "Taşıt ve ihtiyaç kredisi için aylık taksit, toplam ödeme ve vergi dökümünü hesaplayın. BDDK vade limitleri uygulanır.",
};

export default function KrediPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-2 flex items-center gap-2.5 text-2xl font-semibold text-slate-900">
        <IkonKredi size={24} className="text-indigo-600 shrink-0" />
        Kredi Hesaplama
      </h1>
      <p className="mb-8 text-sm text-slate-600">
        Tutar, vade ve faiz oranını belirleyin; aylık taksit, toplam maliyet ve vergi dökümünü görün.
      </p>
      <KrediHesaplama />
    </main>
  );
}
