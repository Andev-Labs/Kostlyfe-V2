import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProperty } from "@/features/kontrakan/actions";
import { PropertyFormDialog } from "@/features/kontrakan/property-form";
import { PaidThrough } from "@/features/sewa/paid-through";
import { requireUser } from "@/lib/auth";
import { currentMonthISO, rupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Kontrakan" };

export default async function KontrakanPage() {
  const { supabase } = await requireUser();
  await supabase.rpc("ensure_all_invoices");
  const curMonth = currentMonthISO();

  const [{ data: properties }, { data: leases }, { data: invoices }] = await Promise.all([
    supabase.from("properties").select("*").order("name"),
    supabase.from("lease_summaries").select("*").eq("status", "active"),
    supabase.from("invoice_balances").select("lease_id, status").eq("period_month", curMonth),
  ]);

  return (
    <>
      <PageHeader
        title="Kontrakan"
        description={`${properties?.length ?? 0} unit · ${leases?.length ?? 0} terisi`}
        actions={
          <PropertyFormDialog
            action={createProperty}
            trigger={
              <Button>
                <Plus /> Tambah kontrakan
              </Button>
            }
          />
        }
      />
      {(properties ?? []).length === 0 ? (
        <EmptyState title="Belum ada kontrakan" description="Tambahkan kontrakan pertamamu." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(properties ?? []).map((p) => {
            const lease = leases?.find((l) => l.property_id === p.id);
            const inv = lease && invoices?.find((i) => i.lease_id === lease.id);
            return (
              <Link key={p.id} href={`/kontrakan/${p.id}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{p.name}</CardTitle>
                      {lease ? <Badge>Terisi</Badge> : <Badge variant="secondary">Kosong</Badge>}
                    </div>
                    {p.address && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {p.address}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {lease ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{lease.tenant_name}</span>
                          {inv && <StatusBadge status={inv.status} />}
                        </div>
                        <div className="text-muted-foreground">{rupiah(lease.monthly_rent)}/bulan</div>
                        <div className="text-xs">
                          <PaidThrough lease={lease} />
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Sewa default {rupiah(p.default_rent)}/bulan</div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
