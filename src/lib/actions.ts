export type ActionResult = { ok: boolean; message?: string };

export function ok(message?: string): ActionResult {
  return { ok: true, message };
}

/** Ubah error Supabase/Postgres jadi pesan yang ramah. Pesan `raise exception` dari SQL diteruskan apa adanya. */
export function fail(error: { message?: string; code?: string } | string | null | undefined): ActionResult {
  if (!error) return { ok: false, message: "Terjadi kesalahan." };
  if (typeof error === "string") return { ok: false, message: error };
  if (error.code === "23503") return { ok: false, message: "Data masih dipakai oleh data lain, tidak bisa dihapus." };
  if (error.code === "23505") return { ok: false, message: "Data sudah ada / bentrok dengan data lain." };
  if (error.code === "23514") return { ok: false, message: "Isian tidak valid." };
  return { ok: false, message: error.message ?? "Terjadi kesalahan." };
}

export function text(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function optText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

export function fileOf(formData: FormData, key: string) {
  const v = formData.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}
