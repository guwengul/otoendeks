import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "guwengul@gmail.com";

async function getSupabaseMetrics() {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [
    { count: kullaniciSayisi },
    { count: waitListSayisi },
    { count: aracSayisi },
    { count: takipSayisi },
  ] = await Promise.all([
    admin.from("kullanici_araclar").select("*", { count: "exact", head: true }),
    admin.from("wait_list").select("*", { count: "exact", head: true }),
    admin.from("kullanici_araclar").select("*", { count: "exact", head: true }).eq("sahip_mi", true),
    admin.from("izleme_listesi").select("*", { count: "exact", head: true }),
  ]);

  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const toplamKullanici = users?.users?.length ?? 0;
  const bugunKullanici = users?.users?.filter((u) => {
    const created = new Date(u.created_at);
    const bugun = new Date();
    return created.toDateString() === bugun.toDateString();
  }).length ?? 0;

  return {
    toplamKullanici,
    bugunKullanici,
    waitListSayisi: waitListSayisi ?? 0,
    toplamAracKaydi: kullaniciSayisi ?? 0,
    benimArabam: aracSayisi ?? 0,
    takipListesi: takipSayisi ?? 0,
  };
}

async function getPostHogMetrics() {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId) return null;

  try {
    const bugun = new Date().toISOString().slice(0, 10);
    const birHaftaOnce = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const res = await fetch(
      `https://us.posthog.com/api/projects/${projectId}/insights/trend/?events=[{"id":"$pageview"}]&date_from=${birHaftaOnce}&date_to=${bugun}&interval=day`,
      { headers: { Authorization: `Bearer ${apiKey}` }, next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const sonuclar = data?.result?.[0]?.data ?? [];
    const toplamPageview = sonuclar.reduce((s: number, n: number) => s + n, 0);
    return { toplamPageview, gunler: data?.result?.[0]?.labels ?? [], degerler: sonuclar };
  } catch {
    return null;
  }
}

function Kart({ baslik, deger, alt }: { baslik: string; deger: string | number; alt?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{baslik}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{deger}</p>
      {alt && <p className="mt-1 text-xs text-slate-400">{alt}</p>}
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) redirect("/");

  const [sb, ph] = await Promise.all([getSupabaseMetrics(), getPostHogMetrics()]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Admin</h1>
      <p className="mb-8 text-sm text-slate-400">Sadece sen görüyorsun bunu.</p>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Kullanıcılar</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Kart baslik="Toplam Kayıt" deger={sb.toplamKullanici} />
        <Kart baslik="Bugün Yeni" deger={sb.bugunKullanici} />
        <Kart baslik="Piyasa Wait List" deger={sb.waitListSayisi} />
      </div>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Araçlar</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Kart baslik="Benim Arabam" deger={sb.benimArabam} alt="sahip_mi = true" />
        <Kart baslik="Takip Listesi" deger={sb.takipListesi} />
        <Kart baslik="Toplam Araç Kaydı" deger={sb.toplamAracKaydi} alt="garaj + takip" />
      </div>

      {ph ? (
        <>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Trafik (Son 7 Gün)</h2>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Kart baslik="Toplam Pageview" deger={ph.toplamPageview.toLocaleString("tr-TR")} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Günlük Pageview</p>
            <div className="flex items-end gap-1.5 h-24">
              {ph.degerler.map((v: number, i: number) => {
                const max = Math.max(...ph.degerler, 1);
                const yuzde = (v / max) * 100;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-indigo-400"
                      style={{ height: `${yuzde}%`, minHeight: v > 0 ? 4 : 0 }}
                      title={`${ph.gunler[i]}: ${v}`}
                    />
                    <span className="text-[9px] text-slate-400">{String(ph.gunler[i]).slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm text-slate-400">PostHog metrikleri için <code className="rounded bg-slate-100 px-1">POSTHOG_PERSONAL_API_KEY</code> ve <code className="rounded bg-slate-100 px-1">POSTHOG_PROJECT_ID</code> env değişkenlerini ekle.</p>
        </div>
      )}
    </main>
  );
}
