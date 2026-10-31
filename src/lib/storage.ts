import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Bucket = "payment-proofs" | "expense-receipts";
const MAX_SIZE = 5 * 1024 * 1024;

export async function uploadFile(supabase: SupabaseClient<Database>, bucket: Bucket, userId: string, file: File) {
  if (file.size > MAX_SIZE) throw new Error("Ukuran file maksimal 5 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Upload gagal: ${error.message}`);
  return path;
}

export async function signedUrl(supabase: SupabaseClient<Database>, bucket: Bucket, path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
