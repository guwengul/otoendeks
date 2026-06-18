import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GarajimIstemci } from "@/components/GarajimIstemci";
import { cikisYap } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function fmt(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

async function getKaskoFiyati(tipKodu: number, modelYili: number): Promise<number | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/kasko_degerleri?tip_kodu=eq.${tipKodu}&model_yili=eq.${modelYili}&order=snapshot_month.desc&limit=1&select=deger`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, cache: "no-store" }
    );
    const data = await res.json();
    return data?.[0]?.deger ?? null;
  } catch {
    return null;
  }
}

export default async function GarajimPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: araclar } = await supabase
    .from("kullanici_araclar")
    .select("*, arac_tarihler(*)")
    .order("created_at", { ascending: false });

  const araclarWithFiyat = await Promise.all(
    (araclar ?? []).map(async (a) => {
      const fiyat = await getKaskoFiyati(a.tip_kodu, a.model_yili);
      return { ...a, kasko_fiyati: fiyat };
    })
  );

  // Yaklaşan tarihler (30 gün içinde)
  const bugun = new Date();
  const otuzGunSonra = new Date(bugun);
  otuzGunSonra.setDate(otuzGunSonra.getDate() + 30);

  type Tarih = { tip: string; tarih: string; arac: string };
  const yaklasanTarihler: Tarih[] = [];
  for (const arac of araclarWithFiyat) {
    for (const t of arac.arac_tarihler ?? []) {
      const d = new Date(t.tarih);
      if (d >= bugun && d <= otuzGunSonra) {
        const tipLabel = t.tip === "mtv" ? "MTV" : t.tip === "muayene" ? "Muayene" : "Kasko";
        yaklasanTarihler.push({
          tip: tipLabel,
          tarih: t.tarih,
          arac: `${arac.marka_adi} ${arac.tip_adi} ${arac.model_yili}`,
        });
      }
    }
  }
  yaklasanTarihler.sort((a, b) => a.tarih.localeCompare(b.tarih));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Garajım</h1>
          <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
        </div>
        <form action={cikisYap}>
          <button type="submit" className="text-sm text-slate-400 hover:text-slate-600">
            Çıkış yap
          </button>
        </form>
      </div>

      {yaklasanTarihler.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">
            30 gün içinde
          </p>
          <ul className="space-y-1">
            {yaklasanTarihler.map((t, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{t.arac}</span>
                <span className="text-amber-700 font-medium">
                  {t.tip} — {new Date(t.tarih).toLocaleDateString("tr-TR")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {araclarWithFiyat.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-400 text-sm">Henüz araç eklemedin.</p>
          <p className="mt-1 text-xs text-slate-400">
            Kasko detay sayfasında "Bu aracı takip et" ile ekleyebilirsin.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Araç sorgula
          </Link>
        </div>
      ) : (
        <GarajimIstemci araclar={araclarWithFiyat} />
      )}
    </main>
  );
}
