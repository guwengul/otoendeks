import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HesabimIstemci } from "@/components/HesabimIstemci";
import { cikisYap } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function HesabimPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const adSoyad = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Hesabım</h1>
        <Link href="/araclarim" className="text-sm text-slate-500 hover:text-indigo-600">
          ← Araçlarım
        </Link>
      </div>

      <HesabimIstemci email={user.email ?? ""} adSoyad={adSoyad} />

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
        <form action={cikisYap}>
          <button type="submit" className="text-sm text-slate-400 hover:text-slate-600">
            Çıkış yap
          </button>
        </form>
      </div>
    </main>
  );
}
