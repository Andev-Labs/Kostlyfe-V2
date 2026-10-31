import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { WaButton } from "@/components/wa-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteTenant, updateTenant } from "@/features/penghuni/actions";
import { TenantFormDialog } from "@/features/penghuni/tenant-form";
import { PaidThrough } from "@/features/sewa/paid-through";
import { requireUser } from "@/lib/auth";
import { dateLabel, rupiah } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

export default async function PenghuniDetailPage({ params }: PageProps<"/penghuni/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const [{ data: tenant }, { data: leases }] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", id).maybeSingle(),
    supabase.from("lease_summaries").select("*").eq("tenant_id", id).order("start_date", { ascending: false }),
  ]);
  if (!tenant) notFound();

  const leaseIds = (leases ?? []).map((l) => l.id!);
  const { data: payments } = leaseIds.length
    ? await supabase.from("payments").select("*").in("lease_id", leaseIds).order("paid_at", { ascending: false }).limit(20)
    : { data: [] };

  return (
    <>
      <PageHeader
        title={tenant.name}
        description={[tenant.phone, tenant.nik && `NIK ${tenant.nik}`].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <WaButton href={waLink(tenant.phone, `Halo ${tenant.name}, `)} label="Chat WhatsApp" />
            <TenantFormDialog
              action={updateTenant.bind(null, id)}
              tenant={tenant}
              trigger={
                <Button variant="outline">
                  <Pencil /> Ubah
                </Button>
              }
            />
            <ConfirmAction
              title="Hapus penghuni?"
              description="Hanya bisa dihapus bila belum pernah punya sewa."
              action={deleteTenant.bind(null, id)}
              trigger={
                <Button variant="ghost" size="icon" aria-label="Hapus penghuni">
                  <Trash2 />
                </Button>
              }
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="No. WhatsApp" value={tenant.phone} />
            <Row label="NIK" value={tenant.nik} />
            <Row label="Kontak darurat" value={tenant.emergency_contact} />
            <Row label="Catatan" value={tenant.notes} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sewa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(leases ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum pernah menyewa.</p>}
            {(leases ?? []).map((l) => (
              <Link key={l.id} href={`/sewa/${l.id}`} className="block rounded-lg border p-3 hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{l.property_name}</span>
                  {l.status === "active" ? <Badge>Aktif</Badge> : <Badge variant="secondary">Selesai</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {dateLabel(l.start_date)} – {l.end_date ? dateLabel(l.end_date) : "sekarang"} · tunggakan {rupiah(l.outstanding)}
                </div>
                <div className="text-xs">
                  <PaidThrough lease={l} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pembayaran terakhir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(payments ?? []).length === 0 && <p className="text-muted-foreground">Belum ada pembayaran.</p>}
            {(payments ?? []).map((p) => (
              <div key={p.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                <span>
                  {dateLabel(p.paid_at)} <span className="text-xs text-muted-foreground">· {p.receipt_no}</span>
                </span>
                <span className="font-medium">{rupiah(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value || "-"}</span>
    </div>
  );
}
