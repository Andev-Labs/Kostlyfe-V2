import { dateLabel, monthLabel, rupiah } from "@/lib/format";
import { fillTemplate, waLink } from "@/lib/whatsapp";

export const DEFAULT_WA_TEMPLATE =
  "Halo {nama}, ini pengingat sewa {kontrakan} untuk bulan {bulan} sebesar {nominal}, jatuh tempo {jatuh_tempo}. Terima kasih 🙏";

export function invoiceReminderLink(
  template: string | null | undefined,
  inv: {
    tenant_name: string | null;
    tenant_phone: string | null;
    property_name: string | null;
    period_month: string | null;
    balance: number | null;
    effective_due_date: string | null;
  },
) {
  const message = fillTemplate(template || DEFAULT_WA_TEMPLATE, {
    nama: inv.tenant_name ?? "",
    kontrakan: inv.property_name ?? "",
    bulan: monthLabel(inv.period_month),
    nominal: rupiah(inv.balance),
    jatuh_tempo: dateLabel(inv.effective_due_date),
  });
  return waLink(inv.tenant_phone, message);
}
