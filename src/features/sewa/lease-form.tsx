"use client";

import { useState } from "react";
import { Field } from "@/components/field";
import { FormDialog } from "@/components/form-dialog";
import { MoneyInput } from "@/components/money-input";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions";
import { todayISO } from "@/lib/format";

type Option = { id: string; name: string };

export function CreateLeaseDialog({
  trigger,
  action,
  properties,
  tenants,
  defaultPropertyId,
  defaultTenantId,
}: {
  trigger: React.ReactNode;
  action: (formData: FormData) => Promise<ActionResult>;
  properties: (Option & { default_rent: number })[];
  tenants: Option[];
  defaultPropertyId?: string;
  defaultTenantId?: string;
}) {
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? properties[0]?.id ?? "");
  const [startDate, setStartDate] = useState(todayISO());
  const rent = properties.find((p) => p.id === propertyId)?.default_rent ?? 0;
  const dueDay = Math.min(Number(startDate.slice(8, 10)) || 1, 28);

  return (
    <FormDialog
      trigger={trigger}
      title="Buat sewa baru"
      description="Tagihan bulanan akan dibuat otomatis mulai dari bulan awal sewa."
      action={action}
    >
      <Field label="Kontrakan" htmlFor="property_id" hint={properties.length === 0 ? "Semua kontrakan sedang terisi." : undefined}>
        <NativeSelect id="property_id" name="property_id" className="w-full" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required>
          {properties.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Penghuni" htmlFor="tenant_id">
        <NativeSelect id="tenant_id" name="tenant_id" className="w-full" defaultValue={defaultTenantId} required>
          {tenants.map((t) => (
            <NativeSelectOption key={t.id} value={t.id}>
              {t.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal mulai" htmlFor="start_date">
          <Input id="start_date" name="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Field label="Jatuh tempo tiap tanggal" htmlFor="due_day" hint="1–28">
          <Input key={dueDay} id="due_day" name="due_day" type="number" min={1} max={28} defaultValue={dueDay} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Harga sewa / bulan" htmlFor="monthly_rent">
          <MoneyInput key={propertyId} id="monthly_rent" name="monthly_rent" defaultValue={rent} required />
        </Field>
        <Field label="Deposit" htmlFor="deposit">
          <MoneyInput id="deposit" name="deposit" />
        </Field>
      </div>
      <Field label="Catatan" htmlFor="notes">
        <Textarea id="notes" name="notes" />
      </Field>
    </FormDialog>
  );
}

export function EditLeaseDialog({
  trigger,
  action,
  lease,
}: {
  trigger: React.ReactNode;
  action: (formData: FormData) => Promise<ActionResult>;
  lease: { monthly_rent: number; due_day: number; deposit: number; notes: string | null };
}) {
  return (
    <FormDialog trigger={trigger} title="Ubah sewa" description="Perubahan harga berlaku untuk tagihan bulan depan." action={action}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Harga sewa / bulan" htmlFor="monthly_rent">
          <MoneyInput id="monthly_rent" name="monthly_rent" defaultValue={lease.monthly_rent} required />
        </Field>
        <Field label="Jatuh tempo tiap tanggal" htmlFor="due_day">
          <Input id="due_day" name="due_day" type="number" min={1} max={28} defaultValue={lease.due_day} required />
        </Field>
      </div>
      <Field label="Deposit" htmlFor="deposit">
        <MoneyInput id="deposit" name="deposit" defaultValue={lease.deposit} />
      </Field>
      <Field label="Catatan" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={lease.notes ?? ""} />
      </Field>
    </FormDialog>
  );
}

export function EndLeaseDialog({ trigger, action }: { trigger: React.ReactNode; action: (formData: FormData) => Promise<ActionResult> }) {
  return (
    <FormDialog
      trigger={trigger}
      title="Akhiri sewa"
      description="Tagihan setelah bulan selesai akan dihapus. Kontrakan bisa disewakan lagi."
      action={action}
      submitLabel="Akhiri sewa"
    >
      <Field label="Tanggal selesai" htmlFor="end_date">
        <Input id="end_date" name="end_date" type="date" defaultValue={todayISO()} required />
      </Field>
    </FormDialog>
  );
}
