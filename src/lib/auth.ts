import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Supabase client + user id untuk Server Components / Actions. Redirect ke /login bila belum masuk. */
export async function requireUser() {
  // Halaman ini selalu per-request (data user, tanggal hari ini), jangan di-prerender.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}
