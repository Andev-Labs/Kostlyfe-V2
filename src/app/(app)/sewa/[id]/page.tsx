import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deletePayment } from "@/features/pembayaran/actions";
import { toLeaseOption } from "@/features/pembayaran/lease-option";
import { RecordPaymentDialog } from "@/features/pembayaran/record-payment-dialog";
import { deleteLease, endLease, updateLease } from "@/features/sewa/actions";
import { EditLeaseDialog, EndLeaseDialog } from "@/features/sewa/lease-form";
import { PaidThrough } from "@/features/sewa/paid-through";
import { requireUser } from "@/lib/auth";
import { statusMeta } from "@/lib/billing";
import { currentMonthISO, dateLabel, monthLabel, rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function SewaDetailPage({ params }: PageProps<"/sewa/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  await supabase.rpc("ensure_invoices", { p_lease_id: id }).then(() => null, () => null);

  const [{ data: lease }, { data: invoices }, { data: payments }] = await Promise.all([
    supabase.from("lease_summaries").select("*").eq("id", id).maybeSingle(),
    supabase.from("invoice_balances").select("*").eq("lease_id", id).order("period_month"),
    supabase
      .from("payments")
      .select("*, payment_allocations(amount, invoices(period_month))")
      .eq("lease_id", id)
      .order("paid_at", { ascending: false }),
  ]);
  if (!lease) notFound();

  const curMonth = currentMonthISO();
  const active = lease.status === "active";
  const totalPaid = (payments ?? []).reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        title={`${lease.property_name} — ${lease.tenant_name}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {active ? <Badge>Aktif</Badge> : <Badge variant="secondary">Selesai {dateLabel(lease.end_date)}</Badge>}
            <span>
              Mulai {dateLabel(lease.start_date)} · {rupiah(lease.monthly_rent)}/bulan · jatuh tempo tiap tgl {lease.due_day}
            </span>
          </span>
        }
        actions={
          <>
            {active && (
              <RecordPaymentDialog
                leases={[toLeaseOption(lease)]}
                defaultLeaseId={id}
                trigger={
                  <Button>
                    <Plus /> Catat pembayaran
                  </Button>
                }
              />
            )}
            <EditLeaseDialog
              action={updateLease.bind(null, id)}
              lease={{ monthly_rent: lease.monthly_rent!, due_day: lease.due_day!, deposit: lease.deposit!, notes: lease.notes }}
              trigger={
                <Button variant="outline">
                  <Pencil /> Ubah
                </Button>
              }
            />
            {active && <EndLeaseDialog action={endLease.bind(null, id)} trigger={<Button variant="outline">Akhiri sewa</Button>} />}
            <ConfirmAction
              title="Hapus sewa ini?"
              description="Semua tagihan, pembayaran, dan potongan renovasi untuk sewa ini akan ikut terhapus. Gunakan 'Akhiri sewa' bila penghuni hanya pindah."
              action={deleteLease.bind(null, id)}
              trigger={
                <Button variant="ghost" size="icon" aria-label="Hapus sewa">
                  <Trash2 />
                </Button>
              }
            />
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Status bayar" value={<PaidThrough lease={lease} />} />
        <Stat label="Tunggakan s/d bulan ini" value={rupiah(lease.outstanding)} danger={(lease.outstanding ?? 0) > 0} />
        <Stat label="Total dibayar" value={rupiah(totalPaid)} />
        <Stat label="Deposit / saldo lebih" value={`${rupiah(lease.deposit)} / ${rupiah(lease.credit)}`} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Timeline pembayaran</CardTitle>
          <CardDescription>Setiap kotak adalah satu bulan sewa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12">
            {(invoices ?? []).map((inv) => (
              <div
                key={inv.id}
                title={`${monthLabel(inv.period_month)}: ${statusMeta(inv.status).label}`}
                className={cn(
                  "rounded-lg border p-2 text-xs",
                  statusMeta(inv.status).className,
                  inv.period_month === curMonth && "ring-2 ring-primary",
                )}
              >
                <div className="font-semibold">{monthLabel(inv.period_month, "short")}</div>
                <div>{statusMeta(inv.status).label}</div>
                {(inv.balance ?? 0) > 0 && <div className="opacity-80">sisa {rupiah(inv.balance)}</div>}
                {(inv.discount ?? 0) > 0 && <div className="opacity-80">−{rupiah(inv.discount)}</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rincian tagihan</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Bulan</TableHead>
                  <TableHead className="text-right">Tagihan</TableHead>
                  <TableHead className="text-right">Dibayar</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...(invoices ?? [])].reverse().map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="pl-6">
                      {monthLabel(inv.period_month, "short")}
                      {inv.extension_note && <div className="text-xs text-muted-foreground">{inv.extension_note}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      {rupiah(inv.amount_due)}
                      {(inv.discount ?? 0) > 0 && <div className="text-xs text-emerald-600">−{rupiah(inv.discount)}</div>}
                    </TableCell>
                    <TableCell className="text-right">{rupiah(inv.paid)}</TableCell>
                    <TableCell className="pr-6">
                      <StatusBadge status={inv.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(payments ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum ada pembayaran.</p>}
            {(payments ?? []).map((p) => {
              const months = p.payment_allocations
                .map((a) => a.invoices?.period_month)
                .filter(Boolean)
                .sort() as string[];
              return (
                <div key={p.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <div className="font-medium">{rupiah(p.amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {dateLabel(p.paid_at)} · {p.method === "cash" ? "Tunai" : "Transfer"} · {p.receipt_no}
                    </div>
                    <div className="text-xs">
                      {months.length > 0
                        ? `Untuk ${monthLabel(months[0], "short")}${months.length > 1 ? ` – ${monthLabel(months[months.length - 1], "short")}` : ""}`
                        : "Saldo lebih"}
                    </div>
                    {p.notes && <div className="text-xs text-muted-foreground">{p.notes}</div>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" asChild aria-label="Unduh kwitansi">
                      <a href={`/api/kwitansi/${p.id}`} target="_blank" rel="noreferrer">
                        <FileDown />
                      </a>
                    </Button>
                    <ConfirmAction
                      title="Hapus pembayaran?"
                      description="Alokasi tagihan akan dihitung ulang."
                      action={deletePayment.bind(null, p.id)}
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label="Hapus pembayaran">
                          <Trash2 />
                        </Button>
                      }
                    />
                  </div>
                </div>
              );
            })}
            <Link href="/pembayaran" className="block text-sm text-muted-foreground hover:underline">
              Lihat semua pembayaran →
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, danger }: { label: string; value: React.ReactNode; danger?: boolean }) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("mt-1 text-lg font-semibold", danger && "text-red-600")}>{value}</div>
      </CardContent>
    </Card>
  );
}
