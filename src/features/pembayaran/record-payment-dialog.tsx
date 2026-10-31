"use client";

import { useState } from "react";
import { Field } from "@/components/field";
import { FormDialog } from "@/components/form-dialog";
import { MoneyInput } from "@/components/money-input";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { monthsCovered } from "@/lib/billing";
import { monthLabel, rupiah, todayISO } from "@/lib/format";
import type { LeaseOption } from "./lease-option";
import { recordPayment } from "./actions";

const QUICK_MONTHS = [1, 2, 3, 6, 12];

export function RecordPaymentDialog({
  trigger,
  leases,
  defaultLeaseId,
  defaultAmount,
}: {
  trigger: React.ReactNode;
  leases: LeaseOption[];
  defaultLeaseId?: string;
  defaultAmount?: number;
}) {
  const [leaseId, setLeaseId] = useState(defaultLeaseId ?? leases[0]?.id ?? "");
  const [mode, setMode] = useState<"amount" | "months">("amount");
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState(defaultAmount ?? 0);
  const lease = leases.find((l) => l.id === leaseId);

  const covered = lease ? monthsCovered(lease.next_open_month, months) : [];
  const approxMonths = lease && amount > 0 ? amount / lease.monthly_rent : 0;

  return (
    <FormDialog
      trigger={trigger}
      title="Catat pembayaran"
      description="Pembayaran otomatis melunasi tagihan tertua dulu. Kelebihan dipakai untuk bulan berikutnya."
      action={recordPayment}
    >
      <Field label="Sewa" htmlFor="lease_id">
        <NativeSelect id="lease_id" name="lease_id" className="w-full" value={leaseId} onChange={(e) => setLeaseId(e.target.value)} required>
          {leases.map((l) => (
            <NativeSelectOption key={l.id} value={l.id}>
              {l.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {lease && (
          <p className="text-xs text-muted-foreground">
            Sewa {rupiah(lease.monthly_rent)}/bulan · Tunggakan s/d bulan ini: {rupiah(lease.outstanding)}
          </p>
        )}
      </Field>

      <input type="hidden" name="mode" value={mode} />
      <Tabs value={mode} onValueChange={(v) => setMode(v as "amount" | "months")}>
        <TabsList className="w-full">
          <TabsTrigger value="amount">Nominal</TabsTrigger>
          <TabsTrigger value="months">Bayar per bulan</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "amount" ? (
        <Field
          label="Nominal"
          htmlFor="amount"
          hint={approxMonths > 0 ? `≈ ${approxMonths.toLocaleString("id-ID", { maximumFractionDigits: 1 })} bulan sewa` : undefined}
        >
          <MoneyInput id="amount" name="amount" value={amount} onValueChange={setAmount} required />
        </Field>
      ) : (
        <Field
          label="Jumlah bulan"
          htmlFor="months"
          hint={
            covered.length > 0
              ? `Melunasi ${monthLabel(covered[0])} – ${monthLabel(covered[covered.length - 1])}. Nominal dihitung otomatis (termasuk potongan renovasi).`
              : undefined
          }
        >
          <div className="flex flex-wrap gap-2">
            {QUICK_MONTHS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`rounded-md border px-3 py-1 text-sm ${months === m ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {m} bln
              </button>
            ))}
            <Input
              id="months"
              name="months"
              type="number"
              min={1}
              max={60}
              className="w-20"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value) || 1)}
            />
          </div>
          {lease && <p className="text-sm font-medium">Perkiraan: {rupiah(lease.monthly_rent * months)}</p>}
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal bayar" htmlFor="paid_at">
          <Input id="paid_at" name="paid_at" type="date" defaultValue={todayISO()} required />
        </Field>
        <Field label="Metode" htmlFor="method">
          <NativeSelect id="method" name="method" className="w-full" defaultValue="transfer">
            <NativeSelectOption value="transfer">Transfer</NativeSelectOption>
            <NativeSelectOption value="cash">Tunai</NativeSelectOption>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Bukti transfer (opsional)" htmlFor="proof" hint="JPG/PNG/WebP/PDF, maks 5 MB">
        <Input id="proof" name="proof" type="file" accept="image/*,application/pdf" />
      </Field>
      <Field label="Catatan" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} />
      </Field>
    </FormDialog>
  );
}
