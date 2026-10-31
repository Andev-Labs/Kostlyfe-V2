"use client";

import { Field } from "@/components/field";
import { FormDialog } from "@/components/form-dialog";
import { MoneyInput } from "@/components/money-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions";

type Property = { name: string; address: string | null; default_rent: number; notes: string | null };

export function PropertyFormDialog({
  trigger,
  action,
  property,
}: {
  trigger: React.ReactNode;
  action: (formData: FormData) => Promise<ActionResult>;
  property?: Property;
}) {
  return (
    <FormDialog trigger={trigger} title={property ? "Ubah kontrakan" : "Tambah kontrakan"} action={action}>
      <Field label="Nama" htmlFor="name">
        <Input id="name" name="name" required defaultValue={property?.name} placeholder="Kontrakan Melati" />
      </Field>
      <Field label="Alamat" htmlFor="address">
        <Input id="address" name="address" defaultValue={property?.address ?? ""} />
      </Field>
      <Field label="Harga sewa default / bulan" htmlFor="default_rent" hint="Dipakai sebagai harga awal saat membuat sewa baru.">
        <MoneyInput id="default_rent" name="default_rent" defaultValue={property?.default_rent} />
      </Field>
      <Field label="Catatan" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={property?.notes ?? ""} />
      </Field>
    </FormDialog>
  );
}
