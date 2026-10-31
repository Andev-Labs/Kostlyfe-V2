"use server";

import { revalidatePath } from "next/cache";
import { fail, fileOf, ok, optText, text, type ActionResult } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { parseRupiah } from "@/lib/format";
import { uploadFile } from "@/lib/storage";

export async function recordPayment(formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const leaseId = text(formData, "lease_id");
  const mode = text(formData, "mode");
  const months = mode === "months" ? Number(text(formData, "months")) : null;
  const amount = mode === "months" ? null : parseRupiah(formData.get("amount"));
  if (!leaseId) return fail("Pilih sewa.");
  if (mode === "months" && (!months || months < 1)) return fail("Jumlah bulan minimal 1.");
  if (mode !== "months" && !amount) return fail("Nominal wajib diisi.");

  let proofPath: string | null = null;
  const proof = fileOf(formData, "proof");
  if (proof) {
    try {
      proofPath = await uploadFile(supabase, "payment-proofs", userId, proof);
    } catch (e) {
      return fail((e as Error).message);
    }
  }

  const { error } = await supabase.rpc("record_payment", {
    p_lease_id: leaseId,
    p_amount: amount ?? undefined,
    p_months: months ?? undefined,
    p_paid_at: text(formData, "paid_at") || undefined,
    p_method: text(formData, "method") === "cash" ? "cash" : "transfer",
    p_proof_path: proofPath ?? undefined,
    p_notes: optText(formData, "notes") ?? undefined,
  });
  if (error) {
    if (proofPath) await supabase.storage.from("payment-proofs").remove([proofPath]);
    return fail(error);
  }
  revalidatePath("/", "layout");
  return ok("Pembayaran dicatat");
}

export async function deletePayment(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: payment } = await supabase.from("payments").select("proof_path").eq("id", id).single();
  const { error } = await supabase.rpc("delete_payment", { p_payment_id: id });
  if (error) return fail(error);
  if (payment?.proof_path) await supabase.storage.from("payment-proofs").remove([payment.proof_path]);
  revalidatePath("/", "layout");
  return ok("Pembayaran dihapus, alokasi tagihan dihitung ulang");
}
