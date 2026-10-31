import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { WaButton } from "@/components/wa-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createTenant } from "@/features/penghuni/actions";
import { TenantFormDialog } from "@/features/penghuni/tenant-form";
import { requireUser } from "@/lib/auth";
import { rupiah } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Penghuni" };

export default async function PenghuniPage() {
  const { supabase } = await requireUser();
  const [{ data: tenants }, { data: leases }] = await Promise.all([
    supabase.from("tenants").select("*").order("name"),
    supabase.from("lease_summaries").select("id, tenant_id, property_name, outstanding").eq("status", "active"),
  ]);

  return (
    <>
      <PageHeader
        title="Penghuni"
        description={`${tenants?.length ?? 0} penghuni terdaftar`}
        actions={
          <TenantFormDialog
            action={createTenant}
            trigger={
              <Button>
                <Plus /> Tambah penghuni
              </Button>
            }
          />
        }
      />
      {(tenants ?? []).length === 0 ? (
        <EmptyState title="Belum ada penghuni" />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No. WhatsApp</TableHead>
                <TableHead>Kontrakan</TableHead>
                <TableHead className="text-right">Tunggakan</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tenants ?? []).map((t) => {
                const lease = leases?.find((l) => l.tenant_id === t.id);
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/penghuni/${t.id}`} className="font-medium hover:underline">
                        {t.name}
                      </Link>
                    </TableCell>
                    <TableCell>{t.phone ?? "-"}</TableCell>
                    <TableCell>{lease ? lease.property_name : <Badge variant="secondary">Tidak menyewa</Badge>}</TableCell>
                    <TableCell className={`text-right ${(lease?.outstanding ?? 0) > 0 ? "font-medium text-red-600" : ""}`}>
                      {lease ? rupiah(lease.outstanding) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <WaButton href={waLink(t.phone, `Halo ${t.name}, `)} label="Chat WhatsApp" />
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
