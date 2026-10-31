"use client";

import { useState } from "react";
import { Field } from "@/components/field";
import { FormDialog } from "@/components/form-dialog";
import { MoneyInput } from "@/components/money-input";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { splitInstallments } from "@/lib/billing";
import { addMonths, currentMonthISO, monthLabel, rupiah, todayISO } from "@/lib/format";
import { createRenovation } from "./actions";

type PropertyOption = { id: string; name: string; lease?: { id: string; tenant_name: string; monthly_rent: number } };

export function RenovationFormDialog({ trigger, properties }: { trigger: React.ReactNode; properties: PropertyOption[] }) {
  const [propertyId, setPropertyId] = useState(properties.find((p) => p.lease)?.id ?? properties[0]?.id ?? "");
  const [cost, setCost] = useState(0);
  const [installments, setInstallments] = useState(1);
  const [startMonth, setStartMonth] = useState(currentMonthISO().slice(0, 7));
  const [deduct, setDeduct] = useState(true);
  const property = properties.find((p) => p.id === propertyId);
  const lease = property?.lease;
  const parts = cost > 0 ? splitInstallments(cost, installments) : [];
  const tooBig = lease && parts.some((p) => p > lease.monthly_rent);

  return (
    <FormDialog
      trigger={trigger}
      title="Catat renovasi"
      description="Biaya yang ditalangi penghuni dipotong dari tagihan sewa — sekaligus atau dicicil beberapa bulan."
      action={createRenovation}
    >
      <Field label="Kontrakan" htmlFor="property_id">
        <NativeSelect id="property_id" name="property_id" className="w-full" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
          {properties.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.name}
              {p.lease ? ` — ${p.lease.tenant_name}` : " (kosong)"}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Judul" htmlFor="title">
        <Input id="title" name="title" required placeholder="Perbaikan atap bocor" />
      </Field>
      <Field label="Keterangan" htmlFor="description">
        <Textarea id="description" name="description" rows={2} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Biaya" htmlFor="cost">
          <MoneyInput id="cost" name="cost" value={cost} onValueChange={setCost} required />
        </Field>
        <Field label="Tanggal renovasi" htmlFor="renovation_date">
          <Input id="renovation_date" name="renovation_date" type="date" defaultValue={todayISO()} required />
        </Field>
      </div>

      <input type="hidden" name="lease_id" value={lease?.id ?? ""} />
      <input type="hidden" name="deduct" value={deduct && lease ? "on" : ""} />
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <div className="text-sm font-medium">Potong dari tagihan sewa</div>
          <div className="text-xs text-muted-foreground">
            {lease ? `Penghuni: ${lease.tenant_name}` : "Kontrakan kosong — hanya dicatat sebagai biaya."}
          </div>
        </div>
        <Switch checked={deduct && !!lease} onCheckedChange={setDeduct} disabled={!lease} />
      </div>

      {deduct && lease && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mulai dipotong bulan" htmlFor="start_month">
              <Input id="start_month" name="start_month" type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} required />
            </Field>
            <Field label="Dicicil (bulan)" htmlFor="installments">
              <Input
                id="installments"
                name="installments"
                type="number"
                min={1}
                max={60}
                value={installments}
                onChange={(e) => setInstallments(Math.max(1, Number(e.target.value) || 1))}
              />
            </Field>
          </div>
          {parts.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="mb-1 font-medium">Preview potongan</div>
              <ul className="space-y-0.5">
                {parts.map((amt, i) => {
                  const m = addMonths(`${startMonth}-01`, i);
                  return (
                    <li key={m} className="flex justify-between">
                      <span>{monthLabel(m)}</span>
                      <span>
                        −{rupiah(amt)} → bayar {rupiah(lease.monthly_rent - amt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {tooBig && <p className="mt-2 text-destructive">Potongan per bulan melebihi harga sewa. Tambah jumlah cicilan.</p>}
            </div>
          )}
        </>
      )}
      {!(deduct && lease) && <input type="hidden" name="start_month" value={startMonth} />}
    </FormDialog>
  );
}
