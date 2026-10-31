"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, optText, text, type ActionResult } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { parseRupiah } from "@/lib/format";

export async function createLease(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const values = {
    property_id: text(formData, "property_id"),
    tenant_id: text(formData, "tenant_id"),
    start_date: text(formData, "start_date"),
    monthly_rent: parseRupiah(formData.get("monthly_rent")),
    due_day: Number(text(formData, "due_day") || 1),
    deposit: parseRupiah(formData.get("deposit")),
    notes: optText(formData, "notes"),
  };
  if (!values.property_id || !values.tenant_id || !values.start_date) return fail("Kontrakan, penghuni, dan tanggal mulai wajib diisi.");
  if (values.monthly_rent <= 0) return fail("Harga sewa harus lebih dari 0.");

  const { data, error } = await supabase.from("leases").insert(values).select("id").single();
  if (error) return fail(error.code === "23505" ? "Kontrakan ini masih punya sewa aktif." : error);

  const { error: invError } = await supabase.rpc("ensure_invoices", { p_lease_id: data.id });
  if (invError) return fail(invError);
  revalidatePath("/", "layout");
  return ok("Sewa dibuat");
}

export async function updateLease(id: string, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("leases")
    .update({
      monthly_rent: parseRupiah(formData.get("monthly_rent")),
      due_day: Number(text(formData, "due_day") || 1),
      deposit: parseRupiah(formData.get("deposit")),
      notes: optText(formData, "notes"),
    })
    .eq("id", id);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Sewa diperbarui. Harga baru berlaku untuk tagihan bulan depan.");
}

export async function endLease(id: string, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const endDate = text(formData, "end_date");
  if (!endDate) return fail("Tanggal selesai wajib diisi.");
  const { error } = await supabase.from("leases").update({ end_date: endDate, status: "ended" }).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Sewa diakhiri");
}

export async function deleteLease(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("leases").delete().eq("id", id);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Sewa dihapus");
}
