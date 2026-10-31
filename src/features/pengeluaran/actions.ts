"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/database.types";
import { fail, fileOf, ok, optText, text, type ActionResult } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { parseRupiah } from "@/lib/format";
import { uploadFile } from "@/lib/storage";

type Category = Database["public"]["Enums"]["expense_category"];

function readExpense(formData: FormData) {
  return {
    property_id: optText(formData, "property_id"),
    category: (text(formData, "category") || "lainnya") as Category,
    amount: parseRupiah(formData.get("amount")),
    expense_date: text(formData, "expense_date"),
    notes: optText(formData, "notes"),
  };
}

export async function saveExpense(id: string | null, formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const values = readExpense(formData);
  if (values.amount <= 0 || !values.expense_date) return fail("Nominal dan tanggal wajib diisi.");

  const file = fileOf(formData, "receipt");
  let receiptPath: string | undefined;
  if (file) {
    try {
      receiptPath = await uploadFile(supabase, "expense-receipts", userId, file);
    } catch (e) {
      return fail((e as Error).message);
    }
  }
  const row = receiptPath ? { ...values, receipt_path: receiptPath } : values;
  const { error } = id ? await supabase.from("expenses").update(row).eq("id", id) : await supabase.from("expenses").insert(row);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok(id ? "Pengeluaran diperbarui" : "Pengeluaran dicatat");
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("expenses").delete().eq("id", id).select("receipt_path").single();
  if (data?.receipt_path) await supabase.storage.from("expense-receipts").remove([data.receipt_path]);
  revalidatePath("/", "layout");
  return ok("Pengeluaran dihapus");
}
