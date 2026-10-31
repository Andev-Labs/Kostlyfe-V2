"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, optText, text, type ActionResult } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: optText(formData, "full_name"),
      phone: optText(formData, "phone"),
      bank_name: optText(formData, "bank_name"),
      bank_account: optText(formData, "bank_account"),
      bank_holder: optText(formData, "bank_holder"),
      receipt_prefix: text(formData, "receipt_prefix") || "KW",
      wa_template: text(formData, "wa_template"),
    })
    .eq("id", userId);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Pengaturan disimpan");
}
