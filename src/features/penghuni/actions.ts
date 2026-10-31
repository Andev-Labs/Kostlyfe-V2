"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, optText, text, type ActionResult } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

function readTenant(formData: FormData) {
  return {
    name: text(formData, "name"),
    phone: optText(formData, "phone"),
    nik: optText(formData, "nik"),
    emergency_contact: optText(formData, "emergency_contact"),
    notes: optText(formData, "notes"),
  };
}

export async function createTenant(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const values = readTenant(formData);
  if (!values.name) return fail("Nama penghuni wajib diisi.");
  const { error } = await supabase.from("tenants").insert(values);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Penghuni ditambahkan");
}

export async function updateTenant(id: string, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const values = readTenant(formData);
  if (!values.name) return fail("Nama penghuni wajib diisi.");
  const { error } = await supabase.from("tenants").update(values).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Penghuni diperbarui");
}

export async function deleteTenant(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tenants").delete().eq("id", id);
  if (error) return fail(error.code === "23503" ? "Penghuni masih punya data sewa. Hapus sewanya dulu." : error);
  revalidatePath("/", "layout");
  return ok("Penghuni dihapus");
}
