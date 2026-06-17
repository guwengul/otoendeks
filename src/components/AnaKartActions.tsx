"use client";

import { useState } from "react";

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.824L.057 23.882a.5.5 0 0 0 .613.614l6.115-1.453A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.17-1.444l-.37-.22-3.832.91.926-3.77-.242-.387A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function IconImage() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

export function AnaKartActions({
  ogParams,
  tumunuMetin,
}: {
  ogParams: string;
  tumunuMetin: string;
}) {
  const [takipAktif, setTakipAktif] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [resimYukleniyor, setResimYukleniyor] = useState(false);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const encodedText = encodeURIComponent(tumunuMetin);
  const encodedUrl = encodeURIComponent(pageUrl);

  function handleKopyala() {
    navigator.clipboard.writeText(tumunuMetin + "\n" + pageUrl);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  }

  async function handleResimPaylas() {
    setResimYukleniyor(true);
    try {
      const ogUrl = `${window.location.origin}/api/og?${ogParams}`;
      const res = await fetch(ogUrl);
      const blob = await res.blob();
      const file = new File([blob], "kasko-degeri.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], url: pageUrl });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "kasko-degeri.png";
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch {
      // kullanıcı iptal etti
    } finally {
      setResimYukleniyor(false);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-4">
      {/* Takip et */}
      {takipAktif ? (
        <span className="text-xs text-blue-600">Takip için kayıt ol — yakında!</span>
      ) : (
        <button
          onClick={() => setTakipAktif(true)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          <span>♡</span>
          <span>Takip et</span>
        </button>
      )}

      {/* Paylaş ikonları */}
      <div className="ml-auto flex items-center gap-1.5">
        <a
          href={`https://wa.me/?text=${encodedText}%0A${encodedUrl}`}
          target="_blank" rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white transition-opacity hover:opacity-80"
          title="WhatsApp"
        >
          <IconWhatsApp />
        </a>
        <a
          href={`https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank" rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80"
          title="X"
        >
          <IconX />
        </a>
        <button
          onClick={handleKopyala}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
          title="Kopyala"
        >
          {kopyalandi ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : <IconCopy />}
        </button>
        <button
          onClick={handleResimPaylas}
          disabled={resimYukleniyor}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
          title="Resim olarak paylaş"
        >
          {resimYukleniyor ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : <IconImage />}
        </button>
      </div>
    </div>
  );
}
