import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { tip_kodu, model_yili, oy } = await req.json();

  if (!tip_kodu || !model_yili || (oy !== 1 && oy !== -1)) {
    return new Response("Geçersiz istek", { status: 400 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/feedback_events`,
    {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ tip_kodu, model_yili, oy }),
    },
  );

  if (!res.ok) return new Response("Supabase hatası", { status: 500 });
  return new Response(null, { status: 204 });
}
