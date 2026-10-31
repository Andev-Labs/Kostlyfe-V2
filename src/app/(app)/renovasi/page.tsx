import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteRenovation } from "@/features/renovasi/actions";
import { RenovationFormDialog } from "@/features/renovasi/renovation-form";
import { requireUser } from "@/lib/auth";
import { dateLabel, monthLabel, rupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Renovasi" };

export default async function RenovasiPage() {
  const { supabase } = await requireUser();
  const [{ data: renovations }, { data: properties }, { data: leases }] = await Promise.all([
    supabase
      .from("renovations")
      .select("*, properties(name), leases(tenants(name)), invoice_adjustments(amount, invoices(period_month))")
      .order("renovation_date", { ascending: false }),
    supabase.from("properties").select("id, name").order("name"),
    supabase.from("lease_summaries").select("id, property_id, tenant_name, monthly_rent").eq("status", "active"),
  ]);

  const options = (properties ?? []).map((p) => {
    const l = leases?.find((x) => x.property_id === p.id);
    return { ...p, lease: l ? { id: l.id!, tenant_name: l.tenant_name!, monthly_rent: l.monthly_rent! } : undefined };
  });

  return (
    <>
      <PageHeader
        title="Renovasi"
        description="Biaya perbaikan rumah. Bila ditalangi penghuni, dipotong dari tagihan bulanan."
        actions={
          options.length > 0 && (
            <RenovationFormDialog
              properties={options}
              trigger={
                <Button>
                  <Plus /> Catat renovasi
                </Button>
              }
            />
          )
        }
      />
      {(renovations ?? []).length === 0 ? (
        <EmptyState title="Belum ada renovasi" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(renovations ?? []).map((r) => {
            const adjustments = [...r.invoice_adjustments].sort((a, b) =>
              (a.invoices?.period_month ?? "").localeCompare(b.invoices?.period_month ?? ""),
            );
            return (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{r.title}</CardTitle>
                      <CardDescription>
                        <Link href={`/kontrakan/${r.property_id}`} className="hover:underline">
                          {r.properties?.name}
                        </Link>{" "}
                        · {dateLabel(r.renovation_date)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{rupiah(r.cost)}</span>
                      <ConfirmAction
                        title="Hapus renovasi?"
                        description="Potongan di tagihan akan dibatalkan dan pembayaran dihitung ulang."
                        action={deleteRenovation.bind(null, r.id)}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label="Hapus renovasi">
                            <Trash2 />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {r.description && <p className="text-muted-foreground">{r.description}</p>}
                  {adjustments.length > 0 ? (
                    <>
                      <Badge variant="outline">
                        Dipotong dari sewa {r.leases?.tenants?.name} · {r.installments}x
                      </Badge>
                      <ul className="space-y-0.5">
                        {adjustments.map((a, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{monthLabel(a.invoices?.period_month)}</span>
                            <span className="text-emerald-600">−{rupiah(a.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <Badge variant="secondary">Dibayar pemilik (tidak memotong sewa)</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
