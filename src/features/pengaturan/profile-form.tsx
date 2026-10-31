"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions";
import { DEFAULT_WA_TEMPLATE } from "@/features/tagihan/wa";
import { updateProfile } from "./actions";

type Profile = {
  full_name: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  receipt_prefix: string;
  wa_template: string;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(async (_prev, formData) => {
    const result = await updateProfile(formData);
    if (result.ok) toast.success(result.message);
    return result;
  }, null);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profil pemilik</CardTitle>
          <CardDescription>Tampil di kwitansi pembayaran.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Nama" htmlFor="full_name">
            <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} />
          </Field>
          <Field label="No. HP" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank" htmlFor="bank_name">
              <Input id="bank_name" name="bank_name" defaultValue={profile.bank_name ?? ""} />
            </Field>
            <Field label="No. rekening" htmlFor="bank_account">
              <Input id="bank_account" name="bank_account" defaultValue={profile.bank_account ?? ""} />
            </Field>
          </div>
          <Field label="Atas nama" htmlFor="bank_holder">
            <Input id="bank_holder" name="bank_holder" defaultValue={profile.bank_holder ?? ""} />
          </Field>
          <Field label="Prefix nomor kwitansi" htmlFor="receipt_prefix" hint="Contoh: KW → KW-202610-0001">
            <Input id="receipt_prefix" name="receipt_prefix" defaultValue={profile.receipt_prefix} maxLength={10} />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Template pengingat WhatsApp</CardTitle>
          <CardDescription>
            Variabel: <code>{"{nama}"}</code> <code>{"{kontrakan}"}</code> <code>{"{bulan}"}</code> <code>{"{nominal}"}</code>{" "}
            <code>{"{jatuh_tempo}"}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea name="wa_template" rows={8} defaultValue={profile.wa_template || DEFAULT_WA_TEMPLATE} />
          {state && !state.ok && <p className="text-sm text-destructive">{state.message}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan pengaturan"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
