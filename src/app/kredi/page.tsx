import type { Metadata } from "next";
import { KrediHesaplama } from "@/components/KrediHesaplama";

export const metadata: Metadata = {
  title: "Kredi Karşılaştırma — Taşıt & İhtiyaç Kredisi | Otoendeks",
  description: "Taşıt ve ihtiyaç kredisi faiz oranlarını karşılaştır. Tutar ve vade seç, aylık taksitini hesapla.",
};

export default function KrediPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Kredi Karşılaştırma</h1>
      <p className="mb-8 text-sm text-slate-600">
        Tutar ve vadeyi gir, bankaların aylık taksit tekliflerini karşılaştır.
      </p>
      <KrediHesaplama />
    </main>
  );
}
