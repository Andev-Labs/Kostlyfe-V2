import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteProperty, updateProperty } from "@/features/kontrakan/actions";
import { PropertyFormDialog } from "@/features/kontrakan/property-form";
import { createLease } from "@/features/sewa/actions";
import { CreateLeaseDialog } from "@/features/sewa/lease-form";
import { PaidThrough } from "@/features/sewa/paid-through";
import { requireUser } from "@/lib/auth";
import { categoryLabel } from "@/lib/billing";
import { dateLabel, rupiah, todayISO } from "@/lib/format";

export default async function KontrakanDetailPage({ params }: PageProps<"/kontrakan/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const year = todayISO().slice(0, 4);

  const [{ data: property }, { data: leases }, { data: renovations }, { data: expenses }, { data: tenants }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).maybeSingle(),
    supabase.from("lease_summaries").select("*").eq("property_id", id).order("start_date", { ascending: false }),
    supabase.from("renovations").select("*").eq("property_id", id).order("renovation_date", { ascending: false }),
    supabase.from("expenses").select("*").eq("property_id", id).order("expense_date", { ascending: false }),
    supabase.from("tenants").select("id, name").order("name"),
  ]);
  if (!property) notFound();

  const leaseIds = (leases ?? []).map((l) => l.id!);
  const { data: payments } = leaseIds.length
    ? await supabase.from("payments").select("amount, paid_at").in("lease_id", leaseIds).gte("paid_at", `${year}-01-01`)
    : { data: [] };

  const income = (payments ?? []).reduce((s, p) => s + p.amount, 0);
  const expenseTotal = (expenses ?? []).filter((e) => e.expense_date >= `${year}-01-01`).reduce((s, e) => s + e.amount, 0);
  const active = leases?.find((l) => l.status === "active");

  return (
    <>
      <PageHeader
        title={property.name}
        description={property.address ?? undefined}
        actions={
          <>
            {!active && (
              <CreateLeaseDialog
                action={createLease}
                properties={[property]}
                tenants={tenants ?? []}
                defaultPropertyId={property.id}
                trigger={
                  <Button>
                    <Plus /> Sewakan
                  </Button>
                }
              />
            )}
            <PropertyFormDialog
              action={updateProperty.bind(null, id)}
              property={property}
              trigger={
                <Button variant="outline">
                  <Pencil /> Ubah
                </Button>
              }
            />
            <ConfirmAction
              title="Hapus kontrakan?"
              description="Hanya bisa dihapus bila belum pernah punya sewa."
              action={deleteProperty.bind(null, id)}
              trigger={
                <Button variant="ghost" size="icon" aria-label="Hapus kontrakan">
                  <Trash2 />
                </Button>
              }
            />
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent>
            <div className="text-xs text-muted-foreground">Pemasukan {year}</div>
            <div className="mt-1 text-lg font-semibold">{rupiah(income)}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="text-xs text-muted-foreground">Pengeluaran {year}</div>
            <div className="mt-1 text-lg font-semibold">{rupiah(expenseTotal)}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="text-xs text-muted-foreground">Bersih {year}</div>
            <div className="mt-1 text-lg font-semibold">{rupiah(income - expenseTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Riwayat sewa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(leases ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum pernah disewakan.</p>}
            {(leases ?? []).map((l) => (
              <Link key={l.id} href={`/sewa/${l.id}`} className="block rounded-lg border p-3 hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{l.tenant_name}</span>
                  {l.status === "active" ? <Badge>Aktif</Badge> : <Badge variant="secondary">Selesai</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {dateLabel(l.start_date)} – {l.end_date ? dateLabel(l.end_date) : "sekarang"} · {rupiah(l.monthly_rent)}/bulan
                </div>
                <div className="text-xs">
                  <PaidThrough lease={l} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Renovasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(renovations ?? []).length === 0 && <p className="text-muted-foreground">Belum ada renovasi.</p>}
              {(renovations ?? []).map((r) => (
                <div key={r.id} className="flex justify-between gap-2">
                  <span>
                    {r.title} <span className="text-xs text-muted-foreground">· {dateLabel(r.renovation_date)}</span>
                  </span>
                  <span className="font-medium">{rupiah(r.cost)}</span>
                </div>
              ))}
              <Link href="/renovasi" className="block pt-2 text-xs text-muted-foreground hover:underline">
                Kelola renovasi →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(expenses ?? []).length === 0 && <p className="text-muted-foreground">Belum ada pengeluaran.</p>}
              {(expenses ?? []).slice(0, 8).map((e) => (
                <div key={e.id} className="flex justify-between gap-2">
                  <span>
                    {categoryLabel(e.category)}
                    {e.notes && <span className="text-muted-foreground"> · {e.notes}</span>}
                    <span className="text-xs text-muted-foreground"> · {dateLabel(e.expense_date)}</span>
                  </span>
                  <span className="font-medium">{rupiah(e.amount)}</span>
                </div>
              ))}
              <Link href="/pengeluaran" className="block pt-2 text-xs text-muted-foreground hover:underline">
                Kelola pengeluaran →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
