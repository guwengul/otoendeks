"use client";

import { useActionState, useState } from "react";
import { adSoyadGuncelle, sifreDegistir, hesabiSil } from "@/app/actions/hesap";

export function HesabimIstemci({ email, adSoyad }: { email: string; adSoyad: string }) {
  const [adState, adAction, adPending] = useActionState<{ error?: string; ok?: boolean } | null, FormData>(
    async (_, fd) => { const r = await adSoyadGuncelle(fd); return r ?? null; },
    null
  );
  const [sifreState, sifreAction, sifrePending] = useActionState<{ error?: string; ok?: boolean } | null, FormData>(
    async (_, fd) => { const r = await sifreDegistir(fd); return r ?? null; },
    null
  );

  const [sifreAcik, setSifreAcik] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [siliyor, setSiliyor] = useState(false);

  async function handleSil() {
    setSiliyor(true);
    await hesabiSil();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">

      {/* Profil satırı */}
      <form action={adAction} className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Profil</span>
          {adState?.ok && <span className="text-xs text-emerald-600">Kaydedildi</span>}
          {adState?.error && <span className="text-xs text-red-500">{adState.error}</span>}
        </div>
        <div className="mb-3">
          <p className="text-xs text-slate-400 mb-0.5">E-posta</p>
          <p className="text-sm text-slate-600">{email}</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-400" htmlFor="ad_soyad">Ad Soyad</label>
            <input
              id="ad_soyad"
              name="ad_soyad"
              type="text"
              defaultValue={adSoyad}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={adPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 shrink-0"
          >
            {adPending ? "..." : "Kaydet"}
          </button>
        </div>
      </form>

      {/* Şifre değiştir — collapsible */}
      <div className="p-5">
        <button
          type="button"
          onClick={() => setSifreAcik(v => !v)}
          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
        >
          <span>Şifre Değiştir</span>
          <span className="text-slate-300">{sifreAcik ? "▲" : "▼"}</span>
        </button>

        {sifreAcik && (
          <form action={sifreAction} className="mt-4 flex flex-col gap-3">
            <input
              name="yeni_sifre"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Yeni şifre"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              name="yeni_sifre_tekrar"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Yeni şifre tekrar"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {sifreState?.error && <p className="text-xs text-red-500">{sifreState.error}</p>}
            {sifreState?.ok && <p className="text-xs text-emerald-600">Şifre güncellendi.</p>}
            <button
              type="submit"
              disabled={sifrePending}
              className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {sifrePending ? "Güncelleniyor..." : "Güncelle"}
            </button>
          </form>
        )}
      </div>

      {/* Hesabı sil — en altta minimal */}
      <div className="px-5 py-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">Tüm veriler kalıcı olarak silinir.</p>
        {!silOnay ? (
          <button
            onClick={() => setSilOnay(true)}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Hesabı sil
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSil}
              disabled={siliyor}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {siliyor ? "Siliniyor..." : "Evet, sil"}
            </button>
            <button onClick={() => setSilOnay(false)} className="text-xs text-slate-400 hover:text-slate-600">
              İptal
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
