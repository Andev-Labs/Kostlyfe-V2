"use client";

import { Field } from "@/components/field";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions";
import { dateLabel } from "@/lib/format";

export function ExtensionDialog({
  trigger,
  action,
  dueDate,
  extendedDueDate,
  note,
}: {
  trigger: React.ReactNode;
  action: (formData: FormData) => Promise<ActionResult>;
  dueDate: string;
  extendedDueDate?: string | null;
  note?: string | null;
}) {
  return (
    <FormDialog
      trigger={trigger}
      title="Beri perpanjangan waktu"
      description={`Jatuh tempo asli: ${dateLabel(dueDate)}. Selama belum lewat tanggal baru, tagihan tidak dihitung telat.`}
      action={action}
    >
      <Field label="Jatuh tempo baru" htmlFor="extended_due_date">
        <Input id="extended_due_date" name="extended_due_date" type="date" min={dueDate} defaultValue={extendedDueDate ?? ""} required />
      </Field>
      <Field label="Alasan / catatan" htmlFor="extension_note">
        <Textarea id="extension_note" name="extension_note" defaultValue={note ?? ""} placeholder="Mis. gajian tanggal 10" />
      </Field>
    </FormDialog>
  );
}
