"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, optText, text, type ActionResult } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { parseRupiah } from "@/lib/format";

export async function createRenovation(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const deduct = text(formData, "deduct") === "on";
  const values = {
    property_id: text(formData, "property_id"),
    lease_id: deduct ? optText(formData, "lease_id") : null,
    title: text(formData, "title"),
    description: optText(formData, "description"),
    cost: parseRupiah(formData.get("cost")),
    renovation_date: text(formData, "renovation_date"),
    start_month: `${text(formData, "start_month")}-01`,
    installments: Number(text(formData, "installments") || 1),
  };
  if (!values.property_id || !values.title || !values.renovation_date) return fail("Lengkapi kontrakan, judul, dan tanggal.");
  if (values.cost <= 0) return fail("Biaya harus lebih dari 0.");
  if (deduct && !values.lease_id) return fail("Kontrakan ini tidak punya sewa aktif untuk dipotong.");

  const { data, error } = await supabase.from("renovations").insert(values).select("id").single();
  if (error) return fail(error);

  const { error: applyError } = await supabase.rpc("apply_renovation", { p_renovation_id: data.id });
  if (applyError) {
    await supabase.from("renovations").delete().eq("id", data.id);
    return fail(applyError);
  }
  revalidatePath("/", "layout");
  return ok(values.lease_id ? "Renovasi dicatat & dipotong dari tagihan" : "Renovasi dicatat");
}

export async function deleteRenovation(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("delete_renovation", { p_renovation_id: id });
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Renovasi dihapus, potongan tagihan dibatalkan");
}
