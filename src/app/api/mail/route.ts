import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const SECRET = process.env.MAIL_API_SECRET;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-api-secret");
  if (!SECRET || auth !== SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { to, subject, html } = await req.json();
  if (!to || !subject || !html) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "otoendeks <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
