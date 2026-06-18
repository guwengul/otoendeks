import Link from "next/link";
import { girisYap } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Giriş yap</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="text-indigo-600 hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
      <AuthForm action={girisYap} submitLabel="Giriş yap" redirectTo={redirect} />
    </main>
  );
}
