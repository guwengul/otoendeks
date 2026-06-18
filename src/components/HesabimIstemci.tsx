"use client";

import { useActionState, useState } from "react";
import { adSoyadGuncelle, sifreDegistir, hesabiSil } from "@/app/actions/hesap";

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 mb-4">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">{baslik}</h2>
      {children}
    </div>
  );
}

export function HesabimIstemci({ email, adSoyad }: { email: string; adSoyad: string }) {
  const [adState, adAction, adPending] = useActionState<{ error?: string; ok?: boolean } | null, FormData>(
    async (_, fd) => { const r = await adSoyadGuncelle(fd); return r ?? null; },
    null
  );
  const [sifreState, sifreAction, sifrePending] = useActionState<{ error?: string; ok?: boolean } | null, FormData>(
    async (_, fd) => { const r = await sifreDegistir(fd); return r ?? null; },
    null
  );

  const [silOnay, setSilOnay] = useState(false);
  const [siliyor, setSiliyor] = useState(false);

  async function handleSil() {
    setSiliyor(true);
    await hesabiSil();
  }

  return (
    <>
      {/* Profil bilgileri */}
      <Bolum baslik="Profil">
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-0.5">E-posta</p>
          <p className="text-sm text-slate-700">{email}</p>
        </div>
        <form action={adAction} className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="ad_soyad">
              Ad Soyad
            </label>
            <input
              id="ad_soyad"
              name="ad_soyad"
              type="text"
              defaultValue={adSoyad}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {adState?.error && <p className="text-xs text-red-600">{adState.error}</p>}
          {adState?.ok && <p className="text-xs text-emerald-600">Kaydedildi.</p>}
          <button
            type="submit"
            disabled={adPending}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {adPending ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </Bolum>

      {/* Şifre değiştir */}
      <Bolum baslik="Şifre Değiştir">
        <form action={sifreAction} className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="yeni_sifre">
              Yeni şifre
            </label>
            <input
              id="yeni_sifre"
              name="yeni_sifre"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="yeni_sifre_tekrar">
              Yeni şifre tekrar
            </label>
            <input
              id="yeni_sifre_tekrar"
              name="yeni_sifre_tekrar"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {sifreState?.error && <p className="text-xs text-red-600">{sifreState.error}</p>}
          {sifreState?.ok && <p className="text-xs text-emerald-600">Şifre güncellendi.</p>}
          <button
            type="submit"
            disabled={sifrePending}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {sifrePending ? "Güncelleniyor..." : "Güncelle"}
          </button>
        </form>
      </Bolum>

      {/* Hesabı sil */}
      <div className="rounded-xl border border-red-100 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-red-600">Hesabı Sil</h2>
        <p className="mb-4 text-xs text-slate-500">
          Hesabın ve tüm araç verilerin kalıcı olarak silinir. Bu işlem geri alınamaz.
        </p>
        {!silOnay ? (
          <button
            onClick={() => setSilOnay(true)}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Hesabımı sil
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSil}
              disabled={siliyor}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {siliyor ? "Siliniyor..." : "Evet, sil"}
            </button>
            <button
              onClick={() => setSilOnay(false)}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              İptal
            </button>
          </div>
        )}
      </div>
    </>
  );
}
