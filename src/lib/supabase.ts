import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Node 20'de global WebSocket olmadığı için realtime-js'in client oluşturma
// sırasındaki kontrolü "ws" paketiyle karşılanıyor (realtime burada kullanılmıyor).
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
  realtime: { transport: ws as never },
});
