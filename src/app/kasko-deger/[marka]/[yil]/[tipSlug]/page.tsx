import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getMarkaBySlug, getTipDetay, getFiyatGecmisi } from "@/lib/kasko";
import { getLogoSlug } from "@/lib/logo";
import Image from "next/image";
import { DegerKaybiGrafik } from "@/components/DegerKaybiGrafik";
import { FiyatGecmisiGrafik } from "@/components/FiyatGecmisiGrafik";
import { DetayKartlari } from "@/components/DetayKartlari";
import { AnaKartActions } from "@/components/AnaKartActions";
import { MikroFeedback } from "@/components/MikroFeedback";
import { PiyasaFiyatiSection } from "@/components/PiyasaFiyatiSection";
import { createClient } from "@/lib/supabase/server";

function formatTL(value: number): string {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
}
function fmtNum(v: number) { return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.abs(v)); }
function isaret(v: number) { return v >= 0 ? "+" : "−"; }
function fmtTLs(v: number) { return `₺${fmtNum(v)}`; }

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
  return { marka, detay, fiyatGecmisi, tipKodu };
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
    openGraph: { title, images: [{ url: `/api/og?${ogQuery}`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [`/api/og?${ogQuery}`] },
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
  const { marka, detay, fiyatGecmisi, tipKodu } = data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let zatenEklendi = false;
  let zatenTakipte = false;
  let piyasaListede = false;
  if (user) {
    const [{ data: mevcut }, { data: takipte }, { data: waitListe }] = await Promise.all([
      supabase
        .from("kullanici_araclar")
        .select("id")
        .eq("user_id", user.id)
        .eq("tip_kodu", tipKodu)
        .eq("model_yili", modelYili)
        .maybeSingle(),
      supabase
        .from("izleme_listesi")
        .select("id")
        .eq("user_id", user.id)
        .eq("marka_kodu", marka.marka_kodu)
        .eq("tip_kodu", tipKodu)
        .maybeSingle(),
      supabase
        .from("wait_list")
        .select("id")
        .eq("user_id", user.id)
        .eq("ozellik", "piyasa_fiyati")
        .maybeSingle(),
    ]);
    zatenEklendi = !!mevcut;
    zatenTakipte = !!takipte;
    piyasaListede = !!waitListe;
  }

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
    return { ilk, son: sonPiyasa, ilkAyLabel: ayLabel(ilk.snapshot_month), sonAyLabel: ayLabel(sonPiyasa.snapshot_month) };
  })();

  const eskimeData = (() => {
    if (!buYilDegeri || !sonPiyasa) return null;
    const usdKur = sonPiyasa.deger_tl / sonPiyasa.deger_usd;
    const altinKur = sonPiyasa.deger_tl / sonPiyasa.deger_altin_gram;
    if (birSonrakiYilDegeri) {
      return {
        yeni: { tl: birSonrakiYilDegeri.deger, usd: Math.round(birSonrakiYilDegeri.deger / usdKur), altin: Math.round(birSonrakiYilDegeri.deger / altinKur) },
        eski: { tl: buYilDegeri.deger, usd: Math.round(buYilDegeri.deger / usdKur), altin: Math.round(buYilDegeri.deger / altinKur) },
        yeniYil: modelYili + 1, eskiYil: modelYili,
      };
    }
    if (birOncekiYilDegeri) {
      return {
        yeni: { tl: buYilDegeri.deger, usd: Math.round(buYilDegeri.deger / usdKur), altin: Math.round(buYilDegeri.deger / altinKur) },
        eski: { tl: birOncekiYilDegeri.deger, usd: Math.round(birOncekiYilDegeri.deger / usdKur), altin: Math.round(birOncekiYilDegeri.deger / altinKur) },
        yeniYil: modelYili, eskiYil: modelYili - 1,
      };
    }
    return null;
  })();

  // Paylaş metni (tüm içerik)
  const tumunuMetin = [
    `${marka.marka_adi} ${detay.tip_adi} ${modelYili} model`,
    buYilDegeri ? `Kasko: ${formatTL(buYilDegeri.deger)} (${ayLabel(marka.son_snapshot_month)} TSB)` : null,
    enflasyonData ? [
      `\n${enflasyonData.ilkAyLabel} → ${enflasyonData.sonAyLabel}`,
      `TL: ${fmtTLs(enflasyonData.ilk.deger_tl)} → ${fmtTLs(enflasyonData.son.deger_tl)} (${isaret(enflasyonData.son.deger_tl - enflasyonData.ilk.deger_tl)}${fmtTLs(Math.abs(enflasyonData.son.deger_tl - enflasyonData.ilk.deger_tl))})`,
      `USD: $${fmtNum(enflasyonData.ilk.deger_usd)} → $${fmtNum(enflasyonData.son.deger_usd)} (${isaret(enflasyonData.son.deger_usd - enflasyonData.ilk.deger_usd)}$${fmtNum(Math.abs(enflasyonData.son.deger_usd - enflasyonData.ilk.deger_usd))})`,
      `Altın: ${fmtNum(enflasyonData.ilk.deger_altin_gram)} gr → ${fmtNum(enflasyonData.son.deger_altin_gram)} gr (${isaret(enflasyonData.son.deger_altin_gram - enflasyonData.ilk.deger_altin_gram)}${fmtNum(Math.abs(enflasyonData.son.deger_altin_gram - enflasyonData.ilk.deger_altin_gram))} gr)`,
    ].join("\n") : null,
    eskimeData ? [
      `\n${eskimeData.yeniYil} → ${eskimeData.eskiYil} model`,
      `TL: ${fmtTLs(eskimeData.yeni.tl)} → ${fmtTLs(eskimeData.eski.tl)} (${isaret(eskimeData.eski.tl - eskimeData.yeni.tl)}${fmtTLs(Math.abs(eskimeData.eski.tl - eskimeData.yeni.tl))})`,
      `USD: $${fmtNum(eskimeData.yeni.usd)} → $${fmtNum(eskimeData.eski.usd)} (${isaret(eskimeData.eski.usd - eskimeData.yeni.usd)}$${fmtNum(Math.abs(eskimeData.eski.usd - eskimeData.yeni.usd))})`,
      `Altın: ${fmtNum(eskimeData.yeni.altin)} gr → ${fmtNum(eskimeData.eski.altin)} gr (${isaret(eskimeData.eski.altin - eskimeData.yeni.altin)}${fmtNum(Math.abs(eskimeData.eski.altin - eskimeData.yeni.altin))} gr)`,
    ].join("\n") : null,
    "\notoendeks.com",
  ].filter(Boolean).join("\n");

  const ozet = [
    `${marka.marka_adi} ${detay.tip_adi} ${modelYili} model`,
    buYilDegeri ? `Kasko değeri: ${formatTL(buYilDegeri.deger)} (${ayLabel(marka.son_snapshot_month)} TSB)` : null,
  ].filter(Boolean).join("\n");

  const ogParams = buildOgParams(marka, detay.tip_adi, modelYili, buYilDegeri?.deger, fiyatGecmisi, eskimeData);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-700 shrink-0">Kasko Değeri</Link>
        <span className="shrink-0">/</span>
        <Link href={`/kasko-deger/${marka.slug}`} className="hover:text-slate-700 shrink-0">{marka.marka_adi}</Link>
        <span className="shrink-0">/</span>
        <Link href={`/kasko-deger/${marka.slug}/${modelYili}`} className="hover:text-slate-700 shrink-0">{modelYili}</Link>
        <span className="shrink-0">/</span>
        <span className="text-slate-900 min-w-0 truncate">{detay.tip_adi}</span>
      </nav>

      {/* Wrapper — ana kart + iki karşılaştırma + butonlar tek blok */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Ana fiyat */}
        <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            {(() => { const logo = getLogoSlug(marka.marka_adi); return logo ? (
              <div className="shrink-0 flex items-center justify-center w-12 h-12">
                <Image src={`/logos/${logo}.svg`} alt={marka.marka_adi} width={48} height={48} className="w-full h-full object-contain opacity-70" />
              </div>
            ) : null; })()}
            <div className="min-w-0">
              <p className="text-sm font-medium text-indigo-700 mb-1 truncate">
                {marka.marka_adi} {detay.tip_adi} · {modelYili}
              </p>
              {buYilDegeri ? (
                <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{formatTL(buYilDegeri.deger)}</p>
              ) : (
                <p className="text-sm text-slate-500">{modelYili} model yılı için bu tipte değer bulunamadı.</p>
              )}
              <p className="mt-1 text-xs text-indigo-400">{ayLabel(marka.son_snapshot_month)} · TSB kasko değeri</p>
            </div>
          </div>
        </div>

        {/* İki karşılaştırma kartı */}
        <DetayKartlari enflasyon={enflasyonData} eskime={eskimeData} />

        {/* Takip et + paylaş — wrapper'ın alt kısmı */}
        <AnaKartActions
          ozet={ozet}
          tumunuMetin={tumunuMetin}
          girisYapilmis={!!user}
          zatenEklendi={zatenEklendi}
          zatenTakipte={zatenTakipte}
          arac={{
            markaKodu: marka.marka_kodu,
            tipKodu,
            markaAdi: marka.marka_adi,
            tipAdi: detay.tip_adi,
            modelYili,
            markaSlug: marka.slug,
            fiyatKayit: buYilDegeri?.deger ?? 0,
          }}
        />
      </div>

      {/* Mikro feedback */}
      <div className="mb-6 border-b border-slate-100 pb-4">
        <MikroFeedback tipKodu={tipKodu} modelYili={modelYili} />
      </div>

      {/* Piyasa fiyatı wait list */}
      <PiyasaFiyatiSection
        girisYapilmis={!!user}
        listede={piyasaListede}
        geriDonUrl={`/kasko-deger/${marka.slug}/${modelYili}/${tipSlug}`}
      />

      {/* Sıfır araç yönlendirme */}
      <div className="mb-8 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-sm font-medium text-slate-700">{marka.marka_adi} sıfır araç fiyatları</p>
          <p className="text-xs text-slate-400">Güncel liste fiyatları ve kampanyalar</p>
        </div>
        <Link
          href={`/sifir-arac/${marka.slug}`}
          className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          Sıfır fiyatları →
        </Link>
      </div>

      {/* Grafikler */}
      <h2 className="mb-3 text-base font-semibold text-slate-900">Aylık Fiyat Geçmişi</h2>
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <FiyatGecmisiGrafik gecmis={fiyatGecmisi} />
      </div>

      <h2 className="mb-3 text-base font-semibold text-slate-900">Model Yılına Göre Değer</h2>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <DegerKaybiGrafik
          gecmis={detay.gecmis.filter((d) =>
            d.model_yili >= modelYili - 1 && d.model_yili <= modelYili + 1,
          )}
          modelYili={modelYili}
        />
      </div>
    </main>
  );
}
