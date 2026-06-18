"use client";

import { useActionState } from "react";

type AuthAction = (formData: FormData) => Promise<{ error: string } | void>;

export function AuthForm({
  action,
  submitLabel,
  redirectTo,
  adSoyadAl,
}: {
  action: AuthAction;
  submitLabel: string;
  redirectTo?: string;
  adSoyadAl?: boolean;
}) {
  const [state, formAction, pending] = useActionState<{ error: string } | null, FormData>(
    async (_, formData) => {
      if (adSoyadAl) {
        const sifre = formData.get("password") as string;
        const sifreTekrar = formData.get("password2") as string;
        if (sifre !== sifreTekrar) return { error: "Şifreler eşleşmiyor." };
      }
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
      {adSoyadAl && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ad_soyad">
            Ad Soyad
          </label>
          <input
            id="ad_soyad"
            name="ad_soyad"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={adSoyadAl ? "new-password" : "current-password"}
          minLength={8}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {adSoyadAl && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password2">
            Şifre tekrar
          </label>
          <input
            id="password2"
            name="password2"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Bekleniyor..." : submitLabel}
      </button>
    </form>
  );
}
