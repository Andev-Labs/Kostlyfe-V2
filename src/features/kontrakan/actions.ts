"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, optText, text, type ActionResult } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { parseRupiah } from "@/lib/format";

function readProperty(formData: FormData) {
  return {
    name: text(formData, "name"),
    address: optText(formData, "address"),
    default_rent: parseRupiah(formData.get("default_rent")),
    notes: optText(formData, "notes"),
  };
}

export async function createProperty(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const values = readProperty(formData);
  if (!values.name) return fail("Nama kontrakan wajib diisi.");
  const { error } = await supabase.from("properties").insert(values);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Kontrakan ditambahkan");
}

export async function updateProperty(id: string, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const values = readProperty(formData);
  if (!values.name) return fail("Nama kontrakan wajib diisi.");
  const { error } = await supabase.from("properties").update(values).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok("Kontrakan diperbarui");
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) return fail(error.code === "23503" ? "Kontrakan masih punya data sewa. Hapus sewanya dulu." : error);
  revalidatePath("/", "layout");
  return ok("Kontrakan dihapus");
}
