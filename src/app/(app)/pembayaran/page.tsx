import type { Metadata } from "next";
import Link from "next/link";
import { FileDown, Paperclip, Plus, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { UrlSelect } from "@/components/url-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deletePayment } from "@/features/pembayaran/actions";
import { RecordPaymentDialog } from "@/features/pembayaran/record-payment-dialog";
import { requireUser } from "@/lib/auth";
import { addMonths, currentMonthISO, dateLabel, monthLabel, rupiah } from "@/lib/format";
import { getActiveLeaseOptions } from "@/lib/queries";
import { signedUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Pembayaran" };

export default async function PembayaranPage({ searchParams }: PageProps<"/pembayaran">) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const bulan = typeof params.bulan === "string" ? params.bulan : "";
  const curMonth = currentMonthISO();

  let query = supabase
    .from("payments")
    .select("*, leases(id, properties(name), tenants(name)), payment_allocations(amount, invoices(period_month))")
    .order("paid_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (bulan) query = query.gte("paid_at", `${bulan}-01`).lt("paid_at", addMonths(`${bulan}-01`, 1));

  const [{ data: payments }, leaseOptions] = await Promise.all([query, getActiveLeaseOptions(supabase)]);
  const rows = await Promise.all(
    (payments ?? []).map(async (p) => ({ ...p, proofUrl: await signedUrl(supabase, "payment-proofs", p.proof_path) })),
  );
  const total = rows.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Pembayaran"
        description={`${rows.length} pembayaran · total ${rupiah(total)}`}
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
      <div className="mb-4">
        <UrlSelect
          param="bulan"
          label="Bulan bayar"
          value={bulan}
          options={[
            { value: "", label: "Semua bulan" },
            ...Array.from({ length: 13 }, (_, i) => {
              const m = addMonths(curMonth, -i);
              return { value: m.slice(0, 7), label: monthLabel(m) };
            }),
          ]}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Belum ada pembayaran" />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kontrakan / Penghuni</TableHead>
                <TableHead>Untuk bulan</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const months = p.payment_allocations.map((a) => a.invoices?.period_month).filter(Boolean).sort() as string[];
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      {dateLabel(p.paid_at)}
                      <div className="text-xs text-muted-foreground">{p.receipt_no}</div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/sewa/${p.leases?.id}`} className="font-medium hover:underline">
                        {p.leases?.properties?.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{p.leases?.tenants?.name}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {months.length === 0
                        ? "Saldo lebih"
                        : months.length === 1
                          ? monthLabel(months[0], "short")
                          : `${monthLabel(months[0], "short")} – ${monthLabel(months[months.length - 1], "short")} (${months.length} bln)`}
                    </TableCell>
                    <TableCell>{p.method === "cash" ? "Tunai" : "Transfer"}</TableCell>
                    <TableCell className="text-right font-medium">{rupiah(p.amount)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {p.proofUrl && (
                          <Button variant="ghost" size="icon-sm" asChild aria-label="Lihat bukti transfer">
                            <a href={p.proofUrl} target="_blank" rel="noreferrer">
                              <Paperclip />
                            </a>
                          </Button>
                        )}
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
