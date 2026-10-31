"use client";

import { Field } from "@/components/field";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions";

type Tenant = {
  name: string;
  phone: string | null;
  nik: string | null;
  emergency_contact: string | null;
  notes: string | null;
};

export function TenantFormDialog({
  trigger,
  action,
  tenant,
}: {
  trigger: React.ReactNode;
  action: (formData: FormData) => Promise<ActionResult>;
  tenant?: Tenant;
}) {
  return (
    <FormDialog trigger={trigger} title={tenant ? "Ubah penghuni" : "Tambah penghuni"} action={action}>
      <Field label="Nama" htmlFor="name">
        <Input id="name" name="name" required defaultValue={tenant?.name} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="No. WhatsApp" htmlFor="phone">
          <Input id="phone" name="phone" type="tel" defaultValue={tenant?.phone ?? ""} placeholder="0812…" />
        </Field>
        <Field label="NIK / KTP" htmlFor="nik">
          <Input id="nik" name="nik" defaultValue={tenant?.nik ?? ""} />
        </Field>
      </div>
      <Field label="Kontak darurat" htmlFor="emergency_contact">
        <Input id="emergency_contact" name="emergency_contact" defaultValue={tenant?.emergency_contact ?? ""} placeholder="Nama - nomor" />
      </Field>
      <Field label="Catatan" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={tenant?.notes ?? ""} />
      </Field>
    </FormDialog>
  );
}
