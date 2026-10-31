"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, optText, text, type ActionResult } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export async function grantExtension(invoiceId: string, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const date = text(formData, "extended_due_date");
  if (!date) return fail("Tanggal jatuh tempo baru wajib diisi.");
  const { error } = await supabase
    .from("invoices")
    .update({ extended_due_date: date, extension_note: optText(formData, "extension_note") })
    .eq("id", invoiceId);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Perpanjangan disimpan");
}

export async function removeExtension(invoiceId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("invoices")
    .update({ extended_due_date: null, extension_note: null })
    .eq("id", invoiceId);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Perpanjangan dibatalkan");
}
