import { addMonths } from "@/lib/format";

export type InvoiceStatus = "lunas" | "telat" | "diperpanjang" | "sebagian" | "belum_bayar";

export const STATUS_META: Record<InvoiceStatus, { label: string; className: string }> = {
  lunas: { label: "Lunas", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  telat: { label: "Telat", className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
  diperpanjang: { label: "Diperpanjang", className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30" },
  sebagian: { label: "Sebagian", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  belum_bayar: { label: "Belum bayar", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30" },
};

export function statusMeta(status: string | null | undefined) {
  return STATUS_META[(status ?? "belum_bayar") as InvoiceStatus] ?? STATUS_META.belum_bayar;
}

/**
 * Bulan terakhir yang sudah lunas berturut-turut sejak awal sewa.
 * null = belum ada bulan yang lunas.
 */
export function paidThrough(lease: {
  start_date: string;
  first_unpaid_month: string | null;
  last_invoice_month: string | null;
}) {
  const startMonth = `${lease.start_date.slice(0, 7)}-01`;
  if (lease.first_unpaid_month) {
    return lease.first_unpaid_month <= startMonth ? null : addMonths(lease.first_unpaid_month, -1);
  }
  return lease.last_invoice_month;
}

/** Bulan-bulan yang akan dilunasi bila membayar `months` bulan, mulai dari tagihan terbuka tertua. */
export function monthsCovered(firstOpenMonth: string, months: number) {
  return Array.from({ length: Math.max(0, months) }, (_, i) => addMonths(firstOpenMonth, i));
}

/** Pembagian potongan renovasi: rata, sisa pembulatan di bulan terakhir (sama dengan apply_renovation di SQL). */
export function splitInstallments(cost: number, installments: number) {
  const n = Math.max(1, Math.floor(installments));
  const per = Math.floor(cost / n);
  const rest = cost - per * n;
  return Array.from({ length: n }, (_, i) => per + (i === n - 1 ? rest : 0));
}

export const EXPENSE_CATEGORIES = [
  { value: "listrik", label: "Listrik" },
  { value: "air", label: "Air" },
  { value: "pajak", label: "Pajak" },
  { value: "perbaikan", label: "Perbaikan" },
  { value: "kebersihan", label: "Kebersihan" },
  { value: "lainnya", label: "Lainnya" },
] as const;

export function categoryLabel(value: string) {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
