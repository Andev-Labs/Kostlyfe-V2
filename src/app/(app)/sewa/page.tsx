import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createLease } from "@/features/sewa/actions";
import { CreateLeaseDialog } from "@/features/sewa/lease-form";
import { PaidThrough } from "@/features/sewa/paid-through";
import { requireUser } from "@/lib/auth";
import { dateLabel, rupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Sewa" };

export default async function SewaPage() {
  const { supabase } = await requireUser();
  await supabase.rpc("ensure_all_invoices");

  const [{ data: leases }, { data: properties }, { data: tenants }] = await Promise.all([
    supabase.from("lease_summaries").select("*").order("status").order("start_date", { ascending: false }),
    supabase.from("properties").select("id, name, default_rent").order("name"),
    supabase.from("tenants").select("id, name").order("name"),
  ]);

  const occupied = new Set((leases ?? []).filter((l) => l.status === "active").map((l) => l.property_id));
  const vacant = (properties ?? []).filter((p) => !occupied.has(p.id));

  return (
    <>
      <PageHeader
        title="Sewa"
        description="Kontrak sewa antara kontrakan dan penghuni."
        actions={
          <CreateLeaseDialog
            action={createLease}
            properties={vacant}
            tenants={tenants ?? []}
            trigger={
              <Button disabled={vacant.length === 0 || (tenants ?? []).length === 0}>
                <Plus /> Sewa baru
              </Button>
            }
          />
        }
      />
      {(leases ?? []).length === 0 ? (
        <EmptyState title="Belum ada sewa" description="Tambahkan kontrakan dan penghuni dulu, lalu buat sewa." />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kontrakan</TableHead>
                <TableHead>Penghuni</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead className="text-right">Sewa / bulan</TableHead>
                <TableHead>Status bayar</TableHead>
                <TableHead className="text-right">Tunggakan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(leases ?? []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Link href={`/sewa/${l.id}`} className="font-medium hover:underline">
                      {l.property_name}
                    </Link>
                  </TableCell>
                  <TableCell>{l.tenant_name}</TableCell>
                  <TableCell>{dateLabel(l.start_date)}</TableCell>
                  <TableCell className="text-right">{rupiah(l.monthly_rent)}</TableCell>
                  <TableCell className="text-sm">
                    <PaidThrough lease={l} />
                  </TableCell>
                  <TableCell className={`text-right ${(l.outstanding ?? 0) > 0 ? "font-medium text-red-600" : ""}`}>
                    {rupiah(l.outstanding)}
                  </TableCell>
                  <TableCell>
                    {l.status === "active" ? <Badge>Aktif</Badge> : <Badge variant="secondary">Selesai {dateLabel(l.end_date)}</Badge>}
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
