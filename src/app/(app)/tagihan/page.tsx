import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { UrlSelect } from "@/components/url-select";
import { WaButton } from "@/components/wa-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RecordPaymentDialog } from "@/features/pembayaran/record-payment-dialog";
import { grantExtension, removeExtension } from "@/features/tagihan/actions";
import { ExtensionDialog } from "@/features/tagihan/extension-dialog";
import { invoiceReminderLink } from "@/features/tagihan/wa";
import { requireUser } from "@/lib/auth";
import { addMonths, currentMonthISO, dateLabel, monthLabel, rupiah } from "@/lib/format";
import { getActiveLeaseOptions, getWaTemplate } from "@/lib/queries";

export const metadata: Metadata = { title: "Tagihan" };

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "telat", label: "Telat" },
  { value: "belum_bayar", label: "Belum bayar" },
  { value: "sebagian", label: "Sebagian" },
  { value: "diperpanjang", label: "Diperpanjang" },
  { value: "lunas", label: "Lunas" },
];

export default async function TagihanPage({ searchParams }: PageProps<"/tagihan">) {
  const { supabase, userId } = await requireUser();
  const params = await searchParams;
  const bulan = typeof params.bulan === "string" ? params.bulan : "";
  const status = typeof params.status === "string" ? params.status : "";
  const kontrakan = typeof params.kontrakan === "string" ? params.kontrakan : "";

  await supabase.rpc("ensure_all_invoices");
  const curMonth = currentMonthISO();

  let query = supabase.from("invoice_balances").select("*").order("period_month", { ascending: false }).order("property_name");
  if (bulan) query = query.eq("period_month", `${bulan}-01`);
  else query = query.gt("balance", 0).lte("period_month", curMonth); // default: semua yang belum lunas s/d bulan ini
  if (status) query = query.eq("status", status);
  if (kontrakan) query = query.eq("property_id", kontrakan);

  const [{ data: invoices }, { data: properties }, leaseOptions, template] = await Promise.all([
    query,
    supabase.from("properties").select("id, name").order("name"),
    getActiveLeaseOptions(supabase),
    getWaTemplate(supabase, userId),
  ]);

  const monthOptions = [
    { value: "", label: "Belum lunas (s/d bulan ini)" },
    ...Array.from({ length: 15 }, (_, i) => {
      const m = addMonths(curMonth, 2 - i);
      return { value: m.slice(0, 7), label: monthLabel(m) };
    }),
  ];
  const rows = invoices ?? [];
  const totalBalance = rows.reduce((s, r) => s + Math.max(r.balance ?? 0, 0), 0);

  return (
    <>
      <PageHeader
        title="Tagihan"
        description={
          bulan
            ? `Tagihan ${monthLabel(`${bulan}-01`)} · sisa ${rupiah(totalBalance)}`
            : `${rows.length} tagihan belum lunas · total ${rupiah(totalBalance)}`
        }
        actions={
          leaseOptions.length > 0 && (
            <RecordPaymentDialog
              leases={leaseOptions}
              trigger={
                <Button>
                  <Plus /> Catat pembayaran
                </Button>
              }
            />
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <UrlSelect param="bulan" label="Bulan" value={bulan} options={monthOptions} />
        <UrlSelect param="status" label="Status" value={status} options={STATUS_OPTIONS} />
        <UrlSelect
          param="kontrakan"
          label="Kontrakan"
          value={kontrakan}
          options={[{ value: "", label: "Semua kontrakan" }, ...(properties ?? []).map((p) => ({ value: p.id, label: p.name }))]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Tidak ada tagihan" description={bulan ? "Tidak ada tagihan untuk filter ini." : "Semua tagihan sudah lunas 🎉"} />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bulan</TableHead>
                <TableHead>Kontrakan / Penghuni</TableHead>
                <TableHead>Jatuh tempo</TableHead>
                <TableHead className="text-right">Tagihan</TableHead>
                <TableHead className="text-right">Dibayar</TableHead>
                <TableHead className="text-right">Sisa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{monthLabel(inv.period_month, "short")}</TableCell>
                  <TableCell>
                    <Link href={`/sewa/${inv.lease_id}`} className="font-medium hover:underline">
                      {inv.property_name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{inv.tenant_name}</div>
                  </TableCell>
                  <TableCell>
                    {inv.extended_due_date ? (
                      <div>
                        <span>{dateLabel(inv.extended_due_date)}</span>
                        <div className="text-xs text-muted-foreground line-through">{dateLabel(inv.due_date)}</div>
                        {inv.extension_note && <div className="max-w-40 truncate text-xs text-muted-foreground">{inv.extension_note}</div>}
                      </div>
                    ) : (
                      dateLabel(inv.due_date)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {rupiah(inv.amount_due)}
                    {(inv.discount ?? 0) > 0 && <div className="text-xs text-emerald-600">−{rupiah(inv.discount)} renovasi</div>}
                  </TableCell>
                  <TableCell className="text-right">{rupiah(inv.paid)}</TableCell>
                  <TableCell className="text-right font-medium">{rupiah(Math.max(inv.balance ?? 0, 0))}</TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {(inv.balance ?? 0) > 0 && (
                        <>
                          <RecordPaymentDialog
                            leases={leaseOptions}
                            defaultLeaseId={inv.lease_id!}
                            defaultAmount={inv.balance!}
                            trigger={<Button size="sm" variant="outline">Bayar</Button>}
                          />
                          <ExtensionDialog
                            action={grantExtension.bind(null, inv.id!)}
                            dueDate={inv.due_date!}
                            extendedDueDate={inv.extended_due_date}
                            note={inv.extension_note}
                            trigger={
                              <Button size="icon-sm" variant="ghost" aria-label="Beri perpanjangan">
                                <CalendarClock />
                              </Button>
                            }
                          />
                          <WaButton href={invoiceReminderLink(template, inv)} />
                        </>
                      )}
                      {inv.extended_due_date && (inv.balance ?? 0) > 0 && (
                        <ConfirmAction
                          title="Batalkan perpanjangan?"
                          confirmLabel="Batalkan"
                          action={removeExtension.bind(null, inv.id!)}
                          trigger={<Button size="sm" variant="ghost">Batal</Button>}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
