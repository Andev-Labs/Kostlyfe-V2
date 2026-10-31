import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Home, Wallet } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WaButton } from "@/components/wa-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CashflowChart } from "@/features/dashboard/cashflow-chart";
import { RecordPaymentDialog } from "@/features/pembayaran/record-payment-dialog";
import { PaidThrough } from "@/features/sewa/paid-through";
import { invoiceReminderLink } from "@/features/tagihan/wa";
import { requireUser } from "@/lib/auth";
import { addMonths, currentMonthISO, dateLabel, daysBetween, monthLabel, rupiah, todayISO } from "@/lib/format";
import { getActiveLeaseOptions, getWaTemplate } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { supabase, userId } = await requireUser();
  await supabase.rpc("ensure_all_invoices");

  const today = todayISO();
  const curMonth = currentMonthISO();
  const from = addMonths(curMonth, -11);

  const [
    { data: properties },
    { data: leases },
    { data: currentInvoices },
    { data: openInvoices },
    { data: payments },
    { data: expenses },
    { data: ownerRenovations },
    leaseOptions,
    template,
  ] = await Promise.all([
    supabase.from("properties").select("id, name, address").order("name"),
    supabase.from("lease_summaries").select("*").eq("status", "active"),
    supabase.from("invoice_balances").select("*").eq("period_month", curMonth),
    supabase.from("invoice_balances").select("*").gt("balance", 0).lte("period_month", curMonth).order("effective_due_date"),
    supabase.from("payments").select("amount, paid_at").gte("paid_at", from),
    supabase.from("expenses").select("amount, expense_date").gte("expense_date", from),
    supabase.from("renovations").select("cost, renovation_date").is("lease_id", null).gte("renovation_date", from),
    getActiveLeaseOptions(supabase),
    getWaTemplate(supabase, userId),
  ]);

  const target = (currentInvoices ?? []).reduce((s, i) => s + (i.amount_due ?? 0), 0);
  const collected = (currentInvoices ?? []).reduce((s, i) => s + Math.min(i.paid ?? 0, i.amount_due ?? 0), 0);
  const overdue = (openInvoices ?? []).filter((i) => i.status === "telat");
  const extended = (openInvoices ?? []).filter((i) => i.status === "diperpanjang");
  const dueSoon = (openInvoices ?? []).filter(
    (i) => i.status !== "telat" && i.status !== "diperpanjang" && daysBetween(today, i.effective_due_date!) <= 7,
  );
  const outstanding = (openInvoices ?? []).reduce((s, i) => s + (i.balance ?? 0), 0);

  const chart = Array.from({ length: 12 }, (_, i) => {
    const m = addMonths(from, i);
    const key = m.slice(0, 7);
    return {
      month: monthLabel(m, "short").replace(/ \d{4}$/, ""),
      income: (payments ?? []).filter((p) => p.paid_at.startsWith(key)).reduce((s, p) => s + p.amount, 0),
      expense:
        (expenses ?? []).filter((e) => e.expense_date.startsWith(key)).reduce((s, e) => s + e.amount, 0) +
        (ownerRenovations ?? []).filter((r) => r.renovation_date.startsWith(key)).reduce((s, r) => s + r.cost, 0),
    };
  });
  const yearIncome = chart.reduce((s, c) => s + c.income, 0);
  const yearExpense = chart.reduce((s, c) => s + c.expense, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Ringkasan ${monthLabel(curMonth)}`}
        actions={
          leaseOptions.length > 0 && <RecordPaymentDialog leases={leaseOptions} trigger={<Button>Catat pembayaran</Button>} />
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Wallet} label="Target bulan ini" value={rupiah(target)}>
          <Progress value={target ? (collected / target) * 100 : 0} className="mt-3" />
          <p className="mt-1 text-xs text-muted-foreground">{rupiah(collected)} terkumpul</p>
        </Kpi>
        <Kpi icon={Clock} label="Belum terbayar bulan ini" value={rupiah(target - collected)} />
        <Kpi icon={AlertTriangle} label="Tagihan telat" value={`${overdue.length}`} danger={overdue.length > 0}>
          <p className="mt-1 text-xs text-muted-foreground">Total tunggakan {rupiah(outstanding)}</p>
        </Kpi>
        <Kpi icon={Home} label="Hunian" value={`${leases?.length ?? 0} / ${properties?.length ?? 0}`}>
          <p className="mt-1 text-xs text-muted-foreground">kontrakan terisi</p>
        </Kpi>
      </div>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Status kontrakan bulan ini</h2>
      {(properties ?? []).length === 0 ? (
        <EmptyState
          title="Belum ada kontrakan"
          description="Mulai dengan menambahkan kontrakan, penghuni, lalu buat sewa."
          action={
            <Button asChild>
              <Link href="/kontrakan">Tambah kontrakan</Link>
            </Button>
          }
        />
      ) : (
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(properties ?? []).map((p) => {
            const lease = leases?.find((l) => l.property_id === p.id);
            const inv = lease && currentInvoices?.find((i) => i.lease_id === lease.id);
            const tone = !lease
              ? "border-dashed"
              : inv?.status === "lunas"
                ? "border-l-4 border-l-emerald-500"
                : inv?.status === "telat"
                  ? "border-l-4 border-l-red-500"
                  : "border-l-4 border-l-amber-500";
            return (
              <Card key={p.id} className={cn("gap-3", tone)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>
                        <Link href={lease ? `/sewa/${lease.id}` : `/kontrakan/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </CardTitle>
                      <CardDescription>{lease ? lease.tenant_name : "Kosong"}</CardDescription>
                    </div>
                    {inv ? <StatusBadge status={inv.status} /> : !lease && <Badge variant="secondary">Kosong</Badge>}
                  </div>
                </CardHeader>
                {lease && (
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tagihan {monthLabel(curMonth, "short")}</span>
                      <span className="font-medium">{rupiah(inv?.amount_due)}</span>
                    </div>
                    {(inv?.balance ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sisa · jatuh tempo {dateLabel(inv?.effective_due_date)}</span>
                        <span className="font-medium text-red-600">{rupiah(inv?.balance)}</span>
                      </div>
                    )}
                    {(lease.outstanding ?? 0) > (inv?.balance ?? 0) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total tunggakan</span>
                        <span className="font-medium text-red-600">{rupiah(lease.outstanding)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <PaidThrough lease={lease} />
                      {inv && (inv.balance ?? 0) > 0 && <WaButton href={invoiceReminderLink(template, inv)} />}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <InvoiceList
          title="Telat bayar"
          icon={AlertTriangle}
          empty="Tidak ada yang telat 🎉"
          items={overdue}
          template={template}
          leaseOptions={leaseOptions}
          note={(i) => `${daysBetween(i.effective_due_date!, today)} hari lewat jatuh tempo`}
          className="text-red-600"
        />
        <InvoiceList
          title="Jatuh tempo ≤ 7 hari"
          icon={Clock}
          empty="Tidak ada tagihan dalam 7 hari"
          items={dueSoon}
          template={template}
          leaseOptions={leaseOptions}
          note={(i) => {
            const d = daysBetween(today, i.effective_due_date!);
            return d === 0 ? "Hari ini" : `${d} hari lagi · ${dateLabel(i.effective_due_date)}`;
          }}
        />
        <InvoiceList
          title="Diberi perpanjangan"
          icon={CalendarClock}
          empty="Tidak ada perpanjangan aktif"
          items={extended}
          template={template}
          leaseOptions={leaseOptions}
          note={(i) => `s/d ${dateLabel(i.extended_due_date)}${i.extension_note ? ` · ${i.extension_note}` : ""}`}
          className="text-violet-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arus kas 12 bulan</CardTitle>
          <CardDescription>
            Pemasukan {rupiah(yearIncome)} · Pengeluaran {rupiah(yearExpense)} · Bersih {rupiah(yearIncome - yearExpense)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashflowChart data={chart} />
        </CardContent>
      </Card>
    </>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  danger,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {label}
          <Icon className={cn("size-4", danger && "text-red-600")} />
        </div>
        <div className={cn("mt-2 text-2xl font-semibold tracking-tight", danger && "text-red-600")}>{value}</div>
        {children}
      </CardContent>
    </Card>
  );
}

type OpenInvoice = {
  id: string | null;
  lease_id: string | null;
  property_name: string | null;
  tenant_name: string | null;
  tenant_phone: string | null;
  period_month: string | null;
  balance: number | null;
  effective_due_date: string | null;
  extended_due_date: string | null;
  extension_note: string | null;
};

function InvoiceList({
  title,
  icon: Icon,
  empty,
  items,
  template,
  leaseOptions,
  note,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  empty: string;
  items: OpenInvoice[];
  template: string | null;
  leaseOptions: Awaited<ReturnType<typeof getActiveLeaseOptions>>;
  note: (i: OpenInvoice) => string;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={cn("size-4", className)} /> {title}
          <Badge variant="secondary" className="ml-auto">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4" /> {empty}
          </p>
        )}
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium">
                {i.property_name} · {monthLabel(i.period_month, "short")}
              </div>
              <div className={cn("truncate text-xs text-muted-foreground", className)}>
                {i.tenant_name} · {note(i)}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="font-medium">{rupiah(i.balance)}</span>
              <WaButton href={invoiceReminderLink(template, i)} />
              <RecordPaymentDialog
                leases={leaseOptions}
                defaultLeaseId={i.lease_id!}
                defaultAmount={i.balance!}
                trigger={
                  <Button size="xs" variant="outline">
                    Bayar
                  </Button>
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
