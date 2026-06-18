import Link from "next/link";
import { kayitOl } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";

export default function KayitPage() {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Kayıt ol</h1>
        <p className="mt-1 text-sm text-slate-500">
          Zaten hesabın var mı?{" "}
          <Link href="/giris" className="text-indigo-600 hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
      <AuthForm action={kayitOl} submitLabel="Kayıt ol" adSoyadAl />
    </main>
  );
}
