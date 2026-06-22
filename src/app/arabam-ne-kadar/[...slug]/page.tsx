import { permanentRedirect } from "next/navigation";

// Eski site (otoendeks.com) marka slug'larını yeni site slug'larına eşleştirir.
// Tek kelimeli markalar için slug aynı kalır; çok kelimeli olanlar burada belirtilir.
const MARKA_MAP: Record<string, string> = {
  alfaromeo:    "alfa-romeo",
  mercedesbenz: "mercedes-benz",
  landrover:    "land-rover",
  rangerover:   "range-rover",
  rollsroyce:   "rolls-royce",
  astonmartin:  "aston-martin",
  kgmobility:   "kgmobility",
  lynkco:       "lynk-co",
  tofasfiat:    "tofas-fiat",
};

export default async function ArabamNeKadar({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const eskiMarka = slug[0] ?? "";

  // Eski URL'den marka slug'unu al; eşleşme varsa yeni slug'u kullan
  const yeniMarka = MARKA_MAP[eskiMarka] ?? eskiMarka;

  permanentRedirect(`/kasko-degeri/${yeniMarka}`);
}
