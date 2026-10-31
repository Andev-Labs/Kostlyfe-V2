"use client";

import { Field } from "@/components/field";
import { FormDialog } from "@/components/form-dialog";
import { MoneyInput } from "@/components/money-input";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions";
import { EXPENSE_CATEGORIES } from "@/lib/billing";
import { todayISO } from "@/lib/format";

type Expense = { property_id: string | null; category: string; amount: number; expense_date: string; notes: string | null };

export function ExpenseFormDialog({
  trigger,
  action,
  properties,
  expense,
}: {
  trigger: React.ReactNode;
  action: (formData: FormData) => Promise<ActionResult>;
  properties: { id: string; name: string }[];
  expense?: Expense;
}) {
  return (
    <FormDialog trigger={trigger} title={expense ? "Ubah pengeluaran" : "Catat pengeluaran"} action={action}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori" htmlFor="category">
          <NativeSelect id="category" name="category" className="w-full" defaultValue={expense?.category ?? "listrik"}>
            {EXPENSE_CATEGORIES.map((c) => (
              <NativeSelectOption key={c.value} value={c.value}>
                {c.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Kontrakan" htmlFor="property_id">
          <NativeSelect id="property_id" name="property_id" className="w-full" defaultValue={expense?.property_id ?? ""}>
            <NativeSelectOption value="">Umum (semua)</NativeSelectOption>
            {properties.map((p) => (
              <NativeSelectOption key={p.id} value={p.id}>
                {p.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nominal" htmlFor="amount">
          <MoneyInput id="amount" name="amount" defaultValue={expense?.amount} required />
        </Field>
        <Field label="Tanggal" htmlFor="expense_date">
          <Input id="expense_date" name="expense_date" type="date" defaultValue={expense?.expense_date ?? todayISO()} required />
        </Field>
      </div>
      <Field label="Keterangan" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} defaultValue={expense?.notes ?? ""} />
      </Field>
      <Field label={expense ? "Ganti struk (opsional)" : "Struk / nota (opsional)"} htmlFor="receipt" hint="JPG/PNG/WebP/PDF, maks 5 MB">
        <Input id="receipt" name="receipt" type="file" accept="image/*,application/pdf" />
      </Field>
    </FormDialog>
  );
}
