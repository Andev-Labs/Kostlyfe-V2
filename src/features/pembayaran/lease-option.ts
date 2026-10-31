import { addMonths, currentMonthISO } from "@/lib/format";

export type LeaseOption = {
  id: string;
  label: string;
  monthly_rent: number;
  outstanding: number;
  /** tagihan terbuka tertua, atau bulan setelah tagihan terakhir */
  next_open_month: string;
};

/** Bangun opsi sewa dari baris lease_summaries. */
export function toLeaseOption(l: {
  id: string | null;
  property_name: string | null;
  tenant_name: string | null;
  monthly_rent: number | null;
  outstanding: number | null;
  first_unpaid_month: string | null;
  last_invoice_month: string | null;
}): LeaseOption {
  return {
    id: l.id!,
    label: `${l.property_name} — ${l.tenant_name}`,
    monthly_rent: l.monthly_rent ?? 0,
    outstanding: l.outstanding ?? 0,
    next_open_month:
      l.first_unpaid_month ?? (l.last_invoice_month ? addMonths(l.last_invoice_month, 1) : currentMonthISO()),
  };
}
