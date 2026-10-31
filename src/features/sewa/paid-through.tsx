import { paidThrough } from "@/lib/billing";
import { currentMonthISO, monthLabel } from "@/lib/format";

export function PaidThrough({
  lease,
}: {
  lease: { start_date: string | null; first_unpaid_month: string | null; last_invoice_month: string | null };
}) {
  if (!lease.start_date) return null;
  const through = paidThrough({
    start_date: lease.start_date,
    first_unpaid_month: lease.first_unpaid_month,
    last_invoice_month: lease.last_invoice_month,
  });
  if (!through) return <span className="text-muted-foreground">Belum ada bulan lunas</span>;
  const ahead = through > currentMonthISO();
  return (
    <span className={ahead ? "font-medium text-emerald-600" : undefined}>
      Lunas s/d {monthLabel(through)}
      {ahead && " (bayar di muka)"}
    </span>
  );
}
